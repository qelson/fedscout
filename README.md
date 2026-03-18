# FedScout

Federal contract intelligence for small businesses. FedScout monitors SAM.gov daily, scores opportunities against your NAICS codes and keywords, and delivers matching contracts to your inbox every morning.

## What it does

- **Daily digest emails** — matched contracts scored and delivered at 8am EST
- **Weekly summary emails** — pipeline stats, closing deadlines, top new matches
- **AI contract briefs** — one-click Go/No-Go analysis powered by Claude
- **Match scoring** — 0–100 relevance score based on NAICS, keywords, agency, value, set-aside type
- **Pipeline tracking** — mark contracts as Pursuing / Interested / Pass with notes and custom dates
- **Stripe billing** — $49/month with 14-day free trial

## Tech Stack

- **Frontend**: Next.js 14 App Router, Tailwind CSS, React Email
- **Backend**: Supabase (Postgres + Auth + RLS), Next.js API routes
- **Email**: Resend + React Email templates
- **AI**: Anthropic Claude (`claude-sonnet-4-20250514`)
- **Payments**: Stripe subscriptions with webhook handling
- **Deployment**: Vercel (with cron jobs)

## Running locally

```bash
npm install
npm run dev
```

## Environment variables

Create a `.env.local` file with:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Anthropic
ANTHROPIC_API_KEY=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=digest@fedscout.io

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=your-secret-here
```

## Database setup

Run migrations in order:

```bash
# In Supabase SQL editor or via CLI:
supabase/migrations/001_initial.sql
supabase/migrations/002_user_preferences.sql
supabase/migrations/003_contract_briefs.sql
```

Additional columns required (run in Supabase SQL editor):

```sql
alter table public.user_opportunities add column if not exists notes text;
alter table public.user_opportunities add column if not exists bid_due_date date;
alter table public.user_opportunities add column if not exists decision_date date;
```

## Seeding opportunities

The `/api/sync-opportunities` endpoint fetches from SAM.gov and populates the `opportunities` table. It runs daily at 6am via Vercel cron. To seed locally, call it manually:

```bash
curl -X GET http://localhost:3000/api/sync-opportunities \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Cron jobs (Vercel)

| Schedule | Endpoint | Description |
|----------|----------|-------------|
| `0 6 * * *` | `/api/sync-opportunities` | Sync SAM.gov contracts |
| `0 8 * * *` | `/api/cron/digest` | Send daily digest emails |
| `0 9 * * 1` | `/api/send-weekly-summary` | Send Monday weekly summary |
