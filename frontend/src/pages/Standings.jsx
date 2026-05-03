import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getStandings } from '../api';
import Spinner from '../components/Spinner';
import PlayoffBracket from '../components/PlayoffBracket';

const pct = v => (v * 100).toFixed(1) + '%';
const gb  = v => (!v || v === '--') ? '—' : v;

function StandingsTable({ teams }) {
  return (
    <div className="table-wrap">
      <table className="nba">
        <thead>
          <tr>
            <th style={{ width: 32 }}>#</th>
            <th>Equipo</th>
            <th className="num">W</th>
            <th className="num">L</th>
            <th className="num">Win%</th>
            <th className="num">GB</th>
            <th className="num">Local</th>
            <th className="num">Visitante</th>
            <th className="num">Últ.10</th>
            <th className="num">Racha</th>
          </tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.teamId} style={t.rank <= 6 ? { borderLeft: '3px solid var(--win)' } : t.rank <= 10 ? { borderLeft: '3px solid var(--accent)' } : {}}>
              <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{t.rank}</td>
              <td style={{ fontWeight: 600 }}>
                {t.name}
                {t.clinched && <span style={{ marginLeft: 6, fontSize: '.65rem', color: 'var(--accent)', background: 'rgba(253,185,39,.15)', borderRadius: 3, padding: '1px 4px' }}>{t.clinched}</span>}
              </td>
              <td className="num win-c">{t.wins}</td>
              <td className="num">{t.losses}</td>
              <td className="num accent-c">{pct(t.winPct)}</td>
              <td className="num muted-c">{gb(t.gamesBehind)}</td>
              <td className="num">{t.homeRecord}</td>
              <td className="num">{t.awayRecord}</td>
              <td className="num">{t.lastTen}</td>
              <td className="num">
                <span className={`badge ${t.streak?.startsWith('W') ? 'win' : 'loss'}`}>{t.streak}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Standings() {
  const [seasonType, setSeasonType] = useState('Regular Season');
  const [activeTab,  setActiveTab]  = useState('east');

  const { data, loading } = useFetch(
    () => getStandings({ season: '2024-25', seasonType, group: 'conference' }),
    [seasonType]
  );

  const east = data?.data?.east ?? [];
  const west = data?.data?.west ?? [];

  const isPlayoffs = seasonType === 'Playoffs';

  return (
    <>
      <div className="page-title">📊 Clasificación NBA</div>
      <div className="filters" style={{ marginBottom: 16 }}>
        <div className="field">
          <label>Tipo</label>
          <select value={seasonType} onChange={e => setSeasonType(e.target.value)}>
            <option>Regular Season</option>
            <option>Playoffs</option>
          </select>
        </div>
      </div>

      {isPlayoffs ? (
        <PlayoffBracket />
      ) : (
        loading ? <Spinner /> : (
          <>
            <div className="tabs">
              <div className={`tab ${activeTab === 'east' ? 'active' : ''}`} onClick={() => setActiveTab('east')}>🔵 Conferencia Este</div>
              <div className={`tab ${activeTab === 'west' ? 'active' : ''}`} onClick={() => setActiveTab('west')}>🔴 Conferencia Oeste</div>
            </div>
            {activeTab === 'east'
              ? (east.length ? <StandingsTable teams={east} /> : <div className="empty-state">Sin datos.</div>)
              : (west.length ? <StandingsTable teams={west} /> : <div className="empty-state">Sin datos.</div>)
            }
            <div style={{ marginTop: 12, fontSize: '.72rem', color: 'var(--muted)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--win)' }}>■</span><span>Playoffs directo (top 6)</span>
              <span style={{ color: 'var(--accent)' }}>■</span><span>Play-In (#7–10)</span>
            </div>
          </>
        )
      )}
    </>
  );
}
