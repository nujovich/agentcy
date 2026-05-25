import {
  COPYWRITER_SYSTEM_PROMPT,
  buildCopywriterPrompt,
} from '@/agents/prompts/copywriter.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';
import type { EditorialCalendar } from '@/types/calendar';
import { copyBatchLlmSchema, type PostCopy } from '@/types/copywriter';

export interface CopywriterInput {
  calendar: EditorialCalendar;
  brandProfile: BrandProfile;
}

export class CopywriterAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: CopywriterInput): Promise<PostCopy[]> {
    const { calendar, brandProfile } = input;
    const postCount = calendar.posts.length;

    const { text } = await this.provider.generateText({
      system: COPYWRITER_SYSTEM_PROMPT,
      prompt: buildCopywriterPrompt(brandProfile, calendar),
      temperature: 0.6,
      maxTokens: Math.max(8000, postCount * 600),
    });

    const cleaned = text
      .replace(/^```(?:json)?\s*\n?/i, '')
      .replace(/\n?```\s*$/i, '')
      .trim();

    const result = copyBatchLlmSchema.parse(JSON.parse(cleaned));
    return result.copies as PostCopy[];
  }
}
