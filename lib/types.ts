export type Side = 'defender' | 'opposer';

export interface DebateConfig {
  id: string;
  topic: string;
  rounds: number;
  jevEnabled: boolean;
  sides: {
    defender: string;
    opposer: string;
  };
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Turn {
  index: number;
  round: number;
  side: Side;
  modelId: string;
  text: string;
}

export interface AxisScores {
  reasoning: number;
  engagement: number;
  burdenOfProof: number;
}

export interface Verdict {
  scores: {
    defender: AxisScores;
    opposer: AxisScores;
  };
  strongerSide: Side;
  decisiveTurns: number[];
  crystallization: string;
  tieBreakApplied: boolean;
}

export interface Debate {
  id: string;
  topic: string;
  createdAt: string;
  rounds: number;
  jevEnabled: boolean;
  sides: {
    defender: string;
    opposer: string;
  };
  turns: Turn[];
  verdict: Verdict | null;
}

export type TurnStatus = 'streaming' | 'done' | 'error';

export interface ArenaTurn extends Turn {
  status: TurnStatus;
  error?: string;
}
