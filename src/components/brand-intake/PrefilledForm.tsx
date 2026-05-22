'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { SimpleBrandProfile } from '@/types/brand-intake';

interface PrefilledFormProps {
  initialData: Partial<SimpleBrandProfile>;
  onSave: (profile: SimpleBrandProfile) => Promise<void>;
  isSaving: boolean;
}

export function PrefilledForm({ initialData, onSave, isSaving }: PrefilledFormProps) {
  const [form, setForm] = useState<SimpleBrandProfile>({
    clientName: initialData.clientName ?? '',
    industry: initialData.industry ?? '',
    website: initialData.website ?? '',
    toneOfVoice: initialData.toneOfVoice ?? '',
    targetAudience: initialData.targetAudience ?? '',
    mainServices: initialData.mainServices ?? '',
    socialMedia: initialData.socialMedia ?? {},
    contentPillars: initialData.contentPillars ?? [],
    competitors: initialData.competitors ?? [],
    goals: initialData.goals ?? [],
  });

  const set = <K extends keyof SimpleBrandProfile>(key: K, value: SimpleBrandProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const setSocial = (key: keyof SimpleBrandProfile['socialMedia'], value: string) => {
    setForm((prev) => ({
      ...prev,
      socialMedia: { ...prev.socialMedia, [key]: value || undefined },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Revisá y completá los campos que faltan antes de guardar el perfil.
      </p>

      <Field label="Nombre de la empresa *">
        <Input value={form.clientName} onChange={(v) => set('clientName', v)} required />
      </Field>
      <Field label="Industria *">
        <Input value={form.industry} onChange={(v) => set('industry', v)} required />
      </Field>
      <Field label="Sitio web">
        <Input value={form.website} onChange={(v) => set('website', v)} type="url" />
      </Field>
      <Field label="Servicios principales">
        <Textarea value={form.mainServices} onChange={(v) => set('mainServices', v)} />
      </Field>
      <Field label="Audiencia objetivo">
        <Textarea value={form.targetAudience} onChange={(v) => set('targetAudience', v)} />
      </Field>
      <Field label="Tono de voz">
        <Input
          value={form.toneOfVoice}
          onChange={(v) => set('toneOfVoice', v)}
          placeholder="formal, casual, creativo..."
        />
      </Field>

      <fieldset className="space-y-3 rounded-lg border border-border p-4">
        <legend className="text-sm font-semibold px-1">Redes sociales</legend>
        {(['instagram', 'linkedin', 'tiktok', 'twitter', 'facebook', 'youtube'] as const).map(
          (net) => (
            <Field key={net} label={net.charAt(0).toUpperCase() + net.slice(1)}>
              <Input
                value={form.socialMedia[net] ?? ''}
                onChange={(v) => setSocial(net, v)}
                placeholder={`https://${net}.com/...`}
              />
            </Field>
          ),
        )}
      </fieldset>

      <Field label="Pilares de contenido (uno por línea, máx 4)">
        <textarea
          value={form.contentPillars.join('\n')}
          onChange={(e) =>
            set('contentPillars', e.target.value.split('\n').filter(Boolean).slice(0, 4))
          }
          rows={4}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </Field>

      <Field label="Competidores (uno por línea)">
        <textarea
          value={(form.competitors ?? []).join('\n')}
          onChange={(e) =>
            set('competitors', e.target.value.split('\n').filter(Boolean))
          }
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </Field>

      <Field label="Objetivos (uno por línea)">
        <textarea
          value={(form.goals ?? []).join('\n')}
          onChange={(e) =>
            set('goals', e.target.value.split('\n').filter(Boolean))
          }
          rows={3}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </Field>

      <Button type="submit" disabled={isSaving || !form.clientName.trim()} className="w-full">
        {isSaving ? 'Guardando...' : 'Guardar perfil de marca'}
      </Button>
    </form>
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

interface InputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}

function Input({ value, onChange, placeholder, required, type = 'text' }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    />
  );
}

function Textarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    />
  );
}
