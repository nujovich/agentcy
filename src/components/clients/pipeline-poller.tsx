'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface Props {
  generatingAgents: string[];
  failedAgents: string[];
  clientName: string;
}

export function PipelinePoller({ generatingAgents, failedAgents, clientName }: Props) {
  const router = useRouter();
  const prevGeneratingRef = useRef<string[]>(generatingAgents);
  const prevFailedRef = useRef<string[]>(failedAgents);
  const startTimesRef = useRef<Record<string, number>>({});
  const warningFiredRef = useRef<Set<string>>(new Set());

  // Stable dep keys — avoids re-running on every render due to new array references
  const generatingKey = generatingAgents.join(',');
  const failedKey = failedAgents.join(',');

  // Detect status transitions
  useEffect(() => {
    const prev = prevGeneratingRef.current;
    const prevFailed = prevFailedRef.current;

    for (const agent of prev) {
      if (!generatingAgents.includes(agent) && !failedAgents.includes(agent)) {
        toast.success(`${agent} generado`, {
          description: `${clientName} · Listo para revisar`,
        });
        delete startTimesRef.current[agent];
        warningFiredRef.current.delete(agent);
      }
    }

    for (const agent of failedAgents) {
      if (!prevFailed.includes(agent)) {
        toast.error(`Error al generar ${agent}`, {
          description: 'Reintentar desde el pipeline',
        });
      }
    }

    prevGeneratingRef.current = generatingAgents;
    prevFailedRef.current = failedAgents;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingKey, failedKey, clientName]);

  // Polling interval while something is generating
  useEffect(() => {
    if (generatingAgents.length === 0) return;

    const now = Date.now();
    for (const agent of generatingAgents) {
      if (!startTimesRef.current[agent]) {
        startTimesRef.current[agent] = now;
      }
    }

    const id = setInterval(() => {
      router.refresh();

      const current = Date.now();
      for (const agent of generatingAgents) {
        const start = startTimesRef.current[agent] ?? current;
        if (current - start > 60_000 && !warningFiredRef.current.has(agent)) {
          warningFiredRef.current.add(agent);
          toast(`${agent} todavía generando...`, {
            description: '~1-2 minutos en total',
            icon: '⏳',
          });
        }
      }
    }, 5_000);

    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatingKey, router]);

  return null;
}
