import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OpportunityWithStatus, UserPreferences } from '@/lib/types'
import DashboardClient from './DashboardClient'

async function fetchOpportunities(
  supabase: ReturnType<typeof createClient>,
  prefs: UserPreferences,
  userId: string
): Promise<OpportunityWithStatus[]> {
  // Fetch all opportunities — scoring happens client-side
  const { data: opps, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('response_deadline', { ascending: true, nullsFirst: false })
    .limit(500)

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

  const [{ data: prefs }, { data: profile }] = await Promise.all([
    supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('stripe_subscription_status').eq('id', user.id).single(),
  ])

  if (!prefs) redirect('/onboarding')

  const status = profile?.stripe_subscription_status
  if (status !== 'active' && status !== 'trialing') redirect('/pricing')

  const opportunities = await fetchOpportunities(supabase, prefs, user.id)

  return (
    <DashboardClient
      opportunities={opportunities}
      email={user.email ?? ''}
      userPrefs={prefs}
    />
  )
}
