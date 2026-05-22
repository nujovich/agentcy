import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApproveButton } from '@/components/clients/approve-button';
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

  if (profile.status === 'draft') {
    return (
      <main className="mx-auto max-w-2xl space-y-6 p-6">
        <header className="space-y-1">
          <Link href="/dashboard" className="text-xs text-muted-foreground hover:underline">
            ← Volver al dashboard
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{profile.clientName}</h1>
              <p className="text-sm text-muted-foreground">{profile.industry}</p>
            </div>
            <span
              className="shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"
              style={{ background: 'var(--brand-accent-soft)', color: 'var(--brand-accent-dark)' }}
            >
              Borrador
            </span>
          </div>
        </header>

        {/* Captured data */}
        <section className="space-y-4 rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold">Datos capturados</h2>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {profile.website ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Sitio web</p>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate block"
                >
                  {profile.website}
                </a>
              </div>
            ) : null}

            {profile.voice.tone ? (
              <div>
                <p className="text-xs font-medium text-muted-foreground">Tono de voz</p>
                <p>{profile.voice.tone}</p>
              </div>
            ) : null}
          </div>

          {profile.contentPillars.length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Pilares de contenido</p>
              <div className="flex flex-wrap gap-2">
                {profile.contentPillars.map((pillar) => (
                  <span
                    key={pillar}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ background: 'var(--brand-primary-soft)', color: 'var(--brand-primary-dark)' }}
                  >
                    {pillar}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {Object.keys(profile.socialUrls).length > 0 ? (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Redes sociales</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.socialUrls).map(([net, url]) => (
                  <a
                    key={net}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary hover:text-primary transition-colors capitalize"
                  >
                    {net}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <ApproveButton profileId={profile.id} />
          <Link
            href={`/clients/${profile.id}/edit`}
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            Editar / completar campos
          </Link>
        </section>
      </main>
    );
  }

  const { count: strategyCount } = await supabase
    .from('strategies')
    .select('id', { count: 'exact', head: true })
    .eq('brand_profile_id', id)
    .eq('agency_id', user.id)
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
