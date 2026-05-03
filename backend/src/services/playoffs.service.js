'use strict';

const { get, set } = require('../config/cache');
const { fetchPlayoffGames } = require('../espn/playoffs');

// ESPN team IDs by conference (fixed NBA structure)
const EAST_IDS = new Set(['1','2','4','5','8','11','14','15','17','18','19','20','27','28','30']);
const WEST_IDS = new Set(['3','6','7','9','10','12','13','16','21','22','23','24','25','26','29']);

function getConference(teamId) {
  return EAST_IDS.has(String(teamId)) ? 'east' : WEST_IDS.has(String(teamId)) ? 'west' : 'finals';
}

/**
 * Extracts unique series from all playoff game events.
 * Each event has a `series` object with competitor wins info.
 */
function extractSeries(events) {
  const seriesMap = new Map();

  for (const e of events) {
    const comp  = e.competitions?.[0] || {};
    const serie = comp.series || {};
    const serieComps = serie.competitors || [];
    if (serieComps.length < 2) continue;

    const [sc0, sc1] = serieComps;
    const key = [sc0.id, sc1.id].sort().join('_');

    const teamInfo = {};
    for (const c of comp.competitors || []) {
      teamInfo[c.team.id] = {
        id:           c.team.id,
        name:         c.team.displayName,
        abbreviation: c.team.abbreviation,
        shortName:    c.team.shortDisplayName,
        color:        c.team.color,
      };
    }

    const latest = seriesMap.get(key);
    const totalWins = sc0.wins + sc1.wins;
    if (latest && (latest.wins[0] + latest.wins[1]) >= totalWins) continue;

    const winner = sc0.wins === 4 ? sc0.id : sc1.wins === 4 ? sc1.id : null;

    seriesMap.set(key, {
      id:        key,
      teams:     [sc0.id, sc1.id],
      teamInfo:  [teamInfo[sc0.id] || { id: sc0.id, name: '?', abbreviation: '?' },
                  teamInfo[sc1.id] || { id: sc1.id, name: '?', abbreviation: '?' }],
      wins:      [sc0.wins, sc1.wins],
      completed: serie.completed || sc0.wins === 4 || sc1.wins === 4,
      winner,
      summary:   serie.summary || '',
    });
  }

  return [...seriesMap.values()];
}

/**
 * Assigns rounds within a SINGLE conference's series using a DAG.
 * Capped at maxRound to avoid data anomalies (play-in, stale entries, etc.)
 */
function assignConfRounds(series, maxRound = 3) {
  const wonBy = new Map();
  for (const s of series) {
    if (s.winner) wonBy.set(s.winner, s);
  }

  const roundCache = new Map();

  function getRound(s, stack = new Set()) {
    if (roundCache.has(s.id)) return roundCache.get(s.id);
    if (stack.has(s.id)) return 1;
    stack.add(s.id);

    const preds = s.teams
      .map(tid => wonBy.get(tid))
      .filter(p => p && p.id !== s.id);

    const round = Math.min(
      maxRound,
      preds.length === 0 ? 1 : 1 + Math.max(...preds.map(p => getRound(p, stack)))
    );
    roundCache.set(s.id, round);
    return round;
  }

  return series.map(s => ({ ...s, round: getRound(s) }));
}

/**
 * Builds the full playoff bracket structure:
 * { rounds: [{name, east:[], west:[]}], finals: series }
 */
/** Creates a placeholder "projected" series from two known winners. */
function makeProjected(winnerA, winnerB, conf, round) {
  const key = [winnerA.id, winnerB.id].sort().join('_');
  return {
    id:        key,
    teams:     [winnerA.id, winnerB.id],
    teamInfo:  [winnerA, winnerB],
    wins:      [0, 0],
    completed: false,
    winner:    null,
    summary:   '',
    round,
    projected: true,
    conference: conf,
  };
}

/**
 * Ensures every round always has the correct number of slots filled:
 *   R1:  4 series per conference (8 total)
 *   R2:  2 series per conference (4 total)  ← "las 4 casillas de semifinales"
 *   CF:  1 series per conference (2 total)
 *   Finals: 1 series
 * Missing slots are filled with projected series using known winners or TBD placeholders.
 */
