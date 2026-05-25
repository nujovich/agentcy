import { NextResponse } from 'next/server';
import { z } from 'zod';

import { dbToStrategy } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  scenario: z.enum(['conservative', 'sustainable', 'aggressive']),
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

  const { scenario } = parsed.data;

  const { data: existing, error: fetchError } = await supabase
    .from('strategies')
    .select('*')
    .eq('id', id)
    .eq('agency_id', user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Strategy not found' }, { status: 404 });
  }

  const scenarioData =
    scenario === 'conservative'
      ? existing.scenario_conservative
      : scenario === 'sustainable'
        ? existing.scenario_sustainable
        : existing.scenario_aggressive;

  if (!scenarioData) {
    return NextResponse.json({ error: 'Scenario data not found' }, { status: 404 });
  }

  const { data: row, error: updateError } = await supabase
    .from('strategies')
    .update({
      selected_scenario: scenario,
      kpis: scenarioData.kpis,
      status: 'pending',
    })
    .eq('id', id)
    .eq('agency_id', user.id)
    .select()
    .single();

  if (updateError || !row) {
    return NextResponse.json(
      { error: updateError?.message ?? 'Failed to update strategy' },
      { status: 500 },
    );
  }

  return NextResponse.json(dbToStrategy(row));
}
