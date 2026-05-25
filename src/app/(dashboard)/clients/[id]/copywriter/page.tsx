import { notFound } from 'next/navigation';

import { CopywriterPage } from '@/components/copywriter/copywriter-page';
import {
  dbToBrandProfile,
  dbToCopywritingProject,
  dbToEditorialCalendar,
} from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientCopywriterPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: profileRow, error: profileError } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', id)
    .eq('agency_id', user.id)
    .eq('status', 'approved')
    .single();

  if (profileError || !profileRow) notFound();

  const { data: calendarRow, error: calendarError } = await supabase
    .from('editorial_calendars')
    .select('*')
    .eq('brand_profile_id', id)
    .eq('agency_id', user.id)
    .eq('agency_status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (calendarError || !calendarRow) notFound();

  const { data: projectRow } = await supabase
    .from('copywriting_projects')
    .select('*')
    .eq('editorial_calendar_id', calendarRow.id)
    .eq('agency_id', user.id)
    .maybeSingle();

  const profile = dbToBrandProfile(profileRow);
  const calendar = dbToEditorialCalendar(calendarRow);
  const project = projectRow ? dbToCopywritingProject(projectRow) : null;

  return <CopywriterPage profile={profile} calendar={calendar} initialProject={project} />;
}
