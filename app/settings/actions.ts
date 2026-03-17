'use server'

import { createClient } from '@/lib/supabase/server'
import { buildAndSendDigest } from '@/lib/digest'

export async function sendTestDigest() {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prefs) return { error: 'No preferences found. Complete onboarding first.' }

  try {
    // Use 30-day lookback so the test works even without data from the last 24 hours
    const result = await buildAndSendDigest(supabase, user.id, user.email!, prefs, 24 * 30)

    if (result.error) return { error: result.error }
    if (!result.sent) return { error: 'No matching opportunities found to include in the digest.' }

    return { success: true, opportunityCount: result.opportunityCount }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
