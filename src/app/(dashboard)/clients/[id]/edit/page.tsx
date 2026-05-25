import { notFound } from 'next/navigation';

import { EditProfileForm } from '@/components/clients/edit-profile-form';
import { dbToBrandProfile } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/server';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditClientPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: row, error } = await supabase
    .from('brand_profiles')
    .select('*')
    .eq('id', id)
    .eq('agency_id', user.id)
    .single();

  if (error || !row) notFound();

  const profile = dbToBrandProfile(row);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header className="space-y-1">
        <p className="text-xs text-muted-foreground">
          <a href={`/clients/${id}`} className="hover:underline">
            ← Volver al perfil
          </a>
        </p>
        <h1 className="text-2xl font-semibold">Editar perfil</h1>
        <p className="text-sm text-muted-foreground">{profile.clientName}</p>
      </header>
      <EditProfileForm profile={profile} />
    </main>
  );
}
