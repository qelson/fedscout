import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { opportunityId, title, description, agency, naicsCode, estimatedValue } = await request.json()

  if (!opportunityId || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Check cache first — only generate once per opportunity per user
  const { data: cached } = await supabase
    .from('contract_briefs')
    .select('brief')
    .eq('user_id', user.id)
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  if (cached?.brief) {
    return NextResponse.json({ brief: cached.brief, cached: true })
  }

  // Get user preferences for context
  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('naics_codes, keywords, agencies')
    .eq('user_id', user.id)
    .maybeSingle()

  const userContext = prefs
    ? `The contractor's profile: NAICS codes ${prefs.naics_codes?.join(', ')}, keywords: ${prefs.keywords?.join(', ')}, target agencies: ${prefs.agencies?.join(', ')}.`
    : ''

  const prompt = `You are a government contracting advisor helping a small business decide whether to bid on a federal contract.

${userContext}

Contract details:
- Title: ${title}
- Agency: ${agency}
- NAICS Code: ${naicsCode}
- Estimated Value: ${estimatedValue ? '$' + estimatedValue.toLocaleString() : 'Not specified'}
- Description: ${description ? description.slice(0, 1500) : 'Not available'}

Provide exactly 4 bullet points, each one sentence, no headers, no preamble:
1. What the agency is specifically looking for
2. Whether this fits the contractor's profile and why
3. The single most important requirement to win this contract
4. The biggest risk or watch-out for this opportunity

Be direct, specific, and practical. No generic advice.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('Anthropic API error:', err)
      return NextResponse.json({ error: 'Failed to generate brief' }, { status: 500 })
    }

    const data = await response.json()
    const brief = data.content?.[0]?.text?.trim()

    if (!brief) {
      return NextResponse.json({ error: 'Empty response from AI' }, { status: 500 })
    }

    // Cache the brief in Supabase
    await supabase.from('contract_briefs').upsert({
      user_id: user.id,
      opportunity_id: opportunityId,
      brief,
      created_at: new Date().toISOString(),
    }, { onConflict: 'user_id,opportunity_id' })

    return NextResponse.json({ brief, cached: false })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Contract brief error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
