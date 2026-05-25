import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { buildDataset, saveTrainingDataset } from '@/lib/trajectory';

const trainSchema = z.object({
  agentName: z.enum(['brand-intake','strategy','calendar','copywriter','brief','report']),
  includeRejected: z.boolean().default(false),
  creditAssignment: z.boolean().default(true),
  onlyProductiveSegments: z.boolean().default(true),
  baseModel: z.string().default('Qwen3-4B'),
  provider: z.enum(['together', 'openai', 'mock']).default('mock'),
});

// POST /api/train — build dataset + trigger fine-tuning
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const parsed = trainSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', issues: parsed.error.issues }, { status: 400 });
  }

  const { agentName, baseModel, provider, ...datasetConfig } = parsed.data;

  try {
    // Step 1: Build dataset from trajectories
    const { examples, stats } = await buildDataset({
      agencyId: user.id,
      agentName,
      ...datasetConfig,
    });

    if (examples.length < 5) {
      return NextResponse.json({
        error: `Se necesitan al menos 5 trayectorias. Tienes ${examples.length}.`,
        stats,
      }, { status: 400 });
    }

    // Step 2: Save dataset to DB
    const datasetId = await saveTrainingDataset({
      agencyId: user.id,
      name: `${agentName} - ${new Date().toISOString().slice(0, 10)}`,
      description: `${examples.length} trayectorias. Credit-assignment: ${datasetConfig.creditAssignment}. Provider: ${provider}.`,
      agentName,
      trajectoryCount: examples.length,
    });

    // Step 3: Register model (pending training)
    const modelName = `agentcy-${agentName}-${user.id.slice(0, 8)}-v1`;

    const { data: modelRow, error: modelError } = await supabase
      .from('fine_tuned_models')
      .insert({
        agency_id: user.id,
        dataset_id: datasetId,
        agent_name: agentName,
        model_name: modelName,
        base_model: baseModel,
        status: 'training',
        trajectory_count: examples.length,
        metadata: { provider, examples_count: examples.length, credit_assignment: datasetConfig.creditAssignment },
      })
      .select('id')
      .single();

    if (modelError) throw new Error(`Failed to register model: ${modelError.message}`);
    const modelId = modelRow.id;

    // Step 4: Execute training (async — doesn't block response)
    // En producción, esto iría a una cola de trabajos
    executeTraining({
      modelId,
      datasetId,
      agencyId: user.id,
      agentName,
      examples,
      baseModel,
      provider,
      supabase,
    }).catch((err) => {
      console.error(`[train] Training failed for ${modelId}:`, err);
    });

    return NextResponse.json({
      datasetId,
      modelId,
      modelName,
      status: 'training',
      message: `Entrenamiento iniciado para ${agentName}. ${examples.length} trayectorias. Modelo: ${modelName}.`,
      stats,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/train — check training status
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const modelId = url.searchParams.get('modelId');

  if (modelId) {
    const { data, error } = await supabase
      .from('fine_tuned_models')
      .select('*')
      .eq('id', modelId)
      .eq('agency_id', user.id)
      .single();

    if (error) return NextResponse.json({ error: 'Model not found' }, { status: 404 });
    return NextResponse.json(data);
  }

  // Return all models for this agency
  const { data, error } = await supabase
    .from('fine_tuned_models')
    .select('*')
    .eq('agency_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// ─── Training Executor ──────────────────────────────────
// En MVP: modo "mock" (simula entrenamiento) o "together" (API real)
interface TrainingJob {
  modelId: string;
  datasetId: string;
  agencyId: string;
  agentName: string;
  examples: any[];
  baseModel: string;
  provider: string;
  supabase: any;
}

async function executeTraining(job: TrainingJob) {
  const { modelId, agentName, examples, baseModel, provider, supabase } = job;

  try {
    if (provider === 'mock') {
      // Simular entrenamiento (para pruebas)
      const totalSteps = 5;
      for (let step = 1; step <= totalSteps; step++) {
        await new Promise((r) => setTimeout(r, 2000)); // 2s por paso

        await supabase
          .from('fine_tuned_models')
          .update({
            metadata: {
              ...(await getModelMetadata(supabase, modelId)),
              progress: Math.round((step / totalSteps) * 100),
              current_step: `Paso ${step}/${totalSteps}: ${getStepLabel(step)}`,
            },
          })
          .eq('id', modelId);
      }

      // Marcar como activo
      await supabase
        .from('fine_tuned_models')
        .update({
          status: 'active',
          quality_score: 0.75 + Math.random() * 0.2,
          training_time_minutes: 3,
          cost_usd: 0.01,
          activated_at: new Date().toISOString(),
          metadata: {
            ...(await getModelMetadata(supabase, modelId)),
            progress: 100,
            current_step: '✅ Entrenamiento completado (simulado)',
            examples_count: examples.length,
            agent_name: agentName,
          },
        })
        .eq('id', modelId);

      console.log(`[train] ✅ Mock training complete: ${modelId}`);
    } else if (provider === 'together') {
      // TODO: Integración con Together AI fine-tuning API
      await supabase
        .from('fine_tuned_models')
        .update({
          status: 'failed',
          metadata: {
            error: 'Together AI integration not yet implemented. Use provider="mock" for testing.',
          },
        })
        .eq('id', modelId);
    }
  } catch (err) {
    console.error(`[train] ❌ Training error for ${modelId}:`, err);
    await supabase
      .from('fine_tuned_models')
      .update({ status: 'failed', metadata: { error: String(err) } })
      .eq('id', modelId);
  }
}

async function getModelMetadata(supabase: any, modelId: string) {
  const { data } = await supabase.from('fine_tuned_models').select('metadata').eq('id', modelId).single();
  return (data?.metadata as Record<string, any>) ?? {};
}

function getStepLabel(step: number): string {
  const labels = [
    'Preparando dataset de entrenamiento...',
    'Aplicando credit-assignment (Orchard-style)...',
    'Iniciando fine-tuning del modelo 4B...',
    'Evaluando calidad del modelo...',
    'Subiendo modelo a producción...',
  ];
  return labels[step - 1] ?? 'Procesando...';
}
