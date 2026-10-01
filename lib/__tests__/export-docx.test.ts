import { Packer } from 'docx';
import { describe, expect, it } from 'vitest';
import { buildDebateDocument, debateFilename } from '../export-docx';
import type { Debate } from '../types';

const debate: Debate = {
  id: 'debate-1',
  topic: 'Should humans build RSI?',
  createdAt: '2026-10-01T00:00:00.000Z',
  rounds: 1,
  jevEnabled: true,
  sides: { defender: 'openai/gpt', opposer: 'meta/llama' },
  turns: [
    { index: 0, round: 1, side: 'defender', modelId: 'openai/gpt', text: 'RSI is inevitable.' },
    { index: 1, round: 1, side: 'opposer', modelId: 'meta/llama', text: 'It is uncontrollable.' },
  ],
  verdict: {
    scores: {
      defender: { reasoning: 7, engagement: 6, burdenOfProof: 6 },
      opposer: { reasoning: 8, engagement: 8, burdenOfProof: 7 },
    },
    strongerSide: 'opposer',
    decisiveTurns: [1],
    crystallization: 'The opposition kept control on its side.',
    tieBreakApplied: false,
    plainText: false,
  },
};

describe('buildDebateDocument', () => {
  it('packs to a non-empty .docx buffer (a zip archive)', async () => {
    const buffer = await Packer.toBuffer(buildDebateDocument(debate));
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer[0]).toBe(0x50);
    expect(buffer[1]).toBe(0x4b);
    // A real .docx stores its main document part under this path.
    expect(buffer.includes('word/document.xml')).toBe(true);
  });

  it('also packs a plain-text verdict with no scores', async () => {
    const plain: Debate = {
      ...debate,
      verdict: {
        scores: null,
        strongerSide: null,
        decisiveTurns: [],
        crystallization: 'Jev could not score this debate.',
        tieBreakApplied: false,
        plainText: true,
      },
    };
    const buffer = await Packer.toBuffer(buildDebateDocument(plain));
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe('debateFilename', () => {
  it('slugifies the topic', () => {
    expect(debateFilename(debate)).toBe('dialektika-should-humans-build-rsi.docx');
  });
});
