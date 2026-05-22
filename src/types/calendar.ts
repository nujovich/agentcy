export type CalendarChannel = 'Instagram' | 'TikTok' | 'LinkedIn' | 'YouTube' | 'Facebook';
export type CalendarFormat = 'Carousel' | 'Reel' | 'Story' | 'Post' | 'Video' | 'Shorts';
export type CalendarContentType = 'image' | 'video' | 'text' | 'mixed';
export type CalendarStatus = 'pending' | 'approved' | 'rejected';

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
  month: string;
  year: number;
  posts: CalendarPost[];
  totalPosts: number;
  postsByChannel: Record<string, number>;
  pillarDistribution: Record<string, number>;
  status: CalendarStatus;
  createdAt: string;
  updatedAt: string;
}
