// Types for Brand Intake Builder (URL Scraping and Chat flows)
// The full BrandProfile type lives in src/types/brand-profile.ts

export interface SimpleBrandProfile {
  clientName: string;
  industry: string;
  website: string;
  toneOfVoice: string;
  targetAudience: string;
  mainServices: string;
  socialMedia: {
    instagram?: string;
    linkedin?: string;
    tiktok?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
  };
  contentPillars: string[];
  competitors?: string[];
  goals?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ConversationState {
  messages: ChatMessage[];
  extractedProfile: Partial<SimpleBrandProfile>;
  isComplete: boolean;
}

export interface URLScrapingResult {
  content: string;
  socialMedia: Record<string, string>;
  industry: string;
  services: string[];
  toneHints: string[];
}
