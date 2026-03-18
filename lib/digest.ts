/**
 * Shared logic for building and sending a digest email for a single user.
 * Used by both /api/send-digest (batch) and sendTestDigest (single user).
 */
import { Resend } from 'resend'
import { render } from '@react-email/render'
import DailyDigest from '@/emails/DailyDigest'
import { UserPreferences } from '@/lib/types'
import { scoreOpportunity, getScoreLabel } from '@/lib/scoring'
import { SupabaseClient } from '@supabase/supabase-js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fedscout.com'

export interface SendDigestResult {
  sent: boolean
  opportunityCount: number
  error?: string
}

export async function buildAndSendDigest(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string,
  prefs: UserPreferences,
  lookbackHours: number = 24
): Promise<SendDigestResult> {
  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!resendKey || !fromEmail) throw new Error('Missing RESEND_API_KEY or RESEND_FROM_EMAIL')

  // ── Query matching opportunities ─────────────────────────────────────────
  const since = new Date(Date.now() - lookbackHours * 60 * 60 * 1000).toISOString()

  const filters: string[] = []
  if (prefs.naics_codes?.length) {
    filters.push(`naics_code.in.(${prefs.naics_codes.join(',')})`)
  }
  for (const kw of prefs.keywords ?? []) {
    const safe = kw.replace(/[%_\\]/g, '\\$&')
    if (safe) filters.push(`title.ilike.%${safe}%`, `description.ilike.%${safe}%`)
  }

  let query = supabase
    .from('opportunities')
    .select('id, title, sam_url, agency, naics_code, estimated_value_min, estimated_value_max, response_deadline, description, posted_date, created_at')
    .gte('created_at', since)
    .order('response_deadline', { ascending: true, nullsFirst: false })
    .limit(10)

  if (filters.length) query = query.or(filters.join(','))

  const { data: opps, error } = await query
  if (error) return { sent: false, opportunityCount: 0, error: error.message }
  if (!opps || opps.length === 0) return { sent: false, opportunityCount: 0 }

  // ── Score and sort opportunities ─────────────────────────────────────────
  const scoredOpps = opps.map(o => {
    const score = scoreOpportunity(o as any, prefs)
    return { ...o, score, scoreLabel: getScoreLabel(score) }
  }).sort((a, b) => b.score - a.score)

  // ── Fetch cached briefs ───────────────────────────────────────────────────
  const oppIds = scoredOpps.map(o => o.id).filter(Boolean)
  let briefMap: Record<string, string> = {}
  if (oppIds.length > 0) {
    const { data: briefs } = await supabase
      .from('contract_briefs')
      .select('opportunity_id, brief')
      .eq('user_id', userId)
      .in('opportunity_id', oppIds)
    if (briefs) {
      briefMap = Object.fromEntries(briefs.map(b => [b.opportunity_id, b.brief]))
    }
  }

  const oppsWithBriefs = scoredOpps.map(o => ({ ...o, brief: briefMap[o.id] ?? undefined }))

  // ── Render and send ───────────────────────────────────────────────────────
  const date = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const html = await render(
    DailyDigest({
      opportunities: oppsWithBriefs,
      date,
      settingsUrl: `${APP_URL}/settings`,
      userEmail,
    })
  )

  const resend = new Resend(resendKey)
  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: userEmail,
    subject: `${oppsWithBriefs.length} federal contract ${oppsWithBriefs.length === 1 ? 'match' : 'matches'} for you today — FedScout`,
    html,
  })

  if (sendError) return { sent: false, opportunityCount: oppsWithBriefs.length, error: sendError.message }

  // ── Log the send ─────────────────────────────────────────────────────────
  await supabase.from('digest_logs').insert({
    user_id: userId,
    sent_at: new Date().toISOString(),
    opportunity_count: oppsWithBriefs.length,
  })

  return { sent: true, opportunityCount: oppsWithBriefs.length }
}
