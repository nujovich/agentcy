'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

type Mode = 'sign_in' | 'sign_up';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialError = searchParams.get('error');

  const [mode, setMode] = useState<Mode>('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(initialError);

  const supabase = createClient();

  const signInWithGoogle = async () => {
    setError(null);
    setLoading('google');
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(null);
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading('email');
    try {
      if (mode === 'sign_in') {
        const { error: signError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signError) throw new Error(signError.message);
      } else {
        const { error: signError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signError) throw new Error(signError.message);
      }
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de autenticación');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="outline"
        onClick={signInWithGoogle}
        disabled={loading !== null}
        className="w-full"
      >
        {loading === 'google' ? 'Redirigiendo a Google...' : 'Continuar con Google'}
      </Button>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>o</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submitEmail} className="space-y-3">
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
        <label className="block space-y-1 text-sm">
          <span className="font-medium">Contraseña</span>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
        </label>
        <Button type="submit" disabled={loading !== null} className="w-full">
          {loading === 'email'
            ? 'Procesando...'
            : mode === 'sign_in'
              ? 'Iniciar sesión'
              : 'Crear cuenta'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in')}
        className="block w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        {mode === 'sign_in'
          ? '¿No tenés cuenta? Crear una'
          : '¿Ya tenés cuenta? Iniciar sesión'}
      </button>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
