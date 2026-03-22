'use server'

import { createClient, createServiceClient } from '@/lib/supabase/server'

interface PreferencesPayload {
  naics_codes: string[]
  keywords: string[]
  agencies: string[]
  min_value: number | null
  max_value: number | null
  certifications?: string[]
}

export async function savePreferences(data: PreferencesPayload) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Force-create the profile using the service role client (bypasses RLS,
  // no trigger dependency) — guarantees FK constraint is satisfied
  const serviceClient = createServiceClient()
  await serviceClient.from('profiles').upsert({
    id: user.id,
    email: user.email,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'id' })

  // Save preferences
  const { error } = await supabase.from('user_preferences').upsert({
    user_id: user.id,
    naics_codes: data.naics_codes ?? [],
    keywords: data.keywords ?? [],
    agencies: data.agencies ?? [],
    min_value: data.min_value ?? null,
    max_value: data.max_value ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  // Save certifications separately — non-blocking if column not yet present
  try {
    await supabase.from('user_preferences').update({
      certifications: data.certifications ?? [],
    }).eq('user_id', user.id)
  } catch (err) {
    console.error('Certifications save failed (non-blocking):', err)
  }

  return { success: true }
}
