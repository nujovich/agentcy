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
}: ApprovalPanelProps) {
  const isApproved = status === 'approved';

  return (
    <section className="rounded-lg border border-border bg-card text-card-foreground shadow-sm">
      <header className="flex items-start justify-between gap-4 border-b border-border p-4">
        <div>
          {agentName ? (
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'var(--brand-ink-muted, var(--muted-foreground))',
                marginBottom: '4px',
              }}
            >
              {agentName}
            </p>
          ) : null}
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
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
