'use client'

import { useState, useTransition } from 'react'
import { OpportunityWithStatus, OppStatus } from '@/lib/types'
import { updateOpportunityStatus } from './actions'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatValue(min: number | null, max: number | null): string {
  const val = min ?? max
  if (val === null) return 'Not specified'
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000)}K`
  return `$${val.toLocaleString()}`
}

function deadlineInfo(deadline: string | null): { label: string; className: string } {
  if (!deadline) return { label: 'No deadline', className: 'text-gray-400' }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
  const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  if (days < 0) return { label: `${label} (past)`, className: 'text-gray-400 line-through' }
  if (days < 7) return { label: `${label} · ${days}d left`, className: 'text-red-600 font-semibold' }
  if (days < 14) return { label: `${label} · ${days}d left`, className: 'text-amber-600' }
  return { label, className: 'text-gray-500' }
}

// ─── Opportunity Card ─────────────────────────────────────────────────────────

const STATUS_BUTTONS: { key: OppStatus; label: string }[] = [
  { key: 'pursuing',  label: 'Pursuing'  },
  { key: 'interested', label: 'Interested' },
  { key: 'pass',      label: 'Pass'      },
]

function OpportunityCard({
  opp,
  status,
  onStatusChange,
}: {
  opp: OpportunityWithStatus
  status: OppStatus | null
  onStatusChange: (id: string, s: OppStatus) => void
}) {
  const dl = deadlineInfo(opp.response_deadline)

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3 hover:border-gray-300 transition-colors">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <a
          href={opp.sam_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-semibold text-gray-900 hover:text-blue-600 leading-snug transition-colors"
        >
          {opp.title}
        </a>
        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-500">
          {opp.naics_code}
        </span>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <span className="text-gray-600">{opp.agency}</span>
        <span className="text-gray-400">·</span>
        <span className="text-gray-600">{formatValue(opp.estimated_value_min, opp.estimated_value_max)}</span>
        <span className="text-gray-400">·</span>
        <span className={dl.className}>{dl.label}</span>
      </div>

      {/* Status buttons */}
      <div className="flex gap-2 pt-1">
        {STATUS_BUTTONS.map(({ key, label }) => {
          const active = status === key
          return (
            <button
              key={key}
              type="button"
              onClick={() => onStatusChange(opp.id, key)}
              className={`rounded-lg border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? key === 'pursuing'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : key === 'interested'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-400 bg-gray-100 text-gray-600'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Stats Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="mt-0.5 text-sm text-gray-500">{label}</p>
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
}: {
  opportunities: OpportunityWithStatus[]
}) {
  const [, startTransition] = useTransition()

  // Optimistic status map: oppId → status
  const [statuses, setStatuses] = useState<Record<string, OppStatus | null>>(() =>
    Object.fromEntries(opportunities.map((o) => [o.id, o.status]))
  )

  const [activeTab, setActiveTab] = useState<FilterTab>('all')

  function handleStatusChange(oppId: string, newStatus: OppStatus) {
    const current = statuses[oppId]
    // Clicking active status toggles it off
    const next = current === newStatus ? null : newStatus
    setStatuses((prev) => ({ ...prev, [oppId]: next }))
    startTransition(async () => {
      if (next) await updateOpportunityStatus(oppId, next)
    })
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86_400_000)
  const sevenDaysFromNow = new Date(today.getTime() + 7 * 86_400_000)

  const newThisWeek = opportunities.filter((o) => {
    const posted = new Date(o.posted_date)
    return posted >= sevenDaysAgo && !statuses[o.id]
  }).length

  const pursuing = Object.values(statuses).filter((s) => s === 'pursuing').length

  const closingSoon = opportunities.filter((o) => {
    if (!o.response_deadline) return false
    const d = new Date(o.response_deadline)
    return d > today && d <= sevenDaysFromNow
  }).length

  // ── Filtered list ─────────────────────────────────────────────────────────
  const visible = opportunities.filter((o) => {
    const s = statuses[o.id]
    if (activeTab === 'all')        return true
    if (activeTab === 'pursuing')   return s === 'pursuing'
    if (activeTab === 'interested') return s === 'interested'
    if (activeTab === 'passed')     return s === 'pass'
    return true
  })

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="New this week" value={newThisWeek} />
        <StatCard label="Pursuing" value={pursuing} />
        <StatCard label="Closing soon" value={closingSoon} />
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              activeTab === key
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {key === 'all' && (
              <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">
                {opportunities.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Cards */}
      {opportunities.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500">We&apos;re still loading contracts for your profile.</p>
          <p className="mt-1 text-sm text-gray-400">
            Check back in a few hours — or head to{' '}
            <a href="/settings" className="text-blue-600 hover:underline">Settings</a>{' '}
            to broaden your keywords.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-gray-500">No matching opportunities found.</p>
          <p className="mt-1 text-sm text-gray-400">
            Try broadening your keywords in{' '}
            <a href="/settings" className="text-blue-600 hover:underline">Settings</a>.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opp={opp}
              status={statuses[opp.id] ?? null}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}
