'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { savePreferences } from '@/app/onboarding/actions'
import { sendTestDigest } from './actions'
import { UserPreferences } from '@/lib/types'

const NAICS_OPTIONS = [
  { code: '541511', label: 'Custom Computer Programming Services' },
  { code: '541512', label: 'Computer Systems Design Services' },
  { code: '541519', label: 'Other Computer Related Services' },
  { code: '541611', label: 'Management Consulting' },
  { code: '541690', label: 'Scientific & Technical Consulting' },
  { code: '561210', label: 'Facilities Support Services' },
  { code: '236220', label: 'Commercial & Institutional Building Construction' },
  { code: '488190', label: 'Other Support Activities for Air Transportation' },
  { code: '336411', label: 'Aircraft Manufacturing' },
  { code: '334511', label: 'Search, Detection & Navigation Equipment' },
]

const AGENCIES = ['DoD', 'DHS', 'HHS', 'GSA', 'NASA', 'VA', 'DOE', 'DOT']

const SIZE_OPTIONS = [
  { label: 'Under $150k',   min: 0,         max: 150_000    },
  { label: '$150k – $500k', min: 150_000,    max: 500_000    },
  { label: '$500k – $2M',   min: 500_000,    max: 2_000_000  },
  { label: '$2M – $10M',    min: 2_000_000,  max: 10_000_000 },
  { label: '$10M+',         min: 10_000_000, max: null       },
]

