import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import Link from 'next/link'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: prefs }, { data: profile }] = await Promise.all([
    supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('stripe_customer_id, stripe_subscription_status').eq('id', user.id).single(),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
              ← Back
            </Link>
            <span className="text-base font-semibold text-gray-900">Settings</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <form action={logout}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <SettingsClient
          initialPrefs={prefs}
          stripeCustomerId={profile?.stripe_customer_id ?? null}
          subscriptionStatus={profile?.stripe_subscription_status ?? null}
        />
      </main>
    </div>
  )
}
