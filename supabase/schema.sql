create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  nickname text not null,
  username text not null unique,
  avatar_id text not null default 'royal-1',
  xp integer not null default 0 check (xp >= 0),
  wins integer not null default 0 check (wins >= 0),
  matches_played integer not null default 0 check (matches_played >= 0),
  created_at timestamptz not null default now(),
  last_login_at timestamptz not null default now()
);

create table if not exists public.saved_games (
  user_id uuid primary key references auth.users(id) on delete cascade,
  game_state jsonb not null,
  last_saved_at timestamptz not null default now()
);

create table if not exists public.treasure_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  progress jsonb not null,
  last_saved_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.saved_games enable row level security;
alter table public.treasure_progress enable row level security;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.saved_games to authenticated;
grant select, insert, update, delete on public.treasure_progress to authenticated;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "saved_games_select_own" on public.saved_games;
drop policy if exists "saved_games_insert_own" on public.saved_games;
drop policy if exists "saved_games_update_own" on public.saved_games;
drop policy if exists "saved_games_delete_own" on public.saved_games;
drop policy if exists "treasure_progress_select_own" on public.treasure_progress;
drop policy if exists "treasure_progress_insert_own" on public.treasure_progress;
drop policy if exists "treasure_progress_update_own" on public.treasure_progress;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "saved_games_select_own"
  on public.saved_games for select
  using (auth.uid() = user_id);

create policy "saved_games_insert_own"
  on public.saved_games for insert
  with check (auth.uid() = user_id);

create policy "saved_games_update_own"
  on public.saved_games for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "saved_games_delete_own"
  on public.saved_games for delete
  using (auth.uid() = user_id);

create policy "treasure_progress_select_own"
  on public.treasure_progress for select
  using (auth.uid() = user_id);

create policy "treasure_progress_insert_own"
  on public.treasure_progress for insert
  with check (auth.uid() = user_id);

create policy "treasure_progress_update_own"
  on public.treasure_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.create_profile_on_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_display_name text;
begin
  fallback_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    split_part(coalesce(new.email, 'pemain-cuki@example.com'), '@', 1)
  );

  insert into public.profiles (
    id,
    display_name,
    nickname,
    username,
    avatar_id,
    xp,
    wins,
    matches_played,
    created_at,
    last_login_at
  )
  values (
    new.id,
    fallback_display_name,
    fallback_display_name,
    lower(regexp_replace(fallback_display_name, '[^a-zA-Z0-9_]+', '_', 'g')),
    'royal-1',
    0,
    0,
    0,
    now(),
    now()
  )
  on conflict (id) do update set
    display_name = excluded.display_name,
    nickname = excluded.nickname,
    username = excluded.username,
    last_login_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_on_signup();
