import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getTeamsSelect, getPlayersForTeam, getPlayerStats, getPlayerAverages } from '../api';
import Spinner from '../components/Spinner';
import { LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer, CartesianGrid } from 'recharts';

const pct  = v => v != null ? (v * 100).toFixed(1) + '%' : '—';
const stat  = v => v != null ? Number(v).toFixed(1) : '—';

const CHART_STATS = [
  { key: 'points',    label: 'Puntos'      },
  { key: 'rebounds',  label: 'Rebotes'     },
  { key: 'assists',   label: 'Asistencias' },
  { key: 'steals',    label: 'Robos'       },
  { key: 'blocks',    label: 'Tapones'     },
  { key: 'turnovers', label: 'Pérdidas'    },
  { key: 'plusMinus', label: '+/-'         },
];

export default function Players() {
  const [season,     setSeason]     = useState('2024-25');
  const [seasonType, setSeasonType] = useState('Regular Season');
  const [teamId,     setTeamId]     = useState('');
  const [playerId,   setPlayerId]   = useState('');
  const [roster,     setRoster]     = useState([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [chartStat,  setChartStat]  = useState('points');

  const { data: teamsData, loading: loadingTeams } = useFetch(() => getTeamsSelect(), []);
  const teams = (teamsData?.data ?? []).sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    setPlayerId('');
    setRoster([]);
    if (!teamId) return;
    setLoadingRoster(true);
    getPlayersForTeam(teamId)
      .then(r => setRoster((r.data?.data ?? []).sort((a, b) => a.lastName.localeCompare(b.lastName))))
      .catch(() => setRoster([]))
      .finally(() => setLoadingRoster(false));
  }, [teamId]);

  const { data: avgsData,  loading: loadingAvgs  } = useFetch(
    () => getPlayerAverages(playerId, { season, seasonType }),
    [playerId, season, seasonType]
  );
  const { data: statsData, loading: loadingStats } = useFetch(
    () => getPlayerStats(playerId, { season, seasonType, limit: 82 }),
    [playerId, season, seasonType]
  );

  const avgs  = avgsData?.data;
  const games = statsData?.data ?? [];

  const avg = games.length
    ? (games.reduce((s, g) => s + (Number(g[chartStat]) || 0), 0) / games.length).toFixed(1)
    : null;

  return (
    <>
      <div className="page-title">👤 Jugadores</div>

      {/* Filters */}
      <div className="filters">
        <div className="field">
          <label>Temporada</label>
          <input type="text" value={season} onChange={e => setSeason(e.target.value)} style={{ minWidth: 100 }} />
        </div>
        <div className="field">
          <label>Tipo</label>
          <select value={seasonType} onChange={e => setSeasonType(e.target.value)}>
            <option>Regular Season</option>
            <option>Playoffs</option>
          </select>
        </div>
        <div className="field">
          <label>Equipo</label>
          {loadingTeams
            ? <select disabled><option>Cargando...</option></select>
            : <select value={teamId} onChange={e => setTeamId(e.target.value)}>
                <option value="">— Selecciona un equipo —</option>
                {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
              </select>
          }
        </div>
        <div className="field">
          <label>Jugador</label>
          {loadingRoster
            ? <select disabled><option>Cargando plantel...</option></select>
            : <select value={playerId} onChange={e => setPlayerId(e.target.value)} disabled={!teamId}>
                <option value="">— Selecciona un jugador —</option>
                {roster.map(p => (
                  <option key={p.playerId} value={p.playerId}>
                    #{p.jerseyNumber} {p.name} ({p.position})
                  </option>
                ))}
              </select>
          }
        </div>
      </div>

      {!playerId
        ? <div className="empty-state">Selecciona un equipo y un jugador para ver sus estadísticas.</div>
        : loadingAvgs && loadingStats
          ? <Spinner />
          : (
            <>
              {/* Averages */}
              {avgs && (
                <>
                  <div style={{ marginBottom: 8, fontWeight: 700, fontSize: '1.05rem' }}>
                    {avgs.teamAbbreviation} · {avgs.gamesPlayed} GP · {avgs.minutesPerGame} MIN
                  </div>
                  <div className="stat-grid" style={{ marginBottom: 20 }}>
                    {[
                      ['PTS', stat(avgs.pointsPerGame)],
                      ['REB', stat(avgs.reboundsPerGame)],
                      ['AST', stat(avgs.assistsPerGame)],
                      ['STL', stat(avgs.stealsPerGame)],
                      ['BLK', stat(avgs.blocksPerGame)],
                      ['TO',  stat(avgs.turnoversPerGame)],
                      ['FG%', pct(avgs.fgPct)],
                      ['3P%', pct(avgs.tpPct)],
                      ['FT%', pct(avgs.ftPct)],
                    ].map(([lbl, val]) => (
                      <div className="stat-card" key={lbl}>
                        <div className="stat-val">{val}</div>
                        <div className="stat-lbl">{lbl}</div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <div className="divider" />

              {/* Chart stat picker */}
              {games.length > 0 && (
                <>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: '.78rem', color: 'var(--muted)' }}>Gráfico:</span>
                    {CHART_STATS.map(s => (
                      <button
                        key={s.key}
                        className="btn btn-ghost"
                        style={chartStat === s.key ? { borderColor: 'var(--accent)', color: 'var(--accent)', fontSize: '.75rem', padding: '3px 10px' } : { fontSize: '.75rem', padding: '3px 10px' }}
                        onClick={() => setChartStat(s.key)}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  <div style={{ height: 220, marginBottom: 20 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[...games].reverse()} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" hide />
                        <YAxis stroke="var(--muted)" tick={{ fontSize: 11, fill: 'var(--muted)' }} />
                        <Tooltip
                          contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6 }}
                          labelStyle={{ color: 'var(--muted)', fontSize: 11 }}
                          itemStyle={{ color: 'var(--accent)' }}
                        />
                        {avg && <ReferenceLine y={avg} stroke="var(--muted)" strokeDasharray="4 4" label={{ value: `Prom: ${avg}`, fill: 'var(--muted)', fontSize: 11 }} />}
                        <Line type="monotone" dataKey={chartStat} stroke="var(--accent)" strokeWidth={2} dot={{ r: 3, fill: 'var(--accent)' }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Game log table */}
                  <div className="section-title">Registro de partidos ({games.length})</div>
                  <div className="table-wrap">
                    <table className="nba">
                      <thead>
                        <tr>
                          <th>Fecha</th><th>Rival</th><th>H/A</th><th>Res</th><th>Min</th>
                          <th className="num">PTS</th><th className="num">REB</th><th className="num">AST</th>
                          <th className="num">STL</th><th className="num">BLK</th><th className="num">TO</th>
                          <th className="num">FG%</th><th className="num">3P%</th><th className="num">FT%</th>
                          <th className="num">+/-</th>
                        </tr>
                      </thead>
                      <tbody>
                        {games.map((g, i) => (
                          <tr key={i}>
                            <td>{g.date}</td>
                            <td>{g.opponent}</td>
                            <td className="muted-c">{g.homeAway === 'home' ? 'LOCAL' : 'VISIT'}</td>
                            <td><span className={`badge ${g.result?.startsWith('W') ? 'win' : 'loss'}`}>{g.result}</span></td>
                            <td className="muted-c">{g.minutes}</td>
                            <td className="num accent-c">{g.points}</td>
                            <td className="num">{g.rebounds}</td>
                            <td className="num">{g.assists}</td>
                            <td className="num">{g.steals}</td>
                            <td className="num">{g.blocks}</td>
                            <td className="num">{g.turnovers}</td>
                            <td className="num">{pct(g.fgPct)}</td>
                            <td className="num">{pct(g.tpPct)}</td>
                            <td className="num">{pct(g.ftPct)}</td>
                            <td className={`num ${g.plusMinus > 0 ? 'plus-c' : g.plusMinus < 0 ? 'minus-c' : ''}`}>
                              {g.plusMinus > 0 ? '+' : ''}{g.plusMinus}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )
      }
    </>
  );
}
