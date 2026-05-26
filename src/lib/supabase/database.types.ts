import type {
  BrandAudience,
  BrandProfile,
  BrandProfileStatus,
  BrandVoice,
  CalendarEntryStatus,
  ContentFormat,
  CopyOutput,
  EditorialCalendarEntry,
  Pack,
  ProviderName,
  StrategyDoc,
  StrategyFormatQuantity,
  StrategyPillarWeight,
  VisualBriefFormat,
  VisualBriefOutput,
  VisualBriefTypography,
  VisualKit,
} from '@/types/brand-profile';
import type {
  ChannelStrategy,
  ContentPillar,
  KPI,
  KPIScenario,
  ScenarioName,
  Strategy,
  StrategyContentMix,
  StrategyObjectives,
  StrategyStatus,
} from '@/types/strategy';
import type {
  AgencyCalendarStatus,
  CalendarPost,
  ClientCalendarStatus,
  EditorialCalendar,
} from '@/types/calendar';
import type {
  CopyAgencyStatus,
  CopywritingProject,
  PostCopy,
} from '@/types/copywriter';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type AgencyRow = {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export type AgencyInsert = {
  id?: string;
  name: string;
  email: string;
  created_at?: string;
}

export type AgencyUpdate = {
  id?: string;
  name?: string;
  email?: string;
  created_at?: string;
}

export type BrandProfileRow = {
  id: string;
  agency_id: string;
  client_name: string;
  industry: string;
  location: string | null;
  website: string | null;
  social_urls: Record<string, string>;
  voice: BrandVoice;
  audience: BrandAudience;
  content_pillars: string[];
  competitors: string[];
  goals: string[];
  visual_kit: VisualKit;
  pack: Pack;
  provider: ProviderName;
  provider_model: string;
  status: BrandProfileStatus;
  created_at: string;
  updated_at: string;
}

export type BrandProfileInsert = {
  id?: string;
  agency_id: string;
  client_name: string;
  industry: string;
  location?: string | null;
  website?: string | null;
  social_urls?: Record<string, string>;
  voice: BrandVoice;
  audience: BrandAudience;
  content_pillars: string[];
  competitors?: string[];
  goals?: string[];
  visual_kit: VisualKit;
  pack: Pack;
  provider: ProviderName;
  provider_model: string;
  status?: BrandProfileStatus;
  created_at?: string;
  updated_at?: string;
}

export type BrandProfileUpdate = Partial<BrandProfileInsert>;

export type StrategyRow = {
  id: string;
  brand_profile_id: string;
  agency_id: string;
  objectives: StrategyObjectives;
  primary_channels: string[];
  channel_strategies: ChannelStrategy[];
  content_pillars: ContentPillar[];
  content_mix: StrategyContentMix;
  current_followers_data: Record<string, number> | null;
  scenario_conservative: KPIScenario | null;
  scenario_sustainable: KPIScenario | null;
  scenario_aggressive: KPIScenario | null;
  selected_scenario: ScenarioName | null;
  kpis: KPI[];
  posting_frequency: Record<string, string>;
  best_posting_times: Record<string, string[]>;
  reasoning: string;
  next_steps: string;
  model_used: string | null;
  elapsed_ms: number | null;
  feedback: string | null;
  status: StrategyStatus;
  created_at: string;
  updated_at: string;
};

export type StrategyInsert = {
  id?: string;
  brand_profile_id: string;
  agency_id: string;
  objectives: StrategyObjectives;
  primary_channels: string[];
  channel_strategies: ChannelStrategy[];
  content_pillars: ContentPillar[];
  content_mix: StrategyContentMix;
  current_followers_data?: Record<string, number> | null;
  scenario_conservative?: KPIScenario | null;
  scenario_sustainable?: KPIScenario | null;
  scenario_aggressive?: KPIScenario | null;
  selected_scenario?: ScenarioName | null;
  kpis: KPI[];
  posting_frequency: Record<string, string>;
  best_posting_times: Record<string, string[]>;
  reasoning: string;
  next_steps: string;
  feedback?: string | null;
  model_used?: string | null;
  elapsed_ms?: number | null;
  status?: StrategyStatus;
  created_at?: string;
  updated_at?: string;
};

export type StrategyUpdate = Partial<StrategyInsert>;

export function dbToStrategy(row: StrategyRow): Strategy {
  return {
    id: row.id,
    brandProfileId: row.brand_profile_id,
    agencyId: row.agency_id,
    objectives: row.objectives,
    primaryChannels: row.primary_channels,
    channelStrategies: row.channel_strategies,
    contentPillars: row.content_pillars,
    contentMix: row.content_mix,
    currentFollowersData: row.current_followers_data,
    scenarioConservative: row.scenario_conservative,
    scenarioSustainable: row.scenario_sustainable,
    scenarioAggressive: row.scenario_aggressive,
    selectedScenario: row.selected_scenario,
    kpis: row.kpis,
    postingFrequency: row.posting_frequency,
    bestPostingTimes: row.best_posting_times,
    reasoning: row.reasoning,
    nextSteps: row.next_steps,
    feedback: row.feedback,
    modelUsed: row.model_used ?? undefined,
    elapsedMs: row.elapsed_ms ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type StrategyDocRow = {
  id: string;
  brand_profile_id: string;
  month: string;
  objective: string;
  monthly_theme: string;
  content_pillars: StrategyPillarWeight[];
  formats: StrategyFormatQuantity[];
  tone_of_month: string;
  key_dates: string[];
  hooks: string[];
  status: BrandProfileStatus;
  created_at: string;
  updated_at: string;
}

export type StrategyDocInsert = {
  id?: string;
  brand_profile_id: string;
  month: string;
  objective: string;
  monthly_theme: string;
  content_pillars: StrategyPillarWeight[];
  formats: StrategyFormatQuantity[];
  tone_of_month: string;
  key_dates?: string[];
  hooks?: string[];
  status?: BrandProfileStatus;
  created_at?: string;
  updated_at?: string;
}

export type StrategyDocUpdate = Partial<StrategyDocInsert>;

export type CalendarEntryRow = {
  id: string;
  brand_profile_id: string;
  month: string;
  date: string;
  format: ContentFormat;
  pillar: string;
  hook: string;
  caption_brief: string;
  status: CalendarEntryStatus;
  created_at: string;
  updated_at: string;
}

export type CalendarEntryInsert = {
  id?: string;
  brand_profile_id: string;
  month: string;
  date: string;
  format: ContentFormat;
  pillar: string;
  hook: string;
  caption_brief: string;
  status?: CalendarEntryStatus;
  created_at?: string;
  updated_at?: string;
}

export type CalendarEntryUpdate = Partial<CalendarEntryInsert>;

export type CopyRow = {
  id: string;
  calendar_entry_id: string;
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  alt_text: string;
  reel_script: string | null;
  version: number;
  status: BrandProfileStatus;
  created_at: string;
  updated_at: string;
}

export type CopyInsert = {
  id?: string;
  calendar_entry_id: string;
  hook: string;
  body: string;
  cta: string;
  hashtags?: string[];
  alt_text: string;
  reel_script?: string | null;
  version?: number;
  status?: BrandProfileStatus;
  created_at?: string;
  updated_at?: string;
}

export type CopyUpdate = Partial<CopyInsert>;

export type VisualBriefRow = {
  id: string;
  calendar_entry_id: string;
  format: VisualBriefFormat;
  palette: string[];
  typography: VisualBriefTypography;
  layout: string;
  mood: string;
  elements: string[];
  canva_template_hint: string;
  status: BrandProfileStatus;
  created_at: string;
  updated_at: string;
}

export type VisualBriefInsert = {
  id?: string;
  calendar_entry_id: string;
  format: VisualBriefFormat;
  palette?: string[];
  typography: VisualBriefTypography;
  layout: string;
  mood: string;
  elements?: string[];
  canva_template_hint: string;
  status?: BrandProfileStatus;
  created_at?: string;
  updated_at?: string;
}

export type VisualBriefUpdate = Partial<VisualBriefInsert>;

export type MonthlyReportRow = {
  id: string;
  brand_profile_id: string;
  month: string;
  pdf_url: string | null;
  metadata: Record<string, Json>;
  status: BrandProfileStatus;
  created_at: string;
  updated_at: string;
}

export type MonthlyReportInsert = {
  id?: string;
  brand_profile_id: string;
  month: string;
  pdf_url?: string | null;
  metadata?: Record<string, Json>;
  status?: BrandProfileStatus;
  created_at?: string;
  updated_at?: string;
}

export type MonthlyReportUpdate = Partial<MonthlyReportInsert>;

export type EditorialCalendarRow = {
  id: string;
  strategy_id: string | null;
  brand_profile_id: string;
  agency_id: string;
  campaign_start: string;
  campaign_end: string;
  posts: CalendarPost[];
  total_posts: number;
  posts_by_channel: Record<string, number>;
  pillar_distribution: Record<string, number>;
  model_used: string | null;
  elapsed_ms: number | null;
  agency_status: AgencyCalendarStatus;
  client_status: ClientCalendarStatus;
  created_at: string;
  updated_at: string;
};

export type EditorialCalendarInsert = {
  id?: string;
  strategy_id?: string | null;
  brand_profile_id: string;
  agency_id: string;
  campaign_start: string;
  campaign_end: string;
  posts: CalendarPost[];
  total_posts: number;
  posts_by_channel: Record<string, number>;
  pillar_distribution: Record<string, number>;
  agency_status?: AgencyCalendarStatus;
  client_status?: ClientCalendarStatus;
  model_used?: string | null;
  elapsed_ms?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type EditorialCalendarUpdate = Partial<EditorialCalendarInsert>;

export function dbToEditorialCalendar(row: EditorialCalendarRow): EditorialCalendar {
  return {
    id: row.id,
    strategyId: row.strategy_id,
    brandProfileId: row.brand_profile_id,
    agencyId: row.agency_id,
    campaignStart: row.campaign_start,
    campaignEnd: row.campaign_end,
    posts: row.posts,
    totalPosts: row.total_posts,
    postsByChannel: row.posts_by_channel,
    pillarDistribution: row.pillar_distribution,
    agencyStatus: row.agency_status,
    clientStatus: row.client_status,
    modelUsed: row.model_used ?? undefined,
    elapsedMs: row.elapsed_ms ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type CopywritingProjectRow = {
  id: string;
  editorial_calendar_id: string;
  brand_profile_id: string;
  agency_id: string;
  copies: PostCopy[];
  agency_status: CopyAgencyStatus;
  model_used: string | null;
  elapsed_ms: number | null;
  created_at: string;
  updated_at: string;
};

export type CopywritingProjectInsert = {
  id?: string;
  editorial_calendar_id: string;
  brand_profile_id: string;
  agency_id: string;
  copies: PostCopy[];
  agency_status?: CopyAgencyStatus;
  model_used?: string | null;
  elapsed_ms?: number | null;
  created_at?: string;
  updated_at?: string;
};

export type CopywritingProjectUpdate = Partial<CopywritingProjectInsert>;

export function dbToCopywritingProject(row: CopywritingProjectRow): CopywritingProject {
  return {
    id: row.id,
    editorialCalendarId: row.editorial_calendar_id,
    brandProfileId: row.brand_profile_id,
    agencyId: row.agency_id,
    copies: row.copies,
    agencyStatus: row.agency_status,
    modelUsed: row.model_used ?? undefined,
    elapsedMs: row.elapsed_ms ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface Database {
  public: {
    Tables: {
      agencies: {
        Row: AgencyRow;
        Insert: AgencyInsert;
        Update: AgencyUpdate;
        Relationships: [];
      };
      brand_profiles: {
        Row: BrandProfileRow;
        Insert: BrandProfileInsert;
        Update: BrandProfileUpdate;
        Relationships: [];
      };
      strategies: {
        Row: StrategyRow;
        Insert: StrategyInsert;
        Update: StrategyUpdate;
        Relationships: [];
      };
      strategy_docs: {
        Row: StrategyDocRow;
        Insert: StrategyDocInsert;
        Update: StrategyDocUpdate;
        Relationships: [];
      };
      editorial_calendars: {
        Row: EditorialCalendarRow;
        Insert: EditorialCalendarInsert;
        Update: EditorialCalendarUpdate;
        Relationships: [];
      };
      copywriting_projects: {
        Row: CopywritingProjectRow;
        Insert: CopywritingProjectInsert;
        Update: CopywritingProjectUpdate;
        Relationships: [];
      };
      calendar_entries: {
        Row: CalendarEntryRow;
        Insert: CalendarEntryInsert;
        Update: CalendarEntryUpdate;
        Relationships: [];
      };
      copies: {
        Row: CopyRow;
        Insert: CopyInsert;
        Update: CopyUpdate;
        Relationships: [];
      };
      visual_briefs: {
        Row: VisualBriefRow;
        Insert: VisualBriefInsert;
        Update: VisualBriefUpdate;
        Relationships: [];
      };
      monthly_reports: {
        Row: MonthlyReportRow;
        Insert: MonthlyReportInsert;
        Update: MonthlyReportUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export function dbToBrandProfile(row: BrandProfileRow): BrandProfile {
  return {
    id: row.id,
    agencyId: row.agency_id,
    clientName: row.client_name,
    industry: row.industry,
    location: row.location ?? undefined,
    website: row.website ?? undefined,
    socialUrls: row.social_urls,
    voice: row.voice,
    audience: row.audience,
    contentPillars: row.content_pillars,
    competitors: row.competitors,
    goals: row.goals,
    visualKit: row.visual_kit,
    pack: row.pack,
    provider: row.provider,
    providerModel: row.provider_model,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function brandProfileToDb(
  profile: Omit<BrandProfile, 'createdAt' | 'updatedAt'>,
): BrandProfileInsert {
  return {
    id: profile.id,
    agency_id: profile.agencyId,
    client_name: profile.clientName,
    industry: profile.industry,
    location: profile.location ?? null,
    website: profile.website ?? null,
    social_urls: profile.socialUrls,
    voice: profile.voice,
    audience: profile.audience,
    content_pillars: profile.contentPillars,
    competitors: profile.competitors,
    goals: profile.goals,
    visual_kit: profile.visualKit,
    pack: profile.pack,
    provider: profile.provider,
    provider_model: profile.providerModel,
    status: profile.status,
  };
}

export function dbToStrategyDoc(row: StrategyDocRow): StrategyDoc {
  return {
    id: row.id,
    brandProfileId: row.brand_profile_id,
    month: row.month,
    objective: row.objective,
    monthlyTheme: row.monthly_theme,
    contentPillars: row.content_pillars,
    formats: row.formats,
    toneOfMonth: row.tone_of_month,
    keyDates: row.key_dates,
    hooks: row.hooks,
    status: row.status,
  };
}

export function dbToCopyOutput(row: CopyRow): CopyOutput {
  return {
    hook: row.hook,
    body: row.body,
    cta: row.cta,
    hashtags: row.hashtags,
    altText: row.alt_text,
    reelScript: row.reel_script ?? undefined,
  };
}

export function dbToVisualBrief(row: VisualBriefRow): VisualBriefOutput {
  return {
    format: row.format,
    palette: row.palette,
    typography: row.typography,
    layout: row.layout,
    mood: row.mood,
    elements: row.elements,
    canvaTemplateHint: row.canva_template_hint,
  };
}

export function dbToCalendarEntry(
  row: CalendarEntryRow,
  copy?: CopyRow,
  visualBrief?: VisualBriefRow,
): EditorialCalendarEntry {
  return {
    id: row.id,
    brandProfileId: row.brand_profile_id,
    month: row.month,
    date: row.date,
    format: row.format,
    pillar: row.pillar,
    hook: row.hook,
    captionBrief: row.caption_brief,
    copy: copy ? dbToCopyOutput(copy) : undefined,
    visualBrief: visualBrief ? dbToVisualBrief(visualBrief) : undefined,
    status: row.status,
  };
}
