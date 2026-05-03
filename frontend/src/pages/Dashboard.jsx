import { useFetch } from '../hooks/useFetch';
import { getGames, getStandings } from '../api';
import Spinner from '../components/Spinner';

const today = new Date().toISOString().split('T')[0];

function GameCard({ game }) {
  return (
    <div className="card" style={{ marginBottom: 10 }}>
      <div style={{ marginBottom: 10 }}>
        <span className={`badge ${game.status}`}>
          {game.status === 'live'
            ? `● EN VIVO · P${game.period} ${game.clock ?? ''}`
            : game.status === 'final' ? 'FINAL' : 'PRÓXIMO'}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
        <span style={{ fontWeight: 600 }}>{game.awayTeam.name}</span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{game.awayTeam.score ?? '–'}</span>
      </div>
      <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
        <span style={{ fontWeight: 600 }}>{game.homeTeam.name}</span>
        <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{game.homeTeam.score ?? '–'}</span>
      </div>
    </div>
  );
}

function StandingsPreview({ title, teams }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="section-title">{title}</div>
      <table className="nba" style={{ width: '100%' }}>
        <thead>
          <tr><th>#</th><th>Equipo</th><th className="num">W</th><th className="num">L</th><th className="num">Win%</th></tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.teamId}>
              <td style={{ color: 'var(--accent)', fontWeight: 700 }}>{t.rank}</td>
              <td>{t.name}</td>
              <td className="num win-c">{t.wins}</td>
              <td className="num">{t.losses}</td>
              <td className="num accent-c">{(t.winPct * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard() {
  const { data: gamesData, loading: lg } = useFetch(() => getGames(today), []);
  const { data: standData, loading: ls } = useFetch(
    () => getStandings({ season: '2024-25', seasonType: 'Regular Season', group: 'conference' }), []
  );

  const games    = gamesData?.data ?? [];
  const live     = games.filter(g => g.status === 'live').length;
  const final    = games.filter(g => g.status === 'final').length;
  const upcoming = games.filter(g => g.status === 'upcoming').length;
  const east     = (standData?.data?.east ?? []).slice(0, 5);
  const west     = (standData?.data?.west ?? []).slice(0, 5);

  return (
    <>
      <div className="page-title">🏀 Dashboard</div>
      <div className="muted-c" style={{ marginBottom: 20, fontSize: '.85rem' }}>
        {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
      </div>

      <div className="metrics-row">
        {[
          { label: 'Partidos hoy', val: games.length, color: 'var(--accent)' },
          { label: 'En vivo',      val: live,          color: 'var(--live)' },
          { label: 'Finalizados',  val: final,         color: 'var(--win)' },
          { label: 'Próximos',     val: upcoming,      color: '#93c5fd' },
        ].map(m => (
          <div className="metric-card" key={m.label}>
            <div className="metric-val" style={{ color: m.color }}>{lg ? '–' : m.val}</div>
            <div className="metric-lbl">{m.label}</div>
          </div>
        ))}
      </div>

      <div className="two-col">
        <div>
          <div className="section-title">Partidos de hoy</div>
          {lg ? <Spinner /> : games.length === 0
            ? <div className="empty-state">No hay partidos para hoy.</div>
            : games.map(g => <GameCard key={g.gameId} game={g} />)
          }
        </div>
        <div>
          <div className="section-title">Top Clasificación</div>
          {ls ? <Spinner /> : (
            <>
              <StandingsPreview title="🔵 Conferencia Este" teams={east} />
              <StandingsPreview title="🔴 Conferencia Oeste" teams={west} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
