'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';

import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { DateRangePicker } from '@/components/calendar/date-range-picker';
import { Button } from '@/components/ui/button';
import type { BrandProfile } from '@/types/brand-profile';
import type { ClientCalendarStatus, CalendarPost, EditorialCalendar } from '@/types/calendar';
import type { Strategy } from '@/types/strategy';

interface CalendarPageProps {
  profile: BrandProfile;
  strategy: Strategy;
  initialCalendar: EditorialCalendar | null;
}

type PageState = 'generate' | 'loading' | 'edit' | 'agency-review' | 'agency-approved';

function deriveInitialState(calendar: EditorialCalendar | null): PageState {
  if (!calendar) return 'generate';
  if (calendar.agencyStatus === 'approved') return 'agency-approved';
  return 'agency-review';
}

export function CalendarPage({ profile, strategy, initialCalendar }: CalendarPageProps) {
  const [calendar, setCalendar] = useState<EditorialCalendar | null>(initialCalendar);
  const [state, setState] = useState<PageState>(() => deriveInitialState(initialCalendar));
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);
  const [rejectMode, setRejectMode] = useState(false);
  const [rejectFeedback, setRejectFeedback] = useState('');
  const [isActing, setIsActing] = useState(false);

  const shiftStartRef = useRef<HTMLInputElement>(null);
  const shiftEndRef = useRef<HTMLInputElement>(null);

  // Date range for generation
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const [startDate, setStartDate] = useState(firstDay.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(lastDay.toISOString().slice(0, 10));

  // Post editor state
  const [editHeadline, setEditHeadline] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCta, setEditCta] = useState('');
  const [editNotes, setEditNotes] = useState('');

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
          startDate,
          endDate,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? 'Error al generar el calendario';
        throw new Error(msg);
      }
      setCalendar(json as EditorialCalendar);
      setState('agency-review');
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
        throw new Error((json as { error?: string }).error ?? 'Error al guardar');
      }
      setCalendar(json as EditorialCalendar);
      setState('agency-review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleApprove = async () => {
    if (!calendar) return;
    setIsActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial-calendars/${calendar.id}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        throw new Error((json as { error?: string }).error ?? 'Error al aprobar');
      }
      setCalendar({ ...calendar, agencyStatus: 'approved' });
      setState('agency-approved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
    } finally {
      setIsActing(false);
    }
  };

  const handleReject = async () => {
    if (!calendar || !rejectFeedback.trim()) return;
    setIsActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial-calendars/${calendar.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback: rejectFeedback }),
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        throw new Error((json as { error?: string }).error ?? 'Error al rechazar');
      }
      setCalendar({ ...calendar, agencyStatus: 'rejected' });
      setRejectMode(false);
      setRejectFeedback('');
      setState('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al rechazar');
    } finally {
      setIsActing(false);
    }
  };

  const handleClientStatus = async (clientStatus: ClientCalendarStatus) => {
    if (!calendar) return;
    setIsActing(true);
    setError(null);
    try {
      const res = await fetch(`/api/editorial-calendars/${calendar.id}/client-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientStatus }),
      });
      if (!res.ok) {
        const json: unknown = await res.json();
        throw new Error((json as { error?: string }).error ?? 'Error al actualizar estado del cliente');
      }
      setCalendar({ ...calendar, clientStatus });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado del cliente');
    } finally {
      setIsActing(false);
    }
  };

  // Shift all post dates by the delta between new and old campaignStart.
  // Resets agencyStatus to 'pending' so the calendar requires re-approval.
  const handleShiftDates = (newStart: string, newEnd: string) => {
    if (!calendar) return;
    const oldStartMs = new Date(calendar.campaignStart).getTime();
    const newStartMs = new Date(newStart).getTime();
    const deltaMs = newStartMs - oldStartMs;

    const shiftedPosts = calendar.posts.map((post) => {
      const shifted = new Date(new Date(post.date).getTime() + deltaMs);
      return { ...post, date: shifted.toISOString().slice(0, 10) };
    });

    setCalendar({
      ...calendar,
      campaignStart: newStart,
      campaignEnd: newEnd,
      posts: shiftedPosts,
      agencyStatus: 'pending',
    });
    setState('edit');
  };

  const handlePostsChange = (updated: CalendarPost[]) => {
    if (!calendar) return;
    setCalendar({ ...calendar, posts: updated });
    setState('edit');
  };

  const openPostEditor = (post: CalendarPost) => {
    setEditingPost(post);
    setEditHeadline(post.headline);
    setEditDescription(post.description);
    setEditCta(post.cta);
    setEditNotes(post.notes ?? '');
  };

  const saveEditedPost = () => {
    if (!editingPost || !calendar) return;
    const updated = calendar.posts.map((p) =>
      p.id === editingPost.id
        ? { ...p, headline: editHeadline, description: editDescription, cta: editCta, notes: editNotes || undefined }
        : p
    );
    setCalendar({ ...calendar, posts: updated });
    setEditingPost(null);
    setState('edit');
  };

  if (state === 'generate') {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold">Calendario editorial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.clientName}
          </p>
        </header>
        {error && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
            {error}
          </div>
        )}
        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          onGenerate={handleGenerate}
          loading={false}
        />
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Generando calendario con IA...</p>
      </div>
    );
  }

  if (!calendar) return null;

  const campaignLabel = `${calendar.campaignStart} → ${calendar.campaignEnd}`;

  const CLIENT_STATUS_LABELS: Record<ClientCalendarStatus, string> = {
    not_shared: 'No compartido con cliente',
    pending: 'Pendiente de aprobación del cliente',
    approved: 'Aprobado por el cliente',
    rejected: 'Rechazado por el cliente',
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Calendario editorial</h1>
          <p className="text-sm text-muted-foreground">
            {profile.clientName} · {calendar.posts.length} publicaciones · {campaignLabel}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${profile.id}`}>Volver</Link>
          </Button>
          {state === 'edit' && (
            <Button size="sm" onClick={() => handleSave(calendar.posts)}>
              Guardar cambios
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Stats bar */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{calendar.totalPosts} publicaciones</span>
        {Object.entries(calendar.postsByChannel ?? {}).map(([ch, count]) => (
          <span key={ch}>{ch}: {count}</span>
        ))}
      </div>

      {/* Agency approval bar — shown in agency-review and edit states */}
      {(state === 'agency-review' || state === 'edit') && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Revisión de agencia</p>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full px-2 py-0.5">
              Pendiente
            </span>
          </div>
          {!rejectMode ? (
            <div className="flex gap-2">
              <Button size="sm" onClick={handleApprove} disabled={isActing || state === 'edit'}>
                {isActing ? 'Aprobando...' : 'Aprobar calendario'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRejectMode(true)}
                disabled={isActing}
              >
                Rechazar con feedback
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <textarea
                value={rejectFeedback}
                onChange={(e) => setRejectFeedback(e.target.value)}
                rows={3}
                placeholder="Ej: Necesito más posts de LinkedIn los martes..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleReject}
                  disabled={!rejectFeedback.trim() || isActing}
                >
                  {isActing ? 'Enviando...' : 'Enviar feedback y rechazar'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejectMode(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
          {state === 'edit' && (
            <p className="text-xs text-muted-foreground">
              Guardá los cambios antes de aprobar.
            </p>
          )}
        </div>
      )}

      {/* Agency-approved status bar */}
      {state === 'agency-approved' && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-full px-2 py-0.5">
                Aprobado por agencia
              </span>
              <span className="text-xs bg-zinc-700 text-zinc-300 border border-zinc-600 rounded-full px-2 py-0.5">
                {CLIENT_STATUS_LABELS[calendar.clientStatus]}
              </span>
            </div>
            <div className="flex gap-2">
              {calendar.clientStatus === 'not_shared' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleClientStatus('pending')}
                  disabled={isActing}
                >
                  Compartir con cliente
                </Button>
              )}
              {calendar.clientStatus === 'pending' && (
                <>
                  <Button size="sm" onClick={() => handleClientStatus('approved')} disabled={isActing}>
                    Marcar aprobado por cliente
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleClientStatus('rejected')} disabled={isActing}>
                    Marcar rechazado
                  </Button>
                </>
              )}
              {(calendar.clientStatus === 'approved' || calendar.clientStatus === 'rejected') && (
                <Button size="sm" variant="outline" onClick={() => handleClientStatus('not_shared')} disabled={isActing}>
                  Reiniciar estado cliente
                </Button>
              )}
            </div>
          </div>

          {/* Shift dates section */}
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Ajustar fechas de campaña sin regenerar
            </summary>
            <div className="mt-2 flex gap-2 items-end">
              <label className="block space-y-1">
                <span className="text-muted-foreground">Nueva fecha inicio</span>
                <input
                  type="date"
                  defaultValue={calendar.campaignStart}
                  ref={shiftStartRef}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-muted-foreground">Nueva fecha fin</span>
                <input
                  type="date"
                  defaultValue={calendar.campaignEnd}
                  ref={shiftEndRef}
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                />
              </label>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const s = shiftStartRef.current?.value;
                  const e = shiftEndRef.current?.value;
                  if (s && e) handleShiftDates(s, e);
                }}
              >
                Aplicar
              </Button>
            </div>
            <p className="mt-1 text-muted-foreground">
              Desplaza todos los posts por el delta de días. El calendario volverá a "pendiente de aprobación".
            </p>
          </details>
        </div>
      )}

      {/* Calendar Grid */}
      <CalendarGrid
        posts={calendar.posts}
        startDate={calendar.campaignStart}
        endDate={calendar.campaignEnd}
        onPostsChange={state === 'agency-approved' ? () => {} : handlePostsChange}
        onEditPost={state === 'agency-approved' ? () => {} : openPostEditor}
      />

      {/* Post Editor Modal */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setEditingPost(null)}
        >
          <div
            className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium">Editar publicación</h3>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Titular</span>
              <input
                value={editHeadline}
                onChange={(e) => setEditHeadline(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Descripción</span>
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">CTA</span>
              <input
                value={editCta}
                onChange={(e) => setEditCta(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Notas visuales</span>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
              />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingPost(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveEditedPost}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
