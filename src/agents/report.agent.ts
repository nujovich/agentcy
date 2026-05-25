import { z } from 'zod';

import { REPORT_SYSTEM_PROMPT } from '@/agents/prompts/report.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';
import type { StrategyDoc } from '@/types/agent-outputs';

export const monthlyReportSchema = z.object({
  executiveSummary: z.string().min(1),
  totalPosts: z.number(),
  estimatedReach: z.string(),
  engagement: z.string(),
  topPerformers: z
    .array(z.object({ headline: z.string(), metric: z.string(), value: z.string() }))
    .min(3)
    .max(5),
  pillarAnalysis: z
    .array(z.object({ pillar: z.string(), posts: z.number(), engagement: z.string() }))
    .min(1),
  recommendations: z.array(z.string()).min(3).max(5),
  kpisVsActual: z.array(z.object({ kpi: z.string(), planned: z.string(), actual: z.string() })),
});

export type MonthlyReportOutput = z.infer<typeof monthlyReportSchema>;

export interface ReportInput {
  strategy: StrategyDoc;
  brandProfile: BrandProfile;
  month: string;
}

export class ReportAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: ReportInput): Promise<MonthlyReportOutput> {
    const prompt = JSON.stringify(
      {
        strategy: {
          objective: input.strategy.objective,
          monthlyTheme: input.strategy.monthlyTheme,
          contentPillars: input.strategy.contentPillars,
          kpis: input.strategy.kpis,
        },
        brandProfile: {
          clientName: input.brandProfile.clientName,
          industry: input.brandProfile.industry,
          audience: input.brandProfile.audience,
        },
        month: input.month,
      },
      null,
      2
    );

    const { text } = await this.provider.generateText({
      system: REPORT_SYSTEM_PROMPT,
      prompt,
      temperature: 0.4,
      maxTokens: 3000,
    });

    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    return monthlyReportSchema.parse(JSON.parse(cleaned));
  }
}
