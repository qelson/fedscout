'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Passwords do not match'); return }
    if (password.length < 8)  { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    setError('')
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message)
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-10">
        <Link href="/" className="block text-center text-4xl font-extrabold tracking-tight mb-8">
          <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
        </Link>

        {done ? (
          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-green-950 border border-green-800 flex items-center justify-center mx-auto mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-slate-100 text-xl font-bold mb-2">Password updated</p>
            <p className="text-slate-500 text-sm">Redirecting you to the dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div className="text-center mb-6">
              <p className="text-slate-100 text-xl font-bold mb-1">Set new password</p>
              <p className="text-slate-500 text-sm">Choose a strong password for your account.</p>
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                New password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:border-red-600 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                Confirm password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 text-sm focus:border-red-600 focus:outline-none"
                required
              />
            </div>

            {error && <p className="text-red-400 text-xs">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-bold py-3 rounded-xl text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
