import { normalizeModels } from './models';
import type { ModelOption } from './types';

export const MODELS_CACHE_KEY = 'dialektika.models.v1';

export function loadModelsCache(): ModelOption[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(MODELS_CACHE_KEY);
    return raw ? normalizeModels(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function saveModelsCache(models: ModelOption[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(MODELS_CACHE_KEY, JSON.stringify(models));
  } catch {
    return;
  }
}
