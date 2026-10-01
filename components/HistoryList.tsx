'use client';

import Link from 'next/link';
import type { Debate } from '@/lib/types';

export function HistoryList({ debates }: { debates: Debate[] }) {
  if (debates.length === 0) {
    return null;
  }

  return (
    <section className="history">
      <h2 className="history-title">History</h2>
      <ul className="history-list">
        {debates.map((debate) => (
          <li key={debate.id}>
            <Link className="history-item" href={`/debate/${debate.id}`}>
              <span className="history-topic">{debate.topic}</span>
              <span className="history-meta">
                {debate.rounds} {debate.rounds === 1 ? 'round' : 'rounds'}
                {debate.jevEnabled ? ' · Jev' : ' · no Jev'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
