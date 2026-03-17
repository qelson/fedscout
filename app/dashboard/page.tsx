import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'
import { OpportunityWithStatus, UserPreferences } from '@/lib/types'
import DashboardClient from './DashboardClient'
import Link from 'next/link'

async function fetchOpportunities(
  supabase: ReturnType<typeof createClient>,
  prefs: UserPreferences,
  userId: string
): Promise<OpportunityWithStatus[]> {
  // Build OR filter: match by NAICS codes OR keywords in title/description
  const filters: string[] = []

  if (prefs.naics_codes?.length) {
    filters.push(`naics_code.in.(${prefs.naics_codes.join(',')})`)
  }

  for (const kw of prefs.keywords ?? []) {
    const safe = kw.replace(/[%_\\]/g, '\\$&')
    if (safe) {
      filters.push(`title.ilike.%${safe}%`, `description.ilike.%${safe}%`)
    }
  }

  let query = supabase
    .from('opportunities')
    .select('*')
    .order('response_deadline', { ascending: true, nullsFirst: false })
    .limit(200)

  if (filters.length) {
    query = query.or(filters.join(','))
  }

  const { data: opps, error } = await query

  if (error || !opps) return []

  // Fetch user statuses for these opportunities
  const { data: userOpps } = await supabase
    .from('user_opportunities')
    .select('opportunity_id, status, id')
    .eq('user_id', userId)

  const statusMap = new Map(
    (userOpps ?? []).map((uo) => [uo.opportunity_id, { status: uo.status, id: uo.id }])
  )

  return opps.map((opp) => {
    const uo = statusMap.get(opp.id)
    return {
      ...opp,
      status: uo?.status ?? null,
      user_opportunity_id: uo?.id ?? null,
    }
  })
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prefs) redirect('/onboarding')

  const opportunities = await fetchOpportunities(supabase, prefs, user.id)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900 tracking-tight">fedscout</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:block">{user.email}</span>
            <Link
              href="/settings"
              className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              title="Settings"
            >
              {/* gear icon */}
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <DashboardClient opportunities={opportunities} />
      </main>
    </div>
  )
}
