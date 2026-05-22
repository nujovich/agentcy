import { NextResponse } from 'next/server';
import { z } from 'zod';

import { dbToEditorialCalendar } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

const postSchema = z.object({
  id: z.string(),
  date: z.string(),
  time: z.string(),
  channel: z.enum(['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook']),
  format: z.enum(['Carousel', 'Reel', 'Story', 'Post', 'Video', 'Shorts']),
  pillar: z.string(),
  theme: z.string(),
  contentType: z.enum(['image', 'video', 'text', 'mixed']),
  headline: z.string(),
  description: z.string(),
  hashtagsHint: z.string(),
  cta: z.string(),
  notes: z.string().optional(),
});

const bodySchema = z.object({
  posts: z.array(postSchema),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteContext) {
  const { id } = await params;
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

  const { posts } = parsed.data;

  const postsByChannel: Record<string, number> = {};
  const pillarDistribution: Record<string, number> = {};
  for (const post of posts) {
    postsByChannel[post.channel] = (postsByChannel[post.channel] ?? 0) + 1;
    pillarDistribution[post.pillar] = (pillarDistribution[post.pillar] ?? 0) + 1;
  }

  const { data: row, error } = await supabase
    .from('editorial_calendars')
    .update({
      posts,
      total_posts: posts.length,
      posts_by_channel: postsByChannel,
      pillar_distribution: pillarDistribution,
    })
    .eq('id', id)
    .eq('agency_id', user.id)
    .select()
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to update calendar' },
      { status: 500 },
    );
  }

  return NextResponse.json(dbToEditorialCalendar(row));
}
