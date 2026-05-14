-- 001_initial.sql
-- Awake Agentic SaaS — initial schema with RLS

create extension if not exists "pgcrypto";

-- agencies -----------------------------------------------------------------
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  created_at timestamptz default now()
);

alter table agencies enable row level security;

create policy "agencies_select_own"
  on agencies for select
  using (id = auth.uid());

create policy "agencies_insert_own"
  on agencies for insert
  with check (id = auth.uid());

create policy "agencies_update_own"
  on agencies for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "agencies_delete_own"
  on agencies for delete
  using (id = auth.uid());

-- brand_profiles -----------------------------------------------------------
create table brand_profiles (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  client_name text not null,
  industry text not null,
  location text,
  website text,
  social_urls jsonb not null default '{}'::jsonb,
  voice jsonb not null,
  audience jsonb not null,
  content_pillars text[] not null,
  competitors text[] not null default '{}',
  goals text[] not null default '{}',
  visual_kit jsonb not null,
  pack text not null check (pack in ('esencial','gold','pro','elite')),
  provider text not null check (provider in ('anthropic','openai','google')),
  provider_model text not null,
  status text not null default 'draft' check (status in ('draft','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index brand_profiles_agency_id_idx on brand_profiles(agency_id);

alter table brand_profiles enable row level security;

create policy "brand_profiles_select_own"
  on brand_profiles for select
  using (agency_id = auth.uid());

create policy "brand_profiles_insert_own"
  on brand_profiles for insert
  with check (agency_id = auth.uid());

create policy "brand_profiles_update_own"
  on brand_profiles for update
  using (agency_id = auth.uid())
  with check (agency_id = auth.uid());

create policy "brand_profiles_delete_own"
  on brand_profiles for delete
  using (agency_id = auth.uid());

-- strategy_docs ------------------------------------------------------------
create table strategy_docs (
  id uuid primary key default gen_random_uuid(),
  brand_profile_id uuid not null references brand_profiles(id) on delete cascade,
  month text not null,
  objective text not null,
  monthly_theme text not null,
  content_pillars jsonb not null,
  formats jsonb not null,
  tone_of_month text not null,
  key_dates text[] not null default '{}',
  hooks text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index strategy_docs_brand_profile_id_idx on strategy_docs(brand_profile_id);
create unique index strategy_docs_brand_month_idx on strategy_docs(brand_profile_id, month);

alter table strategy_docs enable row level security;

create policy "strategy_docs_select_own"
  on strategy_docs for select
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = strategy_docs.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "strategy_docs_insert_own"
  on strategy_docs for insert
  with check (
    exists (
      select 1 from brand_profiles bp
      where bp.id = strategy_docs.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "strategy_docs_update_own"
  on strategy_docs for update
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = strategy_docs.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "strategy_docs_delete_own"
  on strategy_docs for delete
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = strategy_docs.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

-- calendar_entries ---------------------------------------------------------
create table calendar_entries (
  id uuid primary key default gen_random_uuid(),
  brand_profile_id uuid not null references brand_profiles(id) on delete cascade,
  month text not null,
  date date not null,
  format text not null check (format in ('post','reel','story','carousel')),
  pillar text not null,
  hook text not null,
  caption_brief text not null,
  status text not null default 'draft' check (status in ('draft','in_review','approved','published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index calendar_entries_brand_profile_id_idx on calendar_entries(brand_profile_id);
create index calendar_entries_month_idx on calendar_entries(brand_profile_id, month);

alter table calendar_entries enable row level security;

create policy "calendar_entries_select_own"
  on calendar_entries for select
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = calendar_entries.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "calendar_entries_insert_own"
  on calendar_entries for insert
  with check (
    exists (
      select 1 from brand_profiles bp
      where bp.id = calendar_entries.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "calendar_entries_update_own"
  on calendar_entries for update
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = calendar_entries.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "calendar_entries_delete_own"
  on calendar_entries for delete
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = calendar_entries.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

-- copies -------------------------------------------------------------------
create table copies (
  id uuid primary key default gen_random_uuid(),
  calendar_entry_id uuid not null references calendar_entries(id) on delete cascade,
  hook text not null,
  body text not null,
  cta text not null,
  hashtags text[] not null default '{}',
  alt_text text not null,
  reel_script text,
  version int not null default 1,
  status text not null default 'draft' check (status in ('draft','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index copies_calendar_entry_id_idx on copies(calendar_entry_id);

alter table copies enable row level security;

create policy "copies_select_own"
  on copies for select
  using (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = copies.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "copies_insert_own"
  on copies for insert
  with check (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = copies.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "copies_update_own"
  on copies for update
  using (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = copies.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "copies_delete_own"
  on copies for delete
  using (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = copies.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

-- visual_briefs ------------------------------------------------------------
create table visual_briefs (
  id uuid primary key default gen_random_uuid(),
  calendar_entry_id uuid not null references calendar_entries(id) on delete cascade,
  format jsonb not null,
  palette text[] not null default '{}',
  typography jsonb not null,
  layout text not null,
  mood text not null,
  elements text[] not null default '{}',
  canva_template_hint text not null,
  status text not null default 'draft' check (status in ('draft','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index visual_briefs_calendar_entry_id_idx on visual_briefs(calendar_entry_id);

alter table visual_briefs enable row level security;

create policy "visual_briefs_select_own"
  on visual_briefs for select
  using (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = visual_briefs.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "visual_briefs_insert_own"
  on visual_briefs for insert
  with check (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = visual_briefs.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "visual_briefs_update_own"
  on visual_briefs for update
  using (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = visual_briefs.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "visual_briefs_delete_own"
  on visual_briefs for delete
  using (
    exists (
      select 1 from calendar_entries ce
      join brand_profiles bp on bp.id = ce.brand_profile_id
      where ce.id = visual_briefs.calendar_entry_id
      and bp.agency_id = auth.uid()
    )
  );

-- monthly_reports ----------------------------------------------------------
create table monthly_reports (
  id uuid primary key default gen_random_uuid(),
  brand_profile_id uuid not null references brand_profiles(id) on delete cascade,
  month text not null,
  pdf_url text,
  metadata jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft','approved')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index monthly_reports_brand_profile_id_idx on monthly_reports(brand_profile_id);
create unique index monthly_reports_brand_month_idx on monthly_reports(brand_profile_id, month);

alter table monthly_reports enable row level security;

create policy "monthly_reports_select_own"
  on monthly_reports for select
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = monthly_reports.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "monthly_reports_insert_own"
  on monthly_reports for insert
  with check (
    exists (
      select 1 from brand_profiles bp
      where bp.id = monthly_reports.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "monthly_reports_update_own"
  on monthly_reports for update
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = monthly_reports.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );

create policy "monthly_reports_delete_own"
  on monthly_reports for delete
  using (
    exists (
      select 1 from brand_profiles bp
      where bp.id = monthly_reports.brand_profile_id
      and bp.agency_id = auth.uid()
    )
  );
