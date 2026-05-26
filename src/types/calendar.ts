export type CalendarChannel = string;
export type CalendarFormat = string;
export type CalendarContentType = 'image' | 'video' | 'text' | 'mixed';
export type AgencyCalendarStatus = 'generating' | 'pending' | 'approved' | 'rejected' | 'failed';
export type ClientCalendarStatus = 'not_shared' | 'pending' | 'approved' | 'rejected';

export interface CalendarPost {
  id: string;
  date: string;
  time: string;
  channel: CalendarChannel;
  format: CalendarFormat;
  pillar: string;
  theme: string;
  contentType: CalendarContentType;
  headline: string;
  description: string;
  hashtagsHint: string;
  cta: string;
  notes?: string;
}

export interface EditorialCalendar {
  id: string;
  strategyId: string | null;
  brandProfileId: string;
  agencyId: string;
  campaignStart: string;  // YYYY-MM-DD
  campaignEnd: string;    // YYYY-MM-DD
  posts: CalendarPost[];
  totalPosts: number;
  postsByChannel: Record<string, number>;
  pillarDistribution: Record<string, number>;
  agencyStatus: AgencyCalendarStatus;
  clientStatus: ClientCalendarStatus;
  createdAt: string;
  updatedAt: string;
}
