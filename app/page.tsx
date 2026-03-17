import Link from 'next/link'

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconMail() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25H4.5a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5H4.5a2.25 2.25 0 00-2.25 2.25m19.5 0l-9.75 6.75L2.25 6.75" />
    </svg>
  )
}

function IconFilter() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
    </svg>
  )
}

function IconChart() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-6.375C9.75 6.129 10.254 5.625 10.875 5.625h2.25c.621 0 1.125.504 1.125 1.125v13.125c0 .621-.504 1.125-1.125 1.125h-2.25A1.125 1.125 0 019.75 19.875V6.75zm6.75 4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v8.625c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V11.25z" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg className="h-4 w-4 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors">fedscout</Link>

          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
            <Link href="/login" className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-5">
          SAM.gov intelligence for small contractors
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-gray-900 mb-6">
          Stop missing federal contract opportunities
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10">
          FedScout monitors SAM.gov daily and sends you a personalized digest of contracts matching your business — before the deadline slips by.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/signup"
            className="w-full sm:w-auto rounded-lg bg-gray-900 px-7 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Start 14-day free trial
          </Link>
          <a
            href="#how-it-works"
            className="w-full sm:w-auto rounded-lg border border-gray-300 px-7 py-3 text-sm font-semibold text-gray-700 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            See how it works
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 border-t border-gray-100 pt-10">
          {[
            { stat: '$600B+', label: 'in federal contracts annually' },
            { stat: '$49/mo', label: 'vs $29k/yr for GovWin' },
            { stat: 'Daily', label: 'personalized digest' },
          ].map(({ stat, label }) => (
            <div key={stat} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stat}</p>
              <p className="mt-1 text-sm text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              {
                icon: <IconMail />,
                title: 'Daily email digest',
                desc: 'New matching contracts in your inbox every morning. Never check SAM.gov manually again.',
              },
              {
                icon: <IconFilter />,
                title: 'Smart filtering',
                desc: 'Filter by NAICS code, agency, keywords, and contract value range. Only see what matters.',
              },
              {
                icon: <IconChart />,
                title: 'Pipeline tracking',
                desc: 'Mark opportunities as Pursuing, Interested, or Pass. Track your bid pipeline in one place.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="px-8 py-10 first:pl-0 last:pr-0">
                <div className="inline-flex items-center justify-center h-9 w-9 rounded-lg bg-gray-100 text-gray-600 mb-4">
                  {icon}
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
            Built for small contractors who can&apos;t afford GovWin
          </h2>
          <p className="text-gray-500 text-sm mb-14">
            GovWin starts at $29,000/year. FedScout gives you the same daily intel for $49/month.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
            {[
              { num: '1', title: 'Set your profile', desc: 'Enter your NAICS codes, keywords, target agencies, and contract size range.' },
              { num: '2', title: 'We monitor SAM.gov daily', desc: 'FedScout scans SAM.gov every morning and filters opportunities against your profile.' },
              { num: '3', title: 'Opportunities in your inbox', desc: 'Get a clean digest of matching contracts each morning — with deadlines front and center.' },
            ].map(({ num, title, desc }) => (
              <div key={num} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shrink-0">
                    {num}
                  </span>
                  <div className="hidden sm:block flex-1 h-px bg-gray-200 last:hidden" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="border-t border-gray-100">
        <div className="max-w-md mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">One plan. No surprises.</h2>
          <p className="text-sm text-gray-400 mb-10">Everything you need to win federal contracts.</p>

          <div className="border border-gray-200 rounded-2xl p-8 text-left">
            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900">$49</span>
              <span className="text-gray-400 text-sm ml-1">/month</span>
            </div>

            <p className="text-sm font-medium text-green-600 mb-8">14-day free trial — no charge today</p>

            <ul className="space-y-3 mb-8">
              {[
                'Daily SAM.gov digest',
                'NAICS + keyword filtering',
                'Pipeline tracking dashboard',
                'Deadline alerts',
                'Cancel anytime',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <IconCheck />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className="block w-full rounded-lg bg-gray-900 px-6 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">fedscout</span>
          <div className="flex items-center gap-5">
            <Link href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy</Link>
            <Link href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms</Link>
          </div>
          <p className="text-xs text-gray-400">&copy; 2026 FedScout</p>
        </div>
      </footer>

    </div>
  )
}
