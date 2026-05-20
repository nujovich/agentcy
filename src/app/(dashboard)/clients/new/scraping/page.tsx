'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PrefilledForm } from '@/components/brand-intake/PrefilledForm';
import { URLScrapingForm } from '@/components/brand-intake/URLScrapingForm';
import { createClient } from '@/lib/supabase/client';
import type { BrandProfileInsert } from '@/lib/supabase/database.types';
import type { SimpleBrandProfile } from '@/types/brand-intake';

type Step = 'input' | 'preview';

export default function URLScrapingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('input');
  const [profileData, setProfileData] = useState<Partial<SimpleBrandProfile> | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);

  const handleScrape = async (url: string) => {
    setScrapeError(null);
    setIsScraping(true);
    try {
      const res = await fetch('/api/agents/brand-intake-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof json === 'object' && json !== null && 'error' in json
            ? String((json as { error: unknown }).error)
            : 'Error al escanear el sitio';
        throw new Error(msg);
      }
      const data = json as { profile: SimpleBrandProfile };
      setProfileData(data.profile);
      setStep('preview');
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsScraping(false);
    }
  };

  const handleSave = async (profile: SimpleBrandProfile) => {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      const insert: BrandProfileInsert = {
        agency_id: user.id,
        client_name: profile.clientName,
        industry: profile.industry,
        website: profile.website || null,
        social_urls: Object.fromEntries(
          Object.entries(profile.socialMedia).filter(([, v]) => Boolean(v)),
        ) as Record<string, string>,
        voice: {
          tone: profile.toneOfVoice || '',
          personality: [],
          avoidWords: [],
        },
        audience: {
          ageRange: '',
          interests: [],
          painPoints: [],
          location: '',
        },
        content_pillars: profile.contentPillars,
        competitors: [],
        goals: [],
        visual_kit: {
          primaryColors: [],
          secondaryColors: [],
          fonts: [],
          style: 'minimalista editorial',
        },
        pack: 'esencial',
        provider: 'anthropic',
        provider_model: 'claude-sonnet-4-6',
        status: 'draft',
      };

      const { data, error } = await supabase
        .from('brand_profiles')
        .insert(insert)
        .select('id')
        .single();

      if (error) throw new Error(error.message);

      router.push(`/clients/${data.id}`);
    } catch (err) {
      setScrapeError(err instanceof Error ? err.message : 'Error guardando');
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Nuevo cliente — URL Scraping</h1>
        <p className="text-sm text-muted-foreground">
          {step === 'input'
            ? 'Pegá la URL del sitio web y analizamos la marca automáticamente.'
            : 'Revisá y completá los datos antes de guardar.'}
        </p>
      </header>

      {scrapeError ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {scrapeError}
        </p>
      ) : null}

      {step === 'input' ? (
        <URLScrapingForm onSubmit={handleScrape} isLoading={isScraping} />
      ) : profileData ? (
        <PrefilledForm initialData={profileData} onSave={handleSave} isSaving={isSaving} />
      ) : null}
    </main>
  );
}
