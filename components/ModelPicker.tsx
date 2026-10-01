'use client';

import { useMemo, useState } from 'react';
import { filterModels } from '@/lib/models';
import type { ModelOption } from '@/lib/types';

interface ModelPickerProps {
  id: string;
  label: string;
  value: string;
  models: ModelOption[];
  onChange: (id: string) => void;
}

export function ModelPicker({ id, label, value, models, onChange }: ModelPickerProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => models.find((model) => model.id === value) ?? null, [models, value]);

  if (models.length === 0) {
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <input
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="provider/model-id"
          autoComplete="off"
        />
        <span className="hint">Model list unavailable — type the id by hand.</span>
      </div>
    );
  }

  const matches = filterModels(models, query);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="picker">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Search models…"
          value={open ? query : selected ? selected.name : ''}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          onBlur={() => setOpen(false)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
        {selected ? <span className="picker-selected">{selected.id}</span> : null}
        {open ? (
          <ul id={`${id}-list`} role="listbox" className="picker-list">
            {matches.map((model) => (
              <li key={model.id} role="option" aria-selected={model.id === value}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(model.id);
                    setQuery('');
                    setOpen(false);
                  }}
                >
                  <span className="picker-name">{model.name}</span>
                  <span className="picker-id">{model.id}</span>
                </button>
              </li>
            ))}
            {matches.length === 0 ? <li className="picker-empty">No models match “{query}”.</li> : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
