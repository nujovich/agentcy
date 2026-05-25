import { NextResponse } from 'next/server';
import { z } from 'zod';

import { dbToCopywritingProject } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import { postCopySaveSchema } from '@/types/copywriter';

const bodySchema = z.object({
  copies: z.array(postCopySaveSchema).min(1),
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

  const { data, error } = await supabase
    .from('copywriting_projects')
    .update({ copies: parsed.data.copies, agency_status: 'pending' })
    .eq('id', id)
    .eq('agency_id', user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Copywriting project not found' }, { status: 404 });
  }

  return NextResponse.json(dbToCopywritingProject(data));
}
