import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { buildAndSendDigest } from '@/lib/digest'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // Get all active subscribers
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('stripe_subscription_status', 'active')

  if (profilesError) {
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: 'No active subscribers', sent: 0, skipped: 0 })
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const profile of profiles) {
    try {
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', profile.id)
        .maybeSingle()

      if (!prefs) { skipped++; continue }

      const result = await buildAndSendDigest(supabase, profile.id, profile.email, prefs, 24)

      if (result.sent) {
        sent++
      } else if (result.error) {
        errors.push(`${profile.email}: ${result.error}`)
        skipped++
      } else {
        skipped++ // 0 matches
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${profile.email}: ${msg}`)
      skipped++
    }
  }

  return NextResponse.json({ sent, skipped, errors: errors.length ? errors : undefined })
}
