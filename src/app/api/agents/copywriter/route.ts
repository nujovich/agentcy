import { after, NextResponse } from 'next/server';
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

  // Delete any existing failed/rejected project before retrying
  await supabase
    .from('copywriting_projects')
    .delete()
    .eq('editorial_calendar_id', calendarId)
    .eq('agency_id', user.id)
    .in('agency_status', ['rejected', 'failed']);

  // Return existing pending/approved/generating project without re-generating
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

  const placeholder: CopywritingProjectInsert = {
    editorial_calendar_id: calendarId,
    brand_profile_id: calendarRow.brand_profile_id,
    agency_id: user.id,
    copies: [],
    agency_status: 'generating',
  };

  const { data: row, error: insertError } = await supabase
    .from('copywriting_projects')
    .insert(placeholder)
    .select()
    .single();

  if (insertError || !row) {
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }

  const rowId = row.id;
  const agencyId = user.id;

  after(async () => {
    const bg = await createClient();
    const startTime = Date.now();
    try {
      const provider = createProvider('anthropic', 'claude-opus-4-7');
      const agent = new CopywriterAgent(provider);
      const copies = await agent.run({ calendar, brandProfile: profile });
      const elapsedMs = Date.now() - startTime;

      await bg
        .from('copywriting_projects')
        .update({
          copies,
          agency_status: 'pending',
          model_used: 'claude-opus-4-7',
          elapsed_ms: elapsedMs,
        })
        .eq('id', rowId)
        .eq('agency_id', agencyId);
    } catch {
      await bg
        .from('copywriting_projects')
        .update({ agency_status: 'failed', elapsed_ms: Date.now() - startTime })
        .eq('id', rowId)
        .eq('agency_id', agencyId);
    }
  });

  return NextResponse.json({ id: rowId, status: 'generating' });
}
