import { describe, expect, it } from 'vitest';
import { runDebate, type StreamTurnFn } from '../debate-runner';
import type { StreamEvent } from '../stream-protocol';
import type { ChatMessage, DebateConfig, Side } from '../types';

const config: DebateConfig = {
  id: 'debate-1',
  topic: 'Should humans build RSI?',
  rounds: 2,
  jevEnabled: false,
  sides: { defender: 'defender/model', opposer: 'opposer/model' },
};

const scripts: Record<string, string[]> = {
  'defender/model': ['The ', 'affirmative ', 'case.'],
  'opposer/model': ['I ', 'disagree.'],
};

interface TurnBlock {
  side: Side;
  round: number;
  chunks: string[];
}

function blocksOf(events: StreamEvent[]): { blocks: TurnBlock[]; strayChunks: number } {
  const blocks: TurnBlock[] = [];
  let current: TurnBlock | null = null;
  let strayChunks = 0;

  for (const event of events) {
    if (event.type === 'turn-start') {
      current = { side: event.side, round: event.round, chunks: [] };
      blocks.push(current);
    } else if (event.type === 'turn-chunk') {
      if (current) {
        current.chunks.push(event.text);
      } else {
        strayChunks += 1;
      }
    } else if (event.type === 'turn-end') {
      current = null;
    }
  }

  return { blocks, strayChunks };
}

describe('runDebate', () => {
  it('merges sequential streamed turns in order, preserving boundaries', async () => {
    const calls: { modelId: string; instructions: string; messages: ChatMessage[] }[] = [];
    const streamTurn: StreamTurnFn = (modelId, instructions, messages) => {
      calls.push({ modelId, instructions, messages });
      const chunks = scripts[modelId] ?? [''];
      return (async function* generate() {
        for (const chunk of chunks) {
          yield chunk;
        }
      })();
    };

    const events: StreamEvent[] = [];
    const turns = await runDebate(
      config,
      (event) => {
        events.push(event);
      },
      streamTurn,
    );

    // One turn per side per round, in strict debate order.
    expect(turns.map((turn) => `${turn.round}:${turn.side}`)).toEqual([
      '1:defender',
      '1:opposer',
      '2:defender',
      '2:opposer',
    ]);
    expect(turns.map((turn) => turn.text)).toEqual([
      'The affirmative case.',
      'I disagree.',
      'The affirmative case.',
      'I disagree.',
    ]);

    // Chunks never leak between turns; each turn is a contiguous block.
    const { blocks, strayChunks } = blocksOf(events);
    expect(strayChunks).toBe(0);
    expect(blocks.map((block) => `${block.round}:${block.side}`)).toEqual([
      '1:defender',
      '1:opposer',
      '2:defender',
      '2:opposer',
    ]);
    expect(blocks.map((block) => block.chunks.join(''))).toEqual([
      'The affirmative case.',
      'I disagree.',
      'The affirmative case.',
      'I disagree.',
    ]);

    // Four sequential model calls, each carrying its role instructions, and the
    // second one receiving the first turn so it can actually rebut.
    expect(calls).toHaveLength(4);
    expect(calls[0].modelId).toBe('defender/model');
    expect(calls[0].instructions).toContain('Proposition');
    expect(calls[1].modelId).toBe('opposer/model');
    expect(calls[1].instructions).toContain('Opposition');
    expect(
      calls[1].messages.some((message) => message.content.includes('The affirmative case.')),
    ).toBe(true);
  });

  it('resumes from previously completed turns', async () => {
    const calls: string[] = [];
    const streamTurn: StreamTurnFn = (modelId) =>
      (async function* generate() {
        calls.push(modelId);
        yield 'more';
      })();

    const events: StreamEvent[] = [];
    const prior = [
      { index: 0, round: 1, side: 'defender' as const, modelId: 'defender/model', text: 'opening' },
    ];

    const turns = await runDebate(
      config,
      (event) => {
        events.push(event);
      },
      streamTurn,
      prior,
    );

    // Two rounds = four turns; one was already done, so three more are streamed.
    expect(turns).toHaveLength(4);
    expect(turns[0].text).toBe('opening');
    expect(events[0]).toEqual({
      type: 'turn-start',
      side: 'opposer',
      round: 1,
      modelId: 'opposer/model',
    });
    expect(calls).toEqual(['opposer/model', 'defender/model', 'opposer/model']);
  });

  it('emits a tagged error and rethrows when a turn fails mid-debate', async () => {
    const streamTurn: StreamTurnFn = (modelId) =>
      (async function* generate() {
        if (modelId === 'opposer/model') {
          throw new Error('model offline');
        }
        yield 'opening';
      })();

    const events: StreamEvent[] = [];

    await expect(
      runDebate(
        config,
        (event) => {
          events.push(event);
        },
        streamTurn,
      ),
    ).rejects.toThrow('model offline');

    expect(events).toContainEqual({
      type: 'error',
      side: 'opposer',
      round: 1,
      message: 'model offline',
    });
  });
});
