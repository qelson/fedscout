import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createServiceClient } from '@/lib/supabase/service'

// Disable body parsing — Stripe needs the raw body to verify signatures
export const config = { api: { bodyParser: false } }

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Invalid signature'
    console.error('Webhook signature error:', msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const supabase = createServiceClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        if (!userId) break

        await supabase
          .from('profiles')
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_status: 'trialing',
          })
          .eq('id', userId)
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('profiles')
          .update({ stripe_subscription_status: sub.status })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabase
          .from('profiles')
          .update({ stripe_subscription_status: 'canceled' })
          .eq('stripe_customer_id', sub.customer as string)
        break
      }

      default:
        // Unhandled event type — ignore
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Handler error'
    console.error(`Webhook handler error for ${event.type}:`, msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
