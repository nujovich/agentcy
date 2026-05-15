import { cn } from '@/lib/utils';

type PipelineStatus = 'approved' | 'unlocked' | 'locked';

interface PipelineStepProps {
  label: string;
  status: PipelineStatus;
  href?: string;
}

const STATUS_ICON: Record<PipelineStatus, string> = {
  approved: '✅',
  unlocked: '🔓',
  locked: '🔒',
};

const STATUS_LABEL: Record<PipelineStatus, string> = {
  approved: 'Aprobado',
  unlocked: 'Listo para generar',
  locked: 'Pendiente',
};

export function PipelineStep({ label, status, href }: PipelineStepProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-lg border border-border p-4',
        status === 'locked' && 'opacity-40',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">{STATUS_ICON[status]}</span>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{STATUS_LABEL[status]}</p>
        </div>
      </div>
      {status === 'unlocked' && href ? (
        <a
          href={href}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Generar →
        </a>
      ) : null}
    </div>
  );
}
