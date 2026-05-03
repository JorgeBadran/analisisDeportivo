import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getGames, getBoxscore } from '../api';
import Spinner from '../components/Spinner';

const pct = v => v != null ? (v * 100).toFixed(1) + '%' : '—';

function BoxscoreTable({ players }) {
  return (
    <div className="table-wrap">
      <table className="nba">
        <thead>
          <tr>
            <th>Jugador</th><th>Pos</th><th>Min</th>
            <th className="num">PTS</th><th className="num">REB</th><th className="num">AST</th>
            <th className="num">STL</th><th className="num">BLK</th><th className="num">TO</th>
            <th className="num">FGM/A</th><th className="num">FG%</th>
            <th className="num">3PM/A</th><th className="num">3P%</th>
            <th className="num">FTM/A</th>
            <th className="num">+/-</th>
          </tr>
        </thead>
        <tbody>
          {players.map(p => (
            <tr key={p.personId}>
              <td style={p.starter ? { color: 'var(--accent)', fontWeight: 600 } : {}}>{p.name}</td>
              <td className="muted-c">{p.position}</td>
              <td className="muted-c">{p.minutes}</td>
              <td className="num accent-c">{p.points}</td>
              <td className="num">{p.rebounds}</td>
              <td className="num">{p.assists}</td>
              <td className="num">{p.steals}</td>
              <td className="num">{p.blocks}</td>
              <td className="num">{p.turnovers}</td>
              <td className="num">{p.fgm}/{p.fga}</td>
              <td className="num">{pct(p.fgPct)}</td>
              <td className="num">{p.tpm}/{p.tpa}</td>
              <td className="num">{pct(p.tpPct)}</td>
              <td className="num">{p.ftm}/{p.fta}</td>
              <td className={`num ${p.plusMinus > 0 ? 'plus-c' : p.plusMinus < 0 ? 'minus-c' : ''}`}>
                {p.plusMinus > 0 ? '+' : ''}{p.plusMinus}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Totals({ t }) {
  const stats = [
    ['PTS', t.points], ['REB', t.rebounds], ['AST', t.assists],
    ['STL', t.steals], ['BLK', t.blocks],   ['TO',  t.turnovers],
  ];
  return (
    <div className="stat-grid" style={{ marginBottom: 16 }}>
      {stats.map(([lbl, val]) => (
        <div className="stat-card" key={lbl}>
          <div className="stat-val">{val}</div>
          <div className="stat-lbl">{lbl}</div>
        </div>
      ))}
    </div>
  );
}

function BoxscorePanel({ gameId, onClose }) {
  const [activeTab, setTab] = useState('home');
  const { data, loading } = useFetch(() => getBoxscore(gameId), [gameId]);
  const box = data?.data;

  return (
    <div className="card" style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontWeight: 700, fontSize: '1rem' }}>Boxscore — {gameId}</span>
        <button className="btn btn-ghost" onClick={onClose}>✕ Cerrar</button>
      </div>
      {loading ? <Spinner /> : !box
        ? <div className="empty-state">Sin datos de boxscore.</div>
        : (
          <>
            <div className="tabs">
              <div className={`tab ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
                🏠 {box.homeTeam.abbreviation}
              </div>
              <div className={`tab ${activeTab === 'away' ? 'active' : ''}`} onClick={() => setTab('away')}>
                ✈️ {box.awayTeam.abbreviation}
              </div>
            </div>
            {activeTab === 'home'
              ? <><Totals t={box.homeTeam.totals} /><BoxscoreTable players={box.homeTeam.players} /></>
              : <><Totals t={box.awayTeam.totals} /><BoxscoreTable players={box.awayTeam.players} /></>
            }
          </>
        )}
    </div>
  );
}

export default function Games() {
  const [date, setDate]     = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('');
  const [selected, setSelected] = useState(null);

  const { data, loading } = useFetch(() => getGames(date, status || undefined), [date, status]);
  const games = data?.data ?? [];

  return (
    <>
      <div className="page-title">🎮 Partidos</div>
      <div className="filters">
        <div className="field">
          <label>Fecha</label>
          <input type="date" value={date} onChange={e => { setDate(e.target.value); setSelected(null); }} />
        </div>
        <div className="field">
          <label>Estado</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="">Todos</option>
            <option value="live">En vivo</option>
            <option value="final">Finalizados</option>
            <option value="upcoming">Próximos</option>
          </select>
        </div>
      </div>

      {loading ? <Spinner /> : games.length === 0
        ? <div className="empty-state">No hay partidos para esta fecha.</div>
        : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: 14 }}>
            {games.map(g => (
              <div key={g.gameId} className="card" style={{ cursor: 'pointer', borderColor: selected === g.gameId ? 'var(--accent)' : undefined }}
                   onClick={() => setSelected(selected === g.gameId ? null : g.gameId)}>
                <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={`badge ${g.status}`}>
                    {g.status === 'live' ? `● EN VIVO · P${g.period}` : g.status === 'final' ? 'FINAL' : 'PRÓXIMO'}
                  </span>
                  <span style={{ fontSize: '.72rem', color: 'var(--accent)' }}>Ver boxscore →</span>
                </div>
                {[g.awayTeam, g.homeTeam].map((t, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    <div>
                      <span style={{ fontSize: '.7rem', color: 'var(--muted)', marginRight: 6 }}>{t.abbreviation}</span>
                      <span style={{ fontWeight: 600 }}>{t.name}</span>
                    </div>
                    <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>{t.score ?? '–'}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      }

      {selected && <BoxscorePanel gameId={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
