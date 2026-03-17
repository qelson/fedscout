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
            <Link href="/pricing" className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</Link>
            <Link href="/login" className="hidden md:block text-sm text-gray-500 hover:text-gray-900 transition-colors">Sign in</Link>
            <Link
              href="/quiz"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
            >
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-20 text-center">
        <div className="inline-block rounded-full bg-blue-50 px-3 py-1 mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">
            Built for small government contractors
          </p>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight text-gray-900 mb-6">
          Your next federal contract is already on SAM.gov. Are you seeing it?
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed mb-10">
          FedScout learns your business profile and surfaces the contracts most likely to win — delivered to your inbox before the deadline.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-14">
          <Link
            href="/quiz"
            className="w-full sm:w-auto rounded-lg bg-gray-900 px-7 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Find my opportunities →
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
            { stat: 'Daily', label: 'tailored opportunity picks' },
          ].map(({ stat, label }) => (
            <div key={stat} className="text-center">
              <p className="text-2xl font-bold text-gray-900">{stat}</p>
              <p className="mt-1 text-sm text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              How FedScout works
            </h2>
            <p className="text-sm text-gray-500">
              From setup to opportunities in your inbox — in minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
            {[
              {
                num: '1',
                title: 'Tell us about your business',
                desc: 'We ask about your NAICS codes, past work, and target agencies. Takes 2 minutes.',
              },
              {
                num: '2',
                title: 'We scan SAM.gov daily',
                desc: 'Our system monitors every new federal contract posting and scores it against your profile.',
              },
              {
                num: '3',
                title: 'Your tailored picks arrive',
                desc: 'Every morning you get a shortlist of the contracts most relevant to your business. Not hundreds — just the right ones.',
              },
            ].map(({ num, title, desc }, i) => (
              <div key={num} className="relative flex flex-col gap-4">
                {/* Connecting line (desktop only, not after last item) */}
                {i < 2 && (
                  <div className="hidden sm:block absolute top-4 left-[calc(50%+20px)] right-[-calc(50%-20px)] h-px bg-gray-200" style={{ left: '2.5rem', right: '-50%' }} />
                )}
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white shrink-0 relative z-10">
                    {num}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {[
              {
                icon: <IconMail />,
                title: 'Tailored opportunity matching',
                desc: 'Contracts scored and ranked for your business profile — not a raw feed of everything on SAM.gov.',
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

      {/* ── CTA ── */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
            Ready to stop missing contracts?
          </h2>
          <p className="text-sm text-gray-500 mb-8">
            Join contractors who use FedScout to stay ahead of SAM.gov.
          </p>
          <Link
            href="/quiz"
            className="inline-block rounded-lg bg-gray-900 px-8 py-3 text-sm font-semibold text-white hover:bg-gray-700 transition-colors"
          >
            Start free — 14 days on us
          </Link>
          <p className="mt-4 text-xs text-gray-400">$49/mo after trial. Cancel anytime.</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-gray-600 transition-colors">fedscout</Link>
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
