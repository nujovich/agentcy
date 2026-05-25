import { NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Hermes Bridge API
 *
 * Esta API route conecta Agentcy con Hermes Agent para ejecutar skills
 * que requieren acceso a MCP servers, herramientas externas, o pipelines
 * complejos de orquestación.
 *
 * Uso: POST /api/hermes
 * Body: { skill: string, input: Record<string, unknown> }
 *
 * Para activar: configurar HERMES_CLI_PATH en .env.local
 * Ejemplo: HERMES_CLI_PATH=/home/nujovich/.local/bin/hermes
 *
 * Si HERMES_CLI_PATH no está configurado, esta API devuelve 501.
 */

const bodySchema = z.object({
  skill: z.string().min(1),
  input: z.record(z.any()).default({}),
  profile: z.string().optional(),
});

export async function POST(request: Request) {
  const hermesPath = process.env.HERMES_CLI_PATH;
  if (!hermesPath) {
    return NextResponse.json(
      {
        error: 'Hermes Agent not configured',
        message:
          'Set HERMES_CLI_PATH in .env.local to enable Hermes integration. ' +
          'Without it, Agentcy runs agents directly via AI SDK.',
      },
      { status: 501 }
    );
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
      { status: 400 }
    );
  }

  const { skill, input, profile } = parsed.data;

  try {
    const { execSync } = await import('child_process');

    const profileFlag = profile ? `-p ${profile}` : '';
    const query = `Ejecutá el skill "${skill}" y procesá esta entrada: ${JSON.stringify(input)}. Respondé SOLO con JSON válido.`;

    const command = `${hermesPath} chat -q ${JSON.stringify(query)} ${profileFlag} --skills ${skill} 2>/dev/null`;

    const output = execSync(command, {
      timeout: 120_000,
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });

    // Try to extract JSON from the output
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json({ result, raw: output.slice(0, 500) });
    }

    return NextResponse.json({ result: output.trim() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Hermes error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
