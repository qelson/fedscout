'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { OpportunityWithStatus, OppStatus, UserPreferences } from '@/lib/types'
import { updateOpportunityStatus, updateOpportunityNotes, updateOpportunityDates } from './actions'
import { logout } from '@/app/actions/auth'
import { scoreOpportunity, getScoreColor, getScoreBg, getScoreLabel, getScoreBreakdown } from '@/lib/scoring'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatValue(min: number | null, max: number | null): string {
  const val = min ?? max
  if (val === null) return ''
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000)}k`
  return `$${val.toLocaleString()}`
}

function getAgencyShortName(agency: string): string {
  const up = agency.toUpperCase()
  if (up.includes('DEFENSE'))          return 'DoD'
  if (up.includes('HOMELAND'))         return 'DHS'
  if (up.includes('VETERANS'))         return 'VA'
  if (up.includes('COMMERCE'))         return 'Commerce'
  if (up.includes('HEALTH'))           return 'HHS'
  if (up.includes('NASA'))             return 'NASA'
  if (up.includes('GENERAL SERVICES')) return 'GSA'
  if (up.includes('ENERGY'))           return 'DOE'
  const first = agency.split(' ')[0]
  return first.length > 12 ? first.slice(0, 12) + '…' : first
}

function deadlineInfo(deadline: string | null): { label: string; color: string; bold: boolean } {
  if (!deadline) return { label: 'No deadline', color: '#475569', bold: false }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (days < 0)  return { label: `${label} (past)`, color: '#334155', bold: false }
  if (days < 7)  return { label: `${label} · ${days}d left`, color: '#fbbf24', bold: true }
  if (days < 14) return { label: `${label} · ${days}d left`, color: '#d97706', bold: false }
  return { label, color: '#475569', bold: false }
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

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
  datesOpen,
  onToggleDates,
  bidDueDate,
  decisionDate,
  onBidDueDateChange,
  onDecisionDateChange,
  onDatesBlur,
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
  datesOpen: boolean
  onToggleDates: () => void
  bidDueDate: string
  decisionDate: string
  onBidDueDateChange: (date: string) => void
  onDecisionDateChange: (date: string) => void
  onDatesBlur: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  const dl = deadlineInfo(opp.response_deadline)
  const value = formatValue(opp.estimated_value_min, opp.estimated_value_max)
  const agencyShort = opp.agency ? getAgencyShortName(opp.agency) : null

  return (
    <div
      className="px-5 py-4 border-b transition-colors"
      style={{ borderColor: 'rgba(30,41,59,0.5)' }}
      suppressHydrationWarning
      onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(30,41,59,0.5)')}
      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <a
          href={opp.sam_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-semibold leading-snug flex-1 transition-colors"
          style={{ color: '#cbd5e1' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
          onMouseLeave={e => (e.currentTarget.style.color = '#cbd5e1')}
        >
          {opp.title}
        </a>
        <div className="flex items-center gap-1.5 shrink-0">
          {showTopMatch && (
            <span className="px-2 py-0.5 rounded-full border bg-green-950 border-green-800 text-green-400 text-xs font-bold">
              Top match
            </span>
          )}
          {showScore && (
            <div className="relative">
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-bold cursor-help ${getScoreBg(score)}`}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <span className={getScoreColor(score)}>{score}</span>
                <span className={`text-xs ${getScoreColor(score)}`}>pts</span>
              </div>

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
                  <p className="text-slate-600 text-xs mt-2 border-t border-slate-700 pt-2">
                    Score: {score}/100
                  </p>
                </div>
              )}
            </div>
          )}
          <span
            className="rounded px-1.5 py-0.5 text-xs font-mono"
            style={{ backgroundColor: '#1e293b', color: '#64748b' }}
          >
            {opp.naics_code}
          </span>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-1.5 mb-3">
        {agencyShort && (
          <span
            className="rounded px-1.5 py-0.5 text-xs font-bold"
            style={{ backgroundColor: '#172554', color: '#60a5fa' }}
          >
            {agencyShort}
          </span>
        )}
        {value && (
          <span className="text-sm" style={{ color: '#475569' }}>
            · Est. {value}
          </span>
        )}
      </div>

      {/* Bottom row: status buttons + deadline + brief */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-1.5">
          {STATUS_BUTTONS.map(({ key, label }) => {
            const active = status === key
            let style: React.CSSProperties
            if (active) {
              if (key === 'pursuing')       style = { backgroundColor: '#172554', color: '#93c5fd', borderColor: '#1e3a8a' }
              else if (key === 'interested') style = { backgroundColor: '#052e16', color: '#4ade80', borderColor: '#14532d' }
              else                          style = { backgroundColor: '#1e293b', color: '#94a3b8', borderColor: '#334155' }
            } else {
              style = { backgroundColor: 'transparent', color: '#475569', borderColor: '#334155' }
            }
            return (
              <button
                key={key}
                type="button"
                onClick={() => onStatusChange(opp.id, key)}
                className="rounded border px-3 py-1.5 text-xs transition-colors"
                style={style}
                onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = '#475569' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = '#334155' }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs"
            style={{ color: dl.color, fontWeight: dl.bold ? 600 : 400 }}
          >
            {dl.label}
          </span>
          {value && (
            <span className="text-xs font-extrabold" style={{ color: '#f1f5f9' }}>{value}</span>
          )}
          <button
            type="button"
            onClick={onToggleNotes}
            className="relative text-xs px-2 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
            title="Add notes"
          >
            ✎
            {noteText && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-blue-500" />
            )}
          </button>
          <button
            type="button"
            onClick={onToggleDates}
            className="text-xs px-2 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600 transition-colors"
            title="Set dates"
          >
            📅
          </button>
          <button
            type="button"
            onClick={onGetBrief}
            className="ml-auto flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:border-blue-600 hover:text-blue-400 transition-colors"
          >
            {briefLoading ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : isExpanded ? (
              '▲ Hide brief'
            ) : (
              '✦ Get brief'
            )}
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

      {/* Dates panel */}
      {mounted && datesOpen && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="flex gap-3">
            <div className="flex-1">
              <p className="text-slate-500 text-xs mb-1">Bid due date</p>
              <input
                type="date"
                value={bidDueDate}
                onChange={e => onBidDueDateChange(e.target.value)}
                onBlur={onDatesBlur}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-red-600 focus:outline-none"
              />
            </div>
            <div className="flex-1">
              <p className="text-slate-500 text-xs mb-1">Decision date</p>
              <input
                type="date"
                value={decisionDate}
                onChange={e => onDecisionDateChange(e.target.value)}
                onBlur={onDatesBlur}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-red-600 focus:outline-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Brief expansion panel */}
      {mounted && isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          {briefLoading ? (
            <div className="space-y-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-3 bg-slate-800 rounded animate-pulse" style={{ width: `${85 - i * 8}%` }} />
              ))}
            </div>
          ) : brief ? (
            <div className="space-y-2">
              {brief.split('\n').filter(line => line.trim()).map((line, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5 flex-shrink-0">·</span>
                  <p className="text-slate-300 text-xs leading-relaxed">
                    {line.replace(/^[\d.\-*•]\s*/, '').trim()}
                  </p>
                </div>
              ))}
              <p className="text-slate-600 text-xs mt-2 pt-2 border-t border-slate-800">
                AI-generated summary · Always verify details on SAM.gov
              </p>
            </div>
          ) : (
            <p className="text-slate-500 text-xs">Failed to generate brief. Try again.</p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'pursuing' | 'interested' | 'passed'

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all',        label: 'All'        },
  { key: 'pursuing',   label: 'Pursuing'   },
  { key: 'interested', label: 'Interested' },
  { key: 'passed',     label: 'Passed'     },
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

  // Optimistic status map: oppId → status
  const [statuses, setStatuses] = useState<Record<string, OppStatus | null>>(() =>
    Object.fromEntries(opportunities.map((o) => [o.id, o.status]))
  )

  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [hideLowScores, setHideLowScores] = useState(false)

  const [briefs, setBriefs] = useState<Record<string, string>>({})
  const [briefLoading, setBriefLoading] = useState<Record<string, boolean>>({})
  const [expandedBrief, setExpandedBrief] = useState<string | null>(null)

  const [notes, setNotes] = useState<Record<string, string>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.notes ?? '']))
  )
  const [notesOpen, setNotesOpen] = useState<string | null>(null)

  const [datesOpen, setDatesOpen] = useState<string | null>(null)
  const [bidDueDates, setBidDueDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.bid_due_date ?? '']))
  )
  const [decisionDates, setDecisionDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(opportunities.map(o => [o.id, o.decision_date ?? '']))
  )

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
      if (data.brief) {
        setBriefs(prev => ({ ...prev, [opp.id]: data.brief }))
      }
    } catch (err) {
      console.error('Brief fetch error:', err)
    } finally {
      setBriefLoading(prev => ({ ...prev, [opp.id]: false }))
    }
  }

  function handleStatusChange(oppId: string, newStatus: OppStatus) {
    const current = statuses[oppId]
    // Clicking active status toggles it off
    const next = current === newStatus ? null : newStatus
    setStatuses((prev) => ({ ...prev, [oppId]: next }))
    startTransition(async () => {
      if (next) await updateOpportunityStatus(oppId, next)
    })
  }

  // ── Score + sort ───────────────────────────────────────────────────────────
  const scoredOpportunities = opportunities.map(opp => ({
    ...opp,
    score: userPrefs ? scoreOpportunity(opp, userPrefs) : 0,
  }))

  const sortedOpportunities = [...scoredOpportunities].sort((a, b) => b.score - a.score)

  const topScore = sortedOpportunities[0]?.score ?? 0
  const topId = topScore >= 60 ? sortedOpportunities[0]?.id : null

  // ── Derived stats ─────────────────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000)
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 86_400_000)
  const fourteenDaysFromNow = new Date(today.getTime() + 14 * 86_400_000)

  const newThisWeek = opportunities.filter((o) => {
    const posted = new Date(o.posted_date)
    return posted >= sevenDaysAgo && !statuses[o.id]
  }).length

  const pursuing = Object.values(statuses).filter((s) => s === 'pursuing').length
  const totalTracked = Object.values(statuses).filter((s) => s !== null).length

  const closingSoon = opportunities.filter((o) => {
    if (!o.response_deadline) return false
    const d = new Date(o.response_deadline)
    return d > today && d <= sevenDaysFromNow
  }).length

  const closingSoonContracts = opportunities.filter((o) => {
    if (!o.response_deadline) return false
    const d = new Date(o.response_deadline)
    return d > today && d <= sevenDaysFromNow
  })

  const closingSoonList = [
    ...opportunities
      .filter((o) => {
        if (!o.response_deadline) return false
        const d = new Date(o.response_deadline)
        return d > today && d <= fourteenDaysFromNow
      })
      .map(o => ({ title: o.title, deadline: o.response_deadline!, id: o.id, type: 'deadline' as const })),
    ...opportunities
      .filter(o => {
        const bid = bidDueDates[o.id]
        if (!bid || statuses[o.id] !== 'pursuing') return false
        const d = new Date(bid)
        return d > today && d <= fourteenDaysFromNow
      })
      .map(o => ({ title: o.title, deadline: bidDueDates[o.id], id: o.id + '_bid', type: 'bid' as const })),
  ]
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 4)

  // Filtered + sorted list
  const visible = sortedOpportunities.filter((o) => {
    const matchesTab = activeTab === 'all' ? true : activeTab === 'pursuing' ? statuses[o.id] === 'pursuing' : activeTab === 'interested' ? statuses[o.id] === 'interested' : statuses[o.id] === 'pass'
    const matchesSearch = !searchQuery || o.title.toLowerCase().includes(searchQuery.toLowerCase()) || o.agency.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesSearch && (!hideLowScores || o.score >= 40)
  })

  // Top agencies from visible list
  const visibleAgencyCounts = visible.reduce((acc, o) => {
    if (o.agency) acc[o.agency] = (acc[o.agency] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
  const topAgencies = Object.entries(visibleAgencyCounts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const maxCount = topAgencies[0]?.[1] ?? 1

  // Greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = email.split('@')[0]
  const dateLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const initials = firstName.slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060d1a', color: '#f1f5f9' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: '#0a0f1e', borderColor: '#1e293b', height: '3.5rem' }}
      >
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">

          {/* Left: logo only */}
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>

          {/* Right: nav tabs + email + avatar + sign out */}
          <div className="flex items-center h-full">
            <nav className="flex items-center h-full mr-6">
              {[
                { label: 'Dashboard', href: '/dashboard', active: true },
                { label: 'Pipeline',  href: '/pipeline',  active: false },
                { label: 'Settings',  href: '/settings',  active: false },
              ].map(({ label, href, active }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center h-full px-3 text-xs border-b-2 transition-colors"
                  style={{
                    borderBottomColor: active ? '#dc2626' : 'transparent',
                    color: active ? '#f1f5f9' : '#475569',
                  }}
                >
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-xs" style={{ color: '#475569' }}>{email}</span>

              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}
              >
                {initials}
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="text-xs transition-colors"
                  style={{ color: '#475569' }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                  onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                >
                  Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* ── Urgent banner ── */}
      {closingSoon > 0 && (
        <div
          className="border-b px-8 py-2 flex items-center justify-between"
          style={{ backgroundColor: '#1c1400', borderColor: '#78350f', borderBottomWidth: '0.5px' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#d97706' }} />
            <span className="text-xs font-semibold whitespace-normal" style={{ color: '#fbbf24' }}>
              {closingSoon} contract{closingSoon > 1 ? 's' : ''} closing within 7 days
            </span>
            <span className="text-xs hidden sm:block whitespace-normal" style={{ color: '#92400e' }}>
              — {closingSoonContracts.slice(0, 2).map(o => o.title.split(' ').slice(0, 4).join(' ')).join(', ')}
            </span>
          </div>
          <button
            type="button"
            className="rounded border px-3 py-1 text-xs transition-colors flex-shrink-0 ml-4"
            style={{ borderColor: '#78350f', color: '#d97706' }}
            onClick={() => setActiveTab('all')}
          >
            Review
          </button>
        </div>
      )}

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-8 py-5">

        {/* Greeting */}
        <div className="mb-5">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#f1f5f9' }}>
            {greeting}, {firstName}
          </h1>
          <p className="text-sm mt-1 text-slate-400">
            {dateLabel} · {newThisWeek} new this week · {opportunities.length} total in database
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            {
              label: 'NEW THIS WEEK',
              value: newThisWeek,
              valueColor: '#f1f5f9',
              sub: `${newThisWeek} new · ${opportunities.length} total`,
              subColor: '#16a34a',
            },
            {
              label: 'PURSUING',
              value: pursuing,
              valueColor: '#f1f5f9',
              sub: pursuing > 0 ? `${pursuing} active bid${pursuing > 1 ? 's' : ''}` : 'None yet',
              subColor: '#475569',
            },
            {
              label: 'CLOSING SOON',
              value: closingSoon,
              valueColor: closingSoon > 0 ? '#fbbf24' : '#f1f5f9',
              sub: 'Within 7 days',
              subColor: '#475569',
            },
            {
              label: 'TOTAL TRACKED',
              value: totalTracked,
              valueColor: '#f1f5f9',
              sub: 'Pursuing + Interested',
              subColor: '#475569',
            },
          ].map(({ label, value, valueColor, sub, subColor }) => (
            <div
              key={label}
              className="rounded-xl p-3 border"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <p className="text-3xl font-extrabold mb-0.5" style={{ color: valueColor }}>{value}</p>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#475569' }}>{label}</p>
              <p className="text-xs" style={{ color: subColor }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Main layout: feed + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4">

          {/* ── Left: opportunity feed ── */}
          <div className="rounded-xl border" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>

            {/* Feed header */}
            <div
              className="flex items-center justify-between px-5 py-3 border-b"
              style={{ borderColor: '#1e293b' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-extrabold" style={{ color: '#f1f5f9' }}>Your opportunities</span>
                {newThisWeek > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 text-xs"
                    style={{ backgroundColor: '#7f1d1d', color: '#fca5a5' }}
                  >
                    {newThisWeek} new this week
                  </span>
                )}
              </div>
            </div>

            {/* Search + filter */}
            <div className="px-5 pt-3">
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-red-600 focus:outline-none mb-2"
              />
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={hideLowScores}
                  onChange={e => setHideLowScores(e.target.checked)}
                  className="h-3 w-3 accent-red-600"
                />
                <span className="text-slate-500 text-xs">Hide low matches (under 40)</span>
              </label>
            </div>

            {/* Filter tabs */}
            <div className="flex border-b" style={{ borderColor: '#1e293b' }}>
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className="px-4 py-2.5 text-xs border-b-2 -mb-px transition-colors"
                  style={{
                    borderBottomColor: activeTab === key ? '#dc2626' : 'transparent',
                    color: activeTab === key ? '#f1f5f9' : '#475569',
                  }}
                >
                  {label}
                  {key === 'all' && (
                    <span
                      className="ml-1.5 rounded-full px-1.5 py-0.5 text-xs"
                      style={{ backgroundColor: '#1e293b', color: '#64748b' }}
                    >
                      {opportunities.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Cards / empty state */}
            {opportunities.length === 0 ? (
              <div className="py-20 text-center px-4">
                <svg className="h-8 w-8 mx-auto mb-3" style={{ color: '#334155' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                <p className="text-sm font-semibold mb-1" style={{ color: '#64748b' }}>
                  We&apos;re loading contracts for your profile
                </p>
                <p className="text-xs" style={{ color: '#475569' }}>
                  Check back soon — or{' '}
                  <Link href="/settings" style={{ color: '#60a5fa' }}>update your keywords</Link>
                  {' '}in Settings.
                </p>
              </div>
            ) : visible.length === 0 ? (
              <div className="py-20 text-center px-4">
                <svg className="h-10 w-10 mx-auto mb-4" style={{ color: '#334155' }} fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 48 48">
                  <rect x="8" y="4" width="24" height="32" rx="2" strokeWidth="2" />
                  <path d="M14 14h12M14 20h8" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="36" cy="36" r="8" strokeWidth="2" />
                  <path d="M42 42l-4-4" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <p className="text-sm font-bold mb-1" style={{ color: '#64748b' }}>No contracts found</p>
                <p className="text-xs mb-4" style={{ color: '#475569' }}>
                  Try broadening your search or updating your keywords in Settings.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href="/settings"
                    className="text-xs px-4 py-2 rounded-lg border transition-colors"
                    style={{ borderColor: '#334155', color: '#64748b' }}
                  >
                    Update keywords
                  </Link>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-xs px-4 py-2 rounded-lg border transition-colors"
                      style={{ borderColor: '#334155', color: '#64748b' }}
                    >
                      Clear search
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                {visible.map((opp) => (
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
                    datesOpen={datesOpen === opp.id}
                    onToggleDates={() => setDatesOpen(datesOpen === opp.id ? null : opp.id)}
                    bidDueDate={bidDueDates[opp.id] ?? ''}
                    decisionDate={decisionDates[opp.id] ?? ''}
                    onBidDueDateChange={date => setBidDueDates(prev => ({ ...prev, [opp.id]: date }))}
                    onDecisionDateChange={date => setDecisionDates(prev => ({ ...prev, [opp.id]: date }))}
                    onDatesBlur={() => updateOpportunityDates(opp.id, bidDueDates[opp.id] || null, decisionDates[opp.id] || null)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: sidebar ── */}
          <div className="flex flex-col gap-3">

            {/* Daily Briefing */}
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: '#172554', borderColor: '#1e3a8a' }}
            >
              <p className="text-sm font-bold mb-1" style={{ color: '#93c5fd' }}>
                Daily Briefing
              </p>
              <p className="text-xs mb-2 leading-relaxed" style={{ color: '#60a5fa' }}>
                Your matched contracts delivered to your inbox every morning at 8am EST.
              </p>
              <p className="text-xs font-semibold mb-2" style={{ color: '#93c5fd' }}>
                Tomorrow · 8:00 AM
              </p>
              {opportunities.length === 0 ? (
                <p className="text-xs" style={{ color: '#3b82f6' }}>
                  No matches queued for tomorrow.{' '}
                  <Link href="/settings" style={{ color: '#93c5fd' }}>Update your keywords</Link>
                  {' '}to get better matches.
                </p>
              ) : (
                <span
                  className="inline-block rounded-full px-2 py-0.5 text-xs animate-pulse"
                  style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}
                >
                  {opportunities.length} matches queued
                </span>
              )}
            </div>

            {/* Top agencies */}
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <p className="text-sm font-bold mb-3" style={{ color: '#475569' }}>
                Top agencies
              </p>
              {topAgencies.length === 0 ? (
                <p className="text-xs" style={{ color: '#334155' }}>No data yet</p>
              ) : (
                <div className="space-y-3">
                  {topAgencies.map(([agency, count]) => (
                    <div key={agency}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm" style={{ color: '#94a3b8' }}>
                          {getAgencyShortName(agency)}
                        </span>
                        <span className="text-xs ml-2 flex-shrink-0" style={{ color: '#475569' }}>{count}</span>
                      </div>
                      <div className="h-1 rounded-full" style={{ backgroundColor: '#1e293b' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ backgroundColor: '#7f1d1d', width: `${(count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Deadlines */}
            <div
              className="rounded-xl border p-4"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <p className="text-sm font-bold mb-3" style={{ color: '#475569' }}>
                Closing soon
              </p>
              {closingSoonList.length === 0 ? (
                <p className="text-xs" style={{ color: '#334155' }}>Nothing in the next 14 days</p>
              ) : (
                <div className="space-y-3">
                  {closingSoonList.map((item) => {
                    const d = new Date(item.deadline)
                    const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
                    const isUrgent = days < 7
                    const dlLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm leading-snug block" style={{ color: '#94a3b8' }}>
                            {item.title.split(' ').slice(0, 5).join(' ')}…
                          </span>
                          {item.type === 'bid' && (
                            <span className="text-xs" style={{ color: '#64748b' }}>📋 Bid due</span>
                          )}
                        </div>
                        <span
                          className="rounded px-1.5 py-0.5 text-xs flex-shrink-0"
                          style={
                            isUrgent
                              ? { backgroundColor: '#451a03', color: '#fbbf24' }
                              : { backgroundColor: '#1e293b', color: '#94a3b8' }
                          }
                        >
                          {dlLabel}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
