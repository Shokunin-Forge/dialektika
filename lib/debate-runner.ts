import { buildInstructions, buildMessages, nextSpeaker } from './orchestrator';
import { streamTurnText } from './openrouter';
import type { StreamEvent } from './stream-protocol';
import type { ChatMessage, DebateConfig, Turn } from './types';

export type StreamTurnFn = (
  modelId: string,
  instructions: string,
  messages: ChatMessage[],
) => AsyncIterable<string>;
export type EmitFn = (event: StreamEvent) => void | Promise<void>;

export async function runDebate(
  config: DebateConfig,
  emit: EmitFn,
  streamTurn: StreamTurnFn = streamTurnText,
  initialTurns: Turn[] = [],
): Promise<Turn[]> {
  const turns: Turn[] = [...initialTurns];
  let next = nextSpeaker(config, turns);

  while (next) {
    const { side, round } = next;
    const modelId = config.sides[side];
    await emit({ type: 'turn-start', side, round, modelId });

    const instructions = buildInstructions(config, side);
    const messages = buildMessages(turns);
    let text = '';

    try {
      for await (const chunk of streamTurn(modelId, instructions, messages)) {
        if (!chunk) {
          continue;
        }
        text += chunk;
        await emit({ type: 'turn-chunk', side, round, text: chunk });
      }
    } catch (error) {
      await emit({ type: 'error', side, round, message: toMessage(error) });
      throw error;
    }

    await emit({ type: 'turn-end', side, round });
    turns.push({ index: turns.length, round, side, modelId, text });
    next = nextSpeaker(config, turns);
  }

  return turns;
}

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
