import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { opportunityId, documentUrl, title, agency } = await request.json()
  if (!opportunityId || !documentUrl) {
    return NextResponse.json({ error: 'Missing opportunityId or documentUrl' }, { status: 400 })
  }

  // Check cache
  const { data: cached } = await supabase
    .from('rfp_analyses')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  if (cached) {
    return NextResponse.json({ analysis: cached, cached: true })
  }

  // Fetch the RFP document
  let documentText = ''
  try {
    const docRes = await fetch(documentUrl, { signal: AbortSignal.timeout(15000) })
    if (!docRes.ok) throw new Error(`Failed to fetch document: ${docRes.status}`)
    const contentType = docRes.headers.get('content-type') ?? ''
    if (contentType.includes('text') || contentType.includes('html')) {
      documentText = await docRes.text()
      documentText = documentText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 8000)
    } else {
      // Binary (PDF/docx) — pass URL to Claude for context, use metadata only
      documentText = `[Binary document — URL: ${documentUrl}]`
    }
  } catch (err) {
    console.error('RFP fetch error:', err)
    documentText = `[Could not fetch document — URL: ${documentUrl}]`
  }

  const prompt = `You are a government contracting expert. Analyze this RFP/solicitation document and extract structured intelligence for a small business contractor.

Contract: ${title ?? 'Unknown'}
Agency: ${agency ?? 'Unknown'}
Document excerpt:
${documentText.slice(0, 6000)}

Respond with ONLY a JSON object, no other text:
{
  "summary": "<2-3 sentence plain-English overview of what is being procured>",
  "key_requirements": ["<requirement 1>", "<requirement 2>", "<requirement 3>", "<requirement 4>", "<requirement 5>"],
  "evaluation_criteria": ["<criterion 1>", "<criterion 2>", "<criterion 3>"],
  "set_aside_type": "<e.g. 8(a), SDVOSB, Total Small Business, or None/Unknown>",
  "contract_type": "<e.g. Firm Fixed Price, IDIQ, CPFF, T&M, or Unknown>",
  "period_of_performance": "<e.g. 1 year with 4 option years, or Unknown>",
  "red_flags": ["<risk or concern 1>", "<risk or concern 2>"],
  "win_factors": ["<what a winning proposal needs 1>", "<win factor 2>"]
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
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    const data = await response.json()
    const text = data.content?.[0]?.text?.trim() ?? ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    // Cache the analysis
    await supabase.from('rfp_analyses').insert({
      opportunity_id: opportunityId,
      document_url: documentUrl,
      ...parsed,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ analysis: parsed, cached: false })
  } catch (err) {
    console.error('RFP parse error:', err)
    return NextResponse.json({ error: 'Failed to parse RFP' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const opportunityId = request.nextUrl.searchParams.get('opportunityId')
  if (!opportunityId) return NextResponse.json({ error: 'Missing opportunityId' }, { status: 400 })

  const { data, error } = await supabase
    .from('rfp_analyses')
    .select('*')
    .eq('opportunity_id', opportunityId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ analysis: data })
}
