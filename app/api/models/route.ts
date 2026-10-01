import { fetchModels } from '@/lib/models';
import type { ModelOption } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let cache: ModelOption[] | null = null;

export async function GET() {
  if (cache) {
    return Response.json({ models: cache, cached: true });
  }

  try {
    const models = await fetchModels();
    cache = models;
    return Response.json({ models, cached: false });
  } catch (error) {
    return Response.json(
      {
        models: [],
        error: error instanceof Error ? error.message : 'Could not load the OpenRouter model list.',
      },
      { status: 502 },
    );
  }
}
