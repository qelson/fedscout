'use client'

import { useState } from 'react'
import Link from 'next/link'

const features = [
  'Daily digest of matching federal contracts',
  'AI-powered contract briefs (Go/No-Go analysis)',
  'Relevance scoring based on your NAICS & keywords',
  'Filter by agency, value range, and set-aside type',
  'Saved pipeline with status tracking',
  'Email alerts for new matches',
]

export default function PricingClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleCheckout() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })

      if (res.status === 401) {
        window.location.href = '/signup'
        return
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16" style={{ backgroundColor: '#020817' }}>
      {/* Logo */}
      <Link href="/" className="mb-10 text-4xl font-extrabold tracking-tight">
        <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl p-10" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-2">Full access</p>
          <p className="text-white text-5xl font-extrabold tracking-tight">$49</p>
          <p className="text-slate-400 text-base mt-1">per month</p>
          <p className="text-red-400 text-sm font-medium mt-3">14-day free trial — no card required to begin</p>
        </div>

        <ul className="space-y-3 mb-8">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-slate-300 text-sm">
              <span className="text-green-400 mt-0.5 shrink-0">✓</span>
              {f}
            </li>
          ))}
        </ul>

        {error && (
          <p className="text-red-400 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-3 rounded-lg text-white font-semibold text-base transition-colors disabled:opacity-60"
          style={{ backgroundColor: loading ? '#7f1d1d' : '#b91c1c' }}
          onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#dc2626' }}
          onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#b91c1c' }}
        >
          {loading ? 'Redirecting to checkout…' : 'Start free trial'}
        </button>

        <p className="text-slate-500 text-xs text-center mt-4">
          Cancel anytime. No contracts. Billed monthly after trial ends.
        </p>
      </div>

      <p className="text-slate-600 text-sm mt-8">
        Already have an account?{' '}
        <Link href="/login" className="text-red-400 hover:text-red-300 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  )
}
