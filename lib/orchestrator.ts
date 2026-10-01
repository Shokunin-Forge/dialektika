import type { ChatMessage, DebateConfig, Side, Turn } from './types';

const SIDE_LABEL: Record<Side, string> = {
  defender: 'Proposition (the defender)',
  opposer: 'Opposition (the opposer)',
};

export function totalTurns(config: DebateConfig): number {
  return config.rounds * 2;
}

export function nextSpeaker(
  config: DebateConfig,
  turns: Turn[],
): { side: Side; round: number } | null {
  if (turns.length >= totalTurns(config)) {
    return null;
  }
  const index = turns.length;
  return {
    side: index % 2 === 0 ? 'defender' : 'opposer',
    round: Math.floor(index / 2) + 1,
  };
}

export function buildInstructions(config: DebateConfig, side: Side): string {
  return [
    `You are ${SIDE_LABEL[side]} in a formal debate on the topic: "${config.topic}".`,
    side === 'defender'
      ? 'As the Proposition you carry the burden of proof: make the affirmative case for the topic and defend it against every objection.'
      : 'As the Opposition you contest the Proposition: attack its reasoning and keep the burden of proof on the defender rather than merely disagreeing.',
    'Argue in your own words, engage the latest opposing argument directly, and keep each turn to a few tight paragraphs. Do not narrate and do not add headings.',
  ].join(' ');
}

export function buildMessages(turns: Turn[]): ChatMessage[] {
  if (turns.length === 0) {
    return [{ role: 'user', content: 'Open the debate with your first argument.' }];
  }

  const transcript = turns
    .map((turn) => `Round ${turn.round} — ${SIDE_LABEL[turn.side]}: ${turn.text}`)
    .join('\n\n');

  return [
    {
      role: 'user',
      content: `The debate so far:\n\n${transcript}\n\nWrite your next turn, directly rebutting the other side's latest argument.`,
    },
  ];
}
