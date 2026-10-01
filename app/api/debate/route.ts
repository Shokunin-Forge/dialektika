import { runDebate } from '@/lib/debate-runner';
import { buildJudgePrompt } from '@/lib/judge';
import { hasApiKey, judgeDebate, MISSING_KEY_MESSAGE } from '@/lib/openrouter';
import { serializeEvent } from '@/lib/stream-protocol';
import type { StreamEvent } from '@/lib/stream-protocol';
import type { DebateConfig, Side, Turn } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  if (!hasApiKey()) {
    return Response.json({ error: MISSING_KEY_MESSAGE }, { status: 400 });
  }

  let body: DebateConfig & { priorTurns?: unknown };
  try {
    body = (await request.json()) as DebateConfig & { priorTurns?: unknown };
  } catch {
    return Response.json({ error: 'The debate request was not valid JSON.' }, { status: 400 });
  }

  if (!isValidConfig(body)) {
    return Response.json(
      { error: 'A topic, both models, and at least one round are required.' },
      { status: 400 },
    );
  }

  const priorTurns = sanitizeTurns(body.priorTurns);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(serializeEvent(event)));
      };

      try {
        const turns = await runDebate(body, emit, undefined, priorTurns);

        if (body.jevEnabled) {
          emit({ type: 'verdict', verdict: await judgeDebate(buildJudgePrompt(body, turns)) });
        }

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

function sanitizeTurns(value: unknown): Turn[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const turns: Turn[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const { round, side, modelId, text } = entry as Record<string, unknown>;
    const validSide: Side | null = side === 'defender' || side === 'opposer' ? side : null;
    if (
      validSide &&
      typeof round === 'number' &&
      typeof modelId === 'string' &&
      typeof text === 'string'
    ) {
      turns.push({ index: turns.length, round, side: validSide, modelId, text });
    }
  }
  return turns;
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
