import { useState } from 'react';
import { useFetch } from '../hooks/useFetch';
import { getSchedule, getTeamsSelect } from '../api';
import Spinner from '../components/Spinner';

export default function Schedule() {
  const [season,   setSeason]   = useState('2024-25');
  const [fromDate, setFromDate] = useState('2024-10-22');
  const [toDate,   setToDate]   = useState(new Date().toISOString().split('T')[0]);
  const [teamId,   setTeamId]   = useState('');
  const [page,     setPage]     = useState(1);
  const [limit,    setLimit]    = useState(30);

  const { data: teamsData, loading: loadingTeams } = useFetch(() => getTeamsSelect(), []);
  const teams = (teamsData?.data ?? []).sort((a, b) => a.name.localeCompare(b.name));

  const { data, loading } = useFetch(
    () => getSchedule({ season, teamId: teamId || undefined, from: fromDate, to: toDate, page, limit }),
    [season, fromDate, toDate, teamId, page, limit]
  );

  const games = data?.data ?? [];
  const meta  = data?.meta ?? {};

  return (
    <>
      <div className="page-title">📅 Calendario</div>
      <div className="filters">
        <div className="field">
          <label>Desde</label>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} />
        </div>
        <div className="field">
          <label>Hasta</label>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} />
        </div>
        <div className="field">
          <label>Equipo</label>
          {loadingTeams
            ? <select disabled><option>Cargando...</option></select>
            : <select value={teamId} onChange={e => { setTeamId(e.target.value); setPage(1); }}>
                <option value="">Todos los equipos</option>
                {teams.map(t => <option key={t.teamId} value={t.teamId}>{t.name}</option>)}
              </select>
          }
        </div>
        <div className="field">
          <label>Por página</label>
          <select value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} style={{ minWidth: 80 }}>
            {[20, 30, 50, 82].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {meta.total != null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: '.85rem', color: 'var(--muted)' }}>
          <span>{meta.total} partidos · Página {meta.page}/{meta.totalPages}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
            <button className="btn btn-ghost" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
          </div>
        </div>
      )}

      {loading ? <Spinner /> : games.length === 0
        ? <div className="empty-state">No hay partidos para estos filtros.</div>
        : (
          <div className="table-wrap">
            <table className="nba">
              <thead>
                <tr>
                  <th>Fecha</th><th>Hora UTC</th>
                  <th>Visitante</th><th>Local</th>
                  <th>Cancha</th><th>TV</th>
                </tr>
              </thead>
              <tbody>
                {games.map(g => (
                  <tr key={g.gameId}>
                    <td style={{ fontWeight: 600 }}>{g.date}</td>
                    <td className="muted-c">{g.time ? g.time.replace('T', ' ').slice(0, 16) + ' UTC' : '—'}</td>
                    <td><span style={{ fontSize: '.7rem', color: 'var(--muted)', marginRight: 5 }}>{g.awayTeam.abbreviation}</span>{g.awayTeam.name}</td>
                    <td><span style={{ fontSize: '.7rem', color: 'var(--muted)', marginRight: 5 }}>{g.homeTeam.abbreviation}</span>{g.homeTeam.name}</td>
                    <td className="muted-c">{g.venue || '—'}</td>
                    <td className="muted-c">{g.broadcasters?.join(', ') || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      {meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16, alignItems: 'center' }}>
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>← Anterior</button>
          <span style={{ color: 'var(--muted)' }}>{page} / {meta.totalPages}</span>
          <button className="btn btn-ghost" disabled={page >= meta.totalPages} onClick={() => setPage(p => p + 1)}>Siguiente →</button>
        </div>
      )}
    </>
  );
}
