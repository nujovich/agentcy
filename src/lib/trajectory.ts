/**
 * Trajectory Service — Data Flywheel Core
 *
 * Captura cada interacción con los agentes como una "trayectoria"
 * estructurada, lista para ser usada en fine-tuning estilo Orchard.
 *
 * Uso típico:
 *   const trajId = await startTrajectory({ agencyId, agentName, inputData, ... });
 *   // ... ejecutar el agente ...
 *   await completeTrajectory({ id: trajId, outputData, elapsedMs, ... });
 *   // ... usuario aprueba/rechaza/edita ...
 *   await feedbackTrajectory({ id: trajId, feedbackStatus: 'approved' });
 */

import { createClient } from './supabase/server';
import type {
  AgentName,
  CreateTrajectoryInput,
  CompleteTrajectoryInput,
  FeedbackTrajectoryInput,
  SegmentInput,
  DatasetBuilderConfig,
  TrainingExample,
} from '@/types/trajectory';

// ─── CREATE ────────────────────────────────────────────
export async function startTrajectory(input: CreateTrajectoryInput): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('trajectories')
    .insert({
      agency_id: input.agencyId,
      brand_profile_id: input.brandProfileId,
      agent_name: input.agentName,
      input_schema: input.inputSchema,
      input_data: input.inputData,
      model_used: input.modelUsed,
      provider_used: input.providerUsed,
      status: 'running',
      feedback_status: 'pending',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create trajectory: ${error.message}`);
  return data.id;
}

// ─── UPDATE (completar) ────────────────────────────────
export async function completeTrajectory(input: CompleteTrajectoryInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('trajectories')
    .update({
      output_data: input.outputData,
      output_tokens: input.outputTokens,
      elapsed_ms: input.elapsedMs,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (error) throw new Error(`Failed to complete trajectory: ${error.message}`);
}

// ─── FEEDBACK (aprobación/rechazo/edición) ─────────────
export async function feedbackTrajectory(input: FeedbackTrajectoryInput): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('trajectories')
    .update({
      feedback_status: input.feedbackStatus,
      feedback_edited_output: input.feedbackEditedOutput,
      feedback_notes: input.feedbackNotes,
      feedback_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.id);

  if (error) throw new Error(`Failed to update feedback: ${error.message}`);
}

// ─── ADD SEGMENTS (credit-assignment) ──────────────────
export async function addSegments(segments: SegmentInput[]): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('trajectory_segments').insert(
    segments.map((s) => ({
      trajectory_id: s.trajectoryId,
      segment_index: s.segmentIndex,
      segment_type: s.segmentType,
      content: s.content,
      is_productive: s.isProductive ?? true,
    }))
  );

  if (error) throw new Error(`Failed to add segments: ${error.message}`);
}

// ─── QUERY ─────────────────────────────────────────────
export async function getTrajectories(agencyId: string, options?: {
  agentName?: AgentName;
  feedbackStatus?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from('trajectories')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (options?.agentName) query = query.eq('agent_name', options.agentName);
  if (options?.feedbackStatus) query = query.eq('feedback_status', options.feedbackStatus);
  if (options?.limit) query = query.limit(options.limit);
  if (options?.offset) query = query.range(options.offset, options.offset + (options.limit ?? 50) - 1);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to query trajectories: ${error.message}`);
  return data;
}

export async function getTrajectoryStats(agencyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_trajectory_stats', { p_agency_id: agencyId });
  if (error) {
    // Fallback: compute stats manually
    const trajectories = await getTrajectories(agencyId, { limit: 1000 });
    const total = trajectories.length;
    const byAgent = {} as Record<string, number>;
    const byFeedback = {} as Record<string, number>;
    let approved = 0, rejected = 0, edited = 0;

    for (const t of trajectories) {
      byAgent[t.agent_name] = (byAgent[t.agent_name] ?? 0) + 1;
      byFeedback[t.feedback_status] = (byFeedback[t.feedback_status] ?? 0) + 1;
      if (t.feedback_status === 'approved') approved++;
      else if (t.feedback_status === 'rejected') rejected++;
      else if (t.feedback_status === 'edited') edited++;
    }

    return { total, byAgent, byFeedback, approved, rejected, edited };
  }
  return data;
}

// ─── DATASET BUILDER (Orchard-style) ───────────────────
export async function buildDataset(config: DatasetBuilderConfig): Promise<{
  examples: TrainingExample[];
  stats: { total: number; approved: number; rejected: number; pending: number };
}> {
  const supabase = await createClient();

  let query = supabase
    .from('trajectories')
    .select('*, trajectory_segments(*)')
    .eq('agency_id', config.agencyId)
    .eq('agent_name', config.agentName)
    .order('created_at', { ascending: false });

  if (!config.includeRejected) {
    query = query.in('feedback_status', ['approved', 'edited', 'pending']);
  }

  const { data: trajectories, error } = await query;
  if (error) throw new Error(`Failed to build dataset: ${error.message}`);

  const examples: TrainingExample[] = [];
  const stats = { total: 0, approved: 0, rejected: 0, pending: 0 };

  for (const t of (trajectories ?? [])) {
    stats.total++;
    if (t.feedback_status === 'approved') stats.approved++;
    else if (t.feedback_status === 'rejected') stats.rejected++;
    else stats.pending++;

    // Skip trajectories without output
    if (!t.output_data) continue;

    // Use edited output if available (user corrections = better signal)
    const output = t.feedback_edited_output ?? t.output_data;

    let productive: string[] = [];
    let nonProductive: string[] = [];

    if (config.creditAssignment && t.trajectory_segments) {
      for (const seg of (t.trajectory_segments ?? [])) {
        if (seg.is_productive) {
          productive.push(seg.content);
        } else {
          nonProductive.push(seg.content);
        }
      }
    }

    // Incluir solo segmentos productivos si está configurado
    if (config.onlyProductiveSegments && productive.length === 0 && nonProductive.length > 0) {
      continue; // saltar trayectorias sin segmentos productivos
    }

    examples.push({
      input: t.input_data,
      output,
      segments: config.creditAssignment ? { productive, nonProductive } : undefined,
      metadata: {
        trajectoryId: t.id,
        agentName: t.agent_name,
        feedbackStatus: t.feedback_status,
        score: t.feedback_status === 'approved' ? 1
             : t.feedback_status === 'edited' ? 0.7
             : t.feedback_status === 'pending' ? 0.3
             : 0,
      },
    });
  }

  return { examples, stats };
}

// ─── TRAINING DATASET (persistir en DB) ────────────────
export async function saveTrainingDataset(params: {
  agencyId: string;
  name: string;
  description?: string;
  agentName: AgentName;
  trajectoryCount: number;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('training_datasets')
    .insert({
      agency_id: params.agencyId,
      name: params.name,
      description: params.description,
      agent_name: params.agentName,
      trajectory_count: params.trajectoryCount,
      status: 'ready',
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to save dataset: ${error.message}`);
  return data.id;
}

// ─── DASHBOARD STATS ───────────────────────────────────
export async function getDatasetDashboardStats(agencyId: string) {
  const supabase = await createClient();
  const { data: datasets, error } = await supabase
    .from('training_datasets')
    .select('*')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to get datasets: ${error.message}`);

  const { data: models } = await supabase
    .from('fine_tuned_models')
    .select('*')
    .eq('agency_id', agencyId)
    .eq('status', 'active');

  return {
    datasets: datasets ?? [],
    activeModels: models ?? [],
    totalDatasets: (datasets ?? []).length,
    totalActiveModels: (models ?? []).length,
  };
}