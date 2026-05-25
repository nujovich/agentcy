import { z } from 'zod';

import { COPYWRITER_SYSTEM_PROMPT } from '@/agents/prompts/copywriter.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';
import type { CalendarEntry } from '@/types/agent-outputs';

export const copyOutputSchema = z.object({
  copy: z.string().min(1),
  visualBrief: z.string().min(1),
  hashtags: z.array(z.string()).min(3).max(12),
});

export const copyBatchSchema = z.object({
  copies: z.array(copyOutputSchema).min(1),
});

export type CopyBatchOutput = z.infer<typeof copyBatchSchema>;

export interface CopywriterInput {
  entries: CalendarEntry[];
  brandProfile: BrandProfile;
}

export class CopywriterAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: CopywriterInput): Promise<CopyBatchOutput> {
    const prompt = JSON.stringify(
      {
        entries: input.entries.map((e) => ({
          headline: e.headline,
          description: e.description,
          format: e.format,
          visualNotes: e.visualNotes,
          pillarIndex: e.pillarIndex,
        })),
        brandProfile: {
          clientName: input.brandProfile.clientName,
          voice: input.brandProfile.voice,
          audience: input.brandProfile.audience,
        },
      },
      null,
      2
    );

    const { text } = await this.provider.generateText({
      system: COPYWRITER_SYSTEM_PROMPT,
      prompt,
      temperature: 0.6,
      maxTokens: 5000,
    });

    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    return copyBatchSchema.parse(JSON.parse(cleaned));
  }
}
