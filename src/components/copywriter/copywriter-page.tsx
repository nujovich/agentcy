'use client';

import { useState } from 'react';

import { CopywriterApprovalPanel } from '@/components/copywriter/copywriter-approval-panel';
import { CopywriterEditor } from '@/components/copywriter/copywriter-editor';
import { CopywriterGenerator } from '@/components/copywriter/copywriter-generator';
import type { BrandProfile } from '@/types/brand-profile';
import type { EditorialCalendar } from '@/types/calendar';
import type { CopywritingProject, PostCopy } from '@/types/copywriter';

interface CopywriterPageProps {
  profile: BrandProfile;
  calendar: EditorialCalendar;
  initialProject: CopywritingProject | null;
}

type PageState = 'generate' | 'loading' | 'edit' | 'review' | 'approved';

function deriveInitialState(project: CopywritingProject | null): PageState {
  if (!project) return 'generate';
  if (project.agencyStatus === 'approved') return 'approved';
  return 'review';
}

export function CopywriterPage({
  profile,
  calendar,
  initialProject,
}: CopywriterPageProps) {
  const [project, setProject] = useState<CopywritingProject | null>(initialProject);
  const [state, setState] = useState<PageState>(() => deriveInitialState(initialProject));
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setState('loading');
    setError(null);
    try {
      const res = await fetch('/api/agents/copywriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId: calendar.id }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? 'Error al generar el copy';
        throw new Error(msg);
      }
      setProject(json as CopywritingProject);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setState('generate');
    }
  }

  async function handleSave(copies: PostCopy[]) {
    if (!project) return;
    setError(null);
    try {
      const res = await fetch(`/api/copywriting-projects/${project.id}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ copies }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? 'Error al guardar';
        throw new Error(msg);
      }
      setProject(json as CopywritingProject);
      setState('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  async function handleApprove() {
    if (!project) return;
    setError(null);
    try {
      const res = await fetch(`/api/copywriting-projects/${project.id}/approve`, {
        method: 'POST',
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg = (json as { error?: string }).error ?? 'Error al aprobar';
        throw new Error(msg);
      }
      setProject(json as CopywritingProject);
      setState('approved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  async function handleReject() {
    if (!project) return;
    setError(null);
    try {
      const res = await fetch(`/api/copywriting-projects/${project.id}/reject`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Error al rechazar');
      }
      setProject(null);
      setState('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    }
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      {error ? (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: 'var(--brand-error, #ef4444)',
            background: 'rgba(239,68,68,0.08)',
            color: 'var(--brand-error, #ef4444)',
          }}
        >
          {error}
        </div>
      ) : null}

      {state === 'generate' || state === 'loading' ? (
        <CopywriterGenerator
          calendar={calendar}
          profile={profile}
          onGenerate={handleGenerate}
          isLoading={state === 'loading'}
        />
      ) : null}

      {state === 'review' && project ? (
        <CopywriterApprovalPanel
          project={project}
          calendar={calendar}
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={() => setState('edit')}
        />
      ) : null}

      {state === 'edit' && project ? (
        <CopywriterEditor
          project={project}
          posts={calendar.posts}
          onSave={handleSave}
          onCancel={() => setState('review')}
        />
      ) : null}

      {state === 'approved' && project ? (
        <div className="text-center space-y-4 py-12">
          <div
            className="inline-flex size-16 items-center justify-center rounded-full text-2xl"
            style={{ background: 'var(--brand-success-soft)' }}
          >
            ✓
          </div>
          <h2 className="text-2xl font-semibold">Copy aprobado</h2>
          <p className="text-sm text-muted-foreground">
            {project.copies.length} posts con copy profesional listos para el Brief Agent.
          </p>
        </div>
      ) : null}
    </main>
  );
}
