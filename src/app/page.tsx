import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const PIPELINE = [
  { name: "Brand Intake", status: "Aprobado", state: "done" },
  { name: "Strategy", status: "Aprobado", state: "done" },
  { name: "Copy", status: "Corriendo…", state: "running" },
  { name: "Visual Brief", status: "Pendiente", state: "locked" },
  { name: "Calendar", status: "Pendiente", state: "locked" },
  { name: "Report", status: "Pendiente", state: "locked" },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Image
          src="/logo-lockup.svg"
          alt="Agentcy"
          width={132}
          height={28}
          priority
        />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/login">Crear cuenta</Link>
          </Button>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 md:py-20">
        <section className="grid items-center gap-12 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <span className="eyebrow">Sala de control · Humanos al mando</span>
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              La agencia detrás de tu{" "}
              <span className="text-[var(--brand-accent)]">agencia</span>.
            </h1>
            <p className="max-w-prose text-base text-muted-foreground md:text-lg">
              Seis agentes especializados generan estrategia, copy, briefs
              visuales y calendario. Vos revisás, editás y aprobás antes de que
              corra el siguiente.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/login">Empezar gratis</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/login">Ver demo</Link>
              </Button>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              Claude · GPT-4o · Gemini · Hermes
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <span className="eyebrow">Pipeline</span>
              <span className="font-mono text-[11px] text-muted-foreground">
                cliente · Aurora Studio
              </span>
            </div>
            <ol className="space-y-3">
              {PIPELINE.map((step, i) => (
                <li key={step.name} className="flex items-center gap-3">
                  <span
                    className="flex size-7 items-center justify-center rounded-full border-2 font-mono text-[11px] font-semibold"
                    style={
                      step.state === "done"
                        ? {
                            background: "var(--brand-success)",
                            borderColor: "var(--brand-success)",
                            color: "#fff",
                          }
                        : step.state === "running"
                          ? {
                              background: "var(--card)",
                              borderColor: "var(--brand-primary)",
                              color: "var(--brand-primary)",
                              boxShadow: "var(--shadow-glow-primary)",
                            }
                          : {
                              background: "var(--brand-surface-2)",
                              borderColor: "var(--brand-border)",
                              color: "var(--brand-ink-muted)",
                            }
                    }
                  >
                    {step.state === "done" ? "✓" : i + 1}
                  </span>
                  <div className="flex flex-1 items-baseline justify-between">
                    <span className="font-heading text-sm font-semibold">
                      {step.name}
                    </span>
                    <span
                      className="font-mono text-[11px]"
                      style={{
                        color:
                          step.state === "running"
                            ? "var(--brand-primary)"
                            : step.state === "done"
                              ? "var(--brand-success)"
                              : "var(--brand-ink-muted)",
                      }}
                    >
                      {step.status}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              eyebrow: "Agentes",
              title: "6 especializados",
              body: "Brand Intake, Strategy, Copy, Visual Brief, Calendar y Report. Cada uno enfocado en una tarea.",
            },
            {
              eyebrow: "Decisiones",
              title: "Vos, en el centro",
              body: "Ningún output se publica sin tu aprobación. La IA propone, vos editás y firmás.",
            },
            {
              eyebrow: "Modelos",
              title: "Provider transparente",
              body: "Elegí Claude, GPT-4o, Gemini o Hermes por agente. Tu cliente nunca ve qué hay detrás.",
            },
          ].map((f) => (
            <article
              key={f.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="eyebrow">{f.eyebrow}</div>
              <h2 className="mt-2 text-lg font-semibold">{f.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
            </article>
          ))}
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6 text-xs text-muted-foreground">
        <span>© Agentcy</span>
        <span className="font-mono">v0.1 · hecho en Buenos Aires</span>
      </footer>
    </div>
  );
}
