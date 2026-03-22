'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { savePreferences } from './actions'

// ─── Data ─────────────────────────────────────────────────────────────────────

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

const CERT_OPTIONS = [
  '8(a) Business Development Program',
  'Woman-Owned Small Business (WOSB)',
  'Service-Disabled Veteran-Owned (SDVOSB)',
  'HUBZone Certified',
  'Veteran-Owned Small Business (VOSB)',
  'None currently',
]

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
    <div>
      <h2 className="text-slate-100 text-xl font-bold leading-snug mb-2">
        What type of work do you pursue?
      </h2>
      <p className="text-slate-500 text-sm mb-4">Select all NAICS codes that apply to your business.</p>
      <p className="text-slate-600 text-xs mb-3">(select all that apply)</p>

      <input
        type="text"
        placeholder="Search NAICS codes…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none mb-3"
      />

      <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1 mb-4">
        {filtered.map((o) => {
          const checked = selected.includes(o.code)
          return (
            <button
              key={o.code}
              type="button"
              onClick={() => toggle(o.code)}
              className={`w-full text-left rounded-xl px-5 py-3.5 text-sm transition-all cursor-pointer border ${
                checked
                  ? 'border-red-600 bg-red-950/50 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/80'
              }`}
            >
              <span className="font-medium">{o.label}</span>
              <span className="block text-xs mt-0.5 opacity-50">{o.code}</span>
            </button>
          )
        })}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-600 text-center py-4">No matches — add it as a custom code below.</p>
        )}
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
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
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 hover:border-slate-500 hover:text-white transition-colors bg-slate-800"
          >
            Add
          </button>
        </div>
        {customError && <p className="text-xs text-red-400 mt-1">{customError}</p>}
      </div>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {selected.map((code) => {
            const label = NAICS_OPTIONS.find((o) => o.code === code)?.label
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 rounded-full bg-red-950/60 border border-red-800 px-2.5 py-0.5 text-xs font-medium text-red-300"
              >
                {label ? `${code} · ${label.split(' ').slice(0, 3).join(' ')}` : code}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((c) => c !== code))}
                  className="hover:text-red-100 ml-0.5"
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
    <div>
      <h2 className="text-slate-100 text-xl font-bold leading-snug mb-2">
        Keywords & Agencies
      </h2>
      <p className="text-slate-500 text-sm mb-6">Tell us what to look for in contract titles and descriptions.</p>

      <div className="mb-5">
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Keywords <span className="normal-case font-normal text-slate-600">(comma-separated)</span>
        </label>
        <textarea
          rows={3}
          placeholder="e.g. cybersecurity, IT support, network infrastructure, cloud migration"
          value={keywords}
          onChange={(e) => onKeywordsChange(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none resize-none"
        />
        <p className="text-xs text-slate-600 mt-1.5">
          {keywords
            ? keywords.split(',').map((k) => k.trim()).filter(Boolean).length + ' keyword(s)'
            : 'Enter terms that appear in contracts you care about'}
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Agencies <span className="normal-case font-normal text-slate-600">(optional — select all that apply)</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {AGENCIES.map((a) => {
            const checked = agencies.includes(a)
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggleAgency(a)}
                className={`rounded-xl border py-3 text-sm font-semibold cursor-pointer transition-all ${
                  checked
                    ? 'border-red-600 bg-red-950/50 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/80'
                }`}
              >
                {a}
              </button>
            )
          })}
        </div>
        {agencies.length === 0 && (
          <p className="text-xs text-slate-600 mt-2">Leave blank to receive opportunities from all agencies.</p>
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
    <div>
      <h2 className="text-slate-100 text-xl font-bold leading-snug mb-2">
        Contract size
      </h2>
      <p className="text-slate-500 text-sm mb-6">Filter by estimated contract value. You can skip this step.</p>

      <button
        type="button"
        onClick={() => {
          onAnySizeChange(!anySize)
          if (!anySize) onSelectIndex(null)
        }}
        className={`w-full text-left rounded-xl px-5 py-3.5 text-sm font-semibold transition-all cursor-pointer border mb-3 ${
          anySize
            ? 'border-red-600 bg-red-950/50 text-white'
            : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
        }`}
      >
        Any size — show me all contracts
      </button>

      <div className={`flex flex-col gap-2 transition-opacity ${anySize ? 'opacity-30 pointer-events-none' : ''}`}>
        {SIZE_OPTIONS.map((opt, i) => {
          const active = selectedIndex === i
          return (
            <button
              key={i}
              type="button"
              onClick={() => onSelectIndex(active ? null : i)}
              className={`w-full text-left rounded-xl px-5 py-3.5 text-sm transition-all cursor-pointer border ${
                active
                  ? 'border-red-600 bg-red-950/50 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/80'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 4: Certifications ───────────────────────────────────────────────────

function StepCertifications({
  selected,
  onChange,
}: {
  selected: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(cert: string) {
    if (cert === 'None currently') {
      onChange(selected.includes(cert) ? [] : ['None currently'])
      return
    }
    const withoutNone = selected.filter(c => c !== 'None currently')
    onChange(
      withoutNone.includes(cert)
        ? withoutNone.filter(c => c !== cert)
        : [...withoutNone, cert]
    )
  }

  return (
    <div>
      <h2 className="text-slate-100 text-xl font-bold leading-snug mb-2">
        Small business certifications
      </h2>
      <p className="text-slate-500 text-sm mb-1">We&apos;ll prioritize contracts that require your certifications.</p>
      <p className="text-slate-600 text-xs mb-6">(select all that apply)</p>
      <div className="flex flex-col gap-2">
        {CERT_OPTIONS.map(cert => {
          const active = selected.includes(cert)
          return (
            <button
              key={cert}
              type="button"
              onClick={() => toggle(cert)}
              className={`w-full text-left rounded-xl px-5 py-3.5 text-sm transition-all cursor-pointer border ${
                active
                  ? 'border-red-600 bg-red-950/50 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800/80'
              }`}
            >
              {cert}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Completion Screen ────────────────────────────────────────────────────────

function CompletionScreen() {
  const router = useRouter()

  useEffect(() => {
    const t = setTimeout(() => router.push('/dashboard'), 2000)
    return () => clearTimeout(t)
  }, [router])

  return (
    <>
      <div className="w-16 h-16 bg-green-950 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-slate-100 text-2xl font-bold text-center mb-2">You&apos;re all set!</h2>
      <p className="text-slate-500 text-sm text-center mb-8">
        Your FedScout profile is ready. Taking you to your dashboard...
      </p>
    </>
  )
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function OnboardingWizard() {
  const TOTAL_STEPS = 4

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
  // Step 4
  const [certifications, setCertifications] = useState<string[]>([])

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
      certifications: certifications.filter(c => c !== 'None currently'),
    })

    if (result?.error) {
      setError(result.error)
      setSaving(false)
      return
    }

    setDone(true)
  }

  const canAdvanceStep1 = naicsCodes.length > 0
  const isLastStep = step === TOTAL_STEPS

  function canAdvance() {
    if (step === 1) return canAdvanceStep1
    return true
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>
        </div>

        {done ? (
          <CompletionScreen />
        ) : (
          <>
            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800 rounded-full mt-6 mb-2">
              <div
                className="h-full bg-red-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
              />
            </div>
            <p className="text-slate-600 text-xs text-right mb-6">
              Step {step} of {TOTAL_STEPS}
            </p>

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
              {step === 4 && (
                <StepCertifications
                  selected={certifications}
                  onChange={setCertifications}
                />
              )}
            </div>

            {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

            <div className="flex justify-between items-center mt-8">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}

              <div className="flex items-center gap-3">
                {isLastStep && (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={saving}
                    className="text-slate-600 text-sm hover:text-slate-400 transition-colors"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={isLastStep ? handleFinish : handleNext}
                  disabled={!canAdvance() || saving}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors"
                >
                  {saving ? 'Saving…' : isLastStep ? 'Finish' : 'Continue'}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  )
}
