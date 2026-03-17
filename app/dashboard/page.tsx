import { createClient } from '@/lib/supabase/server'
import { logout } from '@/app/actions/auth'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">ContractPulse</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{user?.email}</span>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex items-center justify-center h-[calc(100vh-65px)]">
        <p className="text-gray-500 text-lg">Dashboard coming soon</p>
      </div>
    </main>
  )
}
