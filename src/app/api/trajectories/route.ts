import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import {
  startTrajectory,
  completeTrajectory,
  feedbackTrajectory,
  getTrajectories,
} from '@/lib/trajectory';

const createSchema = z.object({
  brandProfileId: z.string().uuid().optional(),
  agentName: z.enum(['brand-intake','strategy','calendar','copywriter','brief','report']),
  inputSchema: z.string().min(1),
  inputData: z.record(z.any()),
  modelUsed: z.string().optional(),
  providerUsed: z.string().optional(),
});

const completeSchema = z.object({
  id: z.string().uuid(),
  outputData: z.record(z.any()),
  outputTokens: z.number().int().optional(),
  elapsedMs: z.number().int(),
  status: z.enum(['completed','failed']),
});

const feedbackSchema = z.object({
  id: z.string().uuid(),
  feedbackStatus: z.enum(['approved','rejected','edited']),
  feedbackEditedOutput: z.record(z.any()).optional(),
  feedbackNotes: z.string().optional(),
});

// POST /api/trajectories - create + complete + feedback (multi-action)
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action = body._action as string;

  try {
    switch (action) {
      case 'start': {
        const parsed = createSchema.parse(body);
        const id = await startTrajectory({
          agencyId: user.id,
          ...parsed,
        });
        return NextResponse.json({ id });
      }

      case 'complete': {
        const parsed = completeSchema.parse(body);
        await completeTrajectory(parsed);
        return NextResponse.json({ ok: true });
      }

      case 'feedback': {
        const parsed = feedbackSchema.parse(body);
        await feedbackTrajectory(parsed);
        return NextResponse.json({ ok: true });
      }

      case 'start-complete': {
        // Atomically start and complete (for simple agents)
        const createParsed = createSchema.parse(body);
        const id = await startTrajectory({
          agencyId: user.id,
          ...createParsed,
        });
        await completeTrajectory({
          id,
          outputData: body.outputData ?? {},
          elapsedMs: body.elapsedMs ?? 0,
          status: body.status ?? 'completed',
        });
        return NextResponse.json({ id });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/trajectories
export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const agentName = url.searchParams.get('agent') ?? undefined;
  const feedbackStatus = url.searchParams.get('feedback') ?? undefined;
  const limit = parseInt(url.searchParams.get('limit') ?? '50');
  const offset = parseInt(url.searchParams.get('offset') ?? '0');

  const data = await getTrajectories(user.id, {
    agentName: agentName as any,
    feedbackStatus,
    limit,
    offset,
  });

  return NextResponse.json(data);
}