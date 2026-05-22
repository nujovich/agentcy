'use client';

import { useState } from 'react';
import Link from 'next/link';

import { CalendarApprovalPanel } from '@/components/calendar/calendar-approval-panel';
import { CalendarEditor } from '@/components/calendar/calendar-editor';
import { CalendarGenerator } from '@/components/calendar/calendar-generator';
import type { BrandProfile } from '@/types/brand-profile';
import type { CalendarPost, EditorialCalendar } from '@/types/calendar';
import type { Strategy } from '@/types/strategy';

interface CalendarPageProps {
  profile: BrandProfile;
  strategy: Strategy;
  initialCalendar: EditorialCalendar | null;
}

type PageState = 'generate' | 'loading' | 'edit' | 'review' | 'approved';

function deriveInitialState(calendar: EditorialCalendar | null): PageState {
  if (!calendar) return 'generate';
  if (calendar.status === 'approved') return 'approved';
  return 'review';
}

function extractErrorMessage(json: unknown, fallback: string): string {
  if (typeof json === 'object' && json !== null && 'error' in json) {
    return String((json as { error: unknown }).error);
  }
  return fallback;
}

export function CalendarPage({ profile, strategy, initialCalendar }: CalendarPageProps) {
  const [calendar, setCalendar] = useState<EditorialCalendar | null>(initialCalendar);
  const [state, setState] = useState<PageState>(() => deriveInitialState(initialCalendar));
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/agents/calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandProfileId: profile.id,
          strategyId: strategy.id,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(json, 'Error al generar el calendario'));
      }
      setCalendar(json as EditorialCalendar);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setState('generate');
    }
  };

  const handleSave = async (posts: CalendarPost[]) => {
    if (!calendar) return;
    setError(null);
    try {
      const res = await fetch(`/api/editorial-calendars/${calendar.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ posts }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        throw new Error(extractErrorMessage(json, 'Error al guardar los cambios'));
      }
      setCalendar(json as EditorialCalendar);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleApprove = async () => {
    if (!calendar) return;
    setError(null);
    try {
      const res = await fetch(`/api/editorial-calendars/${calendar.id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        throw new Error(extractErrorMessage(json, 'Error al aprobar'));
      }
      setState('approved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    }
  };

  const handleReject = async (feedback: string) => {
    if (!calendar) return;
    setError(null);
    try {
      const res = await fetch(`/api/editorial-calendars/${calendar.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        throw new Error(extractErrorMessage(json, 'Error al rechazar'));
      }
      setCalendar(null);
      setState('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    }
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <Link
        href={`/clients/${profile.id}`}
        className="text-xs text-muted-foreground hover:underline"
      >
        ← Volver al cliente
      </Link>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {state === 'generate' || state === 'loading' ? (
        <CalendarGenerator
          profile={profile}
          strategy={strategy}
          onGenerate={handleGenerate}
          isLoading={state === 'loading'}
        />
      ) : state === 'edit' && calendar ? (
        <CalendarEditor calendar={calendar} onSave={handleSave} />
      ) : state === 'review' && calendar ? (
        <CalendarApprovalPanel
          calendar={calendar}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={() => setState('edit')}
        />
      ) : state === 'approved' ? (
        <div className="space-y-4 py-12 text-center">
          <p className="text-2xl font-semibold" style={{ color: 'var(--brand-success)' }}>
            Calendario aprobado
          </p>
          <p className="text-sm text-muted-foreground">
            El Copywriter Agent generará el texto completo para cada post.
          </p>
          <Link
            href={`/clients/${profile.id}`}
            className="inline-block rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Volver al cliente →
          </Link>
        </div>
      ) : null}
    </main>
  );
}
