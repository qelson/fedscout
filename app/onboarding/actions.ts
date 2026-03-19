'use server'

import { createClient } from '@/lib/supabase/server'

interface PreferencesPayload {
  naics_codes: string[]
  keywords: string[]
  agencies: string[]
  min_value: number | null
  max_value: number | null
  certifications?: string[]
}

export async function savePreferences(payload: PreferencesPayload) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_preferences')
    .upsert(
      {
        user_id: user.id,
        naics_codes: payload.naics_codes,
        keywords: payload.keywords,
        agencies: payload.agencies,
        min_value: payload.min_value,
        max_value: payload.max_value,
        certifications: payload.certifications ?? [],
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }
  return { success: true }
}
