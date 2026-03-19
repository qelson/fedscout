import { Opportunity, UserPreferences } from '@/lib/types'

const CERT_PATTERNS: { cert: string; patterns: string[] }[] = [
  { cert: '8(a) Business Development Program', patterns: ['8(a)', '8a '] },
  { cert: 'Woman-Owned Small Business (WOSB)', patterns: ['wosb', 'woman-owned', 'woman owned'] },
  { cert: 'Service-Disabled Veteran-Owned (SDVOSB)', patterns: ['sdvosb', 'service-disabled veteran', 'service disabled veteran'] },
  { cert: 'HUBZone Certified', patterns: ['hubzone', 'hub zone'] },
  { cert: 'Veteran-Owned Small Business (VOSB)', patterns: ['vosb', 'veteran-owned', 'veteran owned'] },
]

function getCertMatches(title: string, description: string, userCerts: string[]): string[] {
  const text = (title + ' ' + description).toLowerCase()
  return CERT_PATTERNS
    .filter(({ cert, patterns }) =>
      userCerts.includes(cert) && patterns.some(p => text.includes(p))
    )
    .map(({ cert }) => cert)
}

export function getSetAsideBadge(title: string, description: string): string | null {
  const text = (title + ' ' + description).toLowerCase()
  if (text.includes('8(a)') || text.includes('8a ')) return '8(a)'
  if (text.includes('wosb') || text.includes('woman-owned') || text.includes('woman owned')) return 'WOSB'
  if (text.includes('sdvosb') || text.includes('service-disabled veteran')) return 'SDVOSB'
  if (text.includes('hubzone') || text.includes('hub zone')) return 'HUBZone'
  if (text.includes('vosb') || text.includes('veteran-owned') || text.includes('veteran owned')) return 'VOSB'
  return null
}

export function scoreOpportunity(
  opportunity: Opportunity,
  prefs: UserPreferences
): number {
  let score = 0

  // NAICS exact match — +40 points
  if (prefs.naics_codes?.includes(opportunity.naics_code)) {
    score += 40
  }

  // Keyword matches in title — +20 each, max 30
  const title = opportunity.title.toLowerCase()
  const description = (opportunity.description || '').toLowerCase()
  let titleKeywordPoints = 0
  let descKeywordPoints = 0

  for (const kw of prefs.keywords || []) {
    const keyword = kw.toLowerCase().trim()
    if (!keyword) continue

    if (title.includes(keyword) && titleKeywordPoints < 30) {
      titleKeywordPoints += 20
      score += 20
    }

    if (description.includes(keyword) && descKeywordPoints < 20) {
      descKeywordPoints += 10
      score += 10
    }
  }

  // Cap title keyword contribution at 30
  if (titleKeywordPoints > 30) score -= (titleKeywordPoints - 30)
  // Cap description keyword contribution at 20
  if (descKeywordPoints > 20) score -= (descKeywordPoints - 20)

  // Agency match — +10 points
  const agency = opportunity.agency.toUpperCase()
  for (const a of prefs.agencies || []) {
    if (agency.includes(a.toUpperCase())) {
      score += 10
      break
    }
  }

  // Contract value within user's target range — +10 points
  const min = prefs.min_value
  const max = prefs.max_value
  const oppValue = opportunity.estimated_value_min ?? opportunity.estimated_value_max

  if (oppValue !== null && oppValue !== undefined) {
    const withinMin = min === null || oppValue >= min
    const withinMax = max === null || oppValue <= max
    if (withinMin && withinMax) {
      score += 10
    }
  }

  // Deadline bonus — +5 if more than 14 days away (enough time to respond)
  if (opportunity.response_deadline) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(opportunity.response_deadline)
    const daysLeft = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
    if (daysLeft > 14) score += 5
  }

  // No description penalty — -10 (less information = higher risk)
  if (!opportunity.description || opportunity.description.trim().length < 50) {
    score -= 10
  }

  // Certification set-aside match — +30 if contract targets user's certification
  const certMatches = getCertMatches(title, description, prefs.certifications ?? [])
  if (certMatches.length > 0) {
    score += 30
  } else if (description.includes('small business')) {
    // Generic small business set-aside bonus — +15 (no specific cert needed)
    score += 15
  }

  // Small contract bonus — +5 if under $2M (more appropriate for small contractors)
  if (oppValue !== null && oppValue !== undefined && oppValue < 2_000_000) {
    score += 5
  }

  // Clamp between 0 and 100
  return Math.min(100, Math.max(0, score))
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-amber-400'
  return 'text-slate-500'
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-950 border-green-800'
  if (score >= 60) return 'bg-amber-950 border-amber-800'
  return 'bg-slate-800 border-slate-700'
}

