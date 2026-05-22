export interface StrategyObjectives {
  reach: string;
  engagement: string;
  conversion: string;
  retention: string;
}

export interface StrategyContentMix {
  educational: number;
  promotional: number;
  entertaining: number;
  behind_the_scenes: number;
}

export interface ChannelStrategy {
  name: string;
  allocation: number;
  frequency: string;
  content_mix: StrategyContentMix;
  best_times: string[];
  rationale: string;
}

export interface ContentPillar {
  name: string;
  description: string;
  examples: string[];
  frequency: string;
}

export type KPIImportance = 'critical' | 'high' | 'medium';

export interface KPI {
  name: string;
  target: string;
  measurement: string;
  importance: KPIImportance;
}

export type StrategyStatus = 'pending' | 'approved' | 'rejected';

export interface Strategy {
  id: string;
  brandProfileId: string;
  agencyId: string;
  objectives: StrategyObjectives;
  primaryChannels: string[];
  channelStrategies: ChannelStrategy[];
  contentPillars: ContentPillar[];
  contentMix: StrategyContentMix;
  kpis: KPI[];
  postingFrequency: Record<string, string>;
  bestPostingTimes: Record<string, string[]>;
  reasoning: string;
  nextSteps: string;
  feedback: string | null;
  status: StrategyStatus;
  createdAt: string;
  updatedAt: string;
}
