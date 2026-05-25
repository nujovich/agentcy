import type { BrandProfile } from './brand-profile';

// ─── Strategy ───────────────────────────────────────────
export interface StrategyDoc {
  id: string;
  brandProfileId: string;
  month: string;
  objective: string;
  monthlyTheme: string;
  contentPillars: { pillar: string; weight: number }[];
  formatMix: { type: 'post' | 'reel' | 'story' | 'carousel'; quantity: number }[];
  contentIdeas: { pillarIndex: number; format: string; headline: string; description: string; keyAngle: string }[];
  kpis: string[];
  createdAt: string;
  updatedAt: string;
}

// ─── Calendar ───────────────────────────────────────────
export interface CalendarEntry {
  id: string;
  brandProfileId: string;
  month: string;
  week: number;
  day: string;
  pillarIndex: number;
  format: 'post' | 'reel' | 'story' | 'carousel';
  headline: string;
  description: string;
  cta: string;
  visualNotes: string;
  status: 'draft' | 'in_review' | 'approved' | 'published';
  createdAt: string;
}

// ─── Copy ───────────────────────────────────────────────
export interface CopyContent {
  id: string;
  calendarEntryId: string;
  brandProfileId: string;
  copy: string;
  visualBrief: string;
  hashtags: string[];
  status: 'draft' | 'in_review' | 'approved';
  createdAt: string;
}

// ─── Brief ──────────────────────────────────────────────
export interface DesignBrief {
  id: string;
  copyId: string;
  brandProfileId: string;
  layout: string;
  colorPalette: string[];
  typography: string;
  references: string[];
  specifications: string;
  status: 'draft' | 'in_review' | 'approved';
  createdAt: string;
}

// ─── Report ─────────────────────────────────────────────
export interface MonthlyReport {
  id: string;
  brandProfileId: string;
  month: string;
  totalPosts: number;
  topPerformers: { headline: string; metric: string; value: string }[];
  pillarAnalysis: { pillar: string; posts: number; engagement: string }[];
  recommendations: string[];
  pdfUrl?: string;
  createdAt: string;
}

// ─── Pipeline Status ────────────────────────────────────
export type AgentName = 'brand-intake' | 'strategy' | 'calendar' | 'copywriter' | 'brief' | 'report';
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStep {
  agent: AgentName;
  label: string;
  description: string;
  status: AgentStatus;
}
