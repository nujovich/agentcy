'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CalendarChannel, CalendarPost, EditorialCalendar } from '@/types/calendar';

interface CalendarEditorProps {
  calendar: EditorialCalendar;
  onSave: (posts: CalendarPost[]) => Promise<void>;
}

function channelColor(channel: CalendarChannel): string {
  switch (channel) {
    case 'Instagram':
      return 'var(--brand-accent)';
    case 'LinkedIn':
      return 'var(--brand-primary)';
    case 'TikTok':
      return 'var(--brand-success)';
    default:
      return 'var(--brand-ink-muted)';
  }
}

function groupByDate(posts: CalendarPost[]): Array<{ date: string; posts: CalendarPost[] }> {
  const map = new Map<string, CalendarPost[]>();
  for (const post of posts) {
    const existing = map.get(post.date);
    if (existing) {
      existing.push(post);
    } else {
      map.set(post.date, [post]);
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayPosts]) => ({ date, posts: dayPosts }));
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

interface PostEditorProps {
  post: CalendarPost;
  onSave: (updated: CalendarPost) => void;
  onCancel: () => void;
}

function PostEditor({ post, onSave, onCancel }: PostEditorProps) {
  const [headline, setHeadline] = useState(post.headline);
  const [description, setDescription] = useState(post.description);
  const [cta, setCta] = useState(post.cta);
  const [notes, setNotes] = useState(post.notes ?? '');

  const handleSave = () => {
    onSave({ ...post, headline, description, cta, notes: notes || undefined });
  };

  return (
    <div className="mt-3 space-y-3 border-t pt-3" style={{ borderColor: 'var(--brand-border)' }}>
      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Titular</span>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          style={{ borderColor: 'var(--brand-border)' }}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Descripción</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          style={{ borderColor: 'var(--brand-border)' }}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">CTA</span>
        <input
          type="text"
          value={cta}
          onChange={(e) => setCta(e.target.value)}
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          style={{ borderColor: 'var(--brand-border)' }}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Notas internas</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Notas opcionales..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          style={{ borderColor: 'var(--brand-border)' }}
        />
      </label>

      <div className="flex gap-2">
        <Button onClick={handleSave} size="sm">
          Guardar
        </Button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

interface PostCardProps {
  post: CalendarPost;
  isEditing: boolean;
  onToggleEdit: () => void;
  onSave: (updated: CalendarPost) => void;
}

function PostCard({ post, isEditing, onToggleEdit, onSave }: PostCardProps) {
  return (
    <div
      className="rounded-xl border pl-4 pr-4 py-3 space-y-1"
      style={{
        borderColor: 'var(--brand-border)',
        borderLeftColor: channelColor(post.channel),
        borderLeftWidth: '4px',
      }}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span
          className="rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase"
          style={{
            background: 'var(--brand-primary-soft)',
            color: 'var(--brand-primary-dark)',
          }}
        >
          {post.channel}
        </span>
        <span
          className="rounded-full border px-2 py-0.5 font-mono text-[10px]"
          style={{ borderColor: 'var(--brand-border)' }}
        >
          {post.format}
        </span>
        <span className="font-mono text-xs text-muted-foreground">{post.time}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: 'var(--brand-accent-soft)',
            color: 'var(--brand-accent-dark)',
          }}
        >
          {post.pillar}
        </span>
        <button
          type="button"
          onClick={onToggleEdit}
          className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline"
        >
          {isEditing ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      <p className="text-sm font-semibold leading-snug">{post.headline}</p>
      <p className="text-xs text-muted-foreground line-clamp-2">{post.description}</p>

      {isEditing ? (
        <PostEditor
          post={post}
          onSave={onSave}
          onCancel={onToggleEdit}
        />
      ) : null}
    </div>
  );
}

export function CalendarEditor({ calendar, onSave }: CalendarEditorProps) {
  const [posts, setPosts] = useState<CalendarPost[]>(calendar.posts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePostSave = (updated: CalendarPost) => {
    setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingId(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(posts);
    setIsSaving(false);
  };

  const grouped = groupByDate(posts);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Editor de calendario</h1>
        <p className="text-sm text-muted-foreground">
          {posts.length} posts · hacé clic en un post para editarlo
        </p>
      </header>

      <div className="space-y-6">
        {grouped.map(({ date, posts: dayPosts }) => (
          <section key={date} className="space-y-3">
            <h2
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--brand-ink-muted)' }}
            >
              {formatDate(date)}
            </h2>
            <div className="space-y-2">
              {dayPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  isEditing={editingId === post.id}
                  onToggleEdit={() =>
                    setEditingId((prev) => (prev === post.id ? null : post.id))
                  }
                  onSave={handlePostSave}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      <Button
        onClick={handleSave}
        disabled={isSaving}
        className={cn('w-full')}
        size="lg"
      >
        {isSaving ? 'Guardando...' : `Guardar cambios (${posts.length} posts)`}
      </Button>
    </div>
  );
}
