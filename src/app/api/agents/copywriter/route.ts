import { NextResponse } from 'next/server';
import { z } from 'zod';

import { CopywriterAgent } from '@/agents/copywriter.agent';
import { createProvider } from '@/agents/provider-registry';
import {
  dbToBrandProfile,
  dbToCopywritingProject,
  dbToEditorialCalendar,
  type CopywritingProjectInsert,
} from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  calendarId: z.string().uuid(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

  const { calendarId } = parsed.data;

  const { data: calendarRow, error: calendarError } = await supabase
    .from('editorial_calendars')
    .select('*')
    .eq('id', calendarId)
    .eq('agency_id', user.id)
    .eq('agency_status', 'approved')
    .single();

  if (calendarError || !calendarRow) {
    return NextResponse.json(
      { error: 'Calendar not found or not approved' },
      { status: 404 },
    );
  }

  const { data: profileRow, error: profileError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', calendarRow.brand_profile_id)
    .eq('agency_id', user.id)
    .single();

  if (profileError || !profileRow) {
    return NextResponse.json({ error: 'Brand profile not found' }, { status: 404 });
  }

  // Delete any existing rejected project for this calendar before regenerating
  await supabase
    .from('copywriting_projects')
    .delete()
    .eq('editorial_calendar_id', calendarId)
    .eq('agency_id', user.id)
    .eq('agency_status', 'rejected');

  // Return existing pending/approved project without re-generating
  const { data: existing } = await supabase
    .from('copywriting_projects')
    .select('*')
    .eq('editorial_calendar_id', calendarId)
    .eq('agency_id', user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(dbToCopywritingProject(existing));
  }

  const calendar = dbToEditorialCalendar(calendarRow);
  const profile = dbToBrandProfile(profileRow);

  try {
    const provider = createProvider('anthropic', 'claude-opus-4-7');
    const agent = new CopywriterAgent(provider);
    const copies = await agent.run({ calendar, brandProfile: profile });

    const insert: CopywritingProjectInsert = {
      editorial_calendar_id: calendarId,
      brand_profile_id: calendarRow.brand_profile_id,
      agency_id: user.id,
      copies,
      agency_status: 'pending',
    };

    const { data: row, error: insertError } = await supabase
      .from('copywriting_projects')
      .insert(insert)
      .select()
      .single();

    if (insertError || !row) {
      throw new Error(insertError?.message ?? 'Failed to save copywriting project');
    }

    return NextResponse.json(dbToCopywritingProject(row));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: `Copy generation failed: ${message}` },
      { status: 500 },
    );
  }
}
