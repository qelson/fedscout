import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PipelineClient from './PipelineClient'

export const metadata = { title: 'Pipeline — FedScout' }

export default async function PipelinePage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_status')
    .eq('id', user.id)
    .single()

  const status = profile?.stripe_subscription_status
  if (status !== 'active' && status !== 'trialing') redirect('/pricing')

  // Fetch user_opportunities with full opportunity join
  const { data: userOpps } = await supabase
    .from('user_opportunities')
    .select(`
      id,
      status,
      notes,
      bid_due_date,
      decision_date,
      opportunities (
        id, title, agency, naics_code, estimated_value_min, estimated_value_max,
        response_deadline, sam_url, description, posted_date
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['pursuing', 'interested'])

  const opportunities = (userOpps ?? [])
    .filter(uo => uo.opportunities)
    .map(uo => ({
      ...(uo.opportunities as any),
      status: uo.status,
      user_opportunity_id: uo.id,
      notes: uo.notes ?? null,
      bid_due_date: uo.bid_due_date ?? null,
      decision_date: uo.decision_date ?? null,
    }))

  return (
    <PipelineClient
      opportunities={opportunities}
      email={user.email ?? ''}
    />
  )
}
