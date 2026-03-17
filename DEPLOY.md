# Deployment Checklist

## 1. Supabase
- [ ] Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL editor
- [ ] Run `supabase/migrations/002_digest_logs.sql`
- [ ] Add production domain to **Authentication → URL Configuration → Redirect URLs**
  - e.g. `https://your-app.vercel.app/**`
- [ ] Copy Project URL and anon key from **Project Settings → API**
- [ ] Copy service role key from the same page (keep secret)

## 2. Stripe
- [ ] Create product "fedscout Pro" at dashboard.stripe.com → Products
- [ ] Add a recurring price: $49/month
- [ ] Enable 14-day trial on the price (or it's handled in code via `trial_period_days: 14`)
- [ ] Copy **Price ID** (price_...)
- [ ] Copy **Publishable key** and **Secret key** from Developers → API keys
- [ ] After deploying, add webhook endpoint in Stripe Dashboard:
  - URL: `https://your-app.vercel.app/api/stripe/webhook`
  - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Copy the **Signing secret** (whsec_...)
- [ ] Enable **Billing Portal** in Stripe Dashboard → Settings → Billing Portal

## 3. Resend
- [ ] Create account at resend.com
- [ ] Add and verify your sending domain
- [ ] Create an API key
- [ ] Set RESEND_FROM_EMAIL to a verified address on your domain

## 4. Vercel
- [ ] Push repo to GitHub (already done)
- [ ] Go to vercel.com → New Project → Import from GitHub → select `fedscout`
- [ ] Add all environment variables in Project Settings → Environment Variables:

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SAM_GOV_API_KEY
CRON_SECRET              (generate a random secret, e.g. openssl rand -hex 32)
RESEND_API_KEY
RESEND_FROM_EMAIL
NEXT_PUBLIC_APP_URL      (https://your-app.vercel.app)
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET    (add after deploying — Stripe needs the live URL first)
STRIPE_PRICE_ID
```

- [ ] Deploy
- [ ] Verify cron job is active: Vercel Dashboard → Project → Cron Jobs

## 5. Seed the database
```bash
npm run seed
```
(Run locally after filling in .env.local with real keys)

## 6. Full flow test
1. Sign up with a new email
2. Complete onboarding wizard
3. Hit /pricing → Start Free Trial → Stripe test checkout (use card 4242 4242 4242 4242)
4. Confirm redirect to /dashboard
5. Check Supabase profiles table for stripe_customer_id + status = 'trialing'
6. Go to /settings → Send test digest → check email
7. Test billing portal link
