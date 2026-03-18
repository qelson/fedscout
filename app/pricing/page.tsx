import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Pricing — FedScout',
}
import { createClient } from '@/lib/supabase/server'
import PricingClient from './PricingClient'

export default async function PricingPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_subscription_status')
      .eq('id', user.id)
      .single()

    const status = profile?.stripe_subscription_status
    if (status === 'active' || status === 'trialing') {
      redirect('/dashboard')
    }
  }

  return <PricingClient />
}
