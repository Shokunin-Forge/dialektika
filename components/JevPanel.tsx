import type { AxisScores, Verdict } from '@/lib/types';

const AXES: { key: keyof AxisScores; label: string }[] = [
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'engagement', label: 'Engagement' },
  { key: 'burdenOfProof', label: 'Burden of proof' },
];

export function JevPanel({ verdict }: { verdict: Verdict }) {
  return (
    <section className="jev">
      <header className="jev-head">
        <span className="jev-badge">Jev</span>
        <h2 className="jev-title">
          Stronger side:{' '}
          {verdict.strongerSide === 'defender'
            ? 'Proposition (defender)'
            : 'Opposition (opposer)'}
        </h2>
        {verdict.tieBreakApplied ? (
          <p className="jev-note">
            Scores were level, so the tie goes to the opposition — the defender did not meet the
            burden of proof.
          </p>
        ) : null}
      </header>

      <table className="jev-scores">
        <thead>
          <tr>
            <th scope="col">Axis</th>
            <th scope="col">Defender</th>
            <th scope="col">Opposer</th>
          </tr>
        </thead>
        <tbody>
          {AXES.map((axis) => (
            <tr key={axis.key}>
              <th scope="row">{axis.label}</th>
              <td>{verdict.scores.defender[axis.key]}</td>
              <td>{verdict.scores.opposer[axis.key]}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {verdict.decisiveTurns.length > 0 ? (
        <p className="jev-turns">Decisive turns: {verdict.decisiveTurns.join(', ')}</p>
      ) : null}

      <p className="jev-crystallization">{verdict.crystallization}</p>
    </section>
  );
}

export function JevPending() {
  return <section className="jev-pending">Jev is deliberating…</section>;
}
