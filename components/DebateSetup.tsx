'use client';

import { useState } from 'react';
import type { DebateConfig, ModelOption } from '@/lib/types';
import { ModelPicker } from './ModelPicker';

interface DebateSetupProps {
  models: ModelOption[];
  modelListFailed: boolean;
  keyConfigured: boolean;
  onStart: (config: Omit<DebateConfig, 'id'>) => void;
}

export function DebateSetup({ models, modelListFailed, keyConfigured, onStart }: DebateSetupProps) {
  const [topic, setTopic] = useState('');
  const [defender, setDefender] = useState('');
  const [opposer, setOpposer] = useState('');
  const [rounds, setRounds] = useState(3);
  const [jevEnabled, setJevEnabled] = useState(true);

  const ready =
    keyConfigured &&
    topic.trim().length > 0 &&
    defender.trim().length > 0 &&
    opposer.trim().length > 0;

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
          jevEnabled,
          sides: { defender: defender.trim(), opposer: opposer.trim() },
        });
      }}
    >
      {!keyConfigured ? (
        <p className="notice">
          OPENROUTER_API_KEY is not set. Add it to <code>.env.local</code> and restart the dev
          server, then reload this page.
        </p>
      ) : null}

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
        <div className="field checkbox-field">
          <label htmlFor="jev">
            <input
              id="jev"
              type="checkbox"
              checked={jevEnabled}
              onChange={(event) => setJevEnabled(event.target.checked)}
            />
            <span>Jev judges the debate</span>
          </label>
        </div>
        <button className="btn" type="submit" disabled={!ready}>
          Start debate
        </button>
      </div>
    </form>
  );
}
