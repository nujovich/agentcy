'use client';

import { Button } from '@/components/ui/button';
import type { SimpleBrandProfile } from '@/types/brand-intake';

interface ProfilePreviewProps {
  profile: Partial<SimpleBrandProfile>;
  isComplete: boolean;
  onSave: (profile: SimpleBrandProfile) => void;
  isSaving?: boolean;
}

const REQUIRED_FIELDS: (keyof SimpleBrandProfile)[] = [
  'clientName',
  'industry',
  'mainServices',
  'targetAudience',
];

function countFilledFields(profile: Partial<SimpleBrandProfile>): number {
  return REQUIRED_FIELDS.filter((key) => {
    const v = profile[key];
    if (Array.isArray(v)) return v.length > 0;
    return typeof v === 'string' && v.trim().length > 0;
  }).length;
}

export function ProfilePreview({
  profile,
  isComplete,
  onSave,
  isSaving = false,
}: ProfilePreviewProps) {
  const filled = countFilledFields(profile);
  const pct = Math.round((filled / REQUIRED_FIELDS.length) * 100);

  const canSave = isComplete && 'clientName' in profile && Boolean(profile.clientName);

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      clientName: profile.clientName ?? '',
      industry: profile.industry ?? '',
      website: profile.website ?? '',
      toneOfVoice: profile.toneOfVoice ?? '',
      targetAudience: profile.targetAudience ?? '',
      mainServices: profile.mainServices ?? '',
      socialMedia: profile.socialMedia ?? {},
      contentPillars: profile.contentPillars ?? [],
    });
  };

  return (
    <aside className="flex flex-col h-full bg-card rounded-lg border border-border overflow-hidden">
      <header className="border-b border-border px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Perfil en vivo
        </p>
      </header>

      {/* Progress bar */}
      <div className="px-4 pt-3 pb-2">
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">{pct}% completado</p>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        <ProfileField label="Empresa" value={profile.clientName} />
        <ProfileField label="Industria" value={profile.industry} />
        <ProfileField label="Sitio web" value={profile.website} />
        <ProfileField label="Servicios" value={profile.mainServices} />
        <ProfileField label="Audiencia" value={profile.targetAudience} />
        <ProfileField label="Tono" value={profile.toneOfVoice} />

        {profile.contentPillars && profile.contentPillars.length > 0 ? (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Pilares</p>
            <ul className="space-y-0.5">
              {profile.contentPillars.map((p, i) => (
                <li key={i} className="text-xs text-foreground">
                  · {p}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {profile.socialMedia ? (
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-1">Redes</p>
            <ul className="space-y-0.5">
              {Object.entries(profile.socialMedia)
                .filter(([, v]) => v)
                .map(([net, url]) => (
                  <li key={net} className="text-xs text-foreground truncate">
                    {net}: {url}
                  </li>
                ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Save button */}
      <div className="border-t border-border p-4">
        {isComplete ? (
          <Button onClick={handleSave} disabled={!canSave || isSaving} className="w-full">
            {isSaving ? 'Guardando...' : 'Guardar perfil'}
          </Button>
        ) : (
          <p className="text-xs text-muted-foreground text-center">
            Seguí respondiendo para completar el perfil
          </p>
        )}
      </div>
    </aside>
  );
}

function ProfileField({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p
        className={`text-xs mt-0.5 ${value ? 'text-foreground' : 'text-muted-foreground italic'}`}
      >
        {value ? value.substring(0, 60) + (value.length > 60 ? '…' : '') : '—'}
      </p>
    </div>
  );
}
