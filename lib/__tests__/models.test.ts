import { describe, expect, it } from 'vitest';
import { filterModels, normalizeModels, parseModels } from '../models';

describe('parseModels', () => {
  it('maps an OpenRouter payload to sorted { id, name } options', () => {
    const models = parseModels({
      data: [
        { id: 'openai/gpt', name: 'GPT' },
        { id: 'anthropic/claude', name: 'Claude', context_length: 200000 },
      ],
    });
    expect(models).toEqual([
      { id: 'anthropic/claude', name: 'Claude' },
      { id: 'openai/gpt', name: 'GPT' },
    ]);
  });

  it('skips entries without a string id or name', () => {
    const models = parseModels({
      data: [{ id: 'a/b', name: 'AB' }, { id: 'no-name' }, null, { name: 'no id' }],
    });
    expect(models).toEqual([{ id: 'a/b', name: 'AB' }]);
  });

  it('throws when the payload has no data array', () => {
    expect(() => parseModels({ error: 'nope' })).toThrow();
    expect(() => parseModels(null)).toThrow();
  });
});

describe('normalizeModels', () => {
  it('throws for a non-array', () => {
    expect(() => normalizeModels('not an array')).toThrow();
  });
});

describe('filterModels', () => {
  const models = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'meta-llama/llama-3.3-70b', name: 'Llama 3.3 70B' },
  ];

  it('matches case-insensitively on the name', () => {
    expect(filterModels(models, 'claude').map((model) => model.id)).toEqual([
      'anthropic/claude-3.5-sonnet',
    ]);
  });

  it('matches on the id too', () => {
    expect(filterModels(models, 'gpt-4o').map((model) => model.id)).toEqual(['openai/gpt-4o']);
  });

  it('returns everything (up to the limit) for an empty query', () => {
    expect(filterModels(models, '')).toHaveLength(3);
    expect(filterModels(models, '', 2)).toHaveLength(2);
  });
});
