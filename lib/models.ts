import type { ModelOption } from './types';

export const MODELS_URL = 'https://openrouter.ai/api/v1/models';

export function normalizeModels(entries: unknown): ModelOption[] {
  if (!Array.isArray(entries)) {
    throw new Error('Expected an array of models.');
  }

  const models: ModelOption[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const { id, name } = entry as { id?: unknown; name?: unknown };
    if (typeof id === 'string' && id && typeof name === 'string' && name) {
      models.push({ id, name });
    }
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

export function parseModels(payload: unknown): ModelOption[] {
  const data = (payload as { data?: unknown } | null)?.data;
  if (data === undefined) {
    throw new Error('Unexpected model list response from OpenRouter.');
  }
  return normalizeModels(data);
}

export function filterModels(models: ModelOption[], query: string, limit = 50): ModelOption[] {
  const needle = query.trim().toLowerCase();
  const matched = needle
    ? models.filter(
        (model) =>
          model.name.toLowerCase().includes(needle) || model.id.toLowerCase().includes(needle),
      )
    : models;
  return matched.slice(0, limit);
}

export async function fetchModels(): Promise<ModelOption[]> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  const response = await fetch(MODELS_URL, { headers, cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`OpenRouter model list request failed (${response.status}).`);
  }

  return parseModels(await response.json());
}
