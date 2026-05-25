import { z } from 'zod';

export const COPY_CHANNELS = ['Instagram', 'TikTok', 'LinkedIn', 'YouTube', 'Facebook'] as const;
export type CopyChannel = (typeof COPY_CHANNELS)[number];
export type CopyAgencyStatus = 'pending' | 'approved' | 'rejected';

// Zod schema for saving/editing copies (base — also used as PostCopy type source)
export const postCopySaveSchema = z.object({
  calendarPostId: z.string().min(1),
  channel: z.string().min(1),
  hook: z.string().min(1),
  body: z.string().min(1),
  cta: z.string().min(1),
  hashtags: z.string().min(1), // "#tag1 #tag2 ..." joined string
  videoScript: z.string().min(1).optional(),
});

// PostCopy is derived from the save schema so they never drift
export type PostCopy = z.infer<typeof postCopySaveSchema>;

// LLM-output schema extends the save schema with a stricter hook limit
export const postCopyLlmSchema = postCopySaveSchema.extend({
  hook: z.string().min(1).max(300),
});

export const copyBatchLlmSchema = z.object({
  copies: z.array(postCopyLlmSchema).min(1),
});

export type CopyBatchLlmOutput = z.infer<typeof copyBatchLlmSchema>;

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
