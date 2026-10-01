'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { filterModels } from '@/lib/models';
import type { ModelOption } from '@/lib/types';

interface ModelPickerProps {
  id: string;
  label: string;
  value: string;
  models: ModelOption[];
  loading: boolean;
  onChange: (id: string) => void;
}

export function ModelPicker({ id, label, value, models, loading, onChange }: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(
    () => models.find((model) => model.id === value) ?? null,
    [models, value],
  );
  const matches = useMemo(() => filterModels(models, query, 500), [models, query]);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchRef.current?.focus();

    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  if (loading && models.length === 0) {
    return (
      <div className="field">
        <label htmlFor={id}>{label}</label>
        <button id={id} type="button" className="picker-trigger" disabled>
          Loading models…
        </button>
      </div>
    );
  }

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

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="picker" ref={rootRef}>
        <button
          id={id}
          type="button"
          className="picker-trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((previous) => !previous)}
        >
          <span className={selected ? 'picker-value' : 'picker-placeholder'}>
            {selected ? selected.name : 'Select a model…'}
          </span>
          <span className="picker-caret" aria-hidden="true">
            ▾
          </span>
        </button>

        {selected ? <span className="picker-selected">{selected.id}</span> : null}

        {open ? (
          <div className="picker-panel">
            <input
              ref={searchRef}
              className="picker-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search models…"
              autoComplete="off"
            />
            <ul className="picker-list" role="listbox" aria-label={label}>
              {matches.map((model) => (
                <li key={model.id} role="option" aria-selected={model.id === value}>
                  <button
                    type="button"
                    className={`picker-option${model.id === value ? ' selected' : ''}`}
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
              {matches.length === 0 ? (
                <li className="picker-empty">No models match “{query}”.</li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}
