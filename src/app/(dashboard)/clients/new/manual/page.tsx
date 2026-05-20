'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { BrandProfileAgentOutput } from '@/agents/brand-intake.agent';
import { ApprovalPanel, type ApprovalStatus } from '@/components/agents/approval-panel';
import { Button } from '@/components/ui/button';
import { brandProfileToDb } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/client';
import type { Pack, ProviderName } from '@/types/brand-profile';

interface ProviderOption {
  value: ProviderName;
  model: string;
  label: string;
}

const PROVIDER_OPTIONS: ProviderOption[] = [
  { value: 'anthropic', model: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6' },
  { value: 'openai', model: 'gpt-4o', label: 'GPT-4o' },
  { value: 'google', model: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
];

const PACKS: { value: Pack; label: string }[] = [
  { value: 'esencial', label: 'Esencial' },
  { value: 'gold', label: 'Gold' },
  { value: 'pro', label: 'Pro' },
  { value: 'elite', label: 'Elite' },
];

const TONES = ['cercano', 'profesional', 'humorístico', 'inspirador'];
const PERSONALITY_OPTIONS = [
  'cercano',
  'experto',
  'irónico',
  'optimista',
  'sereno',
  'rebelde',
  'cálido',
  'minimalista',
];
const STYLES = [
  'minimalista editorial',
  'brutalista urbano',
  'ilustrativo orgánico',
  'fotográfico documental',
  'tipográfico bold',
];

interface FormState {
  clientName: string;
  industry: string;
  website: string;
  instagram: string;
  tiktok: string;
  linkedin: string;
  pack: Pack;

  ageRange: string;
  interests: string;
  painPoints: string;
  location: string;

  tone: string;
  personality: string[];
  avoidWords: string;
  referenceAccounts: string;

  primaryColors: string;
  secondaryColors: string;
  fonts: string;
  style: string;

  competitors: string;
  goals: string;

  provider: ProviderName;
  providerModel: string;
}

const INITIAL_FORM: FormState = {
  clientName: '',
  industry: '',
  website: '',
  instagram: '',
  tiktok: '',
  linkedin: '',
  pack: 'esencial',
  ageRange: '',
  interests: '',
  painPoints: '',
  location: '',
  tone: 'cercano',
  personality: [],
  avoidWords: '',
  referenceAccounts: '',
  primaryColors: '',
  secondaryColors: '',
  fonts: '',
  style: STYLES[0],
  competitors: '',
  goals: '',
  provider: 'anthropic',
  providerModel: 'claude-sonnet-4-6',
};

function csvToArray(s: string): string[] {
  return s
    .split(',')
    .map((x) => x.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: string[]): string {
  return arr.join(', ');
}

function buildSocialUrls(f: FormState): Record<string, string> {
  const map: Record<string, string> = {};
  if (f.instagram) map.instagram = f.instagram;
  if (f.tiktok) map.tiktok = f.tiktok;
  if (f.linkedin) map.linkedin = f.linkedin;
  return map;
}

function buildVoiceDescription(f: FormState): string {
  return [
    `Tono base: ${f.tone}.`,
    f.personality.length ? `Personalidad: ${f.personality.join(', ')}.` : '',
    f.avoidWords ? `Evita: ${f.avoidWords}.` : '',
    f.referenceAccounts ? `Cuentas de referencia: ${f.referenceAccounts}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function buildAudienceDescription(f: FormState): string {
  return [
    f.ageRange ? `Edad: ${f.ageRange}.` : '',
    f.interests ? `Intereses: ${f.interests}.` : '',
    f.painPoints ? `Pain points: ${f.painPoints}.` : '',
    f.location ? `Ubicación: ${f.location}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [output, setOutput] = useState<BrandProfileAgentOutput | null>(null);
  const [status, setStatus] = useState<ApprovalStatus>('draft');
  const [isLoading, setIsLoading] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const togglePersonality = (trait: string) => {
    setForm((prev) => ({
      ...prev,
      personality: prev.personality.includes(trait)
        ? prev.personality.filter((t) => t !== trait)
        : [...prev.personality, trait],
    }));
  };

  const runAgent = async () => {
    setError(null);
    setIsLoading(true);
    setStatus('draft');
    try {
      const res = await fetch('/api/agents/brand-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: form.clientName,
          industry: form.industry,
          website: form.website || undefined,
          socialUrls: buildSocialUrls(form),
          voiceDescription: buildVoiceDescription(form),
          audienceDescription: buildAudienceDescription(form),
          competitors: csvToArray(form.competitors),
          goals: csvToArray(form.goals),
          pack: form.pack,
          provider: form.provider,
          providerModel: form.providerModel,
        }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const message =
          typeof json === 'object' && json && 'error' in json
            ? String((json as { error: unknown }).error)
            : 'Error desconocido';
        throw new Error(message);
      }
      const data = json as { profile: BrandProfileAgentOutput };
      setOutput(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  const approve = async () => {
    if (!output) return;
    setError(null);
    setIsApproving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No hay sesión activa');
      }

      const payload = brandProfileToDb({
        id: crypto.randomUUID(),
        agencyId: user.id,
        clientName: output.clientName,
        industry: output.industry,
        location: output.location,
        website: output.website,
        socialUrls: output.socialUrls,
        voice: output.voice,
        audience: output.audience,
        contentPillars: output.contentPillars,
        competitors: output.competitors,
        goals: output.goals,
        visualKit: output.visualKit,
        pack: output.pack,
        provider: form.provider,
        providerModel: form.providerModel,
        status: 'approved',
      });

      const { data, error: dbError } = await supabase
        .from('brand_profiles')
        .insert(payload)
        .select('id')
        .single();
      if (dbError) throw new Error(dbError.message);

      setStatus('approved');
      router.push(`/clients/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando');
    } finally {
      setIsApproving(false);
    }
  };

  if (output) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <ApprovalPanel
          title="Brand Profile generado"
          description="Revisá y editá los campos antes de aprobar."
          status={status}
          isApproving={isApproving}
          isRegenerating={isLoading}
          onApprove={approve}
          onRegenerate={runAgent}
          approveLabel="Aprobar Brand Profile"
        >
          <EditableOutput value={output} onChange={setOutput} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </ApprovalPanel>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">Paso {step} de 5</p>
      </header>

      {step === 1 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Datos básicos</h2>
          <Field label="Nombre del cliente">
            <input
              className="input"
              value={form.clientName}
              onChange={(e) => update('clientName', e.target.value)}
            />
          </Field>
          <Field label="Industria">
            <input
              className="input"
              value={form.industry}
              onChange={(e) => update('industry', e.target.value)}
            />
          </Field>
          <Field label="Website">
            <input
              className="input"
              value={form.website}
              onChange={(e) => update('website', e.target.value)}
              placeholder="https://..."
            />
          </Field>
          <Field label="Instagram">
            <input
              className="input"
              value={form.instagram}
              onChange={(e) => update('instagram', e.target.value)}
            />
          </Field>
          <Field label="TikTok">
            <input
              className="input"
              value={form.tiktok}
              onChange={(e) => update('tiktok', e.target.value)}
            />
          </Field>
          <Field label="LinkedIn">
            <input
              className="input"
              value={form.linkedin}
              onChange={(e) => update('linkedin', e.target.value)}
            />
          </Field>
          <Field label="Pack contratado">
            <select
              className="input"
              value={form.pack}
              onChange={(e) => update('pack', e.target.value as Pack)}
            >
              {PACKS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </Field>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Audiencia</h2>
          <Field label="Rango de edad">
            <input
              className="input"
              value={form.ageRange}
              onChange={(e) => update('ageRange', e.target.value)}
              placeholder="25-35"
            />
          </Field>
          <Field label="Intereses (separados por coma)">
            <input
              className="input"
              value={form.interests}
              onChange={(e) => update('interests', e.target.value)}
            />
          </Field>
          <Field label="Pain points (separados por coma)">
            <textarea
              className="input min-h-24"
              value={form.painPoints}
              onChange={(e) => update('painPoints', e.target.value)}
            />
          </Field>
          <Field label="Ubicación">
            <input
              className="input"
              value={form.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Voz de marca</h2>
          <Field label="Tono">
            <select
              className="input"
              value={form.tone}
              onChange={(e) => update('tone', e.target.value)}
            >
              {TONES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Personalidad (elegí varias)">
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map((trait) => {
                const active = form.personality.includes(trait);
                return (
                  <button
                    key={trait}
                    type="button"
                    onClick={() => togglePersonality(trait)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background'
                    }`}
                  >
                    {trait}
                  </button>
                );
              })}
            </div>
          </Field>
          <Field label="Palabras a evitar (separadas por coma)">
            <input
              className="input"
              value={form.avoidWords}
              onChange={(e) => update('avoidWords', e.target.value)}
            />
          </Field>
          <Field label="Cuentas de referencia (separadas por coma)">
            <input
              className="input"
              value={form.referenceAccounts}
              onChange={(e) => update('referenceAccounts', e.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Kit visual</h2>
          <Field label="Colores primarios (HEX, separados por coma)">
            <input
              className="input"
              value={form.primaryColors}
              onChange={(e) => update('primaryColors', e.target.value)}
              placeholder="#1A1A1A, #FF6B35"
            />
            <ColorSwatches value={form.primaryColors} />
          </Field>
          <Field label="Colores secundarios (HEX, separados por coma)">
            <input
              className="input"
              value={form.secondaryColors}
              onChange={(e) => update('secondaryColors', e.target.value)}
            />
            <ColorSwatches value={form.secondaryColors} />
          </Field>
          <Field label="Tipografías (separadas por coma)">
            <input
              className="input"
              value={form.fonts}
              onChange={(e) => update('fonts', e.target.value)}
            />
          </Field>
          <Field label="Estilo visual">
            <select
              className="input"
              value={form.style}
              onChange={(e) => update('style', e.target.value)}
            >
              {STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Competencia (separada por coma)">
            <input
              className="input"
              value={form.competitors}
              onChange={(e) => update('competitors', e.target.value)}
            />
          </Field>
          <Field label="Objetivos (separados por coma)">
            <input
              className="input"
              value={form.goals}
              onChange={(e) => update('goals', e.target.value)}
            />
          </Field>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="space-y-4">
          <h2 className="text-lg font-medium">Proveedor de LLM</h2>
          <Field label="Modelo">
            <select
              className="input"
              value={`${form.provider}:${form.providerModel}`}
              onChange={(e) => {
                const opt = PROVIDER_OPTIONS.find(
                  (o) => `${o.value}:${o.model}` === e.target.value,
                );
                if (opt) {
                  update('provider', opt.value);
                  update('providerModel', opt.model);
                }
              }}
            >
              {PROVIDER_OPTIONS.map((o) => (
                <option key={`${o.value}:${o.model}`} value={`${o.value}:${o.model}`}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            Necesitás configurar tu API key del proveedor seleccionado en las
            variables de entorno del servidor (<code>ANTHROPIC_API_KEY</code>,{' '}
            <code>OPENAI_API_KEY</code>, <code>GOOGLE_GENERATIVE_AI_API_KEY</code>).
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </section>
      ) : null}

      <nav className="flex items-center justify-between border-t border-border pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || isLoading}
        >
          Atrás
        </Button>
        {step < 5 ? (
          <Button type="button" onClick={() => setStep((s) => s + 1)}>
            Siguiente
          </Button>
        ) : (
          <Button type="button" onClick={runAgent} disabled={isLoading}>
            {isLoading ? 'El agente está analizando la marca...' : 'Generar Brand Profile'}
          </Button>
        )}
      </nav>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid var(--border);
          background: var(--background);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          outline: none;
        }
        :global(.input:focus) {
          border-color: var(--ring);
          box-shadow: 0 0 0 3px color-mix(in oklab, var(--ring) 30%, transparent);
        }
      `}</style>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function ColorSwatches({ value }: { value: string }) {
  const colors = csvToArray(value);
  if (!colors.length) return null;
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {colors.map((c, i) => (
        <span
          key={`${c}-${i}`}
          className="inline-block size-6 rounded border border-border"
          style={{ backgroundColor: c }}
          title={c}
        />
      ))}
    </div>
  );
}

interface EditableOutputProps {
  value: BrandProfileAgentOutput;
  onChange: (next: BrandProfileAgentOutput) => void;
}

function EditableOutput({ value, onChange }: EditableOutputProps) {
  const set = <K extends keyof BrandProfileAgentOutput>(
    key: K,
    next: BrandProfileAgentOutput[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <div className="space-y-4">
      <Field label="Cliente">
        <input
          className="input"
          value={value.clientName}
          onChange={(e) => set('clientName', e.target.value)}
        />
      </Field>
      <Field label="Industria">
        <input
          className="input"
          value={value.industry}
          onChange={(e) => set('industry', e.target.value)}
        />
      </Field>

      <fieldset className="space-y-2 rounded-md border border-border p-3">
        <legend className="text-sm font-semibold">Voz</legend>
        <Field label="Tono">
          <textarea
            className="input min-h-16"
            value={value.voice.tone}
            onChange={(e) => set('voice', { ...value.voice, tone: e.target.value })}
          />
        </Field>
        <Field label="Personalidad (CSV)">
          <input
            className="input"
            value={arrayToCsv(value.voice.personality)}
            onChange={(e) =>
              set('voice', { ...value.voice, personality: csvToArray(e.target.value) })
            }
          />
        </Field>
        <Field label="Palabras a evitar (CSV)">
          <input
            className="input"
            value={arrayToCsv(value.voice.avoidWords)}
            onChange={(e) =>
              set('voice', { ...value.voice, avoidWords: csvToArray(e.target.value) })
            }
          />
        </Field>
      </fieldset>

      <fieldset className="space-y-2 rounded-md border border-border p-3">
        <legend className="text-sm font-semibold">Audiencia</legend>
        <Field label="Edad">
          <input
            className="input"
            value={value.audience.ageRange}
            onChange={(e) =>
              set('audience', { ...value.audience, ageRange: e.target.value })
            }
          />
        </Field>
        <Field label="Intereses (CSV)">
          <input
            className="input"
            value={arrayToCsv(value.audience.interests)}
            onChange={(e) =>
              set('audience', { ...value.audience, interests: csvToArray(e.target.value) })
            }
          />
        </Field>
        <Field label="Pain points (CSV)">
          <textarea
            className="input min-h-20"
            value={arrayToCsv(value.audience.painPoints)}
            onChange={(e) =>
              set('audience', { ...value.audience, painPoints: csvToArray(e.target.value) })
            }
          />
        </Field>
        <Field label="Ubicación">
          <input
            className="input"
            value={value.audience.location}
            onChange={(e) =>
              set('audience', { ...value.audience, location: e.target.value })
            }
          />
        </Field>
      </fieldset>

      <Field label="Content pillars (CSV, máx 4)">
        <textarea
          className="input min-h-20"
          value={arrayToCsv(value.contentPillars)}
          onChange={(e) => set('contentPillars', csvToArray(e.target.value).slice(0, 4))}
        />
      </Field>

      <Field label="Competidores (CSV)">
        <input
          className="input"
          value={arrayToCsv(value.competitors)}
          onChange={(e) => set('competitors', csvToArray(e.target.value))}
        />
      </Field>
      <Field label="Objetivos (CSV)">
        <input
          className="input"
          value={arrayToCsv(value.goals)}
          onChange={(e) => set('goals', csvToArray(e.target.value))}
        />
      </Field>

      <fieldset className="space-y-2 rounded-md border border-border p-3">
        <legend className="text-sm font-semibold">Kit visual</legend>
        <Field label="Colores primarios (CSV)">
          <input
            className="input"
            value={arrayToCsv(value.visualKit.primaryColors)}
            onChange={(e) =>
              set('visualKit', {
                ...value.visualKit,
                primaryColors: csvToArray(e.target.value),
              })
            }
          />
          <ColorSwatches value={arrayToCsv(value.visualKit.primaryColors)} />
        </Field>
        <Field label="Colores secundarios (CSV)">
          <input
            className="input"
            value={arrayToCsv(value.visualKit.secondaryColors)}
            onChange={(e) =>
              set('visualKit', {
                ...value.visualKit,
                secondaryColors: csvToArray(e.target.value),
              })
            }
          />
        </Field>
        <Field label="Tipografías (CSV)">
          <input
            className="input"
            value={arrayToCsv(value.visualKit.fonts)}
            onChange={(e) =>
              set('visualKit', { ...value.visualKit, fonts: csvToArray(e.target.value) })
            }
          />
        </Field>
        <Field label="Estilo">
          <input
            className="input"
            value={value.visualKit.style}
            onChange={(e) =>
              set('visualKit', { ...value.visualKit, style: e.target.value })
            }
          />
        </Field>
      </fieldset>
    </div>
  );
}
