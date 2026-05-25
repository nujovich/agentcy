-- 003_trajectories.sql
-- Data Flywheel: captura de trayectorias para fine-tuning estilo Orchard

-- Cada ejecución de un agente = una trayectoria
create table trajectories (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  brand_profile_id uuid references brand_profiles(id) on delete set null,
  agent_name text not null, -- 'brand-intake' | 'strategy' | 'calendar' | 'copywriter' | 'brief' | 'report'
  status text not null default 'pending' check (status in ('pending','running','completed','failed')),

  -- Input (lo que se le pasó al agente)
  input_schema text not null, -- nombre del schema Zod usado
  input_data jsonb not null,  -- el prompt/datos de entrada

  -- Output (lo que generó el agente)
  output_data jsonb,          -- el JSON que devolvió
  output_tokens integer,      -- tokens de output
  elapsed_ms integer,         -- tiempo de ejecución

  -- Feedback del usuario (aprobación/rechazo/edición)
  feedback_status text check (feedback_status in ('pending','approved','rejected','edited')),
  feedback_edited_output jsonb, -- si el usuario editó, guardar la versión editada
  feedback_at timestamptz,
  feedback_notes text,

  -- Metadatos
  model_used text,            -- qué modelo se usó
  provider_used text,         -- qué proveedor
  trajectory_version integer default 1,
  parent_trajectory_id uuid references trajectories(id), -- para cadenas de edición

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Índices para consultas rápidas
create index trajectories_agency_idx on trajectories(agency_id);
create index trajectories_brand_idx on trajectories(brand_profile_id);
create index trajectories_agent_idx on trajectories(agent_name);
create index trajectories_status_idx on trajectories(feedback_status);
create index trajectories_created_idx on trajectories(created_at desc);

-- Segmentos de trayectoria (para credit-assignment tipo Orchard)
-- Una trayectoria puede tener múltiples segmentos, cada uno
-- marcado como "productivo" o "no productivo"
create table trajectory_segments (
  id uuid primary key default gen_random_uuid(),
  trajectory_id uuid not null references trajectories(id) on delete cascade,
  segment_index integer not null,       -- orden dentro de la trayectoria
  segment_type text not null,           -- 'thought' | 'action' | 'observation' | 'output_part'
  content text not null,                -- el contenido del segmento
  is_productive boolean default true,   -- credit-assignment: ¿este segmento fue útil?
  user_rating smallint check (user_rating between 1 and 5), -- calificación explícita
  created_at timestamptz default now()
);

create index trajectory_segments_traj_idx on trajectory_segments(trajectory_id);

-- Datasets de entrenamiento (agregaciones de trayectorias)
create table training_datasets (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  name text not null,
  description text,
  agent_name text not null,              -- para qué agente es este dataset
  min_trajectories integer not null default 50, -- mínimo para considerar entrenar
  trajectory_count integer default 0,
  status text not null default 'building' check (status in ('building','ready','training','trained','failed')),
  model_base text default 'Qwen3-4B',    -- modelo base usado
  model_fine_tuned text,                 -- referencia al modelo entrenado
  training_cost_usd numeric(10,2),       -- costo del entrenamiento
  metrics_before jsonb,                  -- métricas antes del fine-tuning
  metrics_after jsonb,                   -- métricas después
  trained_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index training_datasets_agency_idx on training_datasets(agency_id);

-- Modelos fine-tuneados por agencia
create table fine_tuned_models (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  dataset_id uuid references training_datasets(id) on delete set null,
  agent_name text not null,
  model_name text not null,              -- nombre del modelo (ej: "agentcy-copywriter-agencia-1")
  model_version integer default 1,
  base_model text not null default 'Qwen3-4B',
  huggingface_id text,                   -- si está subido a HF
  status text not null default 'training' check (status in ('training','active','archived','failed')),
  quality_score numeric(5,2),            -- score de evaluación
  trajectory_count integer,              -- con cuántas trayectorias se entrenó
  training_time_minutes integer,
  cost_usd numeric(10,2),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  activated_at timestamptz,
  last_used_at timestamptz
);

create index fine_tuned_models_agency_idx on fine_tuned_models(agency_id);

-- Row Level Security
alter table trajectories enable row level security;
alter table trajectory_segments enable row level security;
alter table training_datasets enable row level security;
alter table fine_tuned_models enable row level security;

-- Policies: cada agencia ve solo sus datos
create policy "trajectories_select_own" on trajectories for select
  using (agency_id = (select id from agencies where id = auth.uid()));
create policy "trajectories_insert_own" on trajectories for insert
  with check (agency_id = (select id from agencies where id = auth.uid()));
create policy "trajectories_update_own" on trajectories for update
  using (agency_id = (select id from agencies where id = auth.uid()));

create policy "segments_select_own" on trajectory_segments for select
  using (trajectory_id in (select id from trajectories where agency_id = auth.uid()));
create policy "segments_insert_own" on trajectory_segments for insert
  with check (trajectory_id in (select id from trajectories where agency_id = auth.uid()));

create policy "datasets_select_own" on training_datasets for select
  using (agency_id = (select id from agencies where id = auth.uid()));
create policy "models_select_own" on fine_tuned_models for select
  using (agency_id = (select id from agencies where id = auth.uid()));

-- RPC: estadísticas rápidas de trayectorias
create or replace function get_trajectory_stats(p_agency_id uuid)
returns jsonb language plpgsql as $$
declare
  result jsonb;
begin
  select jsonb_build_object(
    'total', count(*),
    'byAgent', (
      select jsonb_object_agg(agent_name, cnt)
      from (select agent_name, count(*) as cnt from trajectories where agency_id = p_agency_id group by agent_name) sub
    ),
    'byFeedback', (
      select jsonb_object_agg(feedback_status, cnt)
      from (select feedback_status, count(*) as cnt from trajectories where agency_id = p_agency_id group by feedback_status) sub
    ),
    'approved', count(*) filter (where feedback_status = 'approved'),
    'rejected', count(*) filter (where feedback_status = 'rejected'),
    'edited', count(*) filter (where feedback_status = 'edited')
  ) into result
  from trajectories
  where agency_id = p_agency_id;

  return result;
end;
$$;