import { z } from 'zod';

import { BRIEF_SYSTEM_PROMPT } from '@/agents/prompts/brief.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';

export const designBriefSchema = z.object({
  layout: z.string().min(1),
  colorPalette: z.array(z.string()).min(2).max(6),
  typography: z.string().min(1),
  references: z.array(z.string()).min(1).max(5),
  specifications: z.string().min(1),
});

export const designBriefBatchSchema = z.object({
  briefs: z.array(designBriefSchema).min(1),
});

export type DesignBriefBatchOutput = z.infer<typeof designBriefBatchSchema>;

export interface BriefInput {
  copies: { copy: string; visualBrief: string; format: string }[];
  brandProfile: BrandProfile;
}

export class BriefAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: BriefInput): Promise<DesignBriefBatchOutput> {
    const prompt = JSON.stringify(
      {
        copies: input.copies,
        brandProfile: {
          clientName: input.brandProfile.clientName,
          visualKit: input.brandProfile.visualKit,
          voice: input.brandProfile.voice,
        },
      },
      null,
      2
    );

    const { text } = await this.provider.generateText({
      system: BRIEF_SYSTEM_PROMPT,
      prompt,
      temperature: 0.4,
      maxTokens: 4000,
    });

    const cleaned = text.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    return designBriefBatchSchema.parse(JSON.parse(cleaned));
  }
}
