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

  // Save safe columns first — these are guaranteed to exist
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (error) {
    console.error('[savePreferences] core upsert failed:', error)
    return { error: error.message }
  }

  // Save extra columns separately — skip if column doesn't exist yet
  try {
    const certs = payload.certifications ?? []
    if (certs.length > 0) {
      const { error: certsError } = await supabase
        .from('user_preferences')
        .update({ certifications: certs })
        .eq('user_id', user.id)

      if (certsError) {
        console.warn('[savePreferences] certifications column not ready, skipping:', certsError.message)
      }
    }
  } catch (e) {
    console.warn('[savePreferences] extra columns save failed, ignoring:', e)
  }

  return { success: true }
}
