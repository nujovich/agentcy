import Image from 'next/image';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

const PIPELINE = [
  { name: 'Brand Intake', status: 'Aprobado', state: 'done' },
  { name: 'Strategy', status: 'Aprobado', state: 'done' },
  { name: 'Copy', status: 'Corriendo…', state: 'running' },
  { name: 'Visual Brief', status: 'En espera', state: 'awaiting' },
  { name: 'Calendar', status: 'Pendiente', state: 'locked' },
] as const;

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="grid min-h-screen w-full md:grid-cols-[1.4fr_1fr]">
      <aside
        className="relative hidden flex-col justify-between gap-12 p-12 text-[var(--brand-dark-ink)] md:flex"
        style={{ background: 'var(--brand-dark-bg)' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 50% at 70% 30%, rgba(13,115,119,0.18), transparent 70%)',
            backgroundImage:
              'radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="relative">
          <Image
            src="/logo-lockup-light.svg"
            alt="Agentcy"
            width={148}
            height={32}
            priority
          />
        </div>

        <div className="relative space-y-8">
          <h1 className="font-heading text-4xl font-bold leading-[1.1] tracking-tight">
            La agencia detrás de tu{' '}
            <span style={{ color: 'var(--brand-accent)' }}>agencia</span>.
          </h1>
          <p
            className="max-w-[34ch] text-[15px]"
            style={{ color: 'var(--brand-dark-ink-soft)' }}
          >
            Seis agentes especializados generan estrategia, copy y calendario.
            Vos aprobás.
          </p>

          <ol className="space-y-3">
            {PIPELINE.map((step, i) => {
              const node =
                step.state === 'done'
                  ? {
                      background: 'rgba(27,138,90,0.18)',
                      borderColor: 'var(--brand-success)',
                      color: 'var(--brand-success)',
                    }
                  : step.state === 'running'
                    ? {
                        background: 'rgba(20,171,171,0.18)',
                        borderColor: 'var(--brand-primary-light)',
                        color: 'var(--brand-primary-light)',
                        boxShadow: '0 0 0 4px rgba(13,115,119,0.20)',
                      }
                    : step.state === 'awaiting'
                      ? {
                          background: 'rgba(242,166,90,0.15)',
                          borderColor: 'var(--brand-accent)',
                          color: 'var(--brand-accent)',
                        }
                      : {
                          background: 'rgba(255,255,255,0.04)',
                          borderColor: 'var(--brand-dark-border)',
                          color: 'var(--brand-dark-ink-muted)',
                        };
              const statusColor =
                step.state === 'running'
                  ? 'var(--brand-primary-light)'
                  : step.state === 'awaiting'
                    ? 'var(--brand-accent)'
                    : step.state === 'done'
                      ? 'var(--brand-success)'
                      : 'var(--brand-dark-ink-muted)';
              return (
                <li key={step.name} className="flex items-center gap-4">
                  <span
                    className="flex size-8 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold"
                    style={node}
                  >
                    {step.state === 'done' ? '✓' : i + 1}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-heading text-[13px] font-semibold">
                      {step.name}
                    </span>
                    <span
                      className="font-mono text-[11px]"
                      style={{ color: statusColor }}
                    >
                      {step.status}
                    </span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div
          className="relative grid grid-cols-3 gap-6 border-t pt-6"
          style={{ borderColor: 'var(--brand-dark-border)' }}
        >
          {[
            { label: 'Agentes', val: '6 especializados' },
            { label: 'Decisiones', val: 'Vos, en el centro' },
            { label: 'Modelos', val: 'Claude · GPT-4o · Gemini' },
          ].map((s) => (
            <div key={s.label}>
              <div
                className="font-heading text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--brand-dark-ink-muted)' }}
              >
                {s.label}
              </div>
              <div className="mt-1 font-heading text-sm font-bold leading-tight">
                {s.val}
              </div>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex flex-col justify-center bg-card p-8 md:p-16">
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div className="flex items-center gap-2 md:hidden">
            <Image
              src="/logo-lockup.svg"
              alt="Agentcy"
              width={120}
              height={26}
            />
          </div>
          <header className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              Bienvenida de nuevo
            </h1>
            <p className="text-sm text-muted-foreground">
              Accedé a tu agencia para gestionar a tus clientes.
            </p>
          </header>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
