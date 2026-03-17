const SAM_API_BASE = 'https://api.sam.gov/opportunities/v2/search'

export interface SamOpportunity {
  sam_notice_id: string
  title: string
  agency: string
  naics_code: string
  posted_date: string
  response_deadline: string | null
  estimated_value_min: number | null
  estimated_value_max: number | null
  description: string
  sam_url: string
}

interface SamApiOpportunity {
  noticeId: string
  title: string
  fullParentPathName?: string
  naicsCode?: string
  postedDate?: string
  responseDeadLine?: string
  award?: { amount?: number }
  estimatedTotalValue?: number
  description?: string
  uiLink?: string
}

interface SamApiResponse {
  opportunitiesData?: SamApiOpportunity[]
  totalRecords?: number
}

function formatDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function parseIsoDate(val: string | undefined): string | null {
  if (!val) return null
  // SAM returns dates like "2024-03-15T00:00:00.000+0000" or "2024-03-15"
  const d = new Date(val)
  if (isNaN(d.getTime())) return null
  return d.toISOString().split('T')[0]
}

function normalizeOpportunity(raw: SamApiOpportunity): SamOpportunity | null {
  if (!raw.noticeId || !raw.title) return null

  const rawValue = raw.award?.amount ?? raw.estimatedTotalValue ?? null
  const estimatedValue = rawValue !== null ? Math.round(Number(rawValue)) : null

  return {
    sam_notice_id: raw.noticeId,
    title: raw.title,
    agency: raw.fullParentPathName ?? 'Unknown Agency',
    naics_code: raw.naicsCode ?? '',
    posted_date: parseIsoDate(raw.postedDate) ?? new Date().toISOString().split('T')[0],
    response_deadline: parseIsoDate(raw.responseDeadLine),
    estimated_value_min: estimatedValue,
    estimated_value_max: estimatedValue,
    description: raw.description ?? '',
    sam_url: raw.uiLink ?? `https://sam.gov/opp/${raw.noticeId}`,
  }
}

export interface FetchOpportunitiesOptions {
  keywords: string
  naicsCode?: string
  postedFrom: string  // MM/dd/yyyy
  postedTo: string    // MM/dd/yyyy
  limit?: number
}

export async function fetchOpportunities(
  options: FetchOpportunitiesOptions
): Promise<SamOpportunity[]> {
  const apiKey = process.env.SAM_GOV_API_KEY
  if (!apiKey) throw new Error('SAM_GOV_API_KEY is not set')

  const { keywords, naicsCode, postedFrom, postedTo, limit = 100 } = options

  const params = new URLSearchParams({
    api_key: apiKey,
    keyword: keywords,
    postedFrom,
    postedTo,
    limit: String(limit),
    offset: '0',
    ptype: 'p,k,r,g,s,i,u,a',
  })

  if (naicsCode) {
    params.set('naicsCode', naicsCode)
  }

  const url = `${SAM_API_BASE}?${params.toString()}`

  const res = await fetch(url, {
    headers: { 'X-Api-Key': apiKey },
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`SAM.gov API error ${res.status}: ${body}`)
  }

  const data: SamApiResponse = await res.json()
  const raw = data.opportunitiesData ?? []

  return raw
    .map(normalizeOpportunity)
    .filter((o): o is SamOpportunity => o !== null)
}

export function dateRangeFromDaysAgo(daysAgo: number): { postedFrom: string; postedTo: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - daysAgo)
  return {
    postedFrom: formatDate(from),
    postedTo: formatDate(to),
  }
}
