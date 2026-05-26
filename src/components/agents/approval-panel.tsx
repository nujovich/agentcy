'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export type ApprovalStatus = 'draft' | 'approved';

export interface ApprovalPanelProps {
  title: string;
  agentName?: string;
  description?: string;
  status: ApprovalStatus;
  isApproving?: boolean;
  isRegenerating?: boolean;
  onApprove?: () => void;
  onRegenerate?: () => void;
  approveLabel?: string;
  regenerateLabel?: string;
  children: ReactNode;
  modelUsed?: string;
  elapsedMs?: number;
}

export function ApprovalPanel({
  title,
  agentName,
  description,
  status,
  isApproving = false,
  isRegenerating = false,
  onApprove,
  onRegenerate,
  approveLabel = 'Aprobar',
  regenerateLabel = 'Regenerar',
  children,
  modelUsed,
  elapsedMs,
}: ApprovalPanelProps) {
  const isApproved = status === 'approved';

  return (
    <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div>
          <p className="font-heading text-sm font-semibold">{title}</p>
          {agentName && (
            <p className="text-xs text-muted-foreground">{agentName}</p>
          )}
          {description && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {modelUsed && (
            <>
              <span
                className="font-mono text-[10px] rounded px-2 py-0.5 border"
                style={{
                  background: 'var(--brand-primary-soft)',
                  color: 'var(--brand-primary-dark)',
                  borderColor: 'rgba(13,115,119,0.2)',
                }}
              >
                {modelUsed}
              </span>
              {elapsedMs && (
                <span className="font-mono text-[10px] text-muted-foreground">
                  {Math.round(elapsedMs / 1000)}s
                </span>
              )}
            </>
          )}
          <span
            style={
              isApproved
                ? {
                    background: 'var(--brand-success-soft, #D8F0E4)',
                    color: 'var(--brand-success, #1B8A5A)',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }
                : {
                    background: 'var(--brand-accent-soft, #FDE8CE)',
                    color: 'var(--brand-accent-dark, #C7823F)',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    animation: 'approvalPillIn 220ms cubic-bezier(0.22, 1, 0.36, 1) both',
                  }
            }
          >
            {isApproved ? 'Aprobado' : 'Pendiente de aprobación'}
            <style>{`
              @keyframes approvalPillIn {
                from { opacity: 0; transform: translateY(4px); }
                to   { opacity: 1; transform: translateY(0); }
              }
            `}</style>
          </span>
        </div>
      </header>

      <div className="space-y-4 p-4">{children}</div>

      <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-border p-4">
        {onRegenerate ? (
          <Button
            type="button"
            variant="outline"
            onClick={onRegenerate}
            disabled={isRegenerating || isApproving || isApproved}
          >
            {isRegenerating ? 'Regenerando...' : regenerateLabel}
          </Button>
        ) : null}
        {onApprove ? (
          <Button
            type="button"
            onClick={onApprove}
            disabled={isApproving || isRegenerating || isApproved}
            style={
              !isApproved
                ? { background: 'var(--brand-primary, #0D7377)', color: '#fff' }
                : undefined
            }
          >
            {isApproving ? 'Guardando...' : isApproved ? 'Aprobado' : approveLabel}
          </Button>
        ) : null}
      </footer>
    </section>
  );
}
