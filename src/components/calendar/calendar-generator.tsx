import { Button } from '@/components/ui/button';
import type { BrandProfile } from '@/types/brand-profile';
import type { Strategy } from '@/types/strategy';

interface CalendarGeneratorProps {
  profile: BrandProfile;
  strategy: Strategy;
  onGenerate: () => void;
  isLoading: boolean;
}

export function CalendarGenerator({
  profile,
  strategy,
  onGenerate,
  isLoading,
}: CalendarGeneratorProps) {
  const scenarioLabel =
    strategy.selectedScenario
      ? strategy.selectedScenario.charAt(0).toUpperCase() + strategy.selectedScenario.slice(1)
      : '—';

  const pillarNames = strategy.contentPillars.map((p) => p.name).join(', ');

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Calendario Editorial</h1>
        <p className="text-sm text-muted-foreground">
          Generaremos ~30 posts para {profile.clientName} basados en la estrategia aprobada.
        </p>
      </header>

      <section
        className="rounded-xl border p-5 space-y-4"
        style={{ borderColor: 'var(--brand-border)' }}
      >
        <h2 className="text-sm font-semibold">Resumen de estrategia</h2>

        {/* Primary channels */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Canales primarios</p>
          <div className="flex flex-wrap gap-2">
            {strategy.primaryChannels.map((channel) => (
              <span
                key={channel}
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  background: 'var(--brand-primary-soft)',
                  color: 'var(--brand-primary-dark)',
                }}
              >
                {channel}
              </span>
            ))}
          </div>
        </div>

        {/* Selected scenario */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Escenario seleccionado</p>
          <p className="text-sm font-medium">{scenarioLabel}</p>
        </div>

        {/* Content pillars */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Pilares de contenido</p>
          <p className="text-sm text-muted-foreground">{pillarNames || '—'}</p>
        </div>

        {/* Channel frequencies */}
        {strategy.channelStrategies.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Frecuencia por canal</p>
            <div className="space-y-1">
              {strategy.channelStrategies.map((ch) => (
                <div key={ch.name} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{ch.name}</span>
                  <span className="text-xs text-muted-foreground">{ch.frequency}</span>
                </div>
              ))}
            </div>
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
          {isLoading ? 'Generando calendario...' : 'Generar calendario'}
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
