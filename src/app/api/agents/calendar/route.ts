import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createProvider } from '@/agents/provider-registry';
import {
  CALENDAR_SYSTEM_PROMPT,
  buildCalendarUserPrompt,
  computePostCount,
} from '@/agents/prompts/calendar.prompt';
import {
  dbToBrandProfile,
  dbToEditorialCalendar,
  dbToStrategy,
} from '@/lib/supabase/database.types';
import type { EditorialCalendarInsert } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import type { CalendarPost } from '@/types/calendar';

const bodySchema = z.object({
  brandProfileId: z.string().uuid(),
  strategyId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
});

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

const llmResponseSchema = z.object({
  posts: z.array(postSchema),
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

  const { brandProfileId, strategyId, startDate, endDate } = parsed.data;

  const { data: strategyRow, error: strategyError } = await supabase
    .from('strategies')
    .select('*')
    .eq('id', strategyId)
    .eq('agency_id', user.id)
    .eq('status', 'approved')
    .single();

  if (strategyError || !strategyRow) {
    return NextResponse.json(
      { error: 'Strategy not found or not approved' },
      { status: 404 },
    );
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', brandProfileId)
    .eq('agency_id', user.id)
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
  }

  const strategy = dbToStrategy(strategyRow);
  const profile = dbToBrandProfile(profileRow);
  const postCount = computePostCount(startDate, endDate);

  try {
    const provider = createProvider('anthropic', 'claude-opus-4-7');
    const { text } = await provider.generateText({
      system: CALENDAR_SYSTEM_PROMPT,
      prompt: buildCalendarUserPrompt(profile, strategy, startDate, endDate),
      maxTokens: Math.max(10000, postCount * 400),
    });

    const cleaned = stripCodeFences(text);
    const extracted = llmResponseSchema.parse(JSON.parse(cleaned));

    const posts: CalendarPost[] = extracted.posts.map((p) => ({
      ...p,
      id: crypto.randomUUID(),
    }));

    const postsByChannel: Record<string, number> = {};
    const pillarDistribution: Record<string, number> = {};

    for (const post of posts) {
      postsByChannel[post.channel] = (postsByChannel[post.channel] ?? 0) + 1;
      pillarDistribution[post.pillar] = (pillarDistribution[post.pillar] ?? 0) + 1;
    }

    const insert: EditorialCalendarInsert = {
      strategy_id: strategyId,
      brand_profile_id: brandProfileId,
      agency_id: user.id,
      campaign_start: startDate,
      campaign_end: endDate,
      posts,
      total_posts: posts.length,
      posts_by_channel: postsByChannel,
      pillar_distribution: pillarDistribution,
      agency_status: 'pending',
      client_status: 'not_shared',
    };

    const { data: row, error: insertError } = await supabase
      .from('editorial_calendars')
      .insert(insert)
      .select()
      .single();

    if (insertError || !row) {
      throw new Error(insertError?.message ?? 'Failed to save editorial calendar');
    }

    return NextResponse.json(dbToEditorialCalendar(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Calendar generation failed: ${message}` },
      { status: 500 },
    );
  }
}
