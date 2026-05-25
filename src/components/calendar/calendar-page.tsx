'use client';

import { useState } from 'react';
import Link from 'next/link';

import { CalendarGrid } from '@/components/calendar/calendar-grid';
import { DateRangePicker } from '@/components/calendar/date-range-picker';
import { Button } from '@/components/ui/button';
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

export function CalendarPage({ profile, strategy, initialCalendar }: CalendarPageProps) {
  const [calendar, setCalendar] = useState<EditorialCalendar | null>(initialCalendar);
  const [state, setState] = useState<PageState>(() => deriveInitialState(initialCalendar));
  const [error, setError] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<CalendarPost | null>(null);

  // Date range state
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
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Error al generar el calendario');
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
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Error al guardar');
      setCalendar(json as EditorialCalendar);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
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
          <h1 className="text-2xl font-semibold">📅 Calendario editorial</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile.clientName} · {strategy.month ?? new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
          </p>
        </header>

        <DateRangePicker
          startDate={startDate}
          endDate={endDate}
          onChange={(s, e) => { setStartDate(s); setEndDate(e); }}
          onGenerate={handleGenerate}
          loading={state === 'loading'}
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">📅 Calendario editorial</h1>
          <p className="text-sm text-muted-foreground">
            {profile.clientName} · {calendar.posts.length} publicaciones
            {calendar.posts.length > 0 && ` · ${new Date(calendar.posts[0].date).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/clients/${profile.id}`}>Volver</Link>
          </Button>
          {state === 'edit' && (
            <Button size="sm" onClick={() => handleSave(calendar.posts)}>
              💾 Guardar cambios
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
        <span>📊 {calendar.totalPosts} publicaciones</span>
        {Object.entries(calendar.postsByChannel ?? {}).map(([ch, count]) => (
          <span key={ch}>{ch}: {count}</span>
        ))}
      </div>

      {/* Calendar Grid with drag & drop */}
      {state !== 'approved' ? (
        <CalendarGrid
          posts={calendar.posts}
          startDate={startDate}
          endDate={endDate}
          onPostsChange={handlePostsChange}
          onEditPost={openPostEditor}
        />
      ) : (
        <CalendarGrid
          posts={calendar.posts}
          startDate={startDate}
          endDate={endDate}
          onPostsChange={() => {}}
          onEditPost={() => {}}
        />
      )}

      {/* Post Editor Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditingPost(null)}>
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium">✏️ Editar publicación</h3>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Titular</span>
              <input value={editHeadline} onChange={(e) => setEditHeadline(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Descripción</span>
              <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={3}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">CTA</span>
              <input value={editCta} onChange={(e) => setEditCta(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
            </label>

            <label className="block space-y-1">
              <span className="text-xs text-muted-foreground">Notas visuales</span>
              <textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring" />
            </label>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setEditingPost(null)}>Cancelar</Button>
              <Button size="sm" onClick={saveEditedPost}>💾 Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}