import type { Side, Verdict } from './types';

export type StreamEvent =
  | { type: 'turn-start'; side: Side; round: number; modelId: string }
  | { type: 'turn-chunk'; side: Side; round: number; text: string }
  | { type: 'turn-end'; side: Side; round: number }
  | { type: 'verdict'; verdict: Verdict }
  | { type: 'done' }
  | { type: 'error'; side?: Side; round?: number; message: string };

export function serializeEvent(event: StreamEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export function parseEvent(line: string): StreamEvent | null {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  return JSON.parse(trimmed) as StreamEvent;
}

export function parseEvents(text: string): StreamEvent[] {
  return text
    .split('\n')
    .map(parseEvent)
    .filter((event): event is StreamEvent => event !== null);
}
