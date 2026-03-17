'use client'

import { useState } from 'react'
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

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="pb-4 border-b border-gray-100">
      <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
      <p className="mt-0.5 text-sm text-gray-500">{description}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">No subscription</span>
  const isActive = status === 'active' || status === 'trialing'
  const isCanceled = status === 'canceled'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
      isActive ? 'bg-green-100 text-green-700' :
      isCanceled ? 'bg-red-100 text-red-700' :
      'bg-gray-100 text-gray-500'
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
    <div className="space-y-10">

      {/* ── NAICS ── */}
      <section className="space-y-5">
        <SectionHeader
          title="Work categories"
          description="Select all NAICS codes that apply to your business."
        />

        <input
          type="text"
          placeholder="Search NAICS codes…"
          value={naicsQuery}
          onChange={(e) => setNaicsQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {filteredNaics.map((o) => {
            const checked = naicsCodes.includes(o.code)
            return (
              <label
                key={o.code}
                className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                  checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleNaics(o.code)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{o.label}</span>
                  <span className="block text-xs text-gray-400">{o.code}</span>
                </span>
              </label>
            )
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Custom NAICS code"
            value={customCode}
            onChange={(e) => { setCustomCode(e.target.value); setCustomError('') }}
            onKeyDown={(e) => e.key === 'Enter' && addCustomNaics()}
            maxLength={6}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
          <button
            type="button"
            onClick={addCustomNaics}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add
          </button>
        </div>
        {customError && <p className="text-xs text-red-500">{customError}</p>}

        {naicsCodes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {naicsCodes.map((code) => {
              const label = NAICS_OPTIONS.find((o) => o.code === code)?.label
              return (
                <span
                  key={code}
                  className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
                >
                  {label ? `${code} · ${label.split(' ').slice(0, 3).join(' ')}` : code}
                  <button
                    type="button"
                    onClick={() => setNaicsCodes((prev) => prev.filter((c) => c !== code))}
                    className="hover:text-blue-600"
                  >
                    ×
                  </button>
                </span>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Keywords & Agencies ── */}
      <section className="space-y-5">
        <SectionHeader
          title="Keywords & agencies"
          description="Used to match contract titles and descriptions."
        />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            Keywords <span className="font-normal text-gray-400">(comma-separated)</span>
          </label>
          <textarea
            rows={3}
            placeholder="e.g. cybersecurity, IT support, network infrastructure"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Agencies <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <div className="grid grid-cols-4 gap-2">
            {AGENCIES.map((a) => {
              const checked = agencies.includes(a)
              return (
                <label
                  key={a}
                  className={`flex items-center justify-center rounded-lg border py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                    checked
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input type="checkbox" checked={checked} onChange={() => toggleAgency(a)} className="sr-only" />
                  {a}
                </label>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Contract size ── */}
      <section className="space-y-5">
        <SectionHeader
          title="Contract size"
          description="Filter by estimated contract value."
        />

        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={anySize}
            onChange={(e) => {
              setAnySize(e.target.checked)
              if (e.target.checked) setSizeIndex(null)
            }}
            className="h-4 w-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          />
          <span className="text-sm font-medium text-gray-700">Any size — show all contracts</span>
        </label>

        <div className={`space-y-2 transition-opacity ${anySize ? 'opacity-30 pointer-events-none' : ''}`}>
          {SIZE_OPTIONS.map((opt, i) => {
            const active = sizeIndex === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => setSizeIndex(active ? null : i)}
                className={`w-full flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors ${
                  active
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{opt.label}</span>
                {active && (
                  <svg className="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Save ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        {saved && <span className="text-sm text-green-600 font-medium">Saved!</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>

      {/* ── Billing ── */}
      <section className="space-y-5">
        <SectionHeader
          title="Billing"
          description="Manage your subscription and payment details."
        />

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Subscription status</span>
          <StatusBadge status={subscriptionStatus} />
        </div>

        {stripeCustomerId ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleManageBilling}
              disabled={portalLoading}
              className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              {portalLoading ? 'Opening…' : 'Manage billing'}
            </button>
            {portalError && <span className="text-sm text-red-600">{portalError}</span>}
          </div>
        ) : (
          <a
            href="/#pricing"
            className="inline-block rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Start free trial
          </a>
        )}
      </section>

      {/* ── Notifications ── */}
      <section className="space-y-5">
        <SectionHeader
          title="Notifications"
          description="Control how and when you receive updates."
        />

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">Daily digest emails</span>
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Enabled
          </span>
        </div>
      </section>

      {/* ── Test digest ── */}
      <section className="space-y-5">
        <SectionHeader
          title="Email digest"
          description="Send a preview digest to your email using your current preferences."
        />

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestDigest}
            disabled={testSending}
            className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            {testSending ? 'Sending…' : 'Send test digest'}
          </button>
          {testResult && (
            <span className={`text-sm ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
              {testResult.message}
            </span>
          )}
        </div>
      </section>

    </div>
  )
}