export function getScoreLabel(score: number): string {
  if (score >= 90) return 'Top match'
  if (score >= 80) return 'Strong match'
  if (score >= 60) return 'Good match'
  if (score >= 40) return 'Partial match'
  return 'Low match'
}

export function getScoreBreakdown(
  opportunity: Opportunity,
  prefs: UserPreferences
): string[] {
  const reasons: string[] = []
  const title = opportunity.title.toLowerCase()
  const description = (opportunity.description || '').toLowerCase()

  if (prefs.naics_codes?.includes(opportunity.naics_code)) {
    reasons.push(`NAICS ${opportunity.naics_code} matches your profile (+40)`)
  }

  const matchedTitleKeywords: string[] = []
  const matchedDescKeywords: string[] = []

  for (const kw of prefs.keywords || []) {
    const keyword = kw.toLowerCase().trim()
    if (!keyword) continue
    if (title.includes(keyword)) matchedTitleKeywords.push(kw)
    else if (description.includes(keyword)) matchedDescKeywords.push(kw)
  }

  if (matchedTitleKeywords.length > 0) {
    reasons.push(`Title matches: ${matchedTitleKeywords.join(', ')}`)
  }
  if (matchedDescKeywords.length > 0) {
    reasons.push(`Description matches: ${matchedDescKeywords.join(', ')}`)
  }

  const agency = opportunity.agency.toUpperCase()
  for (const a of prefs.agencies || []) {
    if (agency.includes(a.toUpperCase())) {
      reasons.push(`Agency match: ${a} (+10)`)
      break
    }
  }

  const oppValue = opportunity.estimated_value_min ?? opportunity.estimated_value_max
  if (oppValue !== null && oppValue !== undefined) {
    const withinMin = prefs.min_value === null || oppValue >= (prefs.min_value ?? 0)
    const withinMax = prefs.max_value === null || oppValue <= (prefs.max_value ?? Infinity)
    if (withinMin && withinMax) {
      reasons.push('Contract value within your target range (+10)')
    }
  }

  if (opportunity.response_deadline) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const d = new Date(opportunity.response_deadline)
    const daysLeft = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
    if (daysLeft > 14) reasons.push(`${daysLeft} days to respond — enough time (+5)`)
  }

  if (!opportunity.description || opportunity.description.trim().length < 50) {
    reasons.push('No description available — harder to evaluate (−10)')
  }

  const certMatches = getCertMatches(title, description, prefs.certifications ?? [])
  if (certMatches.length > 0) {
    const label = certMatches.map(c => c.split(' ')[0]).join(', ')
    reasons.push(`Set-aside match: ${label} — highly targeted opportunity (+30)`)
  } else if (description.includes('small business')) {
    reasons.push('Small business set-aside — more winnable (+15)')
  }

  if (oppValue !== null && oppValue !== undefined && oppValue < 2_000_000) {
    reasons.push('Under $2M — appropriate size for small contractors (+5)')
  }

  if (reasons.length === 0) {
    reasons.push('No direct matches found — broadening your keywords may help')
  }

  return reasons
}
