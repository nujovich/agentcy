import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  clientStatus: z.enum(['not_shared', 'pending', 'approved', 'rejected']),
});

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
      { error: 'Invalid clientStatus', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from('editorial_calendars')
    .select('agency_status')
    .eq('id', id)
    .eq('agency_id', user.id)
    .single();

  if (!existing) {
    return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
  }

  if (existing.agency_status !== 'approved') {
    return NextResponse.json(
      { error: 'Calendar must be agency-approved before updating client status' },
      { status: 422 },
    );
  }

  const { error } = await supabase
    .from('editorial_calendars')
    .update({ client_status: parsed.data.clientStatus })
    .eq('id', id)
    .eq('agency_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
