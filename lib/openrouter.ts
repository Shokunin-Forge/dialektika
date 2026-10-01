import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { generateText, Output, streamText } from 'ai';
import {
  JUDGE_INSTRUCTIONS,
  judgementSchema,
  plainTextVerdict,
  toVerdict,
} from './judge';
import type { ChatMessage, Verdict } from './types';

export const MISSING_KEY_MESSAGE =
  'OPENROUTER_API_KEY is not set. Add it to .env.local and restart the dev server.';

export const JUDGE_MODEL = process.env.JUDGE_MODEL ?? 'openai/gpt-4o-mini';

export function hasApiKey(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

let client: ReturnType<typeof createOpenRouter> | null = null;

function openrouter(): ReturnType<typeof createOpenRouter> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error(MISSING_KEY_MESSAGE);
  }
  client ??= createOpenRouter({ apiKey });
  return client;
}

interface StreamPart {
  type: string;
  text?: string;
  error?: unknown;
}

export function streamTurnText(
  modelId: string,
  instructions: string,
  messages: ChatMessage[],
): AsyncIterable<string> {
  const result = streamText({
    model: openrouter().chat(modelId),
    instructions,
    messages,
  });
  return textDeltas(result.fullStream as unknown as AsyncIterable<StreamPart>);
}

export async function judgeDebate(prompt: string): Promise<Verdict> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const { output } = await generateText({
        model: openrouter().chat(JUDGE_MODEL),
        instructions: JUDGE_INSTRUCTIONS,
        output: Output.object({ schema: judgementSchema }),
        prompt,
      });
      return toVerdict(output);
    } catch (error) {
      lastError = error;
    }
  }

  try {
    const { text } = await generateText({
      model: openrouter().chat(JUDGE_MODEL),
      instructions: JUDGE_INSTRUCTIONS,
      prompt,
    });
    return plainTextVerdict(text);
  } catch {
    return plainTextVerdict(`Jev could not score this debate: ${toError(lastError).message}`);
  }
}

async function* textDeltas(
  stream: AsyncIterable<StreamPart>,
): AsyncGenerator<string, void, unknown> {
  for await (const part of stream) {
    if (part.type === 'text-delta' && typeof part.text === 'string') {
      yield part.text;
    } else if (part.type === 'error') {
      throw toError(part.error);
    }
  }
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(typeof error === 'string' ? error : 'The model call failed.');
}
