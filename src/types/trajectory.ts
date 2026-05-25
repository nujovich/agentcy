// Tipos para el Data Flywheel (trayectorias, datasets, fine-tuning)

export type AgentName = 'brand-intake' | 'strategy' | 'calendar' | 'copywriter' | 'brief' | 'report';
export type TrajectoryStatus = 'pending' | 'running' | 'completed' | 'failed';
export type FeedbackStatus = 'pending' | 'approved' | 'rejected' | 'edited';
export type DatasetStatus = 'building' | 'ready' | 'training' | 'trained' | 'failed';
export type ModelStatus = 'training' | 'active' | 'archived' | 'failed';

// ─── Trajectory ────────────────────────────────────────
export interface Trajectory {
  id: string;
  agencyId: string;
  brandProfileId?: string;
  agentName: AgentName;
  status: TrajectoryStatus;

  inputSchema: string;
  inputData: Record<string, unknown>;

  outputData?: Record<string, unknown>;
  outputTokens?: number;
  elapsedMs?: number;

  feedbackStatus: FeedbackStatus;
  feedbackEditedOutput?: Record<string, unknown>;
  feedbackAt?: string;
  feedbackNotes?: string;

  modelUsed?: string;
  providerUsed?: string;
  trajectoryVersion: number;
  parentTrajectoryId?: string;

  createdAt: string;
  updatedAt: string;
}

// ─── Trajectory Segment (credit-assignment) ────────────
export interface TrajectorySegment {
  id: string;
  trajectoryId: string;
  segmentIndex: number;
  segmentType: 'thought' | 'action' | 'observation' | 'output_part';
  content: string;
  isProductive: boolean;
  userRating?: number;
  createdAt: string;
}

// ─── Training Dataset ──────────────────────────────────
export interface TrainingDataset {
  id: string;
  agencyId: string;
  name: string;
  description?: string;
  agentName: AgentName;
  minTrajectories: number;
  trajectoryCount: number;
  status: DatasetStatus;
  modelBase: string;
  modelFineTuned?: string;
  trainingCostUsd?: number;
  metricsBefore?: Record<string, number>;
  metricsAfter?: Record<string, number>;
  trainedAt?: string;
  createdAt: string;
}

// ─── Fine-Tuned Model ──────────────────────────────────
export interface FineTunedModel {
  id: string;
  agencyId: string;
  datasetId?: string;
  agentName: AgentName;
  modelName: string;
  modelVersion: number;
  baseModel: string;
  huggingfaceId?: string;
  status: ModelStatus;
  qualityScore?: number;
  trajectoryCount?: number;
  trainingTimeMinutes?: number;
  costUsd?: number;
  createdAt: string;
  activatedAt?: string;
  lastUsedAt?: string;
}

// ─── Create/Update types ───────────────────────────────
export interface CreateTrajectoryInput {
  agencyId: string;
  brandProfileId?: string;
  agentName: AgentName;
  inputSchema: string;
  inputData: Record<string, unknown>;
  modelUsed?: string;
  providerUsed?: string;
}

export interface CompleteTrajectoryInput {
  id: string;
  outputData: Record<string, unknown>;
  outputTokens?: number;
  elapsedMs: number;
  status: TrajectoryStatus;
}

export interface FeedbackTrajectoryInput {
  id: string;
  feedbackStatus: FeedbackStatus;
  feedbackEditedOutput?: Record<string, unknown>;
  feedbackNotes?: string;
}

export interface SegmentInput {
  trajectoryId: string;
  segmentIndex: number;
  segmentType: 'thought' | 'action' | 'observation' | 'output_part';
  content: string;
  isProductive?: boolean;
}

// ─── Orchard-style Dataset Builder ─────────────────────
export interface DatasetBuilderConfig {
  agencyId: string;
  agentName: AgentName;
  minTrajectories?: number;
  includeRejected?: boolean;      // incluir trayectorias rechazadas?
  creditAssignment?: boolean;     // usar credit-assignment?
  onlyProductiveSegments?: boolean; // solo segmentos productivos?
}

export interface TrainingExample {
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  segments?: { productive: string[]; nonProductive: string[] };
  metadata: {
    trajectoryId: string;
    agentName: AgentName;
    feedbackStatus: FeedbackStatus;
    score?: number;
  };
}