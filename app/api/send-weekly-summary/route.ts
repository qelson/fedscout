import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { render } from '@react-email/render'
import WeeklySummary from '@/emails/WeeklySummary'
import { scoreOpportunity, getScoreLabel } from '@/lib/scoring'
import { UserPreferences } from '@/lib/types'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://fedscout.com'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resendKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.RESEND_FROM_EMAIL
  if (!resendKey || !fromEmail) {
    return NextResponse.json({ error: 'Missing RESEND_API_KEY or RESEND_FROM_EMAIL' }, { status: 500 })
  }

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!prefs) return NextResponse.json({ error: 'No preferences found' }, { status: 400 })

  // Opportunities posted in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const today = new Date().toISOString()

  const [{ data: newOpps }, { data: closingOpps }, { data: userOpps }] = await Promise.all([
    supabase
      .from('opportunities')
      .select('id, title, sam_url, agency, naics_code, estimated_value_min, estimated_value_max, response_deadline, description, posted_date, created_at')
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('opportunities')
      .select('id, title, sam_url, agency, naics_code, estimated_value_min, estimated_value_max, response_deadline, description, posted_date, created_at')
      .gte('response_deadline', today)
      .lte('response_deadline', sevenDaysFromNow)
      .order('response_deadline', { ascending: true })
      .limit(5),
    supabase
      .from('user_opportunities')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'pursuing'),
  ])

  const pursuingCount = userOpps?.length ?? 0

  const scoredNew = (newOpps ?? []).map(o => {
    const score = scoreOpportunity(o as any, prefs as UserPreferences)
    return { ...o, score, scoreLabel: getScoreLabel(score) }
  }).sort((a, b) => b.score - a.score)

  const topMatches = scoredNew.slice(0, 3)
  const closingThisWeek = (closingOpps ?? []).slice(0, 5)

  const now = new Date()
  const endOfWeek = new Date(now)
  endOfWeek.setDate(now.getDate() + 6)
  const dateRange = `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`

  const html = await render(
    WeeklySummary({
      pursuingCount,
      newThisWeek: scoredNew.length,
      closingThisWeek,
      topMatches,
      settingsUrl: `${APP_URL}/settings`,
      userEmail: user.email ?? '',
      dateRange,
    })
  )

  const resend = new Resend(resendKey)
  const { error: sendError } = await resend.emails.send({
    from: fromEmail,
    to: user.email!,
    subject: `Your FedScout Weekly Briefing — ${dateRange}`,
    html,
  })

  if (sendError) return NextResponse.json({ error: sendError.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// Cron job handler — sends to all active subscribers
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({ message: 'Weekly summary cron — implement batch send if needed' })
}