function sizeIndexFromPrefs(min: number | null, max: number | null): number | null {
  if (min === null && max === null) return null
  return SIZE_OPTIONS.findIndex((o) => o.min === min && o.max === max)
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
      {children}
    </div>
  )
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-bold text-slate-100 mb-1">{title}</h2>
      <p className="text-sm text-slate-500">{description}</p>
      <div className="border-t border-slate-800 mt-4" />
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return (
    <span className="inline-flex items-center rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-400">
      No subscription
    </span>
  )
  const isTrialing = status === 'trialing'
  const isActive = status === 'active'
  const isCanceled = status === 'canceled'
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${
      isTrialing ? 'bg-amber-950 text-amber-400 border-amber-800' :
      isActive   ? 'bg-green-950 text-green-400 border-green-800' :
      isCanceled ? 'bg-red-950 text-red-400 border-red-800' :
                   'bg-slate-800 text-slate-400 border-slate-700'
    }`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function SettingsClient({
  initialPrefs,
  stripeCustomerId,
  subscriptionStatus,
}: {
  initialPrefs: UserPreferences | null
  stripeCustomerId: string | null
  subscriptionStatus: string | null
}) {
  const router = useRouter()

  const [naicsCodes, setNaicsCodes] = useState<string[]>(initialPrefs?.naics_codes ?? [])
  const [naicsQuery, setNaicsQuery] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [customError, setCustomError] = useState('')

  const [keywords, setKeywords] = useState(initialPrefs?.keywords?.join(', ') ?? '')
  const [agencies, setAgencies] = useState<string[]>(initialPrefs?.agencies ?? [])
  const [certifications, setCertifications] = useState<string[]>(initialPrefs?.certifications ?? [])

  const [anySize, setAnySize] = useState(
    !initialPrefs?.min_value && !initialPrefs?.max_value
  )
  const [sizeIndex, setSizeIndex] = useState<number | null>(
    sizeIndexFromPrefs(initialPrefs?.min_value ?? null, initialPrefs?.max_value ?? null)
  )

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [testSending, setTestSending] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [weeklySending, setWeeklySending] = useState(false)
  const [weeklyResult, setWeeklyResult] = useState<{ ok: boolean; message: string } | null>(null)

  const [digestLogs, setDigestLogs] = useState<{ sent_at: string; opportunity_count: number }[]>([])

  useEffect(() => {
    fetch('/api/digest-logs').then(r => r.json()).then(data => {
      if (data.logs) setDigestLogs(data.logs)
    })
  }, [])

  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState<string | null>(null)

  // ── NAICS helpers ────────────────────────────────────────────────────────
  const filteredNaics = NAICS_OPTIONS.filter(
    (o) =>
      o.code.includes(naicsQuery) ||
      o.label.toLowerCase().includes(naicsQuery.toLowerCase())
  )

  function toggleNaics(code: string) {
    setNaicsCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  function addCustomNaics() {
    const code = customCode.trim()
    if (!/^\d{4,6}$/.test(code)) {
      setCustomError('Enter a 4–6 digit NAICS code')
      return
    }
    if (!naicsCodes.includes(code)) setNaicsCodes((prev) => [...prev, code])
    setCustomCode('')
    setCustomError('')
  }

  // ── Agency helpers ───────────────────────────────────────────────────────
  function toggleAgency(a: string) {
    setAgencies((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    )
  }

  // ── Billing portal ───────────────────────────────────────────────────────
  async function handleManageBilling() {
    setPortalLoading(true)
    setPortalError(null)
    const res = await fetch('/api/stripe/portal-session', { method: 'POST' })
    const data = await res.json()
    if (!res.ok || !data.url) {
      setPortalError(data.error ?? 'Could not open billing portal.')
      setPortalLoading(false)
      return
    }
    window.location.href = data.url
  }

  // ── Weekly summary ───────────────────────────────────────────────────────
  async function handleTestWeekly() {
    setWeeklySending(true)
    setWeeklyResult(null)
    const res = await fetch('/api/send-weekly-summary', { method: 'POST' })
    const data = await res.json()
    setWeeklySending(false)
    if (!res.ok || data.error) {
      setWeeklyResult({ ok: false, message: data.error ?? 'Failed to send weekly summary.' })
    } else {
      setWeeklyResult({ ok: true, message: 'Weekly summary sent! Check your inbox.' })
    }
  }

  // ── Test digest ──────────────────────────────────────────────────────────
  async function handleTestDigest() {
    setTestSending(true)
    setTestResult(null)
    const result = await sendTestDigest()
    setTestSending(false)
    if (result?.error) {
      setTestResult({ ok: false, message: result.error })
    } else {
      setTestResult({
        ok: true,
        message: `Sent! Check your inbox — ${result.opportunityCount} ${result.opportunityCount === 1 ? 'opportunity' : 'opportunities'} included.`,
      })
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true)
    setSaved(false)
    setError(null)

    const selectedSize = !anySize && sizeIndex !== null ? SIZE_OPTIONS[sizeIndex] : null

    const result = await savePreferences({
      naics_codes: naicsCodes,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      agencies,
      min_value: selectedSize?.min ?? null,
      max_value: selectedSize?.max ?? null,
      certifications,
    })

    setSaving(false)
    if (result?.error) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
  }

  return (
    <div className="bg-slate-950 min-h-screen">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* ── NAICS ── */}
        <Card>
          <SectionHeader
            title="Work categories"
            description="Select all NAICS codes that apply to your business."
          />

          <input
            type="text"
            placeholder="Search NAICS codes…"
            value={naicsQuery}
            onChange={(e) => setNaicsQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none mb-3"
          />

          <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
            {filteredNaics.map((o) => {
              const checked = naicsCodes.includes(o.code)
              return (
                <label
                  key={o.code}
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    checked
                      ? 'border-red-600 bg-red-950'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleNaics(o.code)}
                    className="mt-0.5 h-4 w-4 accent-red-600"
                  />
                  <span>
                    <span className="block text-sm font-medium text-slate-100">{o.label}</span>
                    <span className="block text-xs font-mono text-slate-500">{o.code}</span>
                  </span>
                </label>
              )
            })}
          </div>

          <div className="flex gap-2 mb-1">
            <input
              type="text"
              placeholder="Custom NAICS code"
              value={customCode}
              onChange={(e) => { setCustomCode(e.target.value); setCustomError('') }}
              onKeyDown={(e) => e.key === 'Enter' && addCustomNaics()}
              maxLength={6}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={addCustomNaics}
              className="bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm px-4 py-2 rounded-lg transition-colors"
            >
              Add
            </button>
          </div>
          {customError && <p className="text-xs text-red-400 mb-3">{customError}</p>}

          {naicsCodes.length > 0 && (
            <div className="flex flex-wrap mt-3">
              {naicsCodes.map((code) => {
                const label = NAICS_OPTIONS.find((o) => o.code === code)?.label
                return (
                  <span
                    key={code}
                    className="inline-flex items-center gap-1 bg-slate-800 border border-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    {label ? `${code} · ${label.split(' ').slice(0, 3).join(' ')}` : code}
                    <button
                      type="button"
                      onClick={() => setNaicsCodes((prev) => prev.filter((c) => c !== code))}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </Card>

        {/* ── Keywords & Agencies ── */}
        <Card>
          <SectionHeader
            title="Keywords & agencies"
            description="Used to match contract titles and descriptions."
          />

          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
            Keywords <span className="font-normal text-slate-600 normal-case tracking-normal">(comma-separated)</span>
          </p>
          <textarea
            rows={3}
            placeholder="e.g. cybersecurity, IT support, network infrastructure"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none resize-none mb-4"
          />

          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide mb-2">
            Agencies <span className="font-normal text-slate-600 normal-case tracking-normal">(optional)</span>
          </p>
          <div className="grid grid-cols-4 gap-2">
            {AGENCIES.map((a) => {
              const checked = agencies.includes(a)
              return (
                <label
                  key={a}
                  className={`flex items-center justify-center rounded-xl border py-3 text-sm font-semibold cursor-pointer transition-colors ${
                    checked
                      ? 'bg-red-900 border-red-700 text-red-200'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleAgency(a)} className="sr-only" />
                  {a}
                </label>
              )
            })}
          </div>
        </Card>

        {/* ── Certifications ── */}
        <Card>
          <SectionHeader
            title="Small business certifications"
            description="We'll prioritize contracts that require your certifications."
          />
          <div className="grid grid-cols-1 gap-2">
            {[
              '8(a) Business Development Program',
              'Woman-Owned Small Business (WOSB)',
              'Service-Disabled Veteran-Owned (SDVOSB)',
              'HUBZone Certified',
              'Veteran-Owned Small Business (VOSB)',
            ].map((cert) => {
              const checked = certifications.includes(cert)
              return (
                <label
                  key={cert}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                    checked
                      ? 'border-amber-600 bg-amber-950'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setCertifications(prev =>
                      prev.includes(cert) ? prev.filter(c => c !== cert) : [...prev, cert]
                    )}
                    className="h-4 w-4 accent-amber-500"
                  />
                  <span className={`text-sm font-medium ${checked ? 'text-amber-200' : 'text-slate-300'}`}>
                    {cert}
                  </span>
                </label>
              )
            })}
          </div>
        </Card>

        {/* ── Contract size ── */}
        <Card>
          <SectionHeader
            title="Contract size"
            description="Filter by estimated contract value."
          />

          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={anySize}
              onChange={(e) => {
                setAnySize(e.target.checked)
                if (e.target.checked) setSizeIndex(null)
              }}
              className="h-4 w-4 accent-red-600"
            />
            <span className="text-sm font-medium text-slate-300">Any size — show all contracts</span>
          </label>

          <div className={`space-y-2 transition-opacity ${anySize ? 'opacity-40 pointer-events-none' : ''}`}>
            {SIZE_OPTIONS.map((opt, i) => {
              const active = sizeIndex === i
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSizeIndex(active ? null : i)}
                  className={`w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm text-left transition-colors ${
                    active
                      ? 'border-red-600 bg-red-950 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <span>{opt.label}</span>
                  {active && (
                    <svg className="h-4 w-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </Card>

        {/* ── Billing ── */}
        <Card>
          <SectionHeader
            title="Billing"
            description="Manage your subscription and payment details."
          />

          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-slate-400">Subscription status</span>
            <StatusBadge status={subscriptionStatus} />
          </div>

          {stripeCustomerId ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleManageBilling}
                disabled={portalLoading}
                className="border border-slate-700 text-slate-300 text-sm px-5 py-2.5 rounded-xl hover:border-slate-500 hover:text-slate-100 disabled:opacity-40 transition-colors"
              >
                {portalLoading ? 'Opening…' : 'Manage billing'}
              </button>
              {portalError && <span className="text-sm text-red-400">{portalError}</span>}
            </div>
          ) : (
            <a
              href="/#pricing"
              className="inline-block bg-red-700 hover:bg-red-600 text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors"
            >
              Start free trial
            </a>
          )}
        </Card>

        {/* ── Notifications ── */}
        <Card>
          <SectionHeader
            title="Notifications"
            description="Control how and when you receive updates."
          />

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Daily digest emails</span>
            <span className="inline-flex items-center rounded-full border border-green-800 bg-green-950 px-3 py-1 text-xs font-medium text-green-400">
              Enabled
            </span>
          </div>
        </Card>

        {/* ── Test digest ── */}
        <Card>
          <SectionHeader
            title="Email digest"
            description="Send a preview digest to your email using your current preferences."
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestDigest}
              disabled={testSending}
              className="border border-slate-700 text-slate-400 text-sm px-5 py-2.5 rounded-xl hover:border-slate-500 hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              {testSending ? 'Sending…' : 'Send test digest'}
            </button>
            <button
              type="button"
              onClick={handleTestWeekly}
              disabled={weeklySending}
              className="border border-slate-700 text-slate-400 text-sm px-5 py-2.5 rounded-xl hover:border-slate-500 hover:text-slate-200 disabled:opacity-40 transition-colors"
            >
              {weeklySending ? 'Sending…' : 'Send test weekly summary'}
            </button>
            {testResult && (
              <span className={`text-sm ${testResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                {testResult.message}
              </span>
            )}
            {weeklyResult && (
              <span className={`text-sm ${weeklyResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                {weeklyResult.message}
              </span>
            )}
          </div>
        </Card>

        {/* ── Email history ── */}
        <Card>
          <SectionHeader
            title="Email history"
            description="Recent digest emails sent to your account."
          />
          {digestLogs.length === 0 ? (
            <p className="text-slate-500 text-sm">No digest emails sent yet. Your first will arrive tomorrow at 8am EST.</p>
          ) : (
            <div className="space-y-3">
              {digestLogs.map((log, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-800 last:border-0"
                >
                  <span className="text-slate-400 text-sm">
                    {new Date(log.sent_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                    })}{' · '}
                    {new Date(log.sent_at).toLocaleTimeString('en-US', {
                      hour: 'numeric', minute: '2-digit',
                    })}
                  </span>
                  <span className="text-slate-500 text-sm">
                    {log.opportunity_count} {log.opportunity_count === 1 ? 'contract' : 'contracts'} included
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* ── Save ── */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-red-700 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-xl text-sm disabled:opacity-40 transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {saved && <span className="text-green-400 text-sm">Saved!</span>}
          {error && <span className="text-sm text-red-400">{error}</span>}
        </div>

      </div>
    </div>
  )
}
