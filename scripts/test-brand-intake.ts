import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { BrandIntakeAgent, type BrandIntakeInput } from '@/agents/brand-intake.agent';
import { AnthropicProvider } from '@/agents/provider-registry';

loadEnv();

const input: BrandIntakeInput = {
  clientName: 'Awake Marketing',
  industry: 'Agencia de marketing digital',
  website: 'https://www.awakemarketing.es',
  socialUrls: { instagram: '@awakemarketing.es' },
  voiceDescription:
    'Cercano, profesional, orientado a resultados. Hablan de tú.',
  audienceDescription:
    'PYMEs y autónomos en España, 30-50 años, quieren crecer en redes',
  competitors: ['Social Mango', 'Hootsuite'],
  goals: [
    'Aumentar seguidores',
    'Generar leads',
    'Posicionarse como referente',
  ],
  pack: 'pro',
};

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY no está seteado. Agregalo a .env.local o exportalo en la shell.',
    );
  }

  const provider = new AnthropicProvider('claude-sonnet-4-20250514');
  const agent = new BrandIntakeAgent(provider);

  console.log('Corriendo Brand Intake Agent...');
  const start = Date.now();
  const profile = await agent.run(input);
  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  console.log(`\nOK — ${elapsed}s\n`);
  console.log(JSON.stringify(profile, null, 2));

  const checks = [
    ['contentPillars.length === 4', profile.contentPillars.length === 4],
    ['voice.tone definido', profile.voice.tone.length > 0],
    ['voice.personality non-empty', profile.voice.personality.length > 0],
    ['audience.painPoints >= 3', profile.audience.painPoints.length >= 3],
  ] as const;

  console.log('\nValidaciones:');
  for (const [name, ok] of checks) {
    console.log(`  ${ok ? 'OK' : 'FAIL'}  ${name}`);
  }
}

function loadEnv(): void {
  const envPath = join(process.cwd(), '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error('\nFALLÓ:', message);
  process.exit(1);
});
