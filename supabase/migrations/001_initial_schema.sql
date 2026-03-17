-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  created_at timestamptz not null default now(),
  stripe_customer_id text,
  stripe_subscription_status text
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- user_preferences table
create table public.user_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  naics_codes text[] not null default '{}',
  keywords text[] not null default '{}',
  min_value bigint,
  max_value bigint,
  agencies text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_preferences enable row level security;

create policy "Users can manage their own preferences"
  on public.user_preferences for all
  using (auth.uid() = user_id);

-- opportunities table
create table public.opportunities (
  id uuid primary key default uuid_generate_v4(),
  sam_notice_id text not null unique,
  title text not null,
  agency text not null,
  naics_code text not null,
  posted_date date not null,
  response_deadline date,
  estimated_value_min bigint,
  estimated_value_max bigint,
  description text not null,
  sam_url text not null,
  created_at timestamptz not null default now()
);

alter table public.opportunities enable row level security;

create policy "Opportunities are publicly readable"
  on public.opportunities for select
  using (true);

-- user_opportunities table
create table public.user_opportunities (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  status text not null default 'new' check (status in ('new', 'interested', 'pursuing', 'pass')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, opportunity_id)
);

alter table public.user_opportunities enable row level security;

create policy "Users can manage their own opportunity statuses"
  on public.user_opportunities for all
  using (auth.uid() = user_id);
