'use client'

import { useState } from 'react'
import Link from 'next/link'

function IconCheck({ className = 'text-green-500' }: { className?: string }) {
  return (
    <svg className={`h-4 w-4 mt-0.5 shrink-0 ${className}`} fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

function IconX() {
  return (
    <svg className="h-4 w-4 mt-0.5 shrink-0 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

const FEATURES = [
  'Tailored contract matches based on your business profile',
  'Daily digest of new SAM.gov opportunities',
  'Filter by NAICS code, agency, and keywords',
  'Pipeline tracking — Pursuing, Interested, Pass',
  'Deadline alerts so you never miss a cutoff',
  'Cancel anytime',
]

const COMPARISON = [
  { feature: 'Tailored contract matching',    fedscout: true,  govwin: false },
  { feature: 'Daily digest email',            fedscout: true,  govwin: false },
  { feature: 'Setup in under 5 minutes',      fedscout: true,  govwin: false },
  { feature: 'SMB-friendly pricing',          fedscout: true,  govwin: false },
]

export default function PricingClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleStartTrial() {
    setLoading(true)
    setError(null)

    const res = await fetch('/api/stripe/create-checkout-session', { method: 'POST' })
    const data = await res.json()

    if (!res.ok || !data.url) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setLoading(false)
      return
    }

    window.location.href = data.url
  }

  return (
    <div className="min-h-screen bg-white">

      {/* ── Nav ── */}
      <header className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors">
            fedscout
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-20">

        {/* ── Header ── */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">Simple pricing</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">One plan. No surprises.</h1>
          <p className="text-gray-500 text-sm">
            Everything you need to never miss a federal contract. Cancel anytime.
          </p>
        </div>

        {/* ── Pricing card ── */}
        <div className="max-w-sm mx-auto border border-gray-200 rounded-2xl p-8 mb-6">
          <div className="mb-2">
            <span className="text-4xl font-bold text-gray-900">$49</span>
            <span className="text-gray-400 text-sm ml-1">/month</span>
          </div>
          <p className="text-sm font-medium text-green-600 mb-6">14-day free trial — no charge today</p>

          <ul className="space-y-3 mb-8">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                <IconCheck />
                {f}
              </li>
            ))}
          </ul>

          <button
            onClick={handleStartTrial}
            disabled={loading}
            className="w-full rounded-lg bg-gray-900 py-3 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Redirecting to checkout…' : 'Start free trial'}
          </button>

          {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
        </div>

        {/* ── Below card ── */}
        <div className="text-center space-y-2 mb-16">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-gray-900 hover:underline">Sign in</Link>
          </p>
          <p className="text-xs text-gray-400">No contracts. No setup fees. Just $49/mo after your trial.</p>
        </div>

        {/* ── Comparison ── */}
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
            <div className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Feature</div>
            <div className="px-5 py-3 text-xs font-semibold text-gray-900 uppercase tracking-wide text-center">FedScout <span className="font-normal text-gray-400">$49/mo</span></div>
            <div className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide text-center">GovWin IQ <span className="font-normal">$2,400+/mo</span></div>
          </div>
          {COMPARISON.map(({ feature, fedscout, govwin }, i) => (
            <div
              key={feature}
              className={`grid grid-cols-3 border-b border-gray-100 last:border-0 ${i % 2 === 1 ? 'bg-gray-50/50' : 'bg-white'}`}
            >
              <div className="px-5 py-3.5 text-sm text-gray-600">{feature}</div>
              <div className="px-5 py-3.5 flex justify-center">
                {fedscout ? <IconCheck /> : <IconX />}
              </div>
              <div className="px-5 py-3.5 flex justify-center">
                {govwin ? <IconCheck className="text-green-500" /> : <IconX />}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}
