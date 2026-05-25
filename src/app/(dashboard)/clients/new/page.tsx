import Link from 'next/link';

export default function NewClientPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-8 p-6 py-12">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Nuevo cliente</h1>
        <p className="text-sm text-muted-foreground">
          Elegí cómo querés cargar la información del cliente.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* URL Scraping */}
        <Link
          href="/clients/new/scraping"
          className="group flex flex-col gap-3 rounded-xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-3xl">🔗</span>
          <div className="space-y-1">
            <p className="font-semibold">URL Scraping</p>
            <p className="text-sm text-muted-foreground">
              Pegá la URL del sitio. Analizamos y pre-llenamos el perfil automáticamente.
            </p>
          </div>
          <p className="mt-auto text-xs text-muted-foreground">⏱ ~30 segundos</p>
        </Link>

        {/* Chat conversacional */}
        <Link
          href="/clients/new/chat"
          className="group flex flex-col gap-3 rounded-xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-3xl">💬</span>
          <div className="space-y-1">
            <p className="font-semibold">Chat conversacional</p>
            <p className="text-sm text-muted-foreground">
              Contestá preguntas del asistente una por una. Ideal cuando no tenés sitio web.
            </p>
          </div>
          <p className="mt-auto text-xs text-muted-foreground">⏱ ~5 minutos</p>
        </Link>

        {/* Manual */}
        <Link
          href="/clients/new/manual"
          className="group flex flex-col gap-3 rounded-xl border-2 border-border p-6 transition-all hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="text-3xl">📝</span>
          <div className="space-y-1">
            <p className="font-semibold">Formulario manual</p>
            <p className="text-sm text-muted-foreground">
              Completá todos los campos del perfil de marca a mano con total control.
            </p>
          </div>
          <p className="mt-auto text-xs text-muted-foreground">⏱ ~10 minutos</p>
        </Link>
      </div>
    </main>
  );
}
