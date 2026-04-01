create extension if not exists "pgcrypto";

create or replace function public.is_owner(target_parent_id uuid)
returns boolean
language sql
stable
as $$
  select auth.uid() = target_parent_id;
$$;

create table if not exists public.parent_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parent_accounts(id) on delete cascade,
  name text not null,
  avatar_color text not null default '#ff0000',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists child_profiles_default_parent_idx
  on public.child_profiles(parent_id)
  where is_default = true;

create table if not exists public.profile_filters (
  profile_id uuid primary key references public.child_profiles(id) on delete cascade,
  block_shorts boolean not null default true,
  min_secs integer not null default 60,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_keywords (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.child_profiles(id) on delete cascade,
  keyword text not null,
  created_at timestamptz not null default now(),
  unique (profile_id, keyword)
);

create table if not exists public.channels (
  id text primary key,
  name text not null,
  handle text,
  subscribers text,
  color text not null default '#ff0000',
  category text not null default 'Family',
  thumb text,
  builtin boolean not null default false,
  created_by uuid references public.parent_accounts(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_channels (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.child_profiles(id) on delete cascade,
  channel_id text not null references public.channels(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (profile_id, channel_id)
);

create table if not exists public.approved_videos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.child_profiles(id) on delete cascade,
  video_id text not null,
  youtube_id text,
  title text not null,
  channel_id text,
  channel_name text,
  thumb text,
  approved_at timestamptz not null default now(),
  unique (profile_id, video_id)
);

create table if not exists public.pinned_videos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.child_profiles(id) on delete cascade,
  video_id text not null,
  youtube_id text,
  title text not null,
  channel_id text,
  channel_name text,
  thumb text,
  duration_label text,
  views_label text,
  published_date text,
  description text,
  pinned_at timestamptz not null default now(),
  unique (profile_id, video_id)
);

create table if not exists public.unlock_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.child_profiles(id) on delete cascade,
  video_id text not null,
  title text not null,
  channel_name text,
  thumb text,
  is_short boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  requested_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique (profile_id, video_id, status)
);

create table if not exists public.watch_history (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.child_profiles(id) on delete cascade,
  video_id text not null,
  title text not null,
  channel_id text,
  channel_name text,
  thumb text,
  duration_label text,
  watched_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists parent_accounts_set_updated_at on public.parent_accounts;
create trigger parent_accounts_set_updated_at
before update on public.parent_accounts
for each row execute function public.set_updated_at();

drop trigger if exists child_profiles_set_updated_at on public.child_profiles;
create trigger child_profiles_set_updated_at
before update on public.child_profiles
for each row execute function public.set_updated_at();

drop trigger if exists profile_filters_set_updated_at on public.profile_filters;
create trigger profile_filters_set_updated_at
before update on public.profile_filters
for each row execute function public.set_updated_at();

drop trigger if exists channels_set_updated_at on public.channels;
create trigger channels_set_updated_at
before update on public.channels
for each row execute function public.set_updated_at();

create or replace function public.bootstrap_parent_account()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.parent_accounts (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.bootstrap_parent_account();

alter table public.parent_accounts enable row level security;
alter table public.child_profiles enable row level security;
alter table public.profile_filters enable row level security;
alter table public.profile_keywords enable row level security;
alter table public.channels enable row level security;
alter table public.profile_channels enable row level security;
alter table public.approved_videos enable row level security;
alter table public.pinned_videos enable row level security;
alter table public.unlock_requests enable row level security;
alter table public.watch_history enable row level security;

create policy "parents can view own account"
on public.parent_accounts
for select
using (public.is_owner(id));

create policy "parents can insert own account"
on public.parent_accounts
for insert
with check (public.is_owner(id));

create policy "parents can update own account"
on public.parent_accounts
for update
using (public.is_owner(id));

create policy "parents can manage own child profiles"
on public.child_profiles
for all
using (public.is_owner(parent_id))
with check (public.is_owner(parent_id));

create policy "parents can manage own profile filters"
on public.profile_filters
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = profile_filters.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = profile_filters.profile_id
      and public.is_owner(cp.parent_id)
  )
);

create policy "parents can manage own profile keywords"
on public.profile_keywords
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = profile_keywords.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = profile_keywords.profile_id
      and public.is_owner(cp.parent_id)
  )
);

create policy "parents can read builtin or owned channels"
on public.channels
for select
using (builtin = true or public.is_owner(created_by));

create policy "parents can create channels they own"
on public.channels
for insert
with check (created_by is null or public.is_owner(created_by));

create policy "parents can update owned channels"
on public.channels
for update
using (public.is_owner(created_by))
with check (public.is_owner(created_by));

create policy "parents can delete owned channels"
on public.channels
for delete
using (public.is_owner(created_by));

create policy "parents can manage own profile channels"
on public.profile_channels
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = profile_channels.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = profile_channels.profile_id
      and public.is_owner(cp.parent_id)
  )
);

create policy "parents can manage own approvals"
on public.approved_videos
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = approved_videos.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = approved_videos.profile_id
      and public.is_owner(cp.parent_id)
  )
);

create policy "parents can manage own pinned videos"
on public.pinned_videos
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = pinned_videos.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = pinned_videos.profile_id
      and public.is_owner(cp.parent_id)
  )
);

create policy "parents can manage own unlock requests"
on public.unlock_requests
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = unlock_requests.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = unlock_requests.profile_id
      and public.is_owner(cp.parent_id)
  )
);

create policy "parents can manage own watch history"
on public.watch_history
for all
using (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = watch_history.profile_id
      and public.is_owner(cp.parent_id)
  )
)
with check (
  exists (
    select 1
    from public.child_profiles cp
    where cp.id = watch_history.profile_id
      and public.is_owner(cp.parent_id)
  )
);
