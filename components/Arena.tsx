import type { ArenaTurn, DebateConfig, Side, Verdict } from '@/lib/types';
import { JevPanel, JevPending } from './JevPanel';
import { TurnCard } from './TurnCard';

export function Arena({
  config,
  turns,
  verdict,
  onRetry,
}: {
  config: DebateConfig;
  turns: ArenaTurn[];
  verdict: Verdict | null;
  onRetry?: () => void;
}) {
  const rounds = Array.from({ length: config.rounds }, (_, index) => index + 1);
  const findTurn = (round: number, side: Side) =>
    turns.find((turn) => turn.round === round && turn.side === side) ?? null;

  const allDone =
    turns.length === config.rounds * 2 && turns.every((turn) => turn.status === 'done');

  return (
    <div className="arena">
      <div className="arena-headers">
        <div className="arena-header defender">
          <span className="role">Defender · Proposition</span>
          <span className="model">{config.sides.defender}</span>
        </div>
        <div className="arena-header opposer">
          <span className="role">Opposer · Opposition</span>
          <span className="model">{config.sides.opposer}</span>
        </div>
      </div>

      {rounds.map((round) => {
        const defender = findTurn(round, 'defender');
        const opposer = findTurn(round, 'opposer');
        return (
          <section className="arena-round" key={round}>
            <div className="arena-round-label">Round {round}</div>
            <div className="arena-grid">
              <div className="arena-col">
                {defender ? (
                  <TurnCard turn={defender} onRetry={onRetry} />
                ) : (
                  <EmptyTurn side="defender" />
                )}
              </div>
              <div className="arena-col">
                {opposer ? (
                  <TurnCard turn={opposer} onRetry={onRetry} />
                ) : (
                  <EmptyTurn side="opposer" />
                )}
              </div>
            </div>
          </section>
        );
      })}

      {config.jevEnabled ? (
        verdict ? (
          <JevPanel verdict={verdict} />
        ) : allDone ? (
          <JevPending />
        ) : null
      ) : null}
    </div>
  );
}

function EmptyTurn({ side }: { side: Side }) {
  return (
    <article className={`turn ${side}`}>
      <p className="turn-empty">Waiting…</p>
    </article>
  );
}
