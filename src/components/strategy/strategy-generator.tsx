import type { BrandProfile } from '@/types/brand-profile';
import { Button } from '@/components/ui/button';

interface StrategyGeneratorProps {
  profile: BrandProfile;
  onGenerate: () => void;
  isLoading: boolean;
}

export function StrategyGenerator({ profile, onGenerate, isLoading }: StrategyGeneratorProps) {
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

      <div className="space-y-2">
        <Button
          onClick={onGenerate}
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
    </div>
  );
}
