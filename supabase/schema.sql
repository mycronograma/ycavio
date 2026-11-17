-- ============================================================================
-- my cronograma - Estudo Inteligente (Schema Supabase + Row Level Security)
-- Cole e execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Perfis de estudante (1:1 com auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text not null default '',
  avatar_seed text,
  preset_chosen boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Workspace completo de estudos (1:1 com auth.users)
create table if not exists public.study_workspaces (
  user_id uuid primary key references auth.users(id) on delete cascade,
  profile_settings jsonb not null default '{}'::jsonb,
  subjects jsonb not null default '[]'::jsonb,
  tasks jsonb not null default '[]'::jsonb,
  reviews jsonb not null default '[]'::jsonb,
  sessions jsonb not null default '[]'::jsonb,
  achievements jsonb not null default '[]'::jsonb,
  daily_goal jsonb not null default '{}'::jsonb,
  question_logs jsonb not null default '[]'::jsonb,
  fixed_commitments jsonb not null default '[]'::jsonb,
  notifications jsonb not null default '[]'::jsonb,
  last_schedule_generated_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 3. Trigger automático de updated_at
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

drop trigger if exists set_study_workspaces_updated_at on public.study_workspaces;
create trigger set_study_workspaces_updated_at
  before update on public.study_workspaces
  for each row execute function public.handle_updated_at();

-- 4. Bootstrap automático ao cadastrar um novo usuário no Supabase Auth
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, preset_chosen, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1)),
    coalesce(new.email, ''),
    false,
    false
  )
  on conflict (id) do nothing;

  insert into public.study_workspaces (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 5. Segurança: Row Level Security (cada usuário acessa apenas seus dados)
alter table public.profiles enable row level security;
alter table public.study_workspaces enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "workspaces_select_own" on public.study_workspaces;
create policy "workspaces_select_own"
  on public.study_workspaces for select
  using (auth.uid() = user_id);

drop policy if exists "workspaces_insert_own" on public.study_workspaces;
create policy "workspaces_insert_own"
  on public.study_workspaces for insert
  with check (auth.uid() = user_id);

drop policy if exists "workspaces_update_own" on public.study_workspaces;
create policy "workspaces_update_own"
  on public.study_workspaces for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
