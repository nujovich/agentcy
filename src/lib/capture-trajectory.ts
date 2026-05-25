/**
 * Helper para capturar trayectorias desde cualquier API route de agente.
 * Se llama DESPUÉS de que el agente ejecutó exitosamente.
 * No modifica el flujo existente — solo añade la trayectoria.
 */

import { createClient } from './supabase/server';
import type { AgentName } from '@/types/trajectory';

export async function captureAgentTrajectory(params: {
  agencyId: string;
  brandProfileId?: string;
  agentName: AgentName;
  inputData: Record<string, unknown>;
  outputData: Record<string, unknown>;
  elapsedMs: number;
  modelUsed?: string;
  providerUsed?: string;
}): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('trajectories')
      .insert({
        agency_id: params.agencyId,
        brand_profile_id: params.brandProfileId,
        agent_name: params.agentName,
        input_schema: `${params.agentName}-input`,
        input_data: params.inputData,
        output_data: params.outputData,
        elapsed_ms: params.elapsedMs,
        status: 'completed',
        feedback_status: 'pending',
        model_used: params.modelUsed,
        provider_used: params.providerUsed,
      })
      .select('id')
      .single();

    if (error) {
      console.warn(`[trajectory] Failed to capture: ${error.message}`);
      return null;
    }
    return data.id;
  } catch (err) {
    // Nunca debe romper el flujo principal
    console.warn('[trajectory] Capture error (non-fatal):', err);
    return null;
  }
}