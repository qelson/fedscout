import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { opportunityId, ...fields } = body

  if (!opportunityId) return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 })

  const { error } = await supabase
    .from('bid_evaluations')
    .upsert(
      { user_id: user.id, opportunity_id: opportunityId, ...fields, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,opportunity_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const opportunityId = request.nextUrl.searchParams.get('opportunityId')
  if (!opportunityId) return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 })

  const { data, error } = await supabase
    .from('bid_evaluations')
    .select('*')
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evaluation: data })
}
