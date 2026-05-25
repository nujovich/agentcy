import { z } from 'zod';

export type CopyChannel = 'Instagram' | 'TikTok' | 'LinkedIn' | 'YouTube' | 'Facebook';
export type CopyAgencyStatus = 'pending' | 'approved' | 'rejected';

export interface PostCopy {
  calendarPostId: string;
  channel: CopyChannel;
  hook: string;
  body: string;
  cta: string;
  hashtags: string;
  videoScript?: string;
}

export interface CopywritingProject {
  id: string;
  editorialCalendarId: string;
  brandProfileId: string;
  agencyId: string;
  copies: PostCopy[];
  agencyStatus: CopyAgencyStatus;
  createdAt: string;
  updatedAt: string;
}

// Zod schema for validating LLM output (used in agent + generate API)
export const postCopyLlmSchema = z.object({
  calendarPostId: z.string().min(1),
  channel: z.enum(['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook']),
  hook: z.string().min(1).max(300),
  body: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.string().min(1),
  videoScript: z.string().optional(),
});

export const copyBatchLlmSchema = z.object({
  copies: z.array(postCopyLlmSchema).min(1),
});

export type CopyBatchLlmOutput = z.infer<typeof copyBatchLlmSchema>;

// Zod schema for validating saved copies (used in update API body)
export const postCopySaveSchema = z.object({
  calendarPostId: z.string().min(1),
  channel: z.enum(['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook']),
  hook: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.string().min(1),
  videoScript: z.string().optional(),
});
