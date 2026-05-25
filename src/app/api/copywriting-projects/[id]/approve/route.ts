import { NextResponse } from 'next/server';

import { dbToCopywritingProject } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('copywriting_projects')
    .update({ agency_status: 'approved' })
    .eq('id', id)
    .eq('agency_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Copywriting project not found' }, { status: 404 });
  }

  return NextResponse.json(dbToCopywritingProject(data));
}
