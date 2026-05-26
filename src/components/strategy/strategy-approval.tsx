'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { Strategy } from '@/types/strategy';

interface StrategyApprovalProps {
  strategy: Strategy;
  onApprove: () => Promise<void>;
  onReject: (feedback: string) => Promise<void>;
}

export function StrategyApproval({ strategy, onApprove, onReject }: StrategyApprovalProps) {
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

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Estrategia generada</h1>
          <p className="text-sm text-muted-foreground">
            Revisá la estrategia y aprobala o pedí cambios con feedback.
          </p>
        </div>
        {strategy.modelUsed && (
          <div className="flex shrink-0 items-center gap-2">
            <span
              className="font-mono text-[10px] rounded px-2 py-0.5 border"
              style={{
                background: 'var(--brand-primary-soft)',
                color: 'var(--brand-primary-dark)',
                borderColor: 'rgba(13,115,119,0.2)',
              }}
            >
              {strategy.modelUsed}
            </span>
            {strategy.elapsedMs && (
              <span className="font-mono text-[10px] text-muted-foreground">
                {Math.round(strategy.elapsedMs / 1000)}s
              </span>
            )}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Objectives */}
          <section className="rounded-xl border border-border p-5 space-y-3">
            <h2 className="text-sm font-semibold">Objetivos</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {(
                [
                  ['Alcance', strategy.objectives.reach],
                  ['Engagement', strategy.objectives.engagement],
                  ['Conversión', strategy.objectives.conversion],
                  ['Retención', strategy.objectives.retention],
                ] as const
              ).map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-medium text-muted-foreground">{label}</p>
                  <p>{value}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Channels */}
          <section className="rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold">Canales recomendados</h2>
            <div className="space-y-4">
              {strategy.channelStrategies.map((ch) => (
                <div key={ch.name} className="space-y-2 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{ch.name}</p>
                      <span
                        className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium"
                        style={{
                          background: 'var(--brand-primary-soft)',
                          color: 'var(--brand-primary-dark)',
                        }}
                      >
                        {ch.allocation}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{ch.frequency}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{ch.rationale}</p>
                  <div className="flex flex-wrap gap-1">
                    {ch.best_times.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border px-2 py-0.5 font-mono text-[11px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Content Pillars */}
          <section className="rounded-xl border border-border p-5 space-y-4">
            <h2 className="text-sm font-semibold">Pilares de contenido</h2>
            <div className="space-y-4">
              {strategy.contentPillars.map((pillar) => (
                <div key={pillar.name} className="space-y-1 border-b border-border pb-4 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm">{pillar.name}</p>
                    <span className="font-mono text-xs text-muted-foreground">{pillar.frequency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{pillar.description}</p>
                  <p className="text-xs text-muted-foreground">
                    Ej: {pillar.examples.slice(0, 2).join(' · ')}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* KPIs */}
          <section className="rounded-xl border border-border p-5 space-y-3">
            <h2 className="text-sm font-semibold">KPIs</h2>
            <div className="space-y-3">
              {strategy.kpis.map((kpi) => (
                <div
                  key={kpi.name}
                  className="space-y-0.5 border-b border-border pb-3 last:border-0 last:pb-0 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{kpi.name}</p>
                    <span
                      className="shrink-0 font-mono text-[10px] uppercase tracking-wide"
                      style={{
                        color:
                          kpi.importance === 'critical'
                            ? 'var(--brand-primary-dark)'
                            : kpi.importance === 'high'
                              ? 'var(--brand-accent-dark)'
                              : 'var(--brand-ink-muted)',
                      }}
                    >
                      {kpi.importance}
                    </span>
                  </div>
                  <p className="font-semibold">{kpi.target}</p>
                  <p className="text-xs text-muted-foreground">{kpi.measurement}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Reasoning */}
          <section className="rounded-xl border border-border p-5 space-y-2">
            <h2 className="text-sm font-semibold">Razonamiento</h2>
            <p className="text-sm text-muted-foreground">{strategy.reasoning}</p>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-border p-5 space-y-3 sticky top-6">
            <h2 className="text-sm font-semibold">Acciones</h2>

            {!rejectMode ? (
              <div className="space-y-2">
                <Button
                  onClick={handleApprove}
                  disabled={isActing}
                  className="w-full"
                  size="lg"
                >
                  {isActing ? 'Aprobando...' : 'Aprobar estrategia'}
                </Button>
                <button
                  type="button"
                  onClick={() => setRejectMode(true)}
                  disabled={isActing}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors disabled:opacity-50"
                >
                  Rechazar y pedir cambios
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium">
                    ¿Qué cambiarias? Sé específico.
                  </span>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    placeholder="Ej: Los canales no incluyen LinkedIn, que es clave para B2B..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
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
                  className="w-full rounded-lg border border-border px-4 py-2 text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
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
                Si rechazás, el agente regenera la estrategia incorporando tu feedback.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
