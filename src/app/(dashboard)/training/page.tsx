import TrainingDashboard from '@/components/training/training-dashboard';

export const metadata = {
  title: 'Entrenamiento — Agentcy',
  description: 'Gestiona los modelos de IA de tus agentes. Recolecta trayectorias y entrena modelos personalizados.',
};

export default function TrainingPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">Entrenamiento</h1>
        <p className="text-sm text-muted-foreground">
          Modelos, trayectorias y fine-tuning — entrena tu propio agente de IA personalizado
        </p>
      </header>
      <TrainingDashboard />
    </main>
  );
}
