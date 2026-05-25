'use client';

import { useState, useCallback, useRef } from 'react';
import type { CalendarPost } from '@/types/calendar';

// ─── Helpers ───────────────────────────────────────────
function getWeekDates(start: Date, end: Date): Date[][] {
  const weeks: Date[][] = [];
  let current = new Date(start);
  // Ajustar al lunes de la semana
  const dayOfWeek = current.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  current.setDate(current.getDate() + diff);

  while (current <= end) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formatDayName(d: Date): string {
  return d.toLocaleDateString('es-ES', { weekday: 'short' });
}

function formatDayNumber(d: Date): number {
  return d.getDate();
}

function isToday(d: Date): boolean {
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

function isInRange(d: Date, start: Date, end: Date): boolean {
  return d >= new Date(start.getFullYear(), start.getMonth(), start.getDate()) &&
         d <= new Date(end.getFullYear(), end.getMonth(), end.getDate());
}

const CHANNEL_COLORS: Record<string, string> = {
  Instagram: '#E1306C',
  LinkedIn: '#0A66C2',
  TikTok: '#000000',
  Twitter: '#1DA1F2',
  Facebook: '#1877F2',
  YouTube: '#FF0000',
};

const FORMAT_ICONS: Record<string, string> = {
  post: '📷',
  reel: '🎬',
  story: '📱',
  carousel: '🎠',
};

// ─── Props ─────────────────────────────────────────────
interface CalendarGridProps {
  posts: CalendarPost[];
  startDate: string;
  endDate: string;
  onPostsChange: (posts: CalendarPost[]) => void;
  onEditPost: (post: CalendarPost) => void;
}

export function CalendarGrid({ posts, startDate, endDate, onPostsChange, onEditPost }: CalendarGridProps) {
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);
  const dragOverDay = useRef<string | null>(null);

  const start = new Date(startDate);
  const end = new Date(endDate);
  const weeks = getWeekDates(start, end);

  // Agrupar posts por fecha
  const postsByDate = new Map<string, CalendarPost[]>();
  for (const post of posts) {
    const existing = postsByDate.get(post.date) ?? [];
    existing.push(post);
    postsByDate.set(post.date, existing);
  }

  // ─── Drag handlers ──────────────────────────────────
  const handleDragStart = useCallback((e: React.DragEvent, postId: string) => {
    setDraggedPostId(postId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', postId);
    (e.target as HTMLElement).classList.add('opacity-40');
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDraggedPostId(null);
    dragOverDay.current = null;
    (e.target as HTMLElement).classList.remove('opacity-40');
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, dateKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverDay.current = dateKey;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    const postId = e.dataTransfer.getData('text/plain');
    if (!postId) return;

    const updated = posts.map((p) => {
      if (p.id === postId) {
        return { ...p, date: targetDate };
      }
      return p;
    });
    onPostsChange(updated);
    setDraggedPostId(null);
  }, [posts, onPostsChange]);

  const handlePostClick = useCallback((post: CalendarPost) => {
    onEditPost(post);
  }, [onEditPost]);

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px] space-y-1">
        {/* Header: days of week */}
        <div className="grid grid-cols-7 gap-1">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
            <div key={day} className="text-center py-2 text-xs font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1">
            {week.map((day) => {
              const dateKey = formatDateKey(day);
              const dayPosts = postsByDate.get(dateKey) ?? [];
              const inRange = isInRange(day, start, end);
              const today = isToday(day);
              const isOver = draggedPostId && dragOverDay.current === dateKey;

              return (
                <div
                  key={dateKey}
                  onDragOver={(e) => handleDragOver(e, dateKey)}
                  onDrop={(e) => handleDrop(e, dateKey)}
                  className={`
                    min-h-[120px] rounded-lg border p-1.5 transition-colors
                    ${inRange ? 'bg-card border-border' : 'bg-muted/30 border-transparent'}
                    ${today ? 'ring-2 ring-[var(--brand-primary)]/30 border-[var(--brand-primary)]/50' : ''}
                    ${isOver ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)]/50' : ''}
                  `}
                >
                  {/* Day header */}
                  <div className={`
                    text-[10px] font-medium mb-1 px-1 py-0.5 rounded
                    ${today ? 'bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]' : 'text-muted-foreground'}
                  `}>
                    {formatDayNumber(day)}
                  </div>

                  {/* Posts */}
                  <div className="space-y-1">
                    {dayPosts.map((post) => (
                      <div
                        key={post.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, post.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handlePostClick(post)}
                        className={`
                          group cursor-grab active:cursor-grabbing rounded-md p-1.5 text-[10px]
                          leading-tight transition-all hover:shadow-md
                          ${draggedPostId === post.id ? 'opacity-40' : ''}
                        `}
                        style={{
                          backgroundColor: `${CHANNEL_COLORS[post.channel] ?? '#64748b'}15`,
                          borderLeft: `3px solid ${CHANNEL_COLORS[post.channel] ?? '#64748b'}`,
                        }}
                      >
                        <div className="flex items-center gap-1 font-medium truncate">
                          <span>{FORMAT_ICONS[post.format] ?? '📄'}</span>
                          <span className="truncate text-[11px]">{post.headline}</span>
                        </div>
                        <div className="text-[9px] text-muted-foreground mt-0.5 truncate">
                          {post.channel} · {post.time?.slice(0, 5) ?? 'Sin hora'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}