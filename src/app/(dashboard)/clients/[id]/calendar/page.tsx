import { notFound } from 'next/navigation';

import { CalendarPage } from '@/components/calendar/calendar-page';
import { dbToBrandProfile, dbToEditorialCalendar, dbToStrategy } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientCalendarPage({ params }: PageProps) {
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

  const { data: strategyRow, error: strategyError } = await supabase
    .from('strategies')
    .select('*')
    .eq('brand_profile_id', id)
    .eq('agency_id', user.id)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (strategyError || !strategyRow) notFound();

  const { data: calendarRow } = await supabase
    .from('editorial_calendars')
    .select('*')
    .eq('brand_profile_id', id)
    .eq('agency_id', user.id)
    .in('agency_status', ['pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const profile = dbToBrandProfile(profileRow);
  const strategy = dbToStrategy(strategyRow);
  const calendar = calendarRow ? dbToEditorialCalendar(calendarRow) : null;

  return <CalendarPage profile={profile} strategy={strategy} initialCalendar={calendar} />;
}
