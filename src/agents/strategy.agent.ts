import { z } from 'zod';

import { STRATEGY_SYSTEM_PROMPT } from '@/agents/prompts/strategy.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';

export const strategyDocSchema = z.object({
  objective: z.string().min(1),
  monthlyTheme: z.string().min(1),
  contentPillars: z
    .array(z.object({ pillar: z.string().min(1), weight: z.number().min(0).max(100) }))
    .length(4),
  formatMix: z
    .array(
      z.object({
        type: z.enum(['post', 'reel', 'story', 'carousel']),
        quantity: z.number().min(0),
      })
    )
    .min(1),
  contentIdeas: z
    .array(
      z.object({
        pillarIndex: z.number().min(0).max(3),
        format: z.string().min(1),
        headline: z.string().min(1),
        description: z.string().min(1),
        keyAngle: z.string().min(1),
      })
    )
    .min(4)
    .max(6),
  kpis: z.array(z.string()).min(3).max(5),
});

export type StrategyDocOutput = z.infer<typeof strategyDocSchema>;

export interface StrategyInput {
  brandProfile: BrandProfile;
  month: string;
}

export class StrategyAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: StrategyInput): Promise<StrategyDocOutput> {
    const prompt = JSON.stringify(
      {
        brandProfile: {
          clientName: input.brandProfile.clientName,
          industry: input.brandProfile.industry,
          location: input.brandProfile.location,
          voice: input.brandProfile.voice,
          audience: input.brandProfile.audience,
          contentPillars: input.brandProfile.contentPillars,
          competitors: input.brandProfile.competitors,
          goals: input.brandProfile.goals,
          pack: input.brandProfile.pack,
        },
        month: input.month,
      },
      null,
      2
    );

    const { text } = await this.provider.generateText({
      system: STRATEGY_SYSTEM_PROMPT,
      prompt,
      temperature: 0.5,
      maxTokens: 3000,
    });

    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    return strategyDocSchema.parse(JSON.parse(cleaned));
  }
}
