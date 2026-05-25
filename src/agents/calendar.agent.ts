import { z } from 'zod';

import {
  CALENDAR_SYSTEM_PROMPT,
  buildCalendarUserPrompt,
  computePostCount,
} from '@/agents/prompts/calendar.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';
import type { EditorialCalendar } from '@/types/calendar';

// ─── Zod schema matching the API route ──────────────────

const postSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  channel: z.string().min(1),
  format: z.string().min(1),
  pillar: z.string().min(1),
  theme: z.string().min(1),
  contentType: z.enum(['image', 'video', 'text', 'mixed']),
  headline: z.string().min(1),
  description: z.string().min(1),
  hashtagsHint: z.string(),
  cta: z.string().min(1),
});

export const calendarSchema = z.object({
  posts: z.array(postSchema).min(1),
});

export type CalendarRawOutput = z.infer<typeof calendarSchema>;

export interface CalendarInput {
  /** Raw strategy output (LLM-generated object with channelStrategies, contentMix, etc.) */
  strategy: Record<string, unknown>;
  brandProfile: BrandProfile;
  /** Month in "YYYY-MM" format */
  month: string;
}

/**
 * Given "2026-06" returns { start: "2026-06-01", end: "2026-06-30" }.
 */
function monthToRange(month: string): { start: string; end: string } {
  const [year, m] = month.split('-').map(Number);
  const start = `${month}-01`;
  const lastDay = new Date(year, m, 0).getDate(); // day 0 of *next* month = last day of this month
  const end = `${month}-${String(lastDay).padStart(2, '0')}`;
  return { start, end };
}

export class CalendarAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: CalendarInput): Promise<CalendarRawOutput> {
    const { start, end } = monthToRange(input.month);

    // buildCalendarUserPrompt expects Strategy type from @/types/strategy.
    // The LLM output (strategyDocSchema) has matching shape, so cast works at runtime.
    const prompt = buildCalendarUserPrompt(
      input.brandProfile,
      input.strategy as unknown as Parameters<typeof buildCalendarUserPrompt>[1],
      start,
      end,
    );

    const postCount = computePostCount(start, end);

    const { text } = await this.provider.generateText({
      system: CALENDAR_SYSTEM_PROMPT,
      prompt,
      temperature: 0.7,
      maxTokens: Math.max(10000, postCount * 400),
    });

    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    return calendarSchema.parse(JSON.parse(cleaned));
  }
}