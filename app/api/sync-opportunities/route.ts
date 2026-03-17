import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchOpportunities, dateRangeFromDaysAgo } from '@/lib/samgov'

export async function POST(request: NextRequest) {
  // Simple shared-secret guard so this endpoint isn't publicly callable
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { postedFrom, postedTo } = dateRangeFromDaysAgo(7)

    const opportunities = await fetchOpportunities({
      keywords: '',
      postedFrom,
      postedTo,
      limit: 100,
    })

    if (opportunities.length === 0) {
      return NextResponse.json({ added: 0, message: 'No opportunities returned from SAM.gov' })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('opportunities')
      .upsert(opportunities, { onConflict: 'sam_notice_id', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error('Supabase upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ added: data?.length ?? 0 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('sync-opportunities error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
