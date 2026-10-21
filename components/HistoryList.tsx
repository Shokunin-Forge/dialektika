'use client';

import Link from 'next/link';
import { downloadDebateDocx } from '@/lib/export-docx';
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
          <li className="history-row" key={debate.id}>
            <Link className="history-item" href={`/debate/${debate.id}`}>
              <span className="history-topic">{debate.topic}</span>
              <span className="history-meta">
                {debate.rounds} {debate.rounds === 1 ? 'round' : 'rounds'}
                {debate.jevEnabled ? ' · Jev' : ' · no Jev'}
              </span>
            </Link>
            <button
              className="btn btn-ghost download-btn"
              type="button"
              aria-label="Download .docx"
              onClick={() => {
                void downloadDebateDocx(debate).catch(() => undefined);
              }}
            >
              <svg className="download-icon" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M8 2.25 V9.25 M4.75 6.25 L8 9.5 L11.25 6.25 M3.25 12.75 H12.75" />
              </svg>
              <span className="download-label">Download .docx</span>
              <span className="download-ext">.docx</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
