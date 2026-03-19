import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { opportunityId, title, description, agency, naicsCode, estimatedValue } = await request.json()

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('naics_codes, keywords, agencies, certifications')
    .eq('user_id', user.id)
    .maybeSingle()

  const prompt = `You are a government contracting advisor. Score each dimension 1-5 for a small contractor evaluating this contract.

Contractor profile:
- NAICS codes: ${prefs?.naics_codes?.join(', ') || 'not specified'}
- Keywords/focus: ${prefs?.keywords?.join(', ') || 'not specified'}
- Target agencies: ${prefs?.agencies?.join(', ') || 'any'}
- Certifications: ${prefs?.certifications?.join(', ') || 'none'}

Contract:
- Title: ${title}
- Agency: ${agency}
- NAICS: ${naicsCode}
- Value: ${estimatedValue ? '$' + Number(estimatedValue).toLocaleString() : 'not specified'}
- Description: ${description?.slice(0, 800) || 'not available'}

Respond with ONLY a JSON object, no other text:
{
  "technical_fit": <1-5>,
  "past_performance": <1-5>,
  "competitive_position": <1-5>,
  "value_vs_effort": <1-5>,
  "timeline": <1-5>,
  "agency_relationship": <1-5>,
  "reasoning": "<one sentence explaining the overall assessment>"
}`

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
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim()
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return NextResponse.json({ prefill: parsed })
  } catch {
    return NextResponse.json({ error: 'Failed to generate prefill' }, { status: 500 })
  }
}
