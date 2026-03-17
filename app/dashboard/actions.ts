'use server'

import { createClient } from '@/lib/supabase/server'
import { OppStatus } from '@/lib/types'

export async function updateOpportunityStatus(opportunityId: string, status: OppStatus) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_opportunities')
    .upsert(
      {
        user_id: user.id,
        opportunity_id: opportunityId,
        status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,opportunity_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}
