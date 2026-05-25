import { notFound } from 'next/navigation';

import { StrategyPage } from '@/components/strategy/strategy-page';
import { dbToBrandProfile, dbToStrategy } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function StrategyNewPage({ params }: PageProps) {
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

  const profile = dbToBrandProfile(profileRow);

  // Fetch the latest non-rejected strategy (pending or approved)
  const { data: strategyRow } = await supabase
    .from('strategies')
    .select('*')
    .eq('brand_profile_id', id)
    .eq('agency_id', user.id)
    .in('status', ['calibration', 'pending', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const strategy = strategyRow ? dbToStrategy(strategyRow) : null;

  return <StrategyPage profile={profile} initialStrategy={strategy} />;
}
