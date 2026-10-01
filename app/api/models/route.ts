import { fetchModels } from '@/lib/models';
import { hasApiKey } from '@/lib/openrouter';
import type { ModelOption } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let cache: ModelOption[] | null = null;

export async function GET() {
  const keyConfigured = hasApiKey();

  if (cache) {
    return Response.json({ models: cache, cached: true, keyConfigured });
  }

  try {
    const models = await fetchModels();
    cache = models;
    return Response.json({ models, cached: false, keyConfigured });
  } catch (error) {
    return Response.json(
      {
        models: [],
        keyConfigured,
        error: error instanceof Error ? error.message : 'Could not load the OpenRouter model list.',
      },
      { status: 502 },
    );
  }
}
