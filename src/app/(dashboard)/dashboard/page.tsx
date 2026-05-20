import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Borrador',
  in_review: 'Pendiente de aprobación',
  approved: 'Aprobado',
  published: 'Publicado',
};

const STATUS_STYLE: Record<string, CSSProperties> = {
  draft: {
    background: 'var(--brand-surface-2)',
    color: 'var(--brand-ink-soft)',
  },
  in_review: {
    background: 'var(--brand-accent-soft)',
    color: 'var(--brand-accent-dark)',
  },
  approved: {
    background: 'var(--brand-success-soft)',
    color: 'var(--brand-success)',
  },
  published: {
    background: 'var(--brand-primary-soft)',
    color: 'var(--brand-primary-dark)',
  },
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from('brand_profiles')
    .select('id, client_name, industry, status, created_at')
    .eq('agency_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <div className="flex items-center justify-between">
        <Image
          src="/logo-lockup.svg"
          alt="Agentcy"
          width={120}
          height={26}
          priority
        />
        <span className="font-mono text-[11px] text-muted-foreground">
          {user?.email}
        </span>
      </div>

      <header className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-1">
          <span className="eyebrow">Tu sala de control</span>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Los agentes proponen, vos editás y aprobás. Nada se publica sin tu
            firma.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/clients/new">+ Nuevo cliente</Link>
        </Button>
      </header>

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <header className="flex items-baseline justify-between border-b border-border px-5 py-4">
          <h2 className="text-base font-semibold">Brand Profiles</h2>
          <span className="font-mono text-[11px] text-muted-foreground">
            {profiles?.length ?? 0} total
          </span>
        </header>
        {profiles && profiles.length > 0 ? (
          <ul className="divide-y divide-border">
            {profiles.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted"
              >
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-semibold">
                    {p.client_name}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">
                    {p.industry}
                  </p>
                </div>
                <span
                  className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.04em]"
                  style={
                    STATUS_STYLE[p.status] ?? STATUS_STYLE.draft
                  }
                >
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="space-y-3 p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Todavía no tenés brand profiles. Creá tu primer cliente para
              arrancar el pipeline.
            </p>
            <Button asChild variant="outline" size="sm">
              <Link href="/clients/new">Crear primer cliente</Link>
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
