import type { BrandProfile } from '@/types/brand-profile';
import { Button } from '@/components/ui/button';

interface StrategyGeneratorProps {
  profile: BrandProfile;
  onGenerate: (followersData: Record<string, number>) => void;
  isLoading: boolean;
}

const SOCIAL_LABELS: Record<string, string> = {
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  twitter: 'X / Twitter',
  facebook: 'Facebook',
  youtube: 'YouTube',
};

export function StrategyGenerator({ profile, onGenerate, isLoading }: StrategyGeneratorProps) {
  const activeSocials = Object.keys(profile.socialUrls);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const followersData: Record<string, number> = {};
    for (const net of activeSocials) {
      const val = data.get(`followers_${net}`);
      followersData[net] = val ? Math.max(0, parseInt(String(val), 10) || 0) : 0;
    }
    onGenerate(followersData);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Strategy Agent</h1>
        <p className="text-sm text-muted-foreground">
          Generá una estrategia de redes sociales personalizada para {profile.clientName}.
        </p>
      </header>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h2 className="text-sm font-semibold">Perfil del cliente</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Empresa</p>
            <p>{profile.clientName}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Industria</p>
            <p>{profile.industry}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Tono de voz</p>
            <p>{profile.voice.tone || '—'}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Audiencia</p>
            <p>{profile.audience.ageRange || '—'}</p>
          </div>
        </div>

        {profile.contentPillars.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Pilares de contenido</p>
            <div className="flex flex-wrap gap-2">
              {profile.contentPillars.map((p) => (
                <span
                  key={p}
                  className="rounded-full px-3 py-1 text-xs font-medium"
                  style={{
                    background: 'var(--brand-primary-soft)',
                    color: 'var(--brand-primary-dark)',
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {profile.goals.length > 0 ? (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Objetivos</p>
            <ul className="space-y-1">
              {profile.goals.map((g) => (
                <li key={g} className="text-sm text-muted-foreground">
                  · {g}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeSocials.length > 0 ? (
          <section className="rounded-xl border border-border bg-card p-5 space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Seguidores actuales</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ingresá los seguidores de cada red para calibrar los KPIs de forma realista.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {activeSocials.map((net) => (
                <label key={net} className="space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {SOCIAL_LABELS[net] ?? net}
                  </span>
                  <input
                    type="number"
                    name={`followers_${net}`}
                    min={0}
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                  />
                </label>
              ))}
            </div>
          </section>
        ) : null}

        <div className="space-y-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Generando estrategia...' : 'Generar estrategia'}
          </Button>
          {isLoading ? (
            <p className="text-center text-xs text-muted-foreground">
              Esto toma aproximadamente 1-2 minutos
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}
