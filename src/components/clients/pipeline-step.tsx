import Link from 'next/link';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

type PipelineStatus = 'approved' | 'unlocked' | 'locked';

interface PipelineStepProps {
  label: string;
  status: PipelineStatus;
  href?: string;
  index?: number;
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  approved: 'Aprobado',
  unlocked: 'Listo para generar',
  locked: 'Pendiente',
};

const NODE_STYLE: Record<PipelineStatus, CSSProperties> = {
  approved: {
    background: 'var(--brand-success)',
    borderColor: 'var(--brand-success)',
    color: '#fff',
  },
  unlocked: {
    background: 'rgba(242,166,90,0.15)',
    borderColor: 'var(--brand-accent)',
    color: 'var(--brand-accent-dark)',
    boxShadow: 'var(--shadow-glow-accent)',
  },
  locked: {
    background: 'var(--brand-surface-2)',
    borderColor: 'var(--brand-border)',
    color: 'var(--brand-ink-muted)',
  },
};

const STATUS_COLOR: Record<PipelineStatus, string> = {
  approved: 'var(--brand-success)',
  unlocked: 'var(--brand-accent-dark)',
  locked: 'var(--brand-ink-muted)',
};

export function PipelineStep({
  label,
  status,
  href,
  index,
}: PipelineStepProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm transition-colors',
        status === 'locked' && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className="flex size-8 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold"
          style={NODE_STYLE[status]}
        >
          {status === 'approved' ? '✓' : (index ?? '·')}
        </span>
        <div>
          <p className="font-heading text-sm font-semibold">{label}</p>
          <p
            className="font-mono text-[11px]"
            style={{ color: STATUS_COLOR[status] }}
          >
            {STATUS_LABEL[status]}
          </p>
        </div>
      </div>
      {status === 'unlocked' && href ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[var(--brand-primary-dark)] active:translate-y-px"
        >
          Generar <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}
