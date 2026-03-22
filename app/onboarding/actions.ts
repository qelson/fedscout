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

export async function savePreferences(data: PreferencesPayload) {
  const supabase = createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return { error: 'Not authenticated' }

  // Wait for profile to exist (Supabase trigger may be delayed)
  let profileExists = false
  for (let i = 0; i < 10; i++) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profile) { profileExists = true; break }

    // Wait 500ms before retrying
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  // If profile still doesn't exist after 5 seconds, create it manually
  if (!profileExists) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  }

  // Now safe to save preferences
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

  // Save certifications separately with its own try/catch
  try {
    await supabase.from('user_preferences').update({
      certifications: data.certifications ?? [],
    }).eq('user_id', user.id)
  } catch (err) {
    console.error('Certifications save failed (non-blocking):', err)
  }

  return { success: true }
}
