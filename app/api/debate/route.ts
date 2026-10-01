import { runDebate } from '@/lib/debate-runner';
import { hasApiKey, MISSING_KEY_MESSAGE } from '@/lib/openrouter';
import { serializeEvent } from '@/lib/stream-protocol';
import type { StreamEvent } from '@/lib/stream-protocol';
import type { DebateConfig } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 400 });
  }

  let config: DebateConfig;
  try {
    config = (await request.json()) as DebateConfig;
  } catch {
    return Response.json({ error: 'The debate request was not valid JSON.' }, { status: 400 });
  }

  if (!isValidConfig(config)) {
    return Response.json(
      { error: 'A topic, both models, and at least one round are required.' },
      { status: 400 },
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(serializeEvent(event)));
      };
      try {
        await runDebate(config, emit);
        emit({ type: 'done' });
      } catch {
        // The runner already emitted a tagged error event for the failed turn.
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function isValidConfig(config: DebateConfig): boolean {
  return Boolean(
    config &&
      typeof config.topic === 'string' &&
      config.topic.trim() &&
      config.sides &&
      config.sides.defender &&
      config.sides.opposer &&
      Number.isInteger(config.rounds) &&
      config.rounds >= 1,
  );
}
