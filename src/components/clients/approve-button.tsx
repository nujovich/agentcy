'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface ApproveButtonProps {
  profileId: string;
}

export function ApproveButton({ profileId }: ApproveButtonProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approve = async () => {
    setIsApproving(true);
    setError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay sesión activa');

      const { error: dbError } = await supabase
        .from('brand_profiles')
        .update({ status: 'approved' })
        .eq('id', profileId)
        .eq('agency_id', user.id);

      if (dbError) throw new Error(dbError.message);

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al aprobar');
      setIsApproving(false);
    }
  };

  return (
    <div className="space-y-1">
      <Button onClick={approve} disabled={isApproving} className="w-full" size="lg">
        {isApproving ? 'Aprobando...' : 'Aprobar perfil de marca'}
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
