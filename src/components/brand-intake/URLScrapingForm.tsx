'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface URLScrapingFormProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

export function URLScrapingForm({ onSubmit, isLoading }: URLScrapingFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('La URL debe comenzar con http:// o https://');
      return;
    }
    onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div className="space-y-1">
        <label htmlFor="url" className="block text-sm font-medium">
          URL del sitio web
        </label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.ejemplo.com"
          disabled={isLoading}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-50"
        />
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
      </div>

      <Button type="submit" disabled={isLoading || !url.trim()} className="w-full">
        {isLoading ? 'Analizando sitio...' : 'Escanear y pre-llenar'}
      </Button>

      <p className="text-xs text-muted-foreground">
        Analizamos el sitio y pre-completamos el perfil de marca. Tarda ~30 segundos.
      </p>
    </form>
  );
}
