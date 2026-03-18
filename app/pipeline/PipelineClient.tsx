'use client'

import Link from 'next/link'
import { logout } from '@/app/actions/auth'

interface PipelineOpp {
  id: string
  title: string
  agency: string
  naics_code: string
  estimated_value_min: number | null
  estimated_value_max: number | null
  response_deadline: string | null
  sam_url: string
  description: string
  posted_date: string
  status: 'pursuing' | 'interested'
  user_opportunity_id: string
  notes: string | null
  bid_due_date: string | null
  decision_date: string | null
}

function formatValue(min: number | null, max: number | null): string {
  const val = min ?? max
  if (val === null) return ''
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `$${Math.round(val / 1_000)}k`
  return `$${val.toLocaleString()}`
}

function daysUntil(deadline: string | null): { days: number; label: string; color: string } | null {
  if (!deadline) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const d = new Date(deadline)
  const days = Math.ceil((d.getTime() - today.getTime()) / 86_400_000)
  if (days < 0) return { days, label: 'Past', color: '#475569' }
  if (days === 0) return { days, label: 'Today', color: '#ef4444' }
  if (days <= 7) return { days, label: `${days}d left`, color: '#fbbf24' }
  if (days <= 14) return { days, label: `${days}d left`, color: '#d97706' }
  return { days, label: `${days}d left`, color: '#64748b' }
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

function PipelineCard({ opp }: { opp: PipelineOpp }) {
  const value = formatValue(opp.estimated_value_min, opp.estimated_value_max)
  const dl = daysUntil(opp.bid_due_date ?? opp.response_deadline)
  const deadlineLabel = (opp.bid_due_date ?? opp.response_deadline)
    ? new Date(opp.bid_due_date ?? opp.response_deadline!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'No deadline'

  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
    >
      {/* Title */}
      <a
        href={opp.sam_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-bold leading-snug transition-colors block mb-2"
        style={{ color: '#e2e8f0' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#93c5fd')}
        onMouseLeave={e => (e.currentTarget.style.color = '#e2e8f0')}
      >
        {opp.title}
      </a>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-1.5 mb-3">
        <span
          className="rounded px-1.5 py-0.5 text-xs font-bold"
          style={{ backgroundColor: '#172554', color: '#60a5fa' }}
        >
          {getAgencyShortName(opp.agency)}
        </span>
        {value && (
          <span className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{value}</span>
        )}
        <span className="text-xs font-mono" style={{ color: '#475569' }}>{opp.naics_code}</span>
      </div>

      {/* Deadline */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs" style={{ color: '#475569' }}>
          {opp.bid_due_date ? '📋 Bid due:' : 'Deadline:'}
        </span>
        <span className="text-xs" style={{ color: '#94a3b8' }}>{deadlineLabel}</span>
        {dl && (
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-full"
            style={{
              color: dl.color,
              backgroundColor: dl.days <= 7 ? '#1c1400' : '#1e293b',
            }}
          >
            {dl.label}
          </span>
        )}
      </div>

      {/* Notes preview */}
      {opp.notes && (
        <p className="text-xs italic mb-3" style={{ color: '#64748b' }}>
          {opp.notes.slice(0, 120)}{opp.notes.length > 120 ? '…' : ''}
        </p>
      )}

      {/* View on SAM.gov */}
      <a
        href={opp.sam_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs transition-colors"
        style={{ color: '#475569' }}
        onMouseEnter={e => (e.currentTarget.style.color = '#60a5fa')}
        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
      >
        View on SAM.gov ↗
      </a>
    </div>
  )
}

export default function PipelineClient({
  opportunities,
  email,
}: {
  opportunities: PipelineOpp[]
  email: string
}) {
  const pursuing = opportunities
    .filter(o => o.status === 'pursuing')
    .sort((a, b) => {
      const da = new Date(a.bid_due_date ?? a.response_deadline ?? '9999').getTime()
      const db = new Date(b.bid_due_date ?? b.response_deadline ?? '9999').getTime()
      return da - db
    })

  const interested = opportunities
    .filter(o => o.status === 'interested')
    .sort((a, b) => {
      const da = new Date(a.response_deadline ?? '9999').getTime()
      const db = new Date(b.response_deadline ?? '9999').getTime()
      return da - db
    })

  const totalPipelineValue = pursuing.reduce((sum, o) => sum + (o.estimated_value_min ?? o.estimated_value_max ?? 0), 0)
  const initials = email.split('@')[0].slice(0, 2).toUpperCase()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#060d1a', color: '#f1f5f9' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{ backgroundColor: '#0a0f1e', borderColor: '#1e293b', height: '3.5rem' }}
      >
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>

          <div className="flex items-center h-full">
            <nav className="flex items-center h-full mr-6">
              {[
                { label: 'Dashboard', href: '/dashboard', active: false },
                { label: 'Pipeline',  href: '/pipeline',  active: true  },
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

      {/* Body */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Page heading */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#f1f5f9' }}>
            Your Pipeline
          </h1>
          <p className="text-sm mt-1" style={{ color: '#475569' }}>
            {pursuing.length + interested.length} tracked contracts
            {totalPipelineValue > 0 && (
              <span> · Total pipeline value: <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{formatValue(totalPipelineValue, null)}</span></span>
            )}
          </p>
        </div>

        {/* Pursuing section */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>Pursuing</h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: '#172554', color: '#60a5fa' }}
            >
              {pursuing.length}
            </span>
          </div>
          {pursuing.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: '#64748b' }}>
                No contracts marked as Pursuing yet
              </p>
              <p className="text-xs mb-4" style={{ color: '#475569' }}>
                Mark opportunities as &ldquo;Pursuing&rdquo; on the dashboard to track them here.
              </p>
              <Link
                href="/dashboard"
                className="text-xs font-semibold"
                style={{ color: '#60a5fa' }}
              >
                Go to Dashboard →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pursuing.map(opp => <PipelineCard key={opp.id} opp={opp} />)}
            </div>
          )}
        </div>

        {/* Interested section */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold" style={{ color: '#f1f5f9' }}>Interested</h2>
            <span
              className="rounded-full px-2 py-0.5 text-xs"
              style={{ backgroundColor: '#052e16', color: '#4ade80' }}
            >
              {interested.length}
            </span>
          </div>
          {interested.length === 0 ? (
            <div
              className="rounded-xl border p-10 text-center"
              style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}
            >
              <p className="text-sm font-semibold mb-1" style={{ color: '#64748b' }}>
                No contracts marked as Interested
              </p>
              <Link
                href="/dashboard"
                className="text-xs font-semibold"
                style={{ color: '#60a5fa' }}
              >
                Go to Dashboard →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {interested.map(opp => <PipelineCard key={opp.id} opp={opp} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
