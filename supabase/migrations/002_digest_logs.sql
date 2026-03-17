create table public.digest_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sent_at timestamptz not null default now(),
  opportunity_count int not null
);

alter table public.digest_logs enable row level security;

create policy "Users can view their own digest logs"
  on public.digest_logs for select
  using (auth.uid() = user_id);
