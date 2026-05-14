export type ProviderName = 'anthropic' | 'openai' | 'google';

export type Pack = 'esencial' | 'gold' | 'pro' | 'elite';

export type BrandProfileStatus = 'draft' | 'approved';

export type ContentFormat = 'post' | 'reel' | 'story' | 'carousel';

export type CalendarEntryStatus = 'draft' | 'in_review' | 'approved' | 'published';

export interface BrandVoice {
  tone: string;
  personality: string[];
  avoidWords: string[];
  referenceAccounts?: string[];
}

export interface BrandAudience {
  ageRange: string;
  interests: string[];
  painPoints: string[];
  location: string;
}

export interface VisualKit {
  primaryColors: string[];
  secondaryColors: string[];
  fonts: string[];
  style: string;
}

export interface BrandProfile {
  id: string;
  agencyId: string;
  clientName: string;
  industry: string;
  location?: string;
  website?: string;
  socialUrls: Record<string, string>;
  voice: BrandVoice;
  audience: BrandAudience;
  contentPillars: string[];
  competitors: string[];
  goals: string[];
  visualKit: VisualKit;
  pack: Pack;
  provider: ProviderName;
  providerModel: string;
  status: BrandProfileStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StrategyPillarWeight {
  pillar: string;
  weight: number;
}

export interface StrategyFormatQuantity {
  type: ContentFormat;
  quantity: number;
}

export interface StrategyDoc {
  id: string;
  brandProfileId: string;
  month: string;
  objective: string;
  monthlyTheme: string;
  contentPillars: StrategyPillarWeight[];
  formats: StrategyFormatQuantity[];
  toneOfMonth: string;
  keyDates: string[];
  hooks: string[];
  status: BrandProfileStatus;
}

export interface CopyOutput {
  hook: string;
  body: string;
  cta: string;
  hashtags: string[];
  altText: string;
  reelScript?: string;
}

export interface VisualBriefFormat {
  width: number;
  height: number;
  orientation: string;
}

export interface VisualBriefTypography {
  headline: string;
  body: string;
  accent?: string;
}

export interface VisualBriefOutput {
  format: VisualBriefFormat;
  palette: string[];
  typography: VisualBriefTypography;
  layout: string;
  mood: string;
  elements: string[];
  canvaTemplateHint: string;
}

export interface EditorialCalendarEntry {
  id: string;
  brandProfileId: string;
  month: string;
  date: string;
  format: ContentFormat;
  pillar: string;
  hook: string;
  captionBrief: string;
  copy?: CopyOutput;
  visualBrief?: VisualBriefOutput;
  status: CalendarEntryStatus;
}
