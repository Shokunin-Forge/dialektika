import { describe, expect, it } from 'vitest';
import { buildJudgePrompt, judgementSchema, toVerdict, type Judgement } from '../judge';
import type { DebateConfig, Turn } from '../types';

const config: DebateConfig = {
  id: 'debate-1',
  topic: 'Should humans build RSI?',
  rounds: 1,
  jevEnabled: true,
  sides: { defender: 'openai/gpt', opposer: 'meta/llama' },
};

const turns: Turn[] = [
  { index: 0, round: 1, side: 'defender', modelId: 'openai/gpt', text: 'RSI is inevitable.' },
  { index: 1, round: 1, side: 'opposer', modelId: 'meta/llama', text: 'It is uncontrollable.' },
];

function judgement(overrides: Partial<Judgement> = {}): Judgement {
  return {
    defender: { reasoning: 8, engagement: 8, burdenOfProof: 8 },
    opposer: { reasoning: 5, engagement: 5, burdenOfProof: 5 },
    strongerSide: 'defender',
    decisiveTurns: [0],
    crystallization: 'The affirmative case held.',
    ...overrides,
  };
}

describe('buildJudgePrompt', () => {
  it('includes the topic, both turns, and their indexes', () => {
    const prompt = buildJudgePrompt(config, turns);
    expect(prompt).toContain('Should humans build RSI?');
    expect(prompt).toContain('RSI is inevitable.');
    expect(prompt).toContain('It is uncontrollable.');
    expect(prompt).toContain('Turn 0');
    expect(prompt).toContain('Turn 1');
  });
});

describe('judgementSchema', () => {
  it('accepts a well-formed judgement', () => {
    expect(judgementSchema.parse(judgement()).strongerSide).toBe('defender');
  });

  it('rejects out-of-range scores and unknown sides', () => {
    expect(() =>
      judgementSchema.parse(judgement({ defender: { reasoning: 11, engagement: 6, burdenOfProof: 6 } })),
    ).toThrow();
    expect(() => judgementSchema.parse(judgement({ strongerSide: 'nobody' as never }))).toThrow();
  });
});

describe('toVerdict', () => {
  it('keeps the named side when the scores are not level', () => {
    const verdict = toVerdict(judgement());
    expect(verdict.strongerSide).toBe('defender');
    expect(verdict.tieBreakApplied).toBe(false);
  });

  it('awards a level debate to the opposition (burden of proof)', () => {
    const verdict = toVerdict(
      judgement({
        defender: { reasoning: 6, engagement: 6, burdenOfProof: 6 },
        opposer: { reasoning: 6, engagement: 6, burdenOfProof: 6 },
        strongerSide: 'defender',
      }),
    );
    expect(verdict.strongerSide).toBe('opposer');
    expect(verdict.tieBreakApplied).toBe(true);
  });
});
