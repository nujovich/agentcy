import { z } from 'zod';

import { BRAND_INTAKE_SYSTEM_PROMPT } from '@/agents/prompts/brand-intake.prompt';
import type { AgentProvider } from '@/agents/provider-registry';
import type { BrandProfile } from '@/types/brand-profile';

export const brandProfileSchema = z.object({
  clientName: z.string().min(1),
  industry: z.string().min(1),
  location: z.string().optional(),
  website: z.string().optional(),
  socialUrls: z.record(z.string(), z.string()),
  voice: z.object({
    tone: z.string().min(1),
    personality: z.array(z.string()).min(1),
    avoidWords: z.array(z.string()),
    referenceAccounts: z.array(z.string()).optional(),
  }),
  audience: z.object({
    ageRange: z.string().min(1),
    interests: z.array(z.string()),
    painPoints: z.array(z.string()).min(1),
    location: z.string().min(1),
  }),
  contentPillars: z.array(z.string()).min(1).max(4),
  competitors: z.array(z.string()),
  goals: z.array(z.string()),
  visualKit: z.object({
    primaryColors: z.array(z.string()),
    secondaryColors: z.array(z.string()),
    fonts: z.array(z.string()),
    style: z.string().min(1),
  }),
  pack: z.enum(['esencial', 'gold', 'pro', 'elite']),
});

export type BrandProfileAgentOutput = z.infer<typeof brandProfileSchema>;

export interface BrandIntakeInput {
  clientName: string;
  industry: string;
  website?: string;
  socialUrls: Record<string, string>;
  voiceDescription: string;
  audienceDescription: string;
  competitors: string[];
  goals: string[];
  pack: BrandProfile['pack'];
}

export class BrandIntakeAgent {
  constructor(private readonly provider: AgentProvider) {}

  async run(input: BrandIntakeInput): Promise<BrandProfileAgentOutput> {
    const userPrompt = JSON.stringify(input, null, 2);

    const { text } = await this.provider.generateText({
      system: BRAND_INTAKE_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.4,
      maxTokens: 2000,
    });

    const cleaned = stripCodeFences(text);

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      throw new Error(`Brand Intake output is not valid JSON: ${message}\n---\n${text}`);
    }

    const result = brandProfileSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(
        `Brand Intake output failed schema validation: ${result.error.message}`,
      );
    }
    return result.data;
  }
}

function stripCodeFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}
