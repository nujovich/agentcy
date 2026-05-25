import { z } from 'zod';

import { STRATEGY_SYSTEM_PROMPT, buildStrategyUserPrompt } from '@/agents/prompts/strategy.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';

// ─── Zod schemas matching the API route ──────────────────

const kpiSchema = z.object({
  name: z.string(),
  target: z.string(),
  measurement: z.string(),
  importance: z.enum(['critical', 'high', 'medium']),
});

const scenarioSchema = z.object({
  name: z.enum(['conservative', 'sustainable', 'aggressive']),
  label: z.string(),
  description: z.string(),
  effort: z.string(),
  investment: z.string(),
  growth_rate: z.string(),
  kpis: z.array(kpiSchema),
  realistic_reasoning: z.string(),
});

const channelStrategySchema = z.object({
  name: z.string(),
  allocation: z.number(),
  frequency: z.string(),
  content_mix: z.object({
    educational: z.number(),
    promotional: z.number(),
    entertaining: z.number(),
    behind_the_scenes: z.number(),
  }),
  best_times: z.array(z.string()),
  rationale: z.string(),
});

const contentPillarSchema = z.object({
  name: z.string(),
  description: z.string(),
  examples: z.array(z.string()),
  frequency: z.string(),
});

export const strategyDocSchema = z.object({
  objectives: z.object({
    reach: z.string(),
    engagement: z.string(),
    conversion: z.string(),
    retention: z.string(),
  }),
  primaryChannels: z.array(z.string()),
  channelStrategies: z.array(channelStrategySchema),
  contentPillars: z.array(contentPillarSchema),
  contentMix: z.object({
    educational: z.number(),
    promotional: z.number(),
    entertaining: z.number(),
    behind_the_scenes: z.number(),
  }),
  scenarioConservative: scenarioSchema,
  scenarioSustainable: scenarioSchema,
  scenarioAggressive: scenarioSchema,
  postingFrequency: z.record(z.string(), z.string()),
  bestPostingTimes: z.record(z.string(), z.array(z.string())),
  reasoning: z.string(),
  next_steps: z.string(),
});

export type StrategyDocOutput = z.infer<typeof strategyDocSchema>;

export interface StrategyInput {
  brandProfile: BrandProfile;
  month: string;
  currentFollowersData?: Record<string, number>;
}

export class StrategyAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: StrategyInput): Promise<StrategyDocOutput> {
    const followersData = input.currentFollowersData ?? {};

    const prompt = buildStrategyUserPrompt(input.brandProfile, followersData);

    const { text } = await this.provider.generateText({
      system: STRATEGY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.6,
      maxTokens: 6000,
    });

    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    return strategyDocSchema.parse(JSON.parse(cleaned));
  }
}
