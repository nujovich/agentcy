import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  BRAND_INTAKE_CHAT_FIRST_MESSAGE,
  BRAND_INTAKE_CHAT_SYSTEM_PROMPT,
} from '@/agents/prompts/brand-intake-chat.prompt';
import { createProvider } from '@/agents/provider-registry';
import { createClient } from '@/lib/supabase/server';
import type { ChatMessage } from '@/types/brand-intake';

const bodySchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    }),
  ),
  extractedProfile: z.record(z.string(), z.unknown()).optional().default({}),
});

const fieldUpdateSchema = z.object({
  field: z.string(),
  value: z.unknown(),
});

function serializeMessages(messages: ChatMessage[]): string {
  return messages
    .map((m) => `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${m.content}`)
    .join('\n\n');
}

function applyFieldUpdate(
  profile: Record<string, unknown>,
  field: string,
  value: unknown,
): Record<string, unknown> {
  const parts = field.split('.');
  if (parts.length === 1) {
    return { ...profile, [field]: value };
  }
  // Nested field like socialMedia.instagram
  const [parent, child] = parts;
  const rawParent = profile[parent];
  const parentObj: Record<string, unknown> =
    rawParent !== null && typeof rawParent === 'object' && !Array.isArray(rawParent)
      ? (rawParent as Record<string, unknown>)
      : {};
  return {
    ...profile,
    [parent]: { ...parentObj, [child]: value },
  };
}

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

  const { messages, extractedProfile } = parsed.data;

  // Handle first message: return greeting without calling the LLM
  if (messages.length === 0) {
    return NextResponse.json({
      response: BRAND_INTAKE_CHAT_FIRST_MESSAGE,
      extractedProfile: {},
      isComplete: false,
    });
  }

  const provider = createProvider('anthropic', 'claude-sonnet-4-6');

  const userPrompt = `
HISTORIAL DE CONVERSACIÓN:
${serializeMessages(messages)}

PERFIL EXTRAÍDO HASTA AHORA:
${JSON.stringify(extractedProfile, null, 2)}

Generá tu siguiente mensaje para el usuario. Recordá incluir el JSON de extracción si hay valores nuevos.
`;

  let text: string;
  try {
    const result = await provider.generateText({
      system: BRAND_INTAKE_CHAT_SYSTEM_PROMPT,
      prompt: userPrompt,
      maxTokens: 500,
      temperature: 0.5,
    });
    text = result.text;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown agent error';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const isComplete = text.includes('✓ Perfil listo para guardar');

  // Extract the JSON field+value update from the response
  const jsonMatch = text.match(/\{"field":\s*"[^"]+",\s*"value":\s*[\s\S]*?\}/);

  let updatedProfile = extractedProfile;

  if (jsonMatch) {
    let jsonRaw: unknown;
    try {
      jsonRaw = JSON.parse(jsonMatch[0]);
    } catch {
      jsonRaw = null;
    }

    if (jsonRaw !== null) {
      const fieldParsed = fieldUpdateSchema.safeParse(jsonRaw);
      if (fieldParsed.success) {
        updatedProfile = applyFieldUpdate(
          extractedProfile,
          fieldParsed.data.field,
          fieldParsed.data.value,
        );
      }
    }
  }

  return NextResponse.json({
    response: text,
    extractedProfile: updatedProfile,
    isComplete,
  });
}
