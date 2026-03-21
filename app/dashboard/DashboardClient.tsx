'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { OpportunityWithStatus, OppStatus, UserPreferences } from '@/lib/types'
import { updateOpportunityStatus, updateOpportunityNotes } from './actions'
import { scoreOpportunity, getScoreBreakdown, getSetAsideBadge } from '@/lib/scoring'
import { createClient } from '@/lib/supabase/client'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(min: number | null, max: number | null): string {
  const val = min ?? max
  if (val === null) return ''
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000)}k`
  return `$${val.toLocaleString()}`
}

function deadlineInfo(deadline: string | null): {
  label: string
  color: string
  bold: boolean
  daysLeft: number | null
} {
  if (!deadline) return { label: 'No deadline', color: '#475569', bold: false, daysLeft: null }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (days < 0)  return { label: `${label} (past)`,          color: '#334155', bold: false, daysLeft: days }
  if (days < 7)  return { label: `${label} · ${days}d left`, color: '#fbbf24', bold: true,  daysLeft: days }
  if (days < 14) return { label: `${label} · ${days}d left`, color: '#d97706', bold: false, daysLeft: days }
  return { label, color: '#475569', bold: false, daysLeft: days }
}

function getAgencyShortName(agency: string): string {
  const upper = agency.toUpperCase()
  if (upper.includes('DEFENSE') || upper.includes('DOD'))                         return 'DoD'
  if (upper.includes('HOMELAND') || upper.includes('DHS'))                        return 'DHS'
  if (upper.includes('GENERAL SERVICES') || upper.includes('GSA'))                return 'GSA'
  if (upper.includes('VETERANS') || upper.includes(' VA ') || upper.endsWith(' VA')) return 'VA'
  if (upper.includes('HEALTH') || upper.includes('HHS'))                          return 'HHS'
  if (upper.includes('ENERGY') || upper.includes(' DOE'))                         return 'DOE'
  if (upper.includes('TRANSPORTATION') || upper.includes(' DOT'))                 return 'DOT'
  if (upper.includes('JUSTICE') || upper.includes(' DOJ'))                        return 'DOJ'
  if (upper.includes('STATE DEPARTMENT'))                                         return 'DOS'
  if (upper.includes('TREASURY'))                                                 return 'TRS'
  if (upper.includes('INTERIOR'))                                                 return 'DOI'
  if (upper.includes('AGRICULTURE'))                                              return 'USDA'
  if (upper.includes('COMMERCE'))                                                 return 'DOC'
  if (upper.includes('LABOR'))                                                    return 'DOL'
  if (upper.includes('EDUCATION'))                                                return 'EDU'
  if (upper.includes('NASA'))                                                     return 'NASA'
  const words = agency.split(/\s+/).filter(w => !['OF','THE','AND','FOR','U.S.','US'].includes(w.toUpperCase()))
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[2]?.[0] ?? '')).toUpperCase().slice(0, 4)
  return agency.slice(0, 3).toUpperCase()
}

function getAgencyStyle(agency: string): { bg: string; text: string } {
  const upper = agency.toUpperCase()
  if (upper.includes('DEFENSE') || upper.includes('DOD'))                           return { bg: 'bg-blue-950',   text: 'text-blue-400'   }
  if (upper.includes('HOMELAND') || upper.includes('DHS'))                          return { bg: 'bg-indigo-950', text: 'text-indigo-400' }
  if (upper.includes('GENERAL SERVICES') || upper.includes('GSA'))                  return { bg: 'bg-slate-800',  text: 'text-slate-500'  }
  if (upper.includes('VETERANS') || upper.includes(' VA ') || upper.endsWith(' VA')) return { bg: 'bg-stone-900',  text: 'text-stone-400'  }
  return { bg: 'bg-slate-800', text: 'text-slate-500' }
}

function isRecompete(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase()
  return text.includes('recompete') || text.includes('re-compete') || text.includes('re-competition')
}

// ─── Score badge ───────────────────────────────────────────────────────────────

function ScoreBadge({
  score,
  userPrefs,
  opp,
}: {
  score: number
  userPrefs: UserPreferences | null
  opp: OpportunityWithStatus
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  let cls = 'relative rounded-full px-2 py-0.5 text-xs font-extrabold border cursor-help '
  if (score >= 80) cls += 'bg-green-950 border-green-900 text-green-400'
  else if (score >= 60) cls += 'bg-amber-950 border-amber-900 text-amber-400'
  else cls += 'bg-slate-800 border-slate-700 text-slate-500'

  return (
    <div className="relative flex-shrink-0">
      <span
        className={cls}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {score}%
      </span>
      {showTooltip && userPrefs && (
        <div className="absolute right-0 top-7 z-50 w-64 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
          <p className="text-slate-300 text-xs font-bold mb-2">Why this score?</p>
          <ul className="space-y-1">
            {getScoreBreakdown(opp, userPrefs).map((reason, i) => (
              <li key={i} className="text-slate-400 text-xs flex items-start gap-1.5">
                <span className="text-green-400 mt-0.5">·</span>
                {reason}
              </li>
            ))}
          </ul>
          <p className="text-slate-600 text-xs mt-2 border-t border-slate-700 pt-2">Score: {score}/100</p>
        </div>
      )}
    </div>
  )
}

// ─── Opportunity Card ──────────────────────────────────────────────────────────

const STATUS_BUTTONS: { key: OppStatus; label: string }[] = [
  { key: 'pursuing',   label: 'Pursuing'   },
  { key: 'interested', label: 'Interested' },
  { key: 'pass',       label: 'Pass'       },
]

function OpportunityCard({
  opp,
  status,
  onStatusChange,
  score,
  showTopMatch,
  showScore,
  userPrefs,
  brief,
  briefLoading,
  isExpanded,
  onGetBrief,
  noteText,
  notesOpen,
  onToggleNotes,
  onNoteChange,
  onNoteBlur,
  isNew,
}: {
  opp: OpportunityWithStatus
  status: OppStatus | null
  onStatusChange: (id: string, s: OppStatus) => void
  score: number
  showTopMatch: boolean
  showScore: boolean
  userPrefs: UserPreferences | null
  brief: string | undefined
  briefLoading: boolean
  isExpanded: boolean
  onGetBrief: () => void
  noteText: string
  notesOpen: boolean
  onToggleNotes: () => void
  onNoteChange: (text: string) => void
  onNoteBlur: () => void
  isNew: boolean
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const dl = deadlineInfo(opp.response_deadline)
  const value = formatValue(opp.estimated_value_min, opp.estimated_value_max)
  const agencyShort = opp.agency ? getAgencyShortName(opp.agency) : null
  const agencyStyle = opp.agency ? getAgencyStyle(opp.agency) : { bg: 'bg-slate-800', text: 'text-slate-500' }
  const setAsideBadge = getSetAsideBadge(opp.title, opp.description ?? '')
  const recompete = isRecompete(opp.title, opp.description ?? '')
  const isUnderDeadline14 = dl.daysLeft !== null && dl.daysLeft >= 0 && dl.daysLeft < 14

  const briefPoints = brief
    ? brief.split('\n').filter(l => l.trim()).map(l => l.replace(/^[\d.\-*•]\s*/, '').trim()).filter(Boolean).slice(0, 4)
    : []

  return (
    <div
      className="px-4 py-3.5 border-b border-slate-950"
      style={{ backgroundColor: showTopMatch ? 'rgba(15,23,42,0.6)' : 'transparent' }}
    >
      {/* Row 1: red dot · title · score */}
      <div className="flex items-start gap-2">
        {isNew && (
          <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-1.5 flex-shrink-0" />
        )}
        <a
          href={opp.sam_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-200 text-xs font-semibold leading-snug flex-1 hover:text-blue-300 transition-colors"
        >
          {opp.title}
        </a>
        {showScore && <ScoreBadge score={score} userPrefs={userPrefs} opp={opp} />}
      </div>

      {/* Row 2: agency · NAICS · set-aside · recompete · value */}
      <div className="flex items-center gap-1.5 flex-wrap mt-1 mb-2.5">
        {agencyShort && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${agencyStyle.bg} ${agencyStyle.text}`}>
            {agencyShort}
          </span>
        )}
        {opp.naics_code && (
          <span className="font-mono bg-slate-950 text-slate-700 text-xs px-1.5 rounded">
            {opp.naics_code}
          </span>
        )}
        {setAsideBadge && (
          <span className="bg-amber-950 border border-amber-900 text-amber-500 text-xs font-bold px-1.5 rounded">
            {setAsideBadge}
          </span>
        )}
        {recompete && (
          <span className="bg-blue-950 border border-blue-900 text-blue-400 text-xs font-bold px-1.5 rounded">
            ♻ Recompete
          </span>
        )}
        {value && (
          <span className="text-slate-700 text-xs ml-auto">{value}</span>
        )}
      </div>

      {/* Row 3: status buttons · deadline · value · brief */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {STATUS_BUTTONS.map(({ key, label }) => {
            const active = status === key
            let cls = 'text-xs px-2.5 py-1 rounded-md border transition-colors '
            if (active) {
              if (key === 'pursuing')        cls += 'bg-blue-950 text-blue-300 border-blue-900'
              else if (key === 'interested') cls += 'bg-green-950 text-green-400 border-green-900'
              else                           cls += 'bg-slate-800 text-slate-500 border-slate-700'
            } else {
              cls += 'border-slate-800 text-slate-700 hover:border-slate-600'
            }
            return (
              <button key={key} type="button" onClick={() => onStatusChange(opp.id, key)} className={cls}>
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={isUnderDeadline14 ? 'text-amber-400 font-semibold text-xs' : 'text-slate-700 text-xs'}>
            {dl.label}
          </span>
          {value && (
            <span className="text-slate-100 font-extrabold text-xs">{value}</span>
          )}
          {/* Notes toggle (hidden but preserved) */}
          <button
            type="button"
            onClick={onToggleNotes}
            className="relative text-xs px-2 py-1 rounded-md border border-slate-800 text-slate-700 hover:border-slate-600 hover:text-slate-500 transition-colors"
            title="Notes"
          >
            ✎
            {noteText && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            type="button"
            onClick={onGetBrief}
            className={`text-xs font-bold px-2.5 py-1 rounded-md border transition-colors ${
              isExpanded
                ? 'bg-blue-900 text-blue-200 border-blue-800'
                : 'bg-blue-950 border-blue-900 text-blue-400 hover:bg-blue-900'
            }`}
          >
            {briefLoading ? <span className="animate-pulse">…</span> : isExpanded ? '▲ Brief' : '✦ Brief'}
          </button>
        </div>
      </div>

      {/* Notes panel */}
      {mounted && notesOpen && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <textarea
            rows={3}
            placeholder="Add your notes about this opportunity..."
            value={noteText}
            onChange={e => onNoteChange(e.target.value)}
            onBlur={onNoteBlur}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:border-red-600 focus:outline-none resize-none"
          />
          <p className="text-slate-600 text-xs mt-1">Auto-saves when you click away</p>
        </div>
      )}

      {/* Brief expansion panel */}
      {mounted && isExpanded && (
        <div className="bg-slate-950 rounded-lg p-3 mt-2.5 -mx-4 -mb-3.5">
          {briefLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-3 bg-slate-900 rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
              ))}
            </div>
          ) : briefPoints.length > 0 ? (
            <div className="space-y-2">
              {briefPoints.map((point, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-slate-700 font-bold text-xs w-4 flex-shrink-0">{i + 1}</span>
                  <p className="text-slate-500 text-xs leading-relaxed">{point}</p>
                </div>
              ))}
              <p className="text-slate-800 text-xs mt-2 pt-2 border-t border-slate-900">
                AI summary · Verify on SAM.gov
              </p>
            </div>
          ) : (
            <p className="text-slate-600 text-xs">Failed to generate brief. Try again.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'pursuing' | 'interested'
type SortBy = 'score' | 'deadline' | 'value' | 'newest'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',        label: 'All'        },
  { key: 'pursuing',   label: 'Pursuing'   },
  { key: 'interested', label: 'Interested' },
]

export default function DashboardClient({
  opportunities,
  email,
  userPrefs,
}: {
  opportunities: OpportunityWithStatus[]
  email: string
  userPrefs: UserPreferences | null
}) {
  const [, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('.avatar-menu')) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  const [statuses, setStatuses] = useState<Record<string, OppStatus | null>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.status]))
  )

  const [activeTab, setActiveTab]     = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy]           = useState<SortBy>('score')
  const [visibleCount, setVisibleCount] = useState(20)

  const [briefs, setBriefs]               = useState<Record<string, string>>({})
  const [briefLoading, setBriefLoading]   = useState<Record<string, boolean>>({})
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null)

  const [notes, setNotes]       = useState<Record<string, string>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.notes ?? '']))
  )
  const [notesOpen, setNotesOpen] = useState<string | null>(null)

  const [bidDueDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.bid_due_date ?? '']))
  )
  const [decisionDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.decision_date ?? '']))
  )

  // quickFilter state preserved from prior version (not exposed in new UI)
  type QuickFilter = 'dod' | 'dhs' | 'closing' | 'highvalue' | null
  const [quickFilter] = useState<QuickFilter>(null)

  // ── Brief fetch ────────────────────────────────────────────────────────────
  async function fetchBrief(opp: OpportunityWithStatus) {
    if (briefs[opp.id]) {
      setExpandedBrief(expandedBrief === opp.id ? null : opp.id)
      return
    }
    setBriefLoading(prev => ({ ...prev, [opp.id]: true }))
    setExpandedBrief(opp.id)
    try {
      const res = await fetch('/api/contract-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp.id,
          title: opp.title,
          description: opp.description,
          agency: opp.agency,
          naicsCode: opp.naics_code,
          estimatedValue: opp.estimated_value_min ?? opp.estimated_value_max,
        }),
      })
      const data = await res.json()
      if (data.brief) setBriefs(prev => ({ ...prev, [opp.id]: data.brief }))
    } catch (err) {
      console.error('Brief fetch error:', err)
    } finally {
      setBriefLoading(prev => ({ ...prev, [opp.id]: false }))
    }
  }

  // ── Status change (optimistic) ─────────────────────────────────────────────
  function handleStatusChange(oppId: string, newStatus: OppStatus) {
    const current = statuses[oppId]
    const next = current === newStatus ? null : newStatus
    setStatuses(prev => ({ ...prev, [oppId]: next }))
    startTransition(async () => {
      if (next) await updateOpportunityStatus(oppId, next)
    })
  }

  // ── Score + sort ───────────────────────────────────────────────────────────
  const scoredOpportunities = opportunities.map(opp => ({
    ...opp,
    score: userPrefs ? scoreOpportunity(opp, userPrefs) : 0,
  }))

  const now      = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const in7days  = new Date(today.getTime() + 7  * 86_400_000)
  const in14days = new Date(today.getTime() + 14 * 86_400_000)

  const sortedOpportunities = [...scoredOpportunities].sort((a, b) => {
    if (sortBy === 'score')    return b.score - a.score
    if (sortBy === 'deadline') {
      if (!a.response_deadline) return 1
      if (!b.response_deadline) return -1
      return new Date(a.response_deadline).getTime() - new Date(b.response_deadline).getTime()
    }
    if (sortBy === 'value') {
      const aV = a.estimated_value_max ?? a.estimated_value_min ?? 0
      const bV = b.estimated_value_max ?? b.estimated_value_min ?? 0
      return bV - aV
    }
    if (sortBy === 'newest') return new Date(b.posted_date).getTime() - new Date(a.posted_date).getTime()
    return b.score - a.score
  })

  const topScore = sortBy === 'score' ? (sortedOpportunities[0]?.score ?? 0) : 0
  const topId    = topScore >= 60 ? sortedOpportunities[0]?.id : null

  // ── Derived stats ──────────────────────────────────────────────────────────
  const pursuing       = Object.values(statuses).filter(s => s === 'pursuing').length
  const notYetReviewed = Object.values(statuses).filter(s => s === null).length

  const newSinceYesterday = opportunities.filter(o => {
    const pd = o.posted_date ? new Date(o.posted_date) : null
    const ca = o.created_at  ? new Date(o.created_at)  : null
    return (pd && pd >= yesterday) || (ca && ca >= yesterday)
  }).length

  const deadlinesThisWeek = opportunities.filter(o => {
    if (!o.response_deadline) return false
    const d = new Date(o.response_deadline)
    return d > today && d <= in7days
  }).length

  // Most urgent unreviewed-or-pursuing contract closing within 7 days
  const urgentContract = sortedOpportunities
    .filter(o => {
      if (!o.response_deadline) return false
      const d = new Date(o.response_deadline)
      const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
      return days >= 0 && days <= 7 && (statuses[o.id] === null || statuses[o.id] === 'pursuing')
    })
    .sort((a, b) =>
      new Date(a.response_deadline!).getTime() - new Date(b.response_deadline!).getTime()
    )[0] ?? null

  // Closing soon list for sidebar (within 14 days)
  const closingSoonList = opportunities
    .filter(o => {
      if (!o.response_deadline) return false
      const d = new Date(o.response_deadline)
      return d > today && d <= in14days
    })
    .sort((a, b) => new Date(a.response_deadline!).getTime() - new Date(b.response_deadline!).getTime())
    .slice(0, 5)

  // "Pursue now" widget — top pursuing contract, or top scored
  const pursueNowContract = (
    scoredOpportunities.filter(o => statuses[o.id] === 'pursuing').sort((a, b) => b.score - a.score)[0]
    ?? scoredOpportunities.sort((a, b) => b.score - a.score)[0]
  ) ?? null

  // Filtered list
  const visible = sortedOpportunities.filter(o => {
    const matchesTab = activeTab === 'all' ? true
      : activeTab === 'pursuing'   ? statuses[o.id] === 'pursuing'
      : statuses[o.id] === 'interested'
    const matchesSearch = !searchQuery
      || o.title.toLowerCase().includes(searchQuery.toLowerCase())
      || o.agency.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesQuick = !quickFilter
      || (quickFilter === 'dod'       && o.agency.toUpperCase().includes('DEFENSE'))
      || (quickFilter === 'dhs'       && o.agency.toUpperCase().includes('HOMELAND'))
      || (quickFilter === 'closing'   && !!o.response_deadline && new Date(o.response_deadline) > today && new Date(o.response_deadline) <= in14days)
      || (quickFilter === 'highvalue' && (o.estimated_value_min ?? 0) >= 1_000_000)
    return matchesTab && matchesSearch && matchesQuick
  })

  const visibleSlice = visible.slice(0, visibleCount)

  // ── Greeting ───────────────────────────────────────────────────────────────
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = email.split('@')[0]
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const initials  = firstName.slice(0, 2).toUpperCase()

  // ── Profile completeness ───────────────────────────────────────────────────
  const completeness = [
    (userPrefs?.keywords?.length    ?? 0) > 0,
    (userPrefs?.naics_codes?.length ?? 0) > 0,
    (userPrefs?.certifications?.length ?? 0) > 0,
    (userPrefs?.agencies?.length    ?? 0) > 0,
  ].filter(Boolean).length * 25
  const hasCertifications = (userPrefs?.certifications?.length ?? 0) > 0
  const hasKeywords       = (userPrefs?.keywords?.length       ?? 0) > 0

  const hoursSaved = (opportunities.length * 5 / 60).toFixed(1)

  // ─── Suppress unused-var warnings for preserved state ───────────────────
  void bidDueDates
  void decisionDates

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ backgroundColor: '#020817', minHeight: '100vh' }}>

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-50 h-14 border-b"
        style={{ backgroundColor: '#0a0f1e', borderColor: '#1e293b' }}
      >
        <div className="h-full px-6 flex items-center justify-between">
          {/* Left: logo only */}
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>

          {/* Right: nav tabs + divider + email + avatar */}
          <div className="flex items-center gap-5 h-full">
            <nav className="flex items-center h-full">
              {[
                { label: 'Dashboard', href: '/dashboard', active: true  },
                { label: 'Pipeline',  href: '/pipeline',  active: false },
                { label: 'Settings',  href: '/settings',  active: false },
              ].map(({ label, href, active }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center h-full px-3 text-xs border-b-2 transition-colors"
                  style={{
                    borderBottomColor: active ? '#dc2626' : 'transparent',
                    color: active ? '#f1f5f9' : '#334155',
                    fontWeight: active ? 700 : 400,
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="w-px h-5 bg-slate-800" />

            <span className="text-slate-600 text-xs hidden sm:block">{email}</span>

            <div className="avatar-menu relative">
              <button
                onClick={() => setMenuOpen(m => !m)}
                className="w-8 h-8 rounded-full bg-blue-900 text-blue-300 text-xs font-bold flex items-center justify-center cursor-pointer hover:bg-blue-800 transition-colors"
              >
                {initials}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-10 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <p className="text-slate-300 text-xs font-semibold truncate">{email}</p>
                  </div>
                  <Link
                    href="/settings"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2.5 text-slate-400 text-xs hover:bg-slate-800 hover:text-slate-200 transition-colors"
                  >
                    Settings
                  </Link>
                  <button
                    onClick={async () => {
                      const supabase = createClient()
                      await supabase.auth.signOut()
                      window.location.href = '/'
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 text-xs hover:bg-slate-800 transition-colors text-left"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Body: 2-column grid ── */}
      <div className="p-6 gap-4" style={{ display: 'grid', gridTemplateColumns: '1fr 220px' }}>

        {/* ── Left column ── */}
        <div>

          {/* Greeting */}
          <p className="text-slate-100 text-lg font-extrabold tracking-tight">
            {greeting}, {firstName}
          </p>
          <p className="text-slate-700 text-xs mt-1 mb-4">
            {dateLabel} · FedScout found {newSinceYesterday} new contracts matching your profile overnight
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-blue-400 text-2xl font-extrabold">{newSinceYesterday}</p>
              <p className="text-slate-700 text-xs uppercase tracking-wide mt-1">New since yesterday</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className="text-slate-100 text-2xl font-extrabold">{pursuing}</p>
              <p className="text-slate-700 text-xs uppercase tracking-wide mt-1">Actively pursuing</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className={`text-2xl font-extrabold ${deadlinesThisWeek > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
                {deadlinesThisWeek}
              </p>
              <p className="text-slate-700 text-xs uppercase tracking-wide mt-1">Deadlines this week</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <p className={`text-2xl font-extrabold ${notYetReviewed > 0 ? 'text-red-400' : 'text-slate-100'}`}>
                {notYetReviewed}
              </p>
              <p className="text-slate-700 text-xs uppercase tracking-wide mt-1">Not yet reviewed</p>
            </div>
          </div>

          {/* Urgency strip */}
          {urgentContract && (() => {
            const daysLeft = Math.ceil(
              (new Date(urgentContract.response_deadline!).getTime() - today.getTime()) / 86_400_000
            )
            const val      = formatValue(urgentContract.estimated_value_min, urgentContract.estimated_value_max)
            const setAside = getSetAsideBadge(urgentContract.title, urgentContract.description ?? '')
            const unreviewed = statuses[urgentContract.id] === null
            const shortTitle = urgentContract.title.split(' ').slice(0, 8).join(' ') +
              (urgentContract.title.split(' ').length > 8 ? '…' : '')
            return (
              <div
                className="flex items-center justify-between bg-slate-900 rounded-r-lg px-4 py-2.5 mb-4"
                style={{
                  borderLeft:   '2px solid #f59e0b',
                  borderTop:    '1px solid #1e293b',
                  borderRight:  '1px solid #1e293b',
                  borderBottom: '1px solid #1e293b',
                }}
              >
                <div>
                  <p className="text-amber-400 text-xs font-semibold">
                    {shortTitle} — closes in {daysLeft} day{daysLeft !== 1 ? 's' : ''} · {urgentContract.score}% match score
                  </p>
                  <p className="text-amber-900 text-xs mt-0.5">
                    {setAside ?? 'Open'} · {val || 'Value TBD'} · {unreviewed ? "You haven't reviewed this yet" : 'Pursuing'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(urgentContract.title.split(' ').slice(0, 3).join(' '))
                    setActiveTab('all')
                  }}
                  className="text-amber-500 text-xs font-bold cursor-pointer ml-4 flex-shrink-0"
                >
                  Review →
                </button>
              </div>
            )
          })()}

          {/* Feed container */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">

            {/* Toolbar */}
            <div className="px-4 py-3 border-b border-slate-800 flex items-center gap-2">
              {/* Search */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 h-8 flex items-center gap-2">
                <svg
                  width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="text-slate-700 opacity-50 flex-shrink-0"
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Search contracts..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-slate-400 placeholder-slate-700 flex-1"
                />
              </div>
              {/* Tab buttons */}
              <div className="flex gap-1">
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={`text-xs px-3 py-1.5 rounded-md transition-colors ${
                      activeTab === key
                        ? 'bg-slate-800 text-slate-300 font-semibold'
                        : 'text-slate-700'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Sort */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as SortBy)}
                className="bg-slate-950 border border-slate-800 text-slate-700 text-xs rounded-md px-2 py-1.5"
              >
                <option value="score">Best match</option>
                <option value="deadline">Deadline</option>
                <option value="value">Value</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {/* Cards / empty states */}
            {opportunities.length === 0 ? (
              <div className="py-20 text-center px-4">
                <p className="text-sm font-semibold mb-1 text-slate-600">
                  We&apos;re loading contracts for your profile
                </p>
                <p className="text-xs text-slate-700">
                  Check back soon — or{' '}
                  <Link href="/settings" className="text-blue-500">update your keywords</Link>
                  {' '}in Settings.
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="text-sm font-bold mb-1 text-slate-600">No contracts found</p>
                <p className="text-xs text-slate-700 mb-4">
                  Try broadening your search or updating your keywords in Settings.
                </p>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-xs px-4 py-2 rounded-lg border border-slate-800 text-slate-600"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <>
                {visibleSlice.map(opp => {
                  const postedDate = opp.posted_date ? new Date(opp.posted_date) : null
                  const createdAt  = opp.created_at  ? new Date(opp.created_at)  : null
                  const isNew = Boolean(
                    (postedDate && postedDate >= yesterday) || (createdAt && createdAt >= yesterday)
                  )
                  return (
                    <OpportunityCard
                      key={opp.id}
                      opp={opp}
                      status={statuses[opp.id] ?? null}
                      onStatusChange={handleStatusChange}
                      score={opp.score}
                      showTopMatch={opp.id === topId}
                      showScore={!!userPrefs}
                      userPrefs={userPrefs}
                      brief={briefs[opp.id]}
                      briefLoading={!!briefLoading[opp.id]}
                      isExpanded={expandedBrief === opp.id}
                      onGetBrief={() => fetchBrief(opp)}
                      noteText={notes[opp.id] ?? ''}
                      notesOpen={notesOpen === opp.id}
                      onToggleNotes={() => setNotesOpen(notesOpen === opp.id ? null : opp.id)}
                      onNoteChange={text => setNotes(prev => ({ ...prev, [opp.id]: text }))}
                      onNoteBlur={() => updateOpportunityNotes(opp.id, notes[opp.id] ?? '')}
                      isNew={isNew}
                    />
                  )
                })}

                {/* Load more row */}
                <div className="px-4 py-2.5 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-slate-700 text-xs">
                    Showing {visibleSlice.length} of {visible.length} contracts
                  </span>
                  {visibleCount < visible.length && (
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + 20)}
                      className="text-blue-500 text-xs font-semibold cursor-pointer"
                    >
                      Load more →
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="flex flex-col gap-3">

          {/* Widget 1 — Pursue now */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-3">Pursue now</p>
            {pursueNowContract ? (() => {
              const val      = formatValue(pursueNowContract.estimated_value_min, pursueNowContract.estimated_value_max)
              const setAside = getSetAsideBadge(pursueNowContract.title, pursueNowContract.description ?? '')
              const dl       = deadlineInfo(pursueNowContract.response_deadline)
              const shortTitle = pursueNowContract.title.split(' ').slice(0, 8).join(' ') +
                (pursueNowContract.title.split(' ').length > 8 ? '…' : '')
              const nextDeadline = closingSoonList[0]
              return (
                <>
                  <div className="bg-green-950 border border-green-900 rounded-lg p-3 mb-2">
                    <p className="text-green-400 text-xs font-bold leading-snug mb-1">{shortTitle}</p>
                    <p className="text-green-900 text-xs mb-2">
                      {pursueNowContract.score}% match · {val || 'TBD'} · {setAside ?? 'Open'}
                    </p>
                    {dl.daysLeft !== null && dl.daysLeft >= 0 && (
                      <span className="bg-amber-950 text-amber-500 text-xs font-bold px-2 py-0.5 rounded inline-block">
                        {dl.daysLeft}d left
                      </span>
                    )}
                  </div>
                  {nextDeadline && (
                    <p className="text-slate-800 text-xs text-center">
                      Next deadline: {nextDeadline.title.split(' ').slice(0, 4).join(' ')}… ·{' '}
                      {new Date(nextDeadline.response_deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                </>
              )
            })() : (
              <p className="text-slate-700 text-xs">No opportunities yet.</p>
            )}
          </div>

          {/* Widget 2 — Closing soon */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-3">Closing soon</p>
            {closingSoonList.length === 0 ? (
              <p className="text-slate-800 text-xs">No contracts closing soon</p>
            ) : (
              <div>
                {closingSoonList.map(o => {
                  const d        = new Date(o.response_deadline!)
                  const daysLeft = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
                  const dlLabel  = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  const isUrgent = daysLeft < 14
                  return (
                    <div key={o.id} className="flex justify-between py-1.5 border-b border-slate-950">
                      <span className="text-slate-500 text-xs flex-1 mr-2 truncate">{o.title}</span>
                      <span
                        className={`text-xs px-2 rounded flex-shrink-0 ${
                          isUrgent ? 'bg-amber-950 text-amber-500' : 'bg-slate-800 text-slate-600'
                        }`}
                      >
                        {dlLabel}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Widget 3 — Improve your matches */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-2">Improve your matches</p>
            <div className="h-1 bg-slate-800 rounded-full mb-1">
              <div className="h-1 bg-red-600 rounded-full" style={{ width: `${completeness}%` }} />
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-700 text-xs">Profile {completeness}% complete</span>
              <Link href="/settings" className="text-red-600 text-xs font-bold">Fix this →</Link>
            </div>
            <div className="space-y-1">
              {!hasKeywords && (
                <p className="text-slate-700 text-xs">· Add past performance to boost match scores</p>
              )}
              {!hasCertifications && (
                <p className="text-slate-700 text-xs">· Add certifications to unlock set-aside contracts</p>
              )}
            </div>
          </div>

          {/* Widget 4 — FedScout saved you */}
          <div className="bg-blue-950 border border-blue-900 rounded-xl p-4">
            <p className="text-blue-900 text-xs font-bold uppercase tracking-widest mb-3">FedScout saved you</p>
            <div className="flex justify-between items-center mb-2">
              <span className="text-blue-500 text-xs">Hours on SAM.gov</span>
              <span className="text-blue-200 text-xs font-extrabold">{hoursSaved} hrs</span>
            </div>
            <div className="flex justify-between items-center mb-3">
              <span className="text-blue-500 text-xs">Contracts reviewed</span>
              <span className="text-blue-200 text-xs font-extrabold">{opportunities.length} this month</span>
            </div>
            <div className="border-t border-blue-900 pt-2">
              <p className="text-blue-900 text-xs">Based on avg 5 min per contract manually</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
