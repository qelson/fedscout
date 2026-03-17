'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'

function CheckIcon() {
  return (
    <svg className="h-4 w-4 mt-0.5 shrink-0 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

function LeftPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 flex-col justify-between bg-gray-950 p-10">
      <Link href="/" className="text-white text-2xl font-extrabold tracking-tight hover:text-gray-300 transition-colors">fedscout</Link>
      <div className="space-y-8">
        <h2 className="text-3xl font-bold text-white leading-snug">
          Never miss a government<br />contract again.
        </h2>
        <ul className="space-y-3">
          {[
            'Daily digest of matching SAM.gov opportunities',
            'Filter by NAICS code, agency, and keywords',
            'Cancel anytime — no long-term commitment',
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm text-gray-300">
              <CheckIcon />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="text-xs text-gray-500">Trusted by government contractors across the US</p>
    </div>
  )
}

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await signup(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <LeftPanel />

      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-16">
        <div className="lg:hidden mb-8">
          <Link href="/" className="text-2xl font-extrabold tracking-tight text-gray-900 hover:text-gray-600 transition-colors">fedscout</Link>
        </div>

        <div className="w-full max-w-sm mx-auto space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
            <p className="mt-1 text-sm text-gray-500">Start your 14-day free trial today</p>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                minLength={8}
                className="block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
              <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-gray-900 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
