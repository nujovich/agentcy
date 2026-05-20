import Link from 'next/link';
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
    .eq('status', 'approved')
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
        <Link
          href="/dashboard"
          className="text-xs text-muted-foreground hover:underline"
        >
          ← Volver al dashboard
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{profile.clientName}</h1>
            <p className="text-sm text-muted-foreground">
              {profile.industry}
              {profile.location ? ` · ${profile.location}` : ''}
            </p>
          </div>
          <span
            className="rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{
              background: 'var(--brand-primary-soft)',
              color: 'var(--brand-primary-dark)',
            }}
          >
            Pack {PACK_LABEL[profile.pack]}
          </span>
        </div>
      </header>

      {/* Brand Profile */}
      <BrandProfileCard profile={profile} />

      {/* Pipeline */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold">Pipeline</h2>
        <div className="space-y-2">
          <PipelineStep index={1} label="Brand Intake" status={profile.status === 'approved' ? 'approved' : 'unlocked'} />
          <PipelineStep
            index={2}
            label="Strategy Agent"
            status={strategyStatus}
            href={strategyStatus === 'unlocked' ? `/clients/${id}/strategy/new` : undefined}
          />
          <PipelineStep index={3} label="Copy" status="locked" />
          <PipelineStep index={4} label="Visual Brief" status="locked" />
          <PipelineStep index={5} label="Calendar" status="locked" />
          <PipelineStep index={6} label="Report" status="locked" />
        </div>
      </section>
    </main>
  );
}
