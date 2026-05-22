import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createProvider } from '@/agents/provider-registry';
import { buildStrategyUserPrompt, STRATEGY_SYSTEM_PROMPT } from '@/agents/prompts/strategy.prompt';
import { dbToBrandProfile, dbToStrategy } from '@/lib/supabase/database.types';
import type { StrategyInsert } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  brandProfileId: z.string().uuid(),
});

const llmResponseSchema = z.object({
  objectives: z.object({
    reach: z.string(),
    engagement: z.string(),
    conversion: z.string(),
    retention: z.string(),
  }),
  primaryChannels: z.array(z.string()),
  channelStrategies: z.array(
    z.object({
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
    }),
  ),
  contentPillars: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      examples: z.array(z.string()),
      frequency: z.string(),
    }),
  ),
  contentMix: z.object({
    educational: z.number(),
    promotional: z.number(),
    entertaining: z.number(),
    behind_the_scenes: z.number(),
  }),
  kpis: z.array(
    z.object({
      name: z.string(),
      target: z.string(),
      measurement: z.string(),
      importance: z.enum(['critical', 'high', 'medium']),
    }),
  ),
  postingFrequency: z.record(z.string(), z.string()),
  bestPostingTimes: z.record(z.string(), z.array(z.string())),
  reasoning: z.string(),
  next_steps: z.string(),
});

function stripCodeFences(s: string): string {
  return s
    .trim()
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { brandProfileId } = parsed.data;

  const { data: profileRow, error: profileError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', brandProfileId)
    .eq('agency_id', user.id)
    .eq('status', 'approved')
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: 'Brand profile not found or not approved' }, { status: 404 });
  }

  const profile = dbToBrandProfile(profileRow);

  try {
    const provider = createProvider('anthropic', 'claude-opus-4-7');
    const { text } = await provider.generateText({
      system: STRATEGY_SYSTEM_PROMPT,
      prompt: buildStrategyUserPrompt(profile),
      maxTokens: 3000,
      temperature: 0.3,
    });

    const cleaned = stripCodeFences(text);
    const extracted = llmResponseSchema.parse(JSON.parse(cleaned));

    const insert: StrategyInsert = {
      brand_profile_id: brandProfileId,
      agency_id: user.id,
      objectives: extracted.objectives,
      primary_channels: extracted.primaryChannels,
      channel_strategies: extracted.channelStrategies,
      content_pillars: extracted.contentPillars,
      content_mix: extracted.contentMix,
      kpis: extracted.kpis,
      posting_frequency: extracted.postingFrequency,
      best_posting_times: extracted.bestPostingTimes,
      reasoning: extracted.reasoning,
      next_steps: extracted.next_steps,
      status: 'pending',
    };

    const { data: row, error: insertError } = await supabase
      .from('strategies')
      .insert(insert)
      .select()
      .single();

    if (insertError || !row) {
      throw new Error(insertError?.message ?? 'Failed to save strategy');
    }

    return NextResponse.json(dbToStrategy(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Strategy generation failed: ${message}` },
      { status: 500 },
    );
  }
}
