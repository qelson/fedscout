'use client'

import { useState } from 'react'

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
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-gray-100">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-3">
              fedscout
            </p>
            <h1 className="text-2xl font-bold text-gray-900">Pro Plan</h1>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-gray-900">$49</span>
              <span className="text-gray-500">/month</span>
            </div>
            <p className="mt-2 text-sm text-green-600 font-medium">
              14-day free trial — no charge today
            </p>
          </div>

          {/* Features */}
          <ul className="px-8 py-6 space-y-3">
            {[
              'Daily digest of matching SAM.gov opportunities',
              'Filter by NAICS code, agency, and keywords',
              'Track status: Pursuing, Interested, or Pass',
              'Contract value and deadline alerts',
              'Cancel anytime',
            ].map((feature) => (
              <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-600">
                <svg
                  className="h-4 w-4 mt-0.5 shrink-0 text-green-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="px-8 pb-8 space-y-3">
            <button
              onClick={handleStartTrial}
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Redirecting to checkout…' : 'Start free trial'}
            </button>
            {error && <p className="text-center text-sm text-red-600">{error}</p>}
            <p className="text-center text-xs text-gray-400">
              Card required · Cancel anytime · $49/mo after trial
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
