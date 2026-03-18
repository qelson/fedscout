import { Opportunity, UserPreferences } from '@/lib/types'

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
