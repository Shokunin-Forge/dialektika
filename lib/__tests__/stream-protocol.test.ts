import { describe, expect, it } from 'vitest';
import { parseEvent, parseEvents, serializeEvent, type StreamEvent } from '../stream-protocol';
import type { Verdict } from '../types';

const verdict: Verdict = {
  scores: {
    defender: { reasoning: 7, engagement: 6, burdenOfProof: 7 },
    opposer: { reasoning: 8, engagement: 8, burdenOfProof: 6 },
  },
  strongerSide: 'opposer',
  decisiveTurns: [1, 3],
  crystallization: 'The opposition shifted the burden and never lost it.',
  tieBreakApplied: false,
  plainText: false,
};

const events: StreamEvent[] = [
  { type: 'turn-start', side: 'defender', round: 1, modelId: 'openai/gpt' },
  { type: 'turn-chunk', side: 'defender', round: 1, text: 'Hello' },
  { type: 'turn-end', side: 'defender', round: 1 },
  { type: 'verdict', verdict },
  { type: 'done' },
  { type: 'error', side: 'opposer', round: 2, message: 'rate limited' },
  { type: 'error', message: 'missing key' },
];

describe('stream protocol', () => {
  it('round-trips every event type', () => {
    for (const event of events) {
      expect(parseEvent(serializeEvent(event))).toEqual(event);
    }
  });

  it('parses newline-delimited events and ignores blank lines', () => {
    const ndjson = `${serializeEvent(events[0])}\n${serializeEvent(events[1])}\n\n${serializeEvent(events[2])}`;
    expect(parseEvents(ndjson)).toEqual([events[0], events[1], events[2]]);
  });

  it('returns null for a blank line', () => {
    expect(parseEvent('   ')).toBeNull();
  });

  it('serializes one event as a single newline-terminated line', () => {
    expect(serializeEvent({ type: 'done' })).toBe('{"type":"done"}\n');
  });
});
