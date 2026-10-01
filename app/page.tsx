'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { DebateConfig } from '@/lib/types';

export default function SetupPage() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [defender, setDefender] = useState('');
  const [opposer, setOpposer] = useState('');
  const [rounds, setRounds] = useState(3);

  const ready = topic.trim().length > 0 && defender.trim().length > 0 && opposer.trim().length > 0;

  function start() {
    if (!ready) {
      return;
    }
    const id = crypto.randomUUID();
    const config: DebateConfig = {
      id,
      topic: topic.trim(),
      rounds,
      jevEnabled: false,
      sides: { defender: defender.trim(), opposer: opposer.trim() },
    };
    sessionStorage.setItem(`dialektika.pending.${id}`, JSON.stringify(config));
    router.push(`/debate/${id}`);
  }

  return (
    <main className="shell">
      <p className="brand">Dialektika</p>
      <h1 className="title">Two models. One arena.</h1>
      <p className="subtitle">
        Put a claim to the test: pick two models, assign the sides, and let them debate round by
        round.
      </p>

      <form
        className="card"
        onSubmit={(event) => {
          event.preventDefault();
          start();
        }}
      >
        <div className="field">
          <label htmlFor="topic">Debate topic</label>
          <input
            id="topic"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Should humans build RSI?"
            autoComplete="off"
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="defender">Defender · Proposition (model id)</label>
            <input
              id="defender"
              value={defender}
              onChange={(event) => setDefender(event.target.value)}
              placeholder="openai/gpt-…"
              autoComplete="off"
            />
          </div>
          <div className="field">
            <label htmlFor="opposer">Opposer · Opposition (model id)</label>
            <input
              id="opposer"
              value={opposer}
              onChange={(event) => setOpposer(event.target.value)}
              placeholder="anthropic/claude-…"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="row">
          <div className="field rounds-field">
            <label htmlFor="rounds">Rounds</label>
            <input
              id="rounds"
              type="number"
              min={1}
              max={10}
              value={rounds}
              onChange={(event) => setRounds(Math.max(1, Number(event.target.value) || 1))}
            />
          </div>
          <button className="btn" type="submit" disabled={!ready}>
            Start debate
          </button>
        </div>

        <p className="hint">
          This first slice takes model ids typed by hand; searchable model pickers come next.
        </p>
      </form>
    </main>
  );
}
