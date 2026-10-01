import type { Debate } from './types';

export const DEBATES_KEY = 'dialektika.debates.v1';

export function loadDebates(): Debate[] {
  const store = getStore();
  if (!store) {
    return [];
  }
  try {
    const raw = store.getItem(DEBATES_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isDebate) : [];
  } catch {
    return [];
  }
}

export function saveDebate(debate: Debate): Debate[] {
  const next = [debate, ...loadDebates().filter((existing) => existing.id !== debate.id)];
  persist(next);
  return next;
}

export function getDebate(id: string): Debate | null {
  return loadDebates().find((debate) => debate.id === id) ?? null;
}

function persist(debates: Debate[]): void {
  const store = getStore();
  if (!store) {
    return;
  }
  try {
    store.setItem(DEBATES_KEY, JSON.stringify(debates));
  } catch {
    return;
  }
}

function getStore(): Storage | null {
  try {
    return (globalThis as { localStorage?: Storage }).localStorage ?? null;
  } catch {
    return null;
  }
}

function isDebate(value: unknown): value is Debate {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { id, topic, turns } = value as Record<string, unknown>;
  return typeof id === 'string' && typeof topic === 'string' && Array.isArray(turns);
}
