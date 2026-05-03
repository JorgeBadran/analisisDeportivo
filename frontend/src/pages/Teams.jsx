import { useState, useEffect } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getTeams, getTeam } from '../api';
import Spinner from '../components/Spinner';

const pct = v => v != null ? (v * 100).toFixed(1) + '%' : '—';
const st  = v => v != null ? Number(v).toFixed(1) : '—';

const COLS = [
  { key: 'name',           label: 'Equipo',  cls: '' },
  { key: 'gamesPlayed',    label: 'GP',      cls: 'num' },
  { key: 'wins',           label: 'W',       cls: 'num win-c' },
  { key: 'losses',         label: 'L',       cls: 'num' },
  { key: 'winPct',         label: 'Win%',    cls: 'num accent-c', fmt: pct },
];

// ── Team Modal ────────────────────────────────────────────────────────────────

function TeamModal({ teamId, season, seasonType, onClose }) {
  const { data, loading } = useFetch(
    () => getTeam(teamId, { season, seasonType }),
    [teamId]
  );
  const detail = data?.data;

  // Cerrar con Escape
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {loading || !detail ? <Spinner /> : (
          <>
            {/* Header */}
            <div className="modal-header">
              <div
                className="modal-team-badge"
                style={{ background: detail.color ? `#${detail.color}22` : 'var(--surface-2)', borderColor: detail.color ? `#${detail.color}55` : 'var(--border)' }}
              >
                <span style={{ fontSize: '2rem' }}>🏀</span>
              </div>
              <div>
                <div className="modal-team-name">{detail.name}</div>
                <div style={{ fontSize: '.8rem', color: 'var(--muted)' }}>
                  {detail.location} · <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{detail.abbreviation}</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              {[
                ['Récord',  `${detail.wins}–${detail.losses}`],
                ['Win%',    pct(detail.winPct)],
                ['PTS/g',   st(detail.pointsPerGame)],
                ['REB/g',   st(detail.reboundsPerGame)],
                ['AST/g',   st(detail.assistsPerGame)],
                ['FG%',     pct(detail.fgPct)],
                ['3P%',     pct(detail.tpPct)],
              ].map(([lbl, val]) => (
                <div className="stat-card" key={lbl}>
                  <div className="stat-val" style={{ fontSize: '1.1rem' }}>{val}</div>
                  <div className="stat-lbl">{lbl}</div>
                </div>
              ))}
            </div>

            {/* Roster */}
            {detail.roster?.length > 0 && (
              <>
                <div className="section-title">Plantel — {detail.roster.length} jugadores</div>
                <div className="table-wrap">
                  <table className="nba">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Jugador</th>
                        <th>Pos</th>
                        <th>Altura</th>
                        <th className="num">Peso</th>
                        <th className="num">Edad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.roster.map((p) => (
                        <tr key={p.personId}>
                          <td className="accent-c" style={{ width: 36 }}>{p.jerseyNumber}</td>
                          <td style={{ fontWeight: 600 }}>{p.name}</td>
                          <td className="muted-c">{p.position}</td>
                          <td className="muted-c">{p.height}</td>
                          <td className="num muted-c">{p.weight}</td>
                          <td className="num">{p.age}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Teams Page ────────────────────────────────────────────────────────────────

export default function Teams() {
  const [season,     setSeason]     = useState('2024-25');
  const [seasonType, setSeasonType] = useState('Regular Season');
  const [sortCol,    setSortCol]    = useState('winPct');
  const [sortDir,    setSortDir]    = useState(-1);
  const [modalTeamId, setModalTeamId] = useState(null);

  const { data, loading } = useFetch(
    () => getTeams({ season, seasonType }),
    [season, seasonType]
  );

  const teams = data?.data ?? [];

  const sorted = [...teams].sort((a, b) => {
    const av = a[sortCol] ?? 0, bv = b[sortCol] ?? 0;
    return typeof av === 'string' ? av.localeCompare(bv) * sortDir : (av - bv) * sortDir;
  });

  function handleSort(key) {
    setSortCol(key);
    setSortDir(s => sortCol === key ? -s : -1);
  }

  return (
    <>
      <div className="page-title">🏆 Equipos NBA</div>

      <div className="filters">
        <div className="field">
          <label>Tipo</label>
          <select value={seasonType} onChange={e => setSeasonType(e.target.value)}>
            <option>Regular Season</option>
            <option>Playoffs</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : (
        <div className="table-wrap">
          <table className="nba">
            <thead>
              <tr>
                {COLS.map(c => (
                  <th key={c.key} className={c.cls} onClick={() => handleSort(c.key)}>
                    {c.label} {sortCol === c.key ? (sortDir === -1 ? '↓' : '↑') : ''}
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {sorted.map(t => (
                <tr key={t.teamId}>
                  {COLS.map(c => (
                    <td key={c.key} className={c.cls}>
                      {c.fmt ? c.fmt(t[c.key]) : t[c.key] ?? '—'}
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '.75rem', padding: '3px 12px', color: 'var(--accent)', borderColor: 'var(--accent)' }}
                      onClick={() => setModalTeamId(t.teamId)}
                    >
                      Ver →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalTeamId && (
        <TeamModal
          teamId={modalTeamId}
          season={season}
          seasonType={seasonType}
          onClose={() => setModalTeamId(null)}
        />
      )}
    </>
  );
}
