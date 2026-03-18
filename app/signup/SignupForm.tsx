'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signup } from '@/app/actions/auth'

export default function SignupForm() {
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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>
        </div>

        {/* Heading */}
        <h1 className="text-slate-100 text-2xl font-bold text-center mb-2">Create your account</h1>
        <p className="text-slate-500 text-sm text-center mb-8">Start your 14-day free trial. No card required to begin.</p>

        {/* Form */}
        <form action={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              minLength={8}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
              placeholder="••••••••"
            />
            <p className="mt-1.5 text-slate-600 text-xs">Minimum 8 characters</p>
          </div>

          {error && (
            <p className="text-red-400 text-xs flex items-center gap-1">
              <span>⚠</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold py-3 rounded-xl text-sm mt-6 transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <hr className="border-t border-slate-800 my-6" />

        <p className="text-slate-500 text-sm text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-red-400 hover:text-red-300 font-semibold">
            Sign in
          </Link>
        </p>

      </div>
    </div>
  )
}
