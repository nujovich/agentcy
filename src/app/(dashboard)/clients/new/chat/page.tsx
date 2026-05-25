'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

import { ChatInterface } from '@/components/brand-intake/ChatInterface';
import { ProfilePreview } from '@/components/brand-intake/ProfilePreview';
import { createClient } from '@/lib/supabase/client';
import type { BrandProfileInsert } from '@/lib/supabase/database.types';
import type { ChatMessage, SimpleBrandProfile } from '@/types/brand-intake';

interface ChatAPIResponse {
  response: string;
  extractedProfile: Record<string, unknown>;
  isComplete: boolean;
}

export default function ChatIntakePage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [extractedProfile, setExtractedProfile] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedRef = useRef(false);

  const callChat = useCallback(
    async (newMessages: ChatMessage[]) => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/agents/brand-intake-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: newMessages, extractedProfile }),
        });
        const json: unknown = await res.json();
        if (!res.ok) {
          const msg =
            typeof json === 'object' && json !== null && 'error' in json
              ? String((json as { error: unknown }).error)
              : 'Error en el chat';
          throw new Error(msg);
        }
        const data = json as ChatAPIResponse;

        setMessages((prev) => [
          ...prev,
          { role: 'assistant' as const, content: data.response },
        ]);
        setExtractedProfile(data.extractedProfile);
        setIsComplete(data.isComplete);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    },
    [extractedProfile],
  );

  // Initialize with first question from assistant
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void callChat([]);
  }, [callChat]);

  const handleSendMessage = async (content: string) => {
    const newMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content },
    ];
    setMessages(newMessages);
    await callChat(newMessages);
  };

  const handleSave = async (profile: SimpleBrandProfile) => {
    setIsSaving(true);
    setError(null);
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
        competitors: Array.isArray(extractedProfile.competitors)
          ? (extractedProfile.competitors as string[])
          : [],
        goals: Array.isArray(extractedProfile.goals)
          ? (extractedProfile.goals as string[])
          : [],
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

      const { data, error: dbError } = await supabase
        .from('brand_profiles')
        .insert(insert)
        .select('id')
        .single();

      if (dbError) throw new Error(dbError.message);

      router.push(`/clients/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando');
      setIsSaving(false);
    }
  };

  // Convert extractedProfile (Record<string,unknown>) to Partial<SimpleBrandProfile>
  const previewProfile: Partial<SimpleBrandProfile> = {
    clientName:
      typeof extractedProfile.clientName === 'string'
        ? extractedProfile.clientName
        : undefined,
    industry:
      typeof extractedProfile.industry === 'string'
        ? extractedProfile.industry
        : undefined,
    website:
      typeof extractedProfile.website === 'string'
        ? extractedProfile.website
        : undefined,
    toneOfVoice:
      typeof extractedProfile.toneOfVoice === 'string'
        ? extractedProfile.toneOfVoice
        : undefined,
    targetAudience:
      typeof extractedProfile.targetAudience === 'string'
        ? extractedProfile.targetAudience
        : undefined,
    mainServices:
      typeof extractedProfile.mainServices === 'string'
        ? extractedProfile.mainServices
        : undefined,
    socialMedia:
      typeof extractedProfile.socialMedia === 'object' &&
      extractedProfile.socialMedia !== null &&
      !Array.isArray(extractedProfile.socialMedia)
        ? (extractedProfile.socialMedia as SimpleBrandProfile['socialMedia'])
        : {},
    contentPillars: Array.isArray(extractedProfile.contentPillars)
      ? (extractedProfile.contentPillars as string[])
      : [],
    competitors: Array.isArray(extractedProfile.competitors)
      ? (extractedProfile.competitors as string[])
      : [],
    goals: Array.isArray(extractedProfile.goals)
      ? (extractedProfile.goals as string[])
      : [],
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0">
      {/* Error banner */}
      {error ? (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive shadow">
          {error}
        </div>
      ) : null}

      {/* Chat — left 2/3 */}
      <div className="flex-1 min-w-0 p-4 pr-2">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </div>

      {/* Profile preview — right 1/3 */}
      <div className="w-80 shrink-0 p-4 pl-2">
        <ProfilePreview
          profile={previewProfile}
          isComplete={isComplete}
          onSave={handleSave}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
}
