create table public.contract_briefs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  opportunity_id uuid not null references public.opportunities(id) on delete cascade,
  brief text not null,
  created_at timestamptz not null default now(),
  unique(user_id, opportunity_id)
);

alter table public.contract_briefs enable row level security;

create policy "Users can manage their own briefs"
  on public.contract_briefs for all
  using (auth.uid() = user_id);
