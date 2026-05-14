'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ApprovalStatus = 'draft' | 'approved';

export interface ApprovalPanelProps {
  title: string;
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
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide',
            isApproved
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-amber-100 text-amber-800',
          )}
        >
          {isApproved ? 'Approved' : 'Draft'}
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
          >
            {isApproving ? 'Guardando...' : isApproved ? 'Aprobado' : approveLabel}
          </Button>
        ) : null}
      </footer>
    </section>
  );
}
