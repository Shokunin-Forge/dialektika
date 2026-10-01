import { z } from 'zod';
import type { AxisScores, DebateConfig, Turn, Verdict } from './types';

const axisScoresSchema = z.object({
  reasoning: z.number().min(1).max(10).describe('Strength of reasoning, 1-10.'),
  engagement: z
    .number()
    .min(1)
    .max(10)
    .describe('Directness of engagement with and rebuttal of the other side, 1-10.'),
  burdenOfProof: z
    .number()
    .min(1)
    .max(10)
    .describe('How well this side met its burden of proof, 1-10.'),
});

export const judgementSchema = z.object({
  defender: axisScoresSchema,
  opposer: axisScoresSchema,
  strongerSide: z.enum(['defender', 'opposer']),
  decisiveTurns: z
    .array(z.number().int())
    .describe('Indices of the turns that decided it, using the turn numbers given.'),
  crystallization: z
    .string()
    .describe('Where the standpoints actually landed, in a few sentences.'),
});

export type Judgement = z.infer<typeof judgementSchema>;

export const JUDGE_INSTRUCTIONS = [
  'You are Jev, an impartial adjudicator of a two-sided debate.',
  'Weigh the standpoints, not the personalities. Score each side from 1 to 10 on reasoning, engagement, and burden of proof.',
  'Name the stronger side, cite the specific turns that decided it, and close with a crystallization of where the reasoning actually lands.',
  'Be decisive and specific; generic praise does not count.',
].join(' ');

export function buildJudgePrompt(config: DebateConfig, turns: Turn[]): string {
  const transcript = turns
    .map(
      (turn) =>
        `Turn ${turn.index} — Round ${turn.round} — ${
          turn.side === 'defender' ? 'Proposition (defender)' : 'Opposition (opposer)'
        } (${turn.modelId}):\n${turn.text}`,
    )
    .join('\n\n');

  return [
    `Topic: "${config.topic}"`,
    'The Proposition (defender) argued to affirm the topic; the Opposition (opposer) contested it. The defender opened and the sides alternated.',
    `Debate transcript:\n\n${transcript}`,
    'Adjudicate the debate. Cite the decisive turns by their turn index, and close with the crystallization.',
  ].join('\n\n');
}

export function toVerdict(judgement: Judgement): Verdict {
  const level = axisTotal(judgement.defender) === axisTotal(judgement.opposer);

  return {
    scores: { defender: judgement.defender, opposer: judgement.opposer },
    strongerSide: level ? 'opposer' : judgement.strongerSide,
    decisiveTurns: judgement.decisiveTurns,
    crystallization: judgement.crystallization,
    tieBreakApplied: level,
  };
}

function axisTotal(scores: AxisScores): number {
  return scores.reasoning + scores.engagement + scores.burdenOfProof;
}
