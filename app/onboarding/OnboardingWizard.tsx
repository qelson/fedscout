'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { savePreferences } from './actions'

// ─── Data ────────────────────────────────────────────────────────────────────

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
  { label: 'Under $150k',   min: 0,          max: 150_000 },
  { label: '$150k – $500k', min: 150_000,     max: 500_000 },
  { label: '$500k – $2M',   min: 500_000,     max: 2_000_000 },
  { label: '$2M – $10M',    min: 2_000_000,   max: 10_000_000 },
  { label: '$10M+',         min: 10_000_000,  max: null },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-500">Step {step} of {total}</span>
        <span className="text-sm text-gray-400">{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Step 1: NAICS ────────────────────────────────────────────────────────────

function StepNaics({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (codes: string[]) => void
}) {
  const [query, setQuery] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [customError, setCustomError] = useState('')

  const filtered = NAICS_OPTIONS.filter(
    (o) =>
      o.code.includes(query) ||
      o.label.toLowerCase().includes(query.toLowerCase())
  )

  function toggle(code: string) {
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    )
  }

  function addCustom() {
    const code = customCode.trim()
    if (!/^\d{4,6}$/.test(code)) {
      setCustomError('Enter a 4–6 digit NAICS code')
      return
    }
    if (!selected.includes(code)) onChange([...selected, code])
    setCustomCode('')
    setCustomError('')
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">What type of work do you pursue?</h2>
        <p className="mt-1 text-sm text-gray-500">Select all NAICS codes that apply to your business.</p>
      </div>

      <input
        type="text"
        placeholder="Search NAICS codes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />

      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {filtered.map((o) => {
          const checked = selected.includes(o.code)
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
                onChange={() => toggle(o.code)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium text-gray-900">{o.label}</span>
                <span className="block text-xs text-gray-400">{o.code}</span>
              </span>
            </label>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No matches — add it as a custom code below.</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">
          Add a custom NAICS code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 332710"
            value={customCode}
            onChange={(e) => { setCustomCode(e.target.value); setCustomError('') }}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            maxLength={6}
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add
          </button>
        </div>
        {customError && <p className="text-xs text-red-500">{customError}</p>}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((code) => {
            const label = NAICS_OPTIONS.find((o) => o.code === code)?.label
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
              >
                {label ? `${code} · ${label.split(' ').slice(0, 3).join(' ')}` : code}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((c) => c !== code))}
                  className="hover:text-blue-600 ml-0.5"
                  aria-label={`Remove ${code}`}
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Step 2: Keywords & Agencies ─────────────────────────────────────────────

function StepKeywords({
  keywords,
  agencies,
  onKeywordsChange,
  onAgenciesChange,
}: {
  keywords: string
  agencies: string[]
  onKeywordsChange: (v: string) => void
  onAgenciesChange: (v: string[]) => void
}) {
  function toggleAgency(a: string) {
    onAgenciesChange(
      agencies.includes(a) ? agencies.filter((x) => x !== a) : [...agencies, a]
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Keywords & Agencies</h2>
        <p className="mt-1 text-sm text-gray-500">Tell us what to look for in contract titles and descriptions.</p>
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-gray-700">
          Keywords
          <span className="ml-1 font-normal text-gray-400">(comma-separated)</span>
        </label>
        <textarea
          rows={3}
          placeholder="e.g. cybersecurity, IT support, network infrastructure, cloud migration"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400">
          {keywords
            ? keywords.split(',').map((k) => k.trim()).filter(Boolean).length + ' keyword(s)'
            : 'Enter terms that appear in contracts you care about'}
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Agencies
          <span className="ml-1 font-normal text-gray-400">(optional)</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {AGENCIES.map((a) => {
            const checked = agencies.includes(a)
            return (
              <label
                key={a}
                className={`flex items-center justify-center rounded-lg border py-2.5 text-sm font-medium cursor-pointer transition-colors ${
                  checked
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAgency(a)}
                  className="sr-only"
                />
                {a}
              </label>
            )
          })}
        </div>
        {agencies.length === 0 && (
          <p className="text-xs text-gray-400">Leave blank to receive opportunities from all agencies.</p>
        )}
      </div>
    </div>
  )
}

// ─── Step 3: Contract Size ────────────────────────────────────────────────────

function StepContractSize({
  anySize,
  selectedIndex,
  onAnySizeChange,
  onSelectIndex,
}: {
  anySize: boolean
  selectedIndex: number | null
  onAnySizeChange: (v: boolean) => void
  onSelectIndex: (i: number | null) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Contract size</h2>
        <p className="mt-1 text-sm text-gray-500">Filter by estimated contract value. You can skip this step.</p>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={anySize}
          onChange={(e) => {
            onAnySizeChange(e.target.checked)
            if (e.target.checked) onSelectIndex(null)
          }}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">Any size — show me all contracts</span>
      </label>

      <div className={`space-y-2 transition-opacity ${anySize ? 'opacity-30 pointer-events-none' : ''}`}>
        {SIZE_OPTIONS.map((opt, i) => {
          const active = selectedIndex === i
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectIndex(active ? null : i)}
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
    </div>
  )
}

// ─── Success Screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onClick }: { onClick: () => void }) {
  return (
    <div className="text-center space-y-4 py-6">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900">You&apos;re all set!</h2>
      <p className="text-gray-500 text-sm max-w-xs mx-auto">
        Your first digest will arrive tomorrow morning. In the meantime, explore what&apos;s already available on your dashboard.
      </p>
      <p className="text-xs text-gray-400">Your preferences have been saved.</p>
      <button
        type="button"
        onClick={onClick}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Go to dashboard →
      </button>
    </div>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const router = useRouter()
  const TOTAL_STEPS = 3

  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1
  const [naicsCodes, setNaicsCodes] = useState<string[]>([])
  // Step 2
  const [keywords, setKeywords] = useState('')
  const [agencies, setAgencies] = useState<string[]>([])
  // Step 3
  const [anySize, setAnySize] = useState(true)
  const [sizeIndex, setSizeIndex] = useState<number | null>(null)

  function handleNext() {
    if (step < TOTAL_STEPS) setStep(step + 1)
  }

  function handleBack() {
    if (step > 1) setStep(step - 1)
  }

  async function handleFinish() {
    setSaving(true)
    setError(null)

    const selectedSize = !anySize && sizeIndex !== null ? SIZE_OPTIONS[sizeIndex] : null

    const result = await savePreferences({
      naics_codes: naicsCodes,
      keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean),
      agencies,
      min_value: selectedSize?.min ?? null,
      max_value: selectedSize?.max ?? null,
    })

    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <SuccessScreen onClick={() => router.push('/pricing')} />
        </div>
      </div>
    )
  }

  const canAdvanceStep1 = naicsCodes.length > 0
  const canAdvanceStep2 = true // keywords and agencies are optional
  const isLastStep = step === TOTAL_STEPS

  function canAdvance() {
    if (step === 1) return canAdvanceStep1
    if (step === 2) return canAdvanceStep2
    return true
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            fedscout setup
          </span>
        </div>

        <ProgressBar step={step} total={TOTAL_STEPS} />

        <div className="min-h-[340px]">
          {step === 1 && (
            <StepNaics selected={naicsCodes} onChange={setNaicsCodes} />
          )}
          {step === 2 && (
            <StepKeywords
              keywords={keywords}
              agencies={agencies}
              onKeywordsChange={setKeywords}
              onAgenciesChange={setAgencies}
            />
          )}
          {step === 3 && (
            <StepContractSize
              anySize={anySize}
              selectedIndex={sizeIndex}
              onAnySizeChange={setAnySize}
              onSelectIndex={setSizeIndex}
            />
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <div className="mt-8 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="text-sm text-gray-500 hover:text-gray-700 disabled:invisible transition-colors"
          >
            ← Back
          </button>

          <div className="flex items-center gap-3">
            {isLastStep && (
              <button
                type="button"
                onClick={handleFinish}
                disabled={saving}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip
              </button>
            )}
            <button
              type="button"
              onClick={isLastStep ? handleFinish : handleNext}
              disabled={!canAdvance() || saving}
              className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              {saving ? 'Saving…' : isLastStep ? 'Finish' : 'Continue →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
