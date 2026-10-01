import { describe, expect, it } from 'vitest';
import { buildInstructions, buildMessages, nextSpeaker, totalTurns } from '../orchestrator';
import type { DebateConfig, Side, Turn } from '../types';

const config: DebateConfig = {
  id: 'debate-1',
  topic: 'Should humans build RSI?',
  rounds: 3,
  jevEnabled: false,
  sides: { defender: 'openai/gpt', opposer: 'anthropic/claude' },
};

function turn(index: number, side: Side, round: number, text: string): Turn {
  return { index, round, side, modelId: config.sides[side], text };
}

describe('nextSpeaker', () => {
  it('opens with the defender in round 1', () => {
    expect(nextSpeaker(config, [])).toEqual({ side: 'defender', round: 1 });
  });

  it('alternates sides each turn', () => {
    const turns = [turn(0, 'defender', 1, 'a')];
    expect(nextSpeaker(config, turns)).toEqual({ side: 'opposer', round: 1 });

    turns.push(turn(1, 'opposer', 1, 'b'));
    expect(nextSpeaker(config, turns)).toEqual({ side: 'defender', round: 2 });
  });

  it('stops after the configured rounds', () => {
    expect(totalTurns(config)).toBe(6);

    const turns: Turn[] = [];
    for (let index = 0; index < totalTurns(config); index += 1) {
      turns.push(
        turn(index, index % 2 === 0 ? 'defender' : 'opposer', Math.floor(index / 2) + 1, 'x'),
      );
    }
    expect(nextSpeaker(config, turns)).toBeNull();
  });

  it('respects a different round count', () => {
    const short: DebateConfig = { ...config, rounds: 2 };
    expect(totalTurns(short)).toBe(4);
    const turns: Turn[] = [
      turn(0, 'defender', 1, 'a'),
      turn(1, 'opposer', 1, 'b'),
      turn(2, 'defender', 2, 'c'),
      turn(3, 'opposer', 2, 'd'),
    ];
    expect(nextSpeaker(short, turns)).toBeNull();
  });
});

describe('buildInstructions', () => {
  it('names the topic and the side, and states the burden of proof', () => {
    const defender = buildInstructions(config, 'defender');
    expect(defender).toContain('Should humans build RSI?');
    expect(defender).toContain('Proposition');
    expect(defender).toContain('burden of proof');

    expect(buildInstructions(config, 'opposer')).toContain('Opposition');
  });
});

describe('buildMessages', () => {
  it('only sends user-role messages (v7 forbids a system message here)', () => {
    const messages = buildMessages([]);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('Open the debate');
    expect(messages.some((message) => message.role === 'system')).toBe(false);
  });

  it('passes the debate so far so each side can rebut', () => {
    const messages = buildMessages([turn(0, 'defender', 1, 'RSI is inevitable and good.')]);
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toContain('RSI is inevitable and good.');
    expect(messages[0].content).toContain('rebutting');
  });
});
