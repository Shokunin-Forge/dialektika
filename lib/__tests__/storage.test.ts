import { beforeEach, describe, expect, it } from 'vitest';
import { getDebate, loadDebates, saveDebate } from '../storage';
import type { Debate } from '../types';

class MemoryStorage {
  private map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? (this.map.get(key) as string) : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  get length(): number {
    return this.map.size;
  }
}

function debate(id: string, topic: string): Debate {
  return {
    id,
    topic,
    createdAt: '2026-10-01T00:00:00.000Z',
    rounds: 1,
    jevEnabled: true,
    sides: { defender: 'a/b', opposer: 'c/d' },
    turns: [{ index: 0, round: 1, side: 'defender', modelId: 'a/b', text: 'opening' }],
    verdict: null,
  };
}

beforeEach(() => {
  (globalThis as unknown as { localStorage: Storage }).localStorage =
    new MemoryStorage() as unknown as Storage;
});

describe('debate storage', () => {
  it('starts empty', () => {
    expect(loadDebates()).toEqual([]);
  });

  it('round-trips a saved debate, newest first', () => {
    saveDebate(debate('one', 'First'));
    saveDebate(debate('two', 'Second'));

    const all = loadDebates();
    expect(all.map((item) => item.id)).toEqual(['two', 'one']);
    expect(getDebate('one')?.topic).toBe('First');
  });

  it('replaces a debate with the same id instead of duplicating', () => {
    saveDebate(debate('one', 'First'));
    saveDebate(debate('one', 'First (revised)'));

    const all = loadDebates();
    expect(all).toHaveLength(1);
    expect(all[0].topic).toBe('First (revised)');
  });

  it('ignores a corrupt store', () => {
    const store = (globalThis as unknown as { localStorage: Storage }).localStorage;
    store.setItem('dialektika.debates.v1', 'not json');
    expect(loadDebates()).toEqual([]);
  });
});
