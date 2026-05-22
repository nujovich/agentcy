'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { StrategyApproval } from '@/components/strategy/strategy-approval';
import { StrategyGenerator } from '@/components/strategy/strategy-generator';
import type { BrandProfile } from '@/types/brand-profile';
import type { Strategy } from '@/types/strategy';

interface StrategyPageProps {
  profile: BrandProfile;
  initialStrategy: Strategy | null;
}

type PageState = 'generate' | 'loading' | 'review' | 'approved';

function deriveInitialState(strategy: Strategy | null): PageState {
  if (!strategy) return 'generate';
  if (strategy.status === 'approved') return 'approved';
  return 'review';
}

export function StrategyPage({ profile, initialStrategy }: StrategyPageProps) {
  const router = useRouter();
  const [strategy, setStrategy] = useState<Strategy | null>(initialStrategy);
  const [state, setState] = useState<PageState>(() => deriveInitialState(initialStrategy));
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/agents/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brandProfileId: profile.id }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === 'object' && json !== null && 'error' in json
            ? String((json as { error: unknown }).error)
            : 'Error al generar la estrategia';
        throw new Error(msg);
      }
      setStrategy(json as Strategy);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setState('generate');
    }
  };

  const handleApprove = async () => {
    if (!strategy) return;
    setError(null);
    try {
      const res = await fetch(`/api/strategies/${strategy.id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        const msg =
          typeof json === 'object' && json !== null && 'error' in json
            ? String((json as { error: unknown }).error)
            : 'Error al aprobar';
        throw new Error(msg);
      }
      setState('approved');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    }
  };

  const handleReject = async (feedback: string) => {
    if (!strategy) return;
    setError(null);
    try {
      const res = await fetch(`/api/strategies/${strategy.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        const msg =
          typeof json === 'object' && json !== null && 'error' in json
            ? String((json as { error: unknown }).error)
            : 'Error al rechazar';
        throw new Error(msg);
      }
      setStrategy(null);
      setState('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link href={`/clients/${profile.id}`} className="text-xs text-muted-foreground hover:underline">
        ← Volver al cliente
      </Link>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {state === 'generate' || state === 'loading' ? (
        <StrategyGenerator
          profile={profile}
          onGenerate={handleGenerate}
          isLoading={state === 'loading'}
        />
      ) : state === 'review' && strategy ? (
        <StrategyApproval
          strategy={strategy}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      ) : state === 'approved' ? (
        <div className="space-y-4 py-12 text-center">
          <p
            className="text-2xl font-semibold"
            style={{ color: 'var(--brand-success)' }}
          >
            ✓ Estrategia aprobada
          </p>
          <p className="text-sm text-muted-foreground">
            El siguiente paso en el pipeline es el Calendar Agent.
          </p>
          <Link
            href={`/clients/${profile.id}`}
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Volver al cliente →
          </Link>
        </div>
      ) : null}
    </main>
  );
}
