import type { ArenaTurn, Side } from '@/lib/types';

const ROLE_LABEL: Record<Side, string> = {
  defender: 'Proposition',
  opposer: 'Opposition',
};

export function TurnCard({ turn, onRetry }: { turn: ArenaTurn; onRetry?: () => void }) {
  return (
    <article className={`turn ${turn.side}${turn.status === 'error' ? ' error' : ''}`}>
      <header className="turn-label">
        <span>{turn.modelId}</span>
        <span>·</span>
        <span>{ROLE_LABEL[turn.side]}</span>
        <span>·</span>
        <span>Round {turn.round}</span>
        {turn.status === 'streaming' && turn.text.length === 0 ? (
          <span className="spinner" aria-label="streaming" />
        ) : null}
      </header>

      {turn.status === 'error' ? (
        <div className="turn-error-block">
          <p className="turn-error">{turn.error ?? 'This turn failed.'}</p>
          {onRetry ? (
            <button className="btn btn-ghost" type="button" onClick={onRetry}>
              Retry
            </button>
          ) : null}
        </div>
      ) : turn.text ? (
        <div className="turn-text">{turn.text}</div>
      ) : (
        <p className="turn-empty">Waiting…</p>
      )}
    </article>
  );
}
