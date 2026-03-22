-- Add missing columns to user_preferences that the quiz and onboarding wizard write to
alter table public.user_preferences add column if not exists certifications text[] default '{}';
alter table public.user_preferences add column if not exists min_contract_value bigint;
alter table public.user_preferences add column if not exists max_contract_value bigint;
alter table public.user_preferences add column if not exists excluded_agencies text[] default '{}';
alter table public.user_preferences add column if not exists min_score_threshold int default 0;
