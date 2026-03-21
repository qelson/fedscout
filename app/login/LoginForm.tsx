'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { login } from '@/app/actions/auth'
import { createClient } from '@/lib/supabase/client'

function LoginFormInner() {
  const [error, setError]                   = useState<string | null>(null)
  const [loading, setLoading]               = useState(false)
  const [email, setEmail]                   = useState('')
  const [forgotPassword, setForgotPassword] = useState(false)
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)

  const searchParams = useSearchParams()
  const inactivity   = searchParams.get('reason') === 'inactivity'

  async function handleSubmit(formData: FormData) {
    setError(null)
    setLoading(true)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })
    if (resetError) {
      setError(resetError.message)
    } else {
      setForgotPasswordSent(true)
    }
    setLoading(false)
  }

  // ── Forgot password — sent confirmation ────────────────────────────────────
  if (forgotPassword && forgotPasswordSent) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-10">
          <div className="flex justify-center mb-8">
            <Link href="/" className="text-4xl font-extrabold tracking-tight">
              <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
            </Link>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-950 border border-green-800 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-slate-100 text-xl font-bold text-center mb-2">Check your email</p>
            <p className="text-slate-500 text-sm text-center mb-6">
              We sent a reset link to <span className="text-slate-300">{email}</span>
            </p>
            <button
              type="button"
              onClick={() => { setForgotPassword(false); setForgotPasswordSent(false) }}
              className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Forgot password form ───────────────────────────────────────────────────
  if (forgotPassword) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-10">
          <div className="flex justify-center mb-8">
            <Link href="/" className="text-4xl font-extrabold tracking-tight">
              <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
            </Link>
          </div>

          <p className="text-slate-100 text-xl font-bold text-center mb-2">Reset your password</p>
          <p className="text-slate-500 text-sm text-center mb-6">
            Enter your email and we&apos;ll send you a reset link.
          </p>

          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
                placeholder="you@company.com"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1">
                <span>⚠</span> {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 active:bg-red-800 text-white font-bold py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => { setForgotPassword(false); setError(null) }}
              className="text-slate-600 text-xs cursor-pointer hover:text-slate-400 transition-colors"
            >
              ← Back to sign in
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Login form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-10">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>
        </div>

        {/* Inactivity notice */}
        {inactivity && (
          <p className="text-amber-400 text-sm text-center mb-4">
            You were signed out due to inactivity.
          </p>
        )}

        {/* Heading */}
        <h1 className="text-slate-100 text-2xl font-bold text-center mb-2">Welcome back</h1>
        <p className="text-slate-500 text-sm text-center mb-8">Sign in to your FedScout account</p>

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
              value={email}
              onChange={e => setEmail(e.target.value)}
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
              autoComplete="current-password"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm placeholder-slate-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600 transition-colors"
              placeholder="••••••••"
            />
            <div className="flex justify-end mt-1.5">
              <button
                type="button"
                onClick={() => { setForgotPassword(true); setError(null) }}
                className="text-slate-600 text-xs hover:text-slate-400 cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>
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
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <hr className="border-t border-slate-800 my-6" />

        <p className="text-slate-500 text-sm text-center">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-red-400 hover:text-red-300 font-semibold">
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

export default function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  )
}
