import { Button } from '@/components/ui/button';
import type { EditorialCalendar } from '@/types/calendar';
import type { BrandProfile } from '@/types/brand-profile';

interface CopywriterGeneratorProps {
  calendar: EditorialCalendar;
  profile: BrandProfile;
  onGenerate: () => void;
  isLoading: boolean;
}

export function CopywriterGenerator({
  calendar,
  profile,
  onGenerate,
  isLoading,
}: CopywriterGeneratorProps) {
  const channels = Object.keys(calendar.postsByChannel);

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Copy & Hashtags</h1>
        <p className="text-sm text-muted-foreground">
          Generaremos copy profesional para los {calendar.totalPosts} posts de {profile.clientName}.
        </p>
      </header>

      <section
        className="rounded-xl border p-5 space-y-4"
        style={{ borderColor: 'var(--brand-border)' }}
      >
        <h2 className="text-sm font-semibold">Resumen del calendario</h2>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Período de campaña</p>
            <p className="font-medium">
              {calendar.campaignStart} → {calendar.campaignEnd}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Total de posts</p>
            <p className="text-xl font-bold" style={{ color: 'var(--brand-primary)' }}>
              {calendar.totalPosts}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Canales</p>
          <div className="flex flex-wrap gap-2">
            {channels.map((channel) => (
              <span
                key={channel}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: 'var(--brand-primary-soft)',
                  color: 'var(--brand-primary-dark)',
                }}
              >
                {channel} ({calendar.postsByChannel[channel]})
              </span>
            ))}
          </div>
        </div>
      </section>

      <div
        className="rounded-xl p-4 space-y-1 text-xs"
        style={{
          background: 'var(--brand-primary-soft)',
          color: 'var(--brand-primary-dark)',
        }}
      >
        <p className="font-semibold">Qué genera el Copywriter Agent</p>
        <ul className="space-y-0.5 list-disc list-inside text-xs opacity-90">
          <li>Hook que detiene el scroll</li>
          <li>Copy optimizado por canal</li>
          <li>CTA específico y accionable</li>
          <li>8-15 hashtags relevantes</li>
          <li>Script de video para Reels/Videos</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Button onClick={onGenerate} disabled={isLoading} className="w-full" size="lg">
          {isLoading ? 'Generando copy...' : 'Generar copy & hashtags'}
        </Button>
        {isLoading ? (
          <p className="text-center text-xs text-muted-foreground">
            Esto toma aproximadamente 2-3 minutos
          </p>
        ) : null}
      </div>
    </div>
  );
}
