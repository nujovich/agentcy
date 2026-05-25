'use client';

import { useEffect, useState } from 'react';

interface ModelStatus {
  agentName: string;
  label: string;
  currentModel: string;
  trajectoryCount: number;
  minRequired: number;
  trainingStatus: 'collecting' | 'ready' | 'training' | 'active';
  fineTunedModelName?: string;
  qualityScore?: number;
}

interface TrainingDashboardData {
  models: ModelStatus[];
  totalTrajectories: number;
  activeFineTunedCount: number;
}

const AGENT_LABELS: Record<string, string> = {
  'brand-intake': 'Brand Intake',
  strategy: 'Estrategia',
  calendar: 'Calendario',
  copywriter: 'Copywriter',
  brief: 'Brief',
  report: 'Reporte',
};

const MODEL_OPTIONS = [
  { value: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { value: 'claude-opus-4-7', label: 'Claude Opus 4.7', provider: 'anthropic' },
  { value: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { value: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google' },
];

export default function TrainingDashboard() {
  const [data, setData] = useState<TrainingDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedModels, setSelectedModels] = useState<Record<string, string>>({});
  const [buildingDataset, setBuildingDataset] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [trajRes, dsRes] = await Promise.all([
        fetch('/api/trajectories?limit=500'),
        fetch('/api/datasets'),
      ]);
      const trajectories = await trajRes.json();
      const datasets = await dsRes.json();

      // Contar trayectorias por agente
      const counts: Record<string, number> = {};
      for (const t of trajectories) {
        counts[t.agent_name] = (counts[t.agent_name] ?? 0) + 1;
      }

      // Modelos fine-tuneados activos
      const activeModels = (datasets.activeModels ?? []) as any[];
      const activeByAgent: Record<string, any> = {};
      for (const m of activeModels) {
        activeByAgent[m.agent_name] = m;
      }

      const agents = ['brand-intake', 'strategy', 'calendar', 'copywriter', 'brief', 'report'];
      const models: ModelStatus[] = agents.map((name) => {
        const count = counts[name] ?? 0;
        const active = activeByAgent[name];
        const hasEnough = count >= 50;

        let trainingStatus: ModelStatus['trainingStatus'] = 'collecting';
        if (active?.status === 'active') trainingStatus = 'active';
        else if (hasEnough) trainingStatus = 'ready';

        return {
          agentName: name,
          label: AGENT_LABELS[name] ?? name,
          currentModel: selectedModels[name] ?? 'claude-sonnet-4-6',
          trajectoryCount: count,
          minRequired: 50,
          trainingStatus,
          fineTunedModelName: active?.model_name,
          qualityScore: active?.quality_score,
        };
      });

      setData({
        models,
        totalTrajectories: Object.values(counts).reduce((a, b) => a + b, 0),
        activeFineTunedCount: activeModels.length,
      });
    } catch (err) {
      console.error('Failed to fetch training data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleModelChange(agentName: string, modelValue: string) {
    setSelectedModels((prev) => ({ ...prev, [agentName]: modelValue }));
    // En el futuro: guardar preferencia en DB
    console.log(`Modelo para ${agentName} cambiado a ${modelValue}`);
  }

  async function handleBuildDataset(agentName: string) {
    setBuildingDataset(agentName);
    try {
      const res = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentName,
          includeRejected: false,
          creditAssignment: true,
          onlyProductiveSegments: true,
        }),
      });
      const result = await res.json();
      alert(result.message);
      fetchData();
    } catch (err) {
      alert('Error al construir dataset');
    } finally {
      setBuildingDataset(null);
    }
  }

  function getStatusBadge(status: ModelStatus['trainingStatus']) {
    const styles = {
      collecting: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      ready: 'bg-green-500/20 text-green-400 border-green-500/30',
      training: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      active: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    };
    const labels = {
      collecting: 'Recolectando datos',
      ready: 'Listo para entrenar',
      training: 'Entrenando...',
      active: 'Modelo activo 🧠',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
        {status === 'active' && <span className="w-1.5 h-1.5 bg-violet-400 rounded-full mr-1.5 animate-pulse" />}
        {status === 'ready' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5" />}
        {labels[status]}
      </span>
    );
  }

  function getProgressColor(percent: number) {
    if (percent >= 100) return 'bg-violet-500';
    if (percent >= 60) return 'bg-green-500';
    if (percent >= 30) return 'bg-yellow-500';
    return 'bg-zinc-600';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total trayectorias</p>
          <p className="text-2xl font-semibold mt-1">{data?.totalTrajectories ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Agentes con datos</p>
          <p className="text-2xl font-semibold mt-1">
            {data?.models.filter((m) => m.trajectoryCount > 0).length ?? 0}/6
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Modelos fine-tuneados</p>
          <p className="text-2xl font-semibold mt-1">{data?.activeFineTunedCount ?? 0}</p>
        </div>
      </div>

      {/* Tabla de agentes */}
      <div className="rounded-lg border border-border bg-card">
        <header className="border-b border-border p-4">
          <h2 className="text-lg font-medium">🧠 Estado de entrenamiento por agente</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Cada agente recolecta trayectorias. Con 50+ aprobadas, puedes entrenar un modelo 4B
            personalizado que reemplace a Claude/GPT.
          </p>
        </header>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-muted-foreground font-medium">Agente</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Modelo actual</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Trayectorias</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Progreso</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Estado</th>
                <th className="text-left p-4 text-muted-foreground font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {data?.models.map((model) => {
                const percent = Math.min(100, Math.round((model.trajectoryCount / model.minRequired) * 100));
                return (
                  <tr key={model.agentName} className="border-b border-border last:border-0">
                    <td className="p-4 font-medium">{model.label}</td>

                    {/* Model selector */}
                    <td className="p-4">
                      <select
                        value={selectedModels[model.agentName] ?? model.currentModel}
                        onChange={(e) => handleModelChange(model.agentName, e.target.value)}
                        className="bg-muted border border-border rounded px-2 py-1 text-xs"
                        disabled={model.trainingStatus === 'active'}
                      >
                        {model.trainingStatus === 'active' && model.fineTunedModelName ? (
                          <option value={model.fineTunedModelName}>
                            🧠 {model.fineTunedModelName} (score: {model.qualityScore ?? 'N/A'})
                          </option>
                        ) : null}
                        {MODEL_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.provider === 'anthropic' ? '🤖' : opt.provider === 'openai' ? '💬' : '🔷'} {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Trajectory count */}
                    <td className="p-4">
                      <span className="font-mono text-sm">
                        {model.trajectoryCount}
                        <span className="text-muted-foreground">/{model.minRequired}</span>
                      </span>
                    </td>

                    {/* Progress bar */}
                    <td className="p-4 w-48">
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${getProgressColor(percent)}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-4">{getStatusBadge(model.trainingStatus)}</td>

                    {/* Action */}
                    <td className="p-4">
                      {model.trainingStatus === 'ready' && (
                        <button
                          onClick={() => handleBuildDataset(model.agentName)}
                          disabled={buildingDataset === model.agentName}
                          className="inline-flex items-center px-3 py-1.5 rounded text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                        >
                          {buildingDataset === model.agentName ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                              Construyendo...
                            </>
                          ) : (
                            '🎯 Entrenar modelo'
                          )}
                        </button>
                      )}
                      {model.trainingStatus === 'collecting' && (
                        <span className="text-xs text-muted-foreground">
                          {50 - model.trajectoryCount} trayectorias más
                        </span>
                      )}
                      {model.trainingStatus === 'active' && (
                        <button
                          onClick={() => handleModelChange(model.agentName, 'claude-sonnet-4-6')}
                          className="text-xs text-violet-400 hover:text-violet-300"
                        >
                          Cambiar a Claude
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explicación del ciclo */}
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium mb-2">🔄 Cómo funciona</h3>
        <div className="grid grid-cols-4 gap-4 text-xs text-muted-foreground">
          <div className="text-center">
            <div className="text-2xl mb-1">📝</div>
            <p className="font-medium text-foreground">1. Usa los agentes</p>
            <p>Genera estrategias, calendarios y copies con Claude</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">📊</div>
            <p className="font-medium text-foreground">2. Acumula trayectorias</p>
            <p>Cada interacción se guarda como dato de entrenamiento</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🧬</div>
            <p className="font-medium text-foreground">3. Entrena modelo 4B</p>
            <p>Con 50+ trayectorias, fine-tuneamos un modelo pequeño</p>
          </div>
          <div className="text-center">
            <div className="text-2xl mb-1">🚀</div>
            <p className="font-medium text-foreground">4. Selecciona tu modelo</p>
            <p>Cambia de Claude a tu modelo personalizado</p>
          </div>
        </div>
      </div>
    </div>
  );
}
