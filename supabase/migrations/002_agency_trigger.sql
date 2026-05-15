-- 002_agency_trigger.sql
-- Auto-crea una fila en agencies cuando se registra un nuevo usuario en auth.users.
-- ON CONFLICT DO NOTHING garantiza idempotencia ante reinicios o llamadas duplicadas.

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.agencies (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
