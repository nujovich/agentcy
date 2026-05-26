import Link from 'next/link';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

type PipelineStatus = 'approved' | 'unlocked' | 'in_review' | 'locked' | 'generating' | 'failed';

interface PipelineStepProps {
  label: string;
  status: PipelineStatus;
  href?: string;
  index?: number;
}

const STATUS_LABEL: Record<PipelineStatus, string> = {
  approved: 'Aprobado',
  unlocked: 'Listo para generar',
  in_review: 'Pendiente de aprobación',
  locked: 'Pendiente',
  generating: 'Generando con IA...',
  failed: 'Error — reintentar',
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
  in_review: {
    background: 'rgba(13,115,119,0.12)',
    borderColor: 'var(--brand-primary)',
    color: 'var(--brand-primary-dark)',
  },
  locked: {
    background: 'var(--brand-surface-2)',
    borderColor: 'var(--brand-border)',
    color: 'var(--brand-ink-muted)',
  },
  generating: {
    background: 'rgba(13,115,119,0.08)',
    borderColor: 'var(--brand-primary)',
    color: 'var(--brand-primary-dark)',
  },
  failed: {
    background: 'rgba(239,68,68,0.08)',
    borderColor: '#ef4444',
    color: '#ef4444',
  },
};

const STATUS_COLOR: Record<PipelineStatus, string> = {
  approved: 'var(--brand-success)',
  unlocked: 'var(--brand-accent-dark)',
  in_review: 'var(--brand-primary-dark)',
  locked: 'var(--brand-ink-muted)',
  generating: 'var(--brand-primary-dark)',
  failed: '#ef4444',
};

const BUTTON_LABEL: Partial<Record<PipelineStatus, string>> = {
  unlocked: 'Generar',
  in_review: 'Revisar',
  failed: 'Reintentar',
};

function NodeContent({ status, index }: { status: PipelineStatus; index?: number }) {
  if (status === 'approved') return <>✓</>;
  if (status === 'generating') {
    return (
      <span
        className="block size-3 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }}
      />
    );
  }
  return <>{index ?? '·'}</>;
}

export function PipelineStep({ label, status, href, index }: PipelineStepProps) {
  const showButton = (status === 'unlocked' || status === 'in_review' || status === 'failed') && href;

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
          <NodeContent status={status} index={index} />
        </span>
        <div>
          <p className="font-heading text-sm font-semibold">{label}</p>
          <p className="font-mono text-[11px]" style={{ color: STATUS_COLOR[status] }}>
            {STATUS_LABEL[status]}
          </p>
        </div>
      </div>
      {showButton ? (
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-[var(--brand-primary-dark)] active:translate-y-px"
          style={status === 'failed' ? { background: '#ef4444' } : undefined}
        >
          {BUTTON_LABEL[status]} <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );
}
