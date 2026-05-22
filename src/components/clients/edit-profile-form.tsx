'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { BrandProfileUpdate } from '@/lib/supabase/database.types';
import type { BrandProfile } from '@/types/brand-profile';

interface EditProfileFormProps {
  profile: BrandProfile;
}

export function EditProfileForm({ profile }: EditProfileFormProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Flat form state
  const [clientName, setClientName] = useState(profile.clientName);
  const [industry, setIndustry] = useState(profile.industry);
  const [website, setWebsite] = useState(profile.website ?? '');
  const [location, setLocation] = useState(profile.location ?? '');

  // Social URLs
  const [instagram, setInstagram] = useState(profile.socialUrls.instagram ?? '');
  const [linkedin, setLinkedin] = useState(profile.socialUrls.linkedin ?? '');
  const [tiktok, setTiktok] = useState(profile.socialUrls.tiktok ?? '');
  const [twitter, setTwitter] = useState(profile.socialUrls.twitter ?? '');
  const [facebook, setFacebook] = useState(profile.socialUrls.facebook ?? '');
  const [youtube, setYoutube] = useState(profile.socialUrls.youtube ?? '');

  // Voice
  const [voiceTone, setVoiceTone] = useState(profile.voice.tone);
  const [voicePersonality, setVoicePersonality] = useState(profile.voice.personality.join('\n'));
  const [voiceAvoidWords, setVoiceAvoidWords] = useState(profile.voice.avoidWords.join('\n'));
  const [voiceReferenceAccounts, setVoiceReferenceAccounts] = useState(
    (profile.voice.referenceAccounts ?? []).join('\n'),
  );

  // Audience
  const [audienceAgeRange, setAudienceAgeRange] = useState(profile.audience.ageRange);
  const [audienceInterests, setAudienceInterests] = useState(profile.audience.interests.join('\n'));
  const [audiencePainPoints, setAudiencePainPoints] = useState(profile.audience.painPoints.join('\n'));
  const [audienceLocation, setAudienceLocation] = useState(profile.audience.location);

  // Pillars, competitors, goals
  const [contentPillars, setContentPillars] = useState(profile.contentPillars.join('\n'));
  const [competitors, setCompetitors] = useState(profile.competitors.join('\n'));
  const [goals, setGoals] = useState(profile.goals.join('\n'));

  // Visual kit
  const [primaryColors, setPrimaryColors] = useState(profile.visualKit.primaryColors.join('\n'));
  const [secondaryColors, setSecondaryColors] = useState(profile.visualKit.secondaryColors.join('\n'));
  const [fonts, setFonts] = useState(profile.visualKit.fonts.join('\n'));
  const [visualStyle, setVisualStyle] = useState(profile.visualKit.style);

  const toLines = (s: string) => s.split('\n').filter(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      const socialUrls: Record<string, string> = {};
      if (instagram) socialUrls.instagram = instagram;
      if (linkedin) socialUrls.linkedin = linkedin;
      if (tiktok) socialUrls.tiktok = tiktok;
      if (twitter) socialUrls.twitter = twitter;
      if (facebook) socialUrls.facebook = facebook;
      if (youtube) socialUrls.youtube = youtube;

      const update: BrandProfileUpdate = {
        client_name: clientName,
        industry,
        website: website || null,
        location: location || null,
        social_urls: socialUrls,
        voice: {
          tone: voiceTone,
          personality: toLines(voicePersonality),
          avoidWords: toLines(voiceAvoidWords),
          referenceAccounts: toLines(voiceReferenceAccounts),
        },
        audience: {
          ageRange: audienceAgeRange,
          interests: toLines(audienceInterests),
          painPoints: toLines(audiencePainPoints),
          location: audienceLocation,
        },
        content_pillars: toLines(contentPillars).slice(0, 4),
        competitors: toLines(competitors),
        goals: toLines(goals),
        visual_kit: {
          primaryColors: toLines(primaryColors),
          secondaryColors: toLines(secondaryColors),
          fonts: toLines(fonts),
          style: visualStyle,
        },
      };

      const { error: dbError } = await supabase
        .from('brand_profiles')
        .update(update)
        .eq('id', profile.id)
        .eq('agency_id', user.id);

      if (dbError) throw new Error(dbError.message);

      router.push(`/clients/${profile.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {/* Datos básicos */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Datos básicos</h2>
        <Field label="Nombre de la empresa *">
          <TextInput value={clientName} onChange={setClientName} required />
        </Field>
        <Field label="Industria *">
          <TextInput value={industry} onChange={setIndustry} required />
        </Field>
        <Field label="Sitio web">
          <TextInput value={website} onChange={setWebsite} type="url" />
        </Field>
        <Field label="Ubicación">
          <TextInput value={location} onChange={setLocation} />
        </Field>
      </section>

      {/* Redes sociales */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Redes sociales</h2>
        {([
          ['instagram', instagram, setInstagram],
          ['linkedin', linkedin, setLinkedin],
          ['tiktok', tiktok, setTiktok],
          ['twitter', twitter, setTwitter],
          ['facebook', facebook, setFacebook],
          ['youtube', youtube, setYoutube],
        ] as const).map(([net, val, setter]) => (
          <Field key={net} label={net.charAt(0).toUpperCase() + net.slice(1)}>
            <TextInput
              value={val}
              onChange={setter}
              placeholder={`https://${net}.com/...`}
            />
          </Field>
        ))}
      </section>

      {/* Voz de marca */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Voz de marca</h2>
        <Field label="Tono de voz">
          <TextInput
            value={voiceTone}
            onChange={setVoiceTone}
            placeholder="formal, casual, creativo..."
          />
        </Field>
        <Field label="Personalidad (uno por línea)">
          <TextareaInput value={voicePersonality} onChange={setVoicePersonality} />
        </Field>
        <Field label="Palabras a evitar (una por línea)">
          <TextareaInput value={voiceAvoidWords} onChange={setVoiceAvoidWords} />
        </Field>
        <Field label="Cuentas de referencia (una por línea)">
          <TextareaInput value={voiceReferenceAccounts} onChange={setVoiceReferenceAccounts} />
        </Field>
      </section>

      {/* Audiencia */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Audiencia</h2>
        <Field label="Rango etario">
          <TextInput value={audienceAgeRange} onChange={setAudienceAgeRange} placeholder="25-40 años" />
        </Field>
        <Field label="Intereses (uno por línea)">
          <TextareaInput value={audienceInterests} onChange={setAudienceInterests} />
        </Field>
        <Field label="Puntos de dolor (uno por línea)">
          <TextareaInput value={audiencePainPoints} onChange={setAudiencePainPoints} />
        </Field>
        <Field label="Ubicación de la audiencia">
          <TextInput value={audienceLocation} onChange={setAudienceLocation} placeholder="Argentina, LATAM..." />
        </Field>
      </section>

      {/* Pilares y estrategia */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Pilares y estrategia</h2>
        <Field label="Pilares de contenido (uno por línea, máx 4)">
          <TextareaInput value={contentPillars} onChange={setContentPillars} />
        </Field>
        <Field label="Competidores (uno por línea)">
          <TextareaInput value={competitors} onChange={setCompetitors} />
        </Field>
        <Field label="Objetivos (uno por línea)">
          <TextareaInput value={goals} onChange={setGoals} />
        </Field>
      </section>

      {/* Kit visual */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold">Kit visual</h2>
        <Field label="Colores primarios (uno por línea, ej: #FF0000)">
          <TextareaInput value={primaryColors} onChange={setPrimaryColors} rows={2} />
        </Field>
        <Field label="Colores secundarios (uno por línea)">
          <TextareaInput value={secondaryColors} onChange={setSecondaryColors} rows={2} />
        </Field>
        <Field label="Tipografías (una por línea)">
          <TextareaInput value={fonts} onChange={setFonts} rows={2} />
        </Field>
        <Field label="Estilo visual">
          <TextInput
            value={visualStyle}
            onChange={setVisualStyle}
            placeholder="minimalista editorial, moderno, etc."
          />
        </Field>
      </section>

      <Button
        type="submit"
        disabled={isSaving || !clientName.trim() || !industry.trim()}
        className="w-full"
        size="lg"
      >
        {isSaving ? 'Guardando...' : 'Guardar cambios'}
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

function TextInput({
  value,
  onChange,
  placeholder,
  required,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
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

function TextareaInput({
  value,
  onChange,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
    />
  );
}
