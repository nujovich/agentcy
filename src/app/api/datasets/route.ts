import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildDataset, saveTrainingDataset, getDatasetDashboardStats } from '@/lib/trajectory';

const buildSchema = z.object({
  agentName: z.enum(['brand-intake','strategy','calendar','copywriter','brief','report']),
  includeRejected: z.boolean().default(false),
  creditAssignment: z.boolean().default(true),
  onlyProductiveSegments: z.boolean().default(false),
  name: z.string().optional(),
});

// POST /api/datasets/build — construir y persistir un dataset
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));

  try {
    const parsed = buildSchema.parse(body);

    const { examples, stats } = await buildDataset({
      agencyId: user.id,
      agentName: parsed.agentName,
      includeRejected: parsed.includeRejected,
      creditAssignment: parsed.creditAssignment,
      onlyProductiveSegments: parsed.onlyProductiveSegments,
    });

    // Persist dataset
    const datasetId = await saveTrainingDataset({
      agencyId: user.id,
      name: parsed.name ?? `${parsed.agentName} - ${new Date().toISOString().slice(0, 10)}`,
      description: `Dataset para ${parsed.agentName}. Credit-assignment: ${parsed.creditAssignment}. Solo productivos: ${parsed.onlyProductiveSegments}.`,
      agentName: parsed.agentName,
      trajectoryCount: examples.length,
    });

    return NextResponse.json({
      datasetId,
      examples: examples.slice(0, 100), // primeros 100 para preview
      totalExamples: examples.length,
      stats,
      message: examples.length >= 50
        ? '✅ Dataset listo para entrenamiento'
        : `⏳ Se necesitan al menos 50 trayectorias. Tienes ${examples.length}. Sigue usando el agente.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/datasets — dashboard stats
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stats = await getDatasetDashboardStats(user.id);
  return NextResponse.json(stats);
}