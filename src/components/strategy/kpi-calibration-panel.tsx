'use client';

import { useState } from 'react';

import { cn } from '@/lib/utils';
import type { KPIScenario, ScenarioName, Strategy } from '@/types/strategy';

interface KPICalibrationPanelProps {
  strategy: Strategy;
  onSelectScenario: (scenario: ScenarioName) => Promise<void>;
}

const HINT: Record<ScenarioName, string> = {
  conservative:
    'Ideal si recién empezás o tenés poco tiempo. Crecimiento lento pero 100% alcanzable con constancia.',
  balanced:
    'El mejor balance entre esfuerzo y resultado. Con 6-8h/semana dedicadas, es muy alcanzable.',
  aggressive:
    'Requiere inversión en ads y contenido premium. Riesgoso sin experiencia en pauta digital.',
};

const SCENARIO_STYLE: Record<
  ScenarioName,
  { border: string; bg: string; badge: string; badgeBg: string }
> = {
  conservative: {
    border: 'var(--brand-border)',
    bg: 'var(--brand-surface-2)',
    badge: 'var(--brand-ink-muted)',
    badgeBg: 'var(--brand-surface-2)',
  },
  balanced: {
    border: 'var(--brand-primary)',
    bg: 'var(--brand-primary-soft)',
    badge: 'var(--brand-primary-dark)',
    badgeBg: 'var(--brand-primary-soft)',
  },
  aggressive: {
    border: 'var(--brand-accent)',
    bg: 'var(--brand-accent-soft)',
    badge: 'var(--brand-accent-dark)',
    badgeBg: 'var(--brand-accent-soft)',
  },
};

function ScenarioCard({
  scenario,
  isSelected,
  onSelect,
}: {
  scenario: KPIScenario;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const style = SCENARIO_STYLE[scenario.name];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border-2 p-5 text-left transition-all',
        isSelected ? 'shadow-md' : 'hover:border-foreground/30',
      )}
      style={
        isSelected
          ? { borderColor: style.border, background: style.bg }
          : { borderColor: 'var(--brand-border)', background: 'var(--brand-surface)' }
      }
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="font-heading text-sm font-semibold">{scenario.label}</p>
        {scenario.name === 'balanced' && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: style.badgeBg, color: style.badge }}
          >
            Recomendado
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-4">{scenario.description}</p>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Esfuerzo</span>
          <span className="font-medium">{scenario.effort}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Inversión</span>
          <span className="font-medium">{scenario.investment}</span>
        </div>
        <div
          className="flex items-center justify-between font-semibold"
          style={{ color: style.badge }}
        >
          <span>Crecimiento</span>
          <span>{scenario.growth_rate}</span>
        </div>
      </div>
    </button>
  );
}

export function KPICalibrationPanel({ strategy, onSelectScenario }: KPICalibrationPanelProps) {
  const [selected, setSelected] = useState<ScenarioName>('balanced');
  const [isLoading, setIsLoading] = useState(false);

  const scenarios = [
    strategy.scenarioConservative,
    strategy.scenarioBalanced,
    strategy.scenarioAggressive,
  ].filter((s): s is KPIScenario => s !== null);

  const selectedScenario = scenarios.find((s) => s.name === selected);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onSelectScenario(selected);
    } finally {
      setIsLoading(false);
    }
  };

  const mainFollowers =
    strategy.currentFollowersData && Object.keys(strategy.currentFollowersData).length > 0
      ? Math.max(...Object.values(strategy.currentFollowersData))
      : 0;

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Calibrá tus KPIs</h1>
        <p className="text-sm text-muted-foreground">
          {mainFollowers > 0
            ? `Cuenta actual: ${mainFollowers.toLocaleString()} seguidores. Elegí el escenario que mejor se adapta a tu esfuerzo y recursos.`
            : 'Elegí el escenario que mejor se adapta a tu esfuerzo y recursos disponibles.'}
        </p>
      </header>

      {/* Scenario cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.name}
            scenario={scenario}
            isSelected={selected === scenario.name}
            onSelect={() => setSelected(scenario.name)}
          />
        ))}
      </div>

      {/* Detail panel for selected scenario */}
      {selectedScenario ? (
        <div className="rounded-xl border border-border p-5 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{selectedScenario.label} — KPIs detallados</h2>
          </div>

          {/* KPI list */}
          <div className="space-y-3">
            {selectedScenario.kpis.map((kpi) => (
              <div
                key={kpi.name}
                className="flex items-start justify-between gap-4 rounded-lg border border-border p-3"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-medium">{kpi.name}</p>
                  <p className="text-xs text-muted-foreground">{kpi.measurement}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p
                    className="text-lg font-bold"
                    style={{ color: SCENARIO_STYLE[selected].badge }}
                  >
                    {kpi.target}
                  </p>
                  <p className="font-mono text-[10px] uppercase text-muted-foreground">
                    {kpi.importance}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Reasoning */}
          <div
            className="rounded-lg p-3 text-xs space-y-1"
            style={{
              background: 'var(--brand-primary-soft)',
              color: 'var(--brand-primary-dark)',
            }}
          >
            <p className="font-semibold">Por qué es realista</p>
            <p>{selectedScenario.realistic_reasoning}</p>
          </div>
        </div>
      ) : null}

      {/* Action */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-[var(--brand-primary-dark)] disabled:opacity-50 active:translate-y-px"
        >
          {isLoading ? 'Guardando...' : `Usar escenario ${selectedScenario?.label ?? ''}`}
        </button>

        <p
          className="rounded-lg px-4 py-2.5 text-xs"
          style={{
            background: 'var(--brand-accent-soft)',
            color: 'var(--brand-accent-dark)',
          }}
        >
          {HINT[selected]}
        </p>
      </div>
    </div>
  );
}
