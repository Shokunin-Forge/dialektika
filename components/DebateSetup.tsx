'use client';

import { useState } from 'react';
import type { DebateConfig, ModelOption } from '@/lib/types';
import { ModelPicker } from './ModelPicker';

interface DebateSetupProps {
  models: ModelOption[];
  modelListFailed: boolean;
  onStart: (config: Omit<DebateConfig, 'id'>) => void;
}

export function DebateSetup({ models, modelListFailed, onStart }: DebateSetupProps) {
  const [topic, setTopic] = useState('');
  const [defender, setDefender] = useState('');
  const [opposer, setOpposer] = useState('');
  const [rounds, setRounds] = useState(3);

  const ready =
    topic.trim().length > 0 && defender.trim().length > 0 && opposer.trim().length > 0;

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        if (!ready) {
          return;
        }
        onStart({
          topic: topic.trim(),
          rounds,
          jevEnabled: false,
          sides: { defender: defender.trim(), opposer: opposer.trim() },
        });
      }}
    >
      {modelListFailed ? (
        <p className="hint">
          Couldn’t load the OpenRouter model list — type model ids by hand in the fields below.
        </p>
      ) : null}

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
        <ModelPicker
          id="defender"
          label="Defender · Proposition"
          value={defender}
          models={models}
          onChange={setDefender}
        />
        <ModelPicker
          id="opposer"
          label="Opposer · Opposition"
          value={opposer}
          models={models}
          onChange={setOpposer}
        />
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
    </form>
  );
}
