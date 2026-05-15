import { notFound } from 'next/navigation';

import { BrandProfileCard } from '@/components/clients/brand-profile-card';
import { PipelineStep } from '@/components/clients/pipeline-step';
import { dbToBrandProfile } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';
import type { Pack } from '@/types/brand-profile';

const PACK_LABEL: Record<Pack, string> = {
  esencial: 'Esencial',
  gold: 'Gold',
  pro: 'Pro',
  elite: 'Elite',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: row, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', id)
    .eq('agency_id', user.id)
    .single();

  if (error || !row) notFound();

  const profile = dbToBrandProfile(row);

  // strategy_docs has no agency_id column — tenancy enforced via brand_profiles fetch above + RLS
  const { count: strategyCount } = await supabase
    .from('strategy_docs')
    .select('id', { count: 'exact', head: true })
    .eq('brand_profile_id', id)
    .eq('status', 'approved');

  const strategyStatus = (strategyCount ?? 0) > 0 ? 'approved' : 'unlocked';

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <header className="space-y-1">
        <a
          href="/dashboard"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Volver al dashboard
        </a>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{profile.clientName}</h1>
            <p className="text-sm text-muted-foreground">
              {profile.industry}
              {profile.location ? ` · ${profile.location}` : ''}
            </p>
          </div>
          <span className="rounded-full border border-border px-3 py-1 text-xs font-medium">
            {PACK_LABEL[profile.pack]}
          </span>
        </div>
      </header>

      {/* Brand Profile */}
      <BrandProfileCard profile={profile} />

      {/* Pipeline */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pipeline</h2>
        <div className="space-y-2">
          <PipelineStep label="Brand Intake" status="approved" />
          <PipelineStep
            label="Strategy Agent"
            status={strategyStatus}
            href={strategyStatus === 'unlocked' ? `/clients/${id}/strategy/new` : undefined}
          />
          <PipelineStep label="Copy" status="locked" />
          <PipelineStep label="Visual Brief" status="locked" />
          <PipelineStep label="Calendar" status="locked" />
        </div>
      </section>
    </main>
  );
}
