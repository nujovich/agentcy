'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { CalendarPost, EditorialCalendar } from '@/types/calendar';

interface CalendarApprovalPanelProps {
  calendar: EditorialCalendar;
  onApprove: () => Promise<void>;
  onReject: (feedback: string) => Promise<void>;
  onEdit: () => void;
}

const DAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function getMonthCells(monthStr: string): string[] {
  const parts = monthStr.split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const jsFirstDow = new Date(y, m - 1, 1).getDay(); // 0=Sun
  const leadingEmpty = jsFirstDow === 0 ? 6 : jsFirstDow - 1; // Mon-start
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells: string[] = [];
  for (let i = 0; i < leadingEmpty; i++) cells.push('');
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }
  while (cells.length % 7 !== 0) cells.push('');
  return cells;
}

function DistributionBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-mono">
          {value} ({pct}%)
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full"
        style={{ background: 'var(--brand-surface-2)' }}
      >
        <div
          className="h-1.5 rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'var(--brand-primary)' }}
        />
      </div>
    </div>
  );
}

function MonthGrid({ posts, monthStr }: { posts: CalendarPost[]; monthStr: string }) {
  const cells = getMonthCells(monthStr);
  const parts = monthStr.split('-');
  const mNum = parseInt(parts[1], 10);
  const yNum = parseInt(parts[0], 10);
  const monthName = `${MONTH_NAMES_ES[mNum - 1]} ${yNum}`;

  const byDate = new Map<string, CalendarPost[]>();
  for (const post of posts) {
    const arr = byDate.get(post.date) ?? [];
    arr.push(post);
    byDate.set(post.date, arr);
  }

  return (
    <section
      className="rounded-xl border p-5 space-y-3"
      style={{ borderColor: 'var(--brand-border)' }}
    >
      <h2 className="text-sm font-semibold">Calendario — {monthName}</h2>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAYS_ES.map((d) => (
          <div
            key={d}
            className="py-1.5 text-center font-mono text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: 'var(--brand-ink-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) {
            return <div key={`empty-${i}`} className="min-h-[52px]" />;
          }
          const dayPosts = byDate.get(dateStr) ?? [];
          const day = parseInt(dateStr.split('-')[2], 10);

          return (
            <div
              key={dateStr}
              className="min-h-[52px] rounded-lg p-1 space-y-0.5"
              style={{
                background: dayPosts.length > 0 ? 'var(--brand-surface)' : 'transparent',
                border: '1px solid var(--brand-border)',
              }}
            >
              <span
                className="block text-right font-mono text-[9px] leading-none"
                style={{ color: 'var(--brand-ink-muted)' }}
              >
                {day}
              </span>
              {dayPosts.map((post) => (
                <div
                  key={post.id}
                  className="truncate rounded px-1 py-px text-[9px] font-semibold leading-tight"
                  title={`${post.channel}: ${post.headline}`}
                  style={{
                    background: 'var(--brand-primary-soft)',
                    color: 'var(--brand-primary-dark)',
                  }}
                >
                  {post.channel}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function CalendarApprovalPanel({
  calendar,
  onApprove,
  onReject,
  onEdit,
}: CalendarApprovalPanelProps) {
  const [rejectMode, setRejectMode] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isActing, setIsActing] = useState(false);

  const handleApprove = async () => {
    setIsActing(true);
    await onApprove();
    setIsActing(false);
  };

  const handleReject = async () => {
    if (!feedback.trim()) return;
    setIsActing(true);
    await onReject(feedback);
    setFeedback('');
    setRejectMode(false);
    setIsActing(false);
  };

  const channelEntries = Object.entries(calendar.postsByChannel);
  const pillarEntries = Object.entries(calendar.pillarDistribution);
  const monthLabel = `${calendar.month} ${calendar.year}`;

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Calendario generado</h1>
          <p className="text-sm text-muted-foreground">
            Revisá el calendario y aprobalo o pedí cambios con feedback.
          </p>
        </div>
        <span
          className="shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em]"
          style={{ background: 'var(--brand-accent-soft)', color: 'var(--brand-accent-dark)' }}
        >
          Borrador
        </span>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-5 lg:col-span-2">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-4">
            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p
                className="text-3xl font-bold"
                style={{ color: 'var(--brand-primary)' }}
              >
                {calendar.totalPosts}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">posts en total</p>
            </div>
            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p className="text-xl font-semibold">{monthLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">mes del calendario</p>
            </div>
          </div>

          {/* Channel distribution */}
          {channelEntries.length > 0 ? (
            <section
              className="rounded-xl border p-5 space-y-3"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <h2 className="text-sm font-semibold">Distribución por canal</h2>
              <div className="space-y-3">
                {channelEntries.map(([channel, count]) => (
                  <DistributionBar
                    key={channel}
                    label={channel}
                    value={count}
                    total={calendar.totalPosts}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Pillar distribution */}
          {pillarEntries.length > 0 ? (
            <section
              className="rounded-xl border p-5 space-y-3"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <h2 className="text-sm font-semibold">Distribución por pilar</h2>
              <div className="space-y-3">
                {pillarEntries.map(([pillar, count]) => (
                  <DistributionBar
                    key={pillar}
                    label={pillar}
                    value={count}
                    total={calendar.totalPosts}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {/* Full month calendar grid */}
          <MonthGrid posts={calendar.posts} monthStr={calendar.month} />
        </div>

        {/* Sidebar */}
        <aside>
          <div
            className="sticky top-6 rounded-xl border p-5 space-y-3"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <h2 className="text-sm font-semibold">Acciones</h2>

            {!rejectMode ? (
              <div className="space-y-2">
                <Button
                  onClick={handleApprove}
                  disabled={isActing}
                  className="w-full"
                  size="lg"
                >
                  {isActing ? 'Aprobando...' : 'Aprobar calendario'}
                </Button>
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={isActing}
                  className="w-full rounded-lg border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                  style={{ borderColor: 'var(--brand-border)' }}
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  disabled={isActing}
                  className="w-full rounded-lg border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                  style={{ borderColor: 'var(--brand-border)' }}
                >
                  Rechazar y pedir cambios
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">¿Qué cambiarias? Sé específico.</span>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="Ej: Necesito más posts de LinkedIn los martes..."
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                    style={{ borderColor: 'var(--brand-border)' }}
                  />
                </label>
                <Button
                  onClick={handleReject}
                  disabled={!feedback.trim() || isActing}
                  variant="destructive"
                  className="w-full"
                >
                  {isActing ? 'Enviando...' : 'Enviar feedback'}
                </Button>
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="w-full rounded-lg border px-4 py-2 text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                  style={{ borderColor: 'var(--brand-border)' }}
                >
                  Cancelar
                </button>
              </div>
            )}

            <div
              className="rounded-lg p-3 text-xs space-y-1"
              style={{
                background: 'var(--brand-primary-soft)',
                color: 'var(--brand-primary-dark)',
              }}
            >
              <p className="font-semibold">Tip</p>
              <p>
                Si aprobás, el Copywriter Agent generará el texto completo para cada post.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
