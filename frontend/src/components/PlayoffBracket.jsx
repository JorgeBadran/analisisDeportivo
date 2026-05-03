import { useFetch } from '../hooks/useFetch';
import { getPlayoffBracket } from '../api';
import Spinner from './Spinner';

// ── Series Card ───────────────────────────────────────────────────────────────

function SeriesCard({ series }) {
  if (!series) {
    return (
      <div className="ps-card ps-card--empty">
        <div className="ps-tbd">Por determinar</div>
      </div>
    );
  }

  const [t0, t1] = series.teamInfo;
  const [w0, w1] = series.wins;
  const wid = series.winner;

  const liveClass = !series.completed && (w0 + w1) > 0 ? 'ps-card--live' : '';
  const projClass = series.projected ? 'ps-card--projected' : '';

  return (
    <div className={`ps-card ${liveClass} ${projClass}`}>
      {series.projected && <div className="ps-projected-label">Proyectado</div>}
      <TeamRow team={t0} wins={w0} won={wid === t0.id} lost={series.completed && wid !== t0.id} tbd={t0.id?.startsWith('tbd_')} />
      <div className="ps-divider" />
      <TeamRow team={t1} wins={w1} won={wid === t1.id} lost={series.completed && wid !== t1.id} tbd={t1.id?.startsWith('tbd_')} />
      {series.summary && <div className="ps-summary">{series.summary}</div>}
    </div>
  );
}

function TeamRow({ team, wins, won, lost, tbd }) {
  return (
    <div className={`ps-team ${won ? 'ps-team--won' : ''} ${lost ? 'ps-team--lost' : ''} ${tbd ? 'ps-team--tbd' : ''}`}>
      <div
        className="ps-badge"
        style={{ background: team.color ? `#${team.color}30` : 'var(--surface-2)', color: team.color ? `#${team.color}` : 'var(--muted)' }}
      >
        {team.abbreviation}
      </div>
      <span className="ps-name">{team.shortName || team.abbreviation}</span>
      <span className={`ps-wins ${won ? 'ps-wins--won' : ''}`}>{wins}</span>
      {won && <span className="ps-check">✓</span>}
    </div>
  );
}

// ── Bracket Group (recursive tree node) ──────────────────────────────────────
// Connects two children (top/bottom) with bracket lines to one result.
// flip=true mirrors for the West conference (right-to-left reading).

function BracketGroup({ top, bottom, result, flip = false, innerGap = 12, outerGap = 20 }) {
  const inputs = (
    <div className="bg-inputs" style={{ '--bg-gap': `${innerGap}px` }}>
      {top}
      {bottom}
    </div>
  );

  const conn = (
    <div className={`bg-conn ${flip ? 'bg-conn--flip' : ''}`}>
      <div className="bg-conn-t" />
      <div className="bg-conn-b" />
    </div>
  );

  const output = <div className="bg-output">{result}</div>;

  return (
    <div className="bg" style={{ '--bg-outer-gap': `${outerGap}px` }}>
      {flip ? output : inputs}
      {conn}
      {flip ? inputs : output}
    </div>
  );
}

// ── Conference Bracket (3 rounds) ─────────────────────────────────────────────

function ConferenceBracket({ name, color, r1 = [], r2 = [], cf = [], flip = false }) {
  const s = (arr, i) => arr[i] || null;

  const roundLabels = flip
    ? ['Final de Conf.', 'Semifinales', 'Primera Ronda']
    : ['Primera Ronda', 'Semifinales', 'Final de Conf.'];

  return (
    <div className="conf-bracket">
      {/* Column headers */}
      <div className={`conf-headers ${flip ? 'conf-headers--flip' : ''}`}>
        {roundLabels.map(lbl => (
          <div key={lbl} className="conf-header-cell">{lbl}</div>
        ))}
      </div>

      {/* Conference label */}
      <div className="conf-name" style={{ color }}>{name}</div>

      {/* Bracket tree */}
      <BracketGroup
        flip={flip}
        innerGap={20}
        outerGap={28}
        result={<SeriesCard series={s(cf, 0)} />}
        top={
          <BracketGroup
            flip={flip}
            innerGap={12}
            result={<SeriesCard series={s(r2, 0)} />}
            top={<SeriesCard series={s(r1, 0)} />}
            bottom={<SeriesCard series={s(r1, 1)} />}
          />
        }
        bottom={
          <BracketGroup
            flip={flip}
            innerGap={12}
            result={<SeriesCard series={s(r2, 1)} />}
            top={<SeriesCard series={s(r1, 2)} />}
            bottom={<SeriesCard series={s(r1, 3)} />}
          />
        }
      />
    </div>
  );
}

// ── NBA Finals Center ─────────────────────────────────────────────────────────

function NBAFinals({ finals }) {
  return (
    <div className="finals-col">
      <div className="finals-title">🏆 Finales NBA</div>
      {finals
        ? <SeriesCard series={finals} />
        : (
          <div className="ps-card ps-card--empty finals-tbd">
            <div style={{ fontSize: '1.6rem', marginBottom: 6 }}>🏀</div>
            <div className="ps-tbd">Por determinar</div>
          </div>
        )
      }
      {finals?.winner && (
        <div className="finals-champion">
          <div className="champion-crown">👑</div>
          <div className="champion-label">Campeón NBA</div>
          <div className="champion-name">
            {finals.teamInfo.find(t => t.id === finals.winner)?.name}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────

export default function PlayoffBracket() {
  const { data, loading, error } = useFetch(() => getPlayoffBracket(), []);
  const bracket = data?.data;

  if (loading) return <Spinner />;
  if (error)   return <div className="empty-state">No se pudieron cargar los datos de playoffs.</div>;
  if (!bracket) return null;

  const { rounds, finals } = bracket;
  const [r1, r2, r3] = rounds;

  return (
    <div className="bracket-page">
      <div className="bracket-root">
        {/* East (left → right) */}
        <ConferenceBracket
          name="🔵 Conferencia Este"
          color="var(--primary)"
          r1={r1?.east || []}
          r2={r2?.east || []}
          cf={r3?.east || []}
          flip={false}
        />

        {/* NBA Finals */}
        <NBAFinals finals={finals} />

        {/* West (right → left, mirrored) */}
        <ConferenceBracket
          name="🔴 Conferencia Oeste"
          color="var(--red)"
          r1={r1?.west || []}
          r2={r2?.west || []}
          cf={r3?.west || []}
          flip={true}
        />
      </div>

      <div className="bracket-legend">
        <span className="bl-item"><span className="bl-dot" style={{ background: 'var(--win)' }} />Serie ganada</span>
        <span className="bl-item"><span className="bl-dot" style={{ background: 'var(--accent)' }} />En curso</span>
        <span className="bl-item"><span className="bl-dot" style={{ background: 'var(--border)' }} />Por jugar</span>
      </div>
    </div>
  );
}
