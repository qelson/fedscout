import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: logs } = await supabase
    .from('digest_logs')
    .select('sent_at, opportunity_count')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ logs: logs ?? [] })
}