function projectBracket(rounds, finals) {
  const newRounds = rounds.map(r => ({
    ...r,
    east: [...r.east],
    west: [...r.west],
  }));

  const [r1, r2, r3] = newRounds;

  for (const conf of ['east', 'west']) {
    const round1 = r1[conf];
    const round2 = r2[conf];
    const round3 = r3[conf];

    const tbd = (tag) => ({
      id: `tbd_${conf}_${tag}`,
      name: 'Por det.',
      abbreviation: 'TBD',
      shortName: 'TBD',
      color: null,
    });

    // ── R1: always 4 slots per conference ──────────────────────────────
    // Seeds: [1v8, 4v5, 3v6, 2v7]  (indices 0–3)
    const R1_LABELS = ['1 vs 8', '4 vs 5', '3 vs 6', '2 vs 7'];
    for (let i = 0; i < 4; i++) {
      if (!round1[i]) {
        const s = makeProjected(tbd(`r1_${i}a`), tbd(`r1_${i}b`), conf, 1);
        s.summary = R1_LABELS[i];
        round1[i] = s;
      }
    }

    // ── R2 (Semifinales): always 2 slots per conference ────────────────
    // Slot 0 = winner(r1[0]) vs winner(r1[1])
    // Slot 1 = winner(r1[2]) vs winner(r1[3])
    for (const [idx, [a, b]] of [[0, [0, 1]], [1, [2, 3]]].entries()) {
      if (round2[idx]) continue;
      const wA = round1[a]?.winner
        ? round1[a].teamInfo.find(t => t.id === round1[a].winner)
        : tbd(`r2_${idx}a`);
      const wB = round1[b]?.winner
        ? round1[b].teamInfo.find(t => t.id === round1[b].winner)
        : tbd(`r2_${idx}b`);
      round2[idx] = makeProjected(wA, wB, conf, 2);
    }

    // ── CF: always 1 slot per conference ───────────────────────────────
    if (!round3[0]) {
      const wA = round2[0]?.winner
        ? round2[0].teamInfo.find(t => t.id === round2[0].winner)
        : tbd('cf_a');
      const wB = round2[1]?.winner
        ? round2[1].teamInfo.find(t => t.id === round2[1].winner)
        : tbd('cf_b');
      round3[0] = makeProjected(wA, wB, conf, 3);
    }
  }

  // ── Finals: always 1 slot ──────────────────────────────────────────
  if (!finals) {
    const cfEast = newRounds[2].east[0];
    const cfWest = newRounds[2].west[0];
    const wE = cfEast?.winner
      ? cfEast.teamInfo.find(t => t.id === cfEast.winner)
      : { id: 'tbd_finals_e', name: 'Por det.', abbreviation: 'TBD', shortName: 'TBD', color: null };
    const wW = cfWest?.winner
      ? cfWest.teamInfo.find(t => t.id === cfWest.winner)
      : { id: 'tbd_finals_w', name: 'Por det.', abbreviation: 'TBD', shortName: 'TBD', color: null };
    finals = makeProjected(wE, wW, 'finals', 4);
  }

  return { rounds: newRounds, finals };
}

function buildBracket(allSeries) {
  const ROUND_NAMES = {
    1: 'Primera Ronda',
    2: 'Semifinales de Conferencia',
    3: 'Finales de Conferencia',
  };

  // Separate by conference FIRST — a same-conference series can never be Finals
  const eastSeries = allSeries.filter(s => {
    const [c0, c1] = s.teams.map(getConference);
    return c0 === 'east' && c1 === 'east';
  });
  const westSeries = allSeries.filter(s => {
    const [c0, c1] = s.teams.map(getConference);
    return c0 === 'west' && c1 === 'west';
  });
  // Cross-conference = NBA Finals (East champion vs West champion)
  const finalsSeries = allSeries.filter(s => {
    const [c0, c1] = s.teams.map(getConference);
    return c0 !== c1;
  });

  const eastWithRounds = assignConfRounds(eastSeries, 3);
  const westWithRounds = assignConfRounds(westSeries, 3);

  const rounds = [1, 2, 3].map(r => ({
    round: r,
    name:  ROUND_NAMES[r],
    east:  eastWithRounds.filter(s => s.round === r),
    west:  westWithRounds.filter(s => s.round === r),
  }));

  const finals = finalsSeries[0] || null;

  return projectBracket(rounds, finals);
}

async function getPlayoffBracket() {
  const key = 'playoffs:bracket';
  const cached = get(key);
  if (cached) return cached;

  const raw       = await fetchPlayoffGames();
  const allSeries = extractSeries(raw.events || []);
  const bracket   = buildBracket(allSeries);

  set(key, bracket, 300); // 5 min cache
  return bracket;
}

module.exports = { getPlayoffBracket };
