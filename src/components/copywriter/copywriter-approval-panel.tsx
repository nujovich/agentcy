'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { EditorialCalendar } from '@/types/calendar';
import type { CopywritingProject, PostCopy } from '@/types/copywriter';

interface CopywriterApprovalPanelProps {
  project: CopywritingProject;
  calendar: EditorialCalendar;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
  onEdit: () => void;
}

function CopyPreviewCard({ copy }: { copy: PostCopy }) {
  return (
    <div
      className="rounded-xl border p-4 space-y-2 text-sm"
      style={{ borderColor: 'var(--brand-border)' }}
    >
      <div className="flex items-center justify-between">
        <span
          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: 'var(--brand-primary-soft)',
            color: 'var(--brand-primary-dark)',
          }}
        >
          {copy.channel}
        </span>
      </div>
      <p className="font-semibold" style={{ color: 'var(--brand-primary)' }}>
        {copy.hook}
      </p>
      <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-wrap">
        {copy.body}
      </p>
      <p className="text-xs italic text-muted-foreground">{copy.cta}</p>
      <p className="text-[10px] text-muted-foreground truncate">{copy.hashtags}</p>
    </div>
  );
}

export function CopywriterApprovalPanel({
  project,
  calendar,
  onApprove,
  onReject,
  onEdit,
}: CopywriterApprovalPanelProps) {
  const [confirmReject, setConfirmReject] = useState(false);
  const [isActing, setIsActing] = useState(false);

  const previewCopies = project.copies.slice(0, 4);

  const copysByChannel = project.copies.reduce<Record<string, number>>((acc, c) => {
    acc[c.channel] = (acc[c.channel] ?? 0) + 1;
    return acc;
  }, {});

  async function handleApprove() {
    setIsActing(true);
    await onApprove();
    setIsActing(false);
  }

  async function handleReject() {
    setIsActing(true);
    await onReject();
    setIsActing(false);
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Copy generado</h1>
          <p className="text-sm text-muted-foreground">
            Revisá el copy y aprobalo o pedí cambios.
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
        {/* Main: preview */}
        <div className="space-y-5 lg:col-span-2">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>
                {project.copies.length}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">copies generados</p>
            </div>
            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p className="text-lg font-semibold">{Object.keys(copysByChannel).length}</p>
              <p className="mt-1 text-xs text-muted-foreground">canales cubiertos</p>
            </div>
            <div
              className="rounded-xl border p-4 text-center"
              style={{ borderColor: 'var(--brand-border)' }}
            >
              <p className="text-sm font-semibold">
                {calendar.campaignStart}
                <br />→ {calendar.campaignEnd}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">período de campaña</p>
            </div>
          </div>

          {/* Channel breakdown */}
          <section
            className="rounded-xl border p-5 space-y-3"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <h2 className="text-sm font-semibold">Posts por canal</h2>
            <div className="space-y-2">
              {Object.entries(copysByChannel).map(([channel, count]) => {
                const pct = Math.round((count / project.copies.length) * 100);
                return (
                  <div key={channel} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium">{channel}</span>
                      <span className="text-muted-foreground font-mono">
                        {count} ({pct}%)
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
              })}
            </div>
          </section>

          {/* Copy preview */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">
              Preview (primeros {previewCopies.length} copies)
            </h2>
            <div className="space-y-3">
              {previewCopies.map((copy) => (
                <CopyPreviewCard key={copy.calendarPostId} copy={copy} />
              ))}
            </div>
            {project.copies.length > previewCopies.length ? (
              <p className="text-center text-xs text-muted-foreground">
                + {project.copies.length - previewCopies.length} copies más — editá si necesitás cambios
              </p>
            ) : null}
          </section>
        </div>

        {/* Sidebar: actions */}
        <aside>
          <div
            className="sticky top-6 rounded-xl border p-5 space-y-3"
            style={{ borderColor: 'var(--brand-border)' }}
          >
            <h2 className="text-sm font-semibold">Acciones</h2>

            {!confirmReject ? (
              <div className="space-y-2">
                <Button onClick={handleApprove} disabled={isActing} className="w-full" size="lg">
                  {isActing ? 'Aprobando...' : 'Aprobar copy'}
                </Button>
                <button
                  type="button"
                  onClick={onEdit}
                  disabled={isActing}
                  className="w-full rounded-lg border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                  style={{ borderColor: 'var(--brand-border)' }}
                >
                  Editar copies
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReject(true)}
                  disabled={isActing}
                  className="w-full rounded-lg border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-50"
                  style={{ borderColor: 'var(--brand-border)' }}
                >
                  Rechazar y regenerar
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Esto rechazará el copy actual y te permitirá regenerarlo desde cero.
                </p>
                <Button
                  onClick={handleReject}
                  disabled={isActing}
                  variant="destructive"
                  className="w-full"
                >
                  {isActing ? 'Rechazando...' : 'Confirmar rechazo'}
                </Button>
                <button
                  type="button"
                  onClick={() => setConfirmReject(false)}
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
                Si aprobás, el Brief Agent generará los lineamientos visuales para cada post.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
