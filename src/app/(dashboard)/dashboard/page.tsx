import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profiles } = await supabase
    .from('brand_profiles')
    .select('id, client_name, industry, status, created_at')
    .eq('agency_id', user?.id ?? '')
    .order('created_at', { ascending: false });

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button asChild>
          <Link href="/clients/new">Nuevo cliente</Link>
        </Button>
      </header>

      <section className="rounded-lg border border-border bg-card">
        <header className="border-b border-border p-4">
          <h2 className="text-lg font-medium">Brand Profiles</h2>
        </header>
        {profiles && profiles.length > 0 ? (
          <ul className="divide-y divide-border">
            {profiles.map((p) => (
              <li key={p.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{p.client_name}</p>
                  <p className="text-xs text-muted-foreground">{p.industry}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-4 text-sm text-muted-foreground">
            Todavía no tenés brand profiles. Creá tu primer cliente.
          </p>
        )}
      </section>
    </main>
  );
}
