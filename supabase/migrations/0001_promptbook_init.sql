-- Копия миграции, применённой в SQL Editor 2026-09-12.
-- Хранится в репозитории для истории и повторного применения на новых проектах.
-- Идемпотентная, безопасна к повторному запуску.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null,
  display_name text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists public.prompts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 200),
  body        text not null check (char_length(body) between 1 and 20000),
  variables   jsonb not null default '[]'::jsonb,
  tags        text[] not null default '{}',
  model       text not null default 'sonar' check (model in ('sonar','sonar-pro')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists prompts_user_idx    on public.prompts(user_id);
create index if not exists prompts_updated_idx on public.prompts(updated_at desc);
create index if not exists prompts_tags_gin    on public.prompts using gin (tags);
create index if not exists prompts_search_idx  on public.prompts using gin (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(body,'')));

create table if not exists public.prompt_runs (
  id                uuid primary key default gen_random_uuid(),
  prompt_id         uuid not null references public.prompts(id) on delete cascade,
  user_id           uuid not null references public.profiles(id) on delete cascade,
  variable_values   jsonb not null default '{}'::jsonb,
  assembled_prompt  text not null,
  model             text not null,
  response_text     text,
  status            text not null check (status in ('pending','ok','error')),
  error_message     text,
  tokens_in         integer,
  tokens_out        integer,
  latency_ms        integer,
  rating            text check (rating in ('up','down')),
  created_at        timestamptz not null default now()
);

create index if not exists prompt_runs_user_idx    on public.prompt_runs(user_id);
create index if not exists prompt_runs_prompt_idx  on public.prompt_runs(prompt_id);
create index if not exists prompt_runs_created_idx on public.prompt_runs(created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at := now(); return new; end; $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists prompts_set_updated_at on public.prompts;
create trigger prompts_set_updated_at before update on public.prompts
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles     enable row level security;
alter table public.prompts      enable row level security;
alter table public.prompt_runs  enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "prompts_select_own" on public.prompts;
create policy "prompts_select_own" on public.prompts for select using (auth.uid() = user_id);
drop policy if exists "prompts_insert_own" on public.prompts;
create policy "prompts_insert_own" on public.prompts for insert with check (auth.uid() = user_id);
drop policy if exists "prompts_update_own" on public.prompts;
create policy "prompts_update_own" on public.prompts for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "prompts_delete_own" on public.prompts;
create policy "prompts_delete_own" on public.prompts for delete using (auth.uid() = user_id);

drop policy if exists "prompt_runs_select_own" on public.prompt_runs;
create policy "prompt_runs_select_own" on public.prompt_runs for select using (auth.uid() = user_id);
drop policy if exists "prompt_runs_insert_own" on public.prompt_runs;
create policy "prompt_runs_insert_own" on public.prompt_runs for insert with check (auth.uid() = user_id);
drop policy if exists "prompt_runs_update_own" on public.prompt_runs;
create policy "prompt_runs_update_own" on public.prompt_runs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
