import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect('/dashboard');

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-6">
      <div className="space-y-6 rounded-lg border border-border bg-card p-6 shadow-sm">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">
            Accedé a tu agencia para gestionar a tus clientes.
          </p>
        </header>
        <LoginForm />
      </div>
    </main>
  );
}
