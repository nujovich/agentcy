import { NextResponse } from 'next/server';
import { z } from 'zod';

import { BrandIntakeAgent } from '@/agents/brand-intake.agent';
import { createProvider } from '@/agents/provider-registry';
import { createClient } from '@/lib/supabase/server';

const bodySchema = z.object({
  clientName: z.string().min(1),
  industry: z.string().min(1),
  website: z.string().optional(),
  socialUrls: z.record(z.string(), z.string()),
  voiceDescription: z.string().min(1),
  audienceDescription: z.string().min(1),
  competitors: z.array(z.string()),
  goals: z.array(z.string()),
  pack: z.enum(['esencial', 'gold', 'pro', 'elite']),
  provider: z.enum(['anthropic', 'openai', 'google']),
  providerModel: z.string().min(1),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid input', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { provider: providerName, providerModel, ...input } = parsed.data;
  const provider = createProvider(providerName, providerModel);
  const agent = new BrandIntakeAgent(provider);

  try {
    const profile = await agent.run(input);
    return NextResponse.json({ profile, provider: providerName, providerModel });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown agent error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
