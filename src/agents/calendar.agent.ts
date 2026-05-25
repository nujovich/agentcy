import { z } from 'zod';

import { CALENDAR_SYSTEM_PROMPT } from '@/agents/prompts/calendar.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';
import type { StrategyDoc } from '@/types/agent-outputs';

export const calendarEntrySchema = z.object({
  week: z.number().min(1).max(5),
  day: z.string().min(1),
  pillarIndex: z.number().min(0).max(3),
  format: z.enum(['post', 'reel', 'story', 'carousel']),
  headline: z.string().min(1),
  description: z.string().min(1),
  cta: z.string().min(1),
  visualNotes: z.string().min(1),
});

export const calendarSchema = z.object({
  month: z.string().min(1),
  entries: z.array(calendarEntrySchema).min(4),
});

export type CalendarOutput = z.infer<typeof calendarSchema>;

export interface CalendarInput {
  strategy: StrategyDoc;
  brandProfile: BrandProfile;
  month: string;
}

export class CalendarAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: CalendarInput): Promise<CalendarOutput> {
    const prompt = JSON.stringify(
      {
        strategy: {
          objective: input.strategy.objective,
          monthlyTheme: input.strategy.monthlyTheme,
          contentPillars: input.strategy.contentPillars,
          formatMix: input.strategy.formatMix,
          contentIdeas: input.strategy.contentIdeas,
        },
        brandProfile: {
          clientName: input.brandProfile.clientName,
          voice: input.brandProfile.voice,
          audience: input.brandProfile.audience,
          pack: input.brandProfile.pack,
        },
        month: input.month,
      },
      null,
      2
    );

    const { text } = await this.provider.generateText({
      system: CALENDAR_SYSTEM_PROMPT,
      prompt,
      temperature: 0.5,
      maxTokens: 4000,
    });

    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    return calendarSchema.parse(JSON.parse(cleaned));
  }
}
