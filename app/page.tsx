import Link from 'next/link'

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen text-slate-100" style={{ backgroundColor: '#0a0f1e' }}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 border-b" style={{ backgroundColor: '#0a0f1e', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold tracking-tight">
            <span className="text-white">Fed</span><span style={{ color: '#ef4444' }}>Scout</span>
          </Link>

          <nav className="flex items-center gap-5">
            <a href="#how-it-works" className="hidden md:block text-sm text-slate-400 hover:text-slate-200 transition-colors">How it works</a>
            <Link href="/pricing" className="hidden md:block text-sm text-slate-400 hover:text-slate-200 transition-colors">Pricing</Link>
            <Link href="/login" className="hidden md:block text-sm text-slate-400 hover:text-slate-200 transition-colors">Sign in</Link>
            {/* Theme toggle pill — visual only */}
            <div className="hidden md:block w-8 h-4 rounded-full border cursor-pointer" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }} />
            <Link
              href="/quiz"
              className="rounded-md px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-700 hover:bg-red-800"
            >
              Start free trial
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-7xl mx-auto px-6 sm:px-8 pt-14 pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-end">

          {/* Left column */}
          <div className="pb-10 lg:pb-14">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 mb-6" style={{ borderColor: '#334155', backgroundColor: '#0f172a' }}>
              <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: '#ef4444' }} />
              <span className="text-xs text-slate-400">SAM.gov intelligence for small contractors</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-50 leading-tight tracking-tight mb-5">
              Stop losing contracts<br />
              to companies that<br />
              <span style={{ color: '#93c5fd' }}>just showed up first</span>
            </h1>

            <p className="text-sm text-slate-500 leading-relaxed max-w-sm mb-8">
              FedScout monitors every federal contract on SAM.gov and sends you the ones that match your business — every morning before your competition sees them.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-8">
              <Link
                href="/quiz"
                className="inline-flex items-center justify-center rounded-md px-6 py-2.5 text-sm font-bold text-white transition-colors bg-red-700 hover:bg-red-800"
              >
                Find my contracts →
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center rounded-md border px-6 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:border-slate-500 transition-colors"
                style={{ borderColor: '#334155' }}
              >
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[['JT', '1e3a8a'], ['MR', '1e3a8a'], ['SK', '1e3a8a']].map(([initials, bg]) => (
                  <div
                    key={initials}
                    className="h-7 w-7 rounded-full border-2 flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: `#${bg}`, borderColor: '#0a0f1e' }}
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <span className="text-xs text-slate-500">Join 200+ contractors already using FedScout</span>
            </div>
          </div>

          {/* Right column — email preview */}
          <div className="hidden lg:block self-end">
            <div className="rounded-t-xl border border-b-0 p-4 translate-y-px" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
              {/* Toolbar */}
              <div className="flex items-center justify-between rounded-md px-3 py-2 mb-3 text-xs text-slate-500" style={{ backgroundColor: '#1e293b' }}>
                <span>📧 Inbox</span>
                <span>Today, 8:04 AM</span>
              </div>

              {/* Subject */}
              <p className="text-sm font-bold text-slate-100 mb-1">Your FedScout digest — 5 new matches</p>
              <p className="text-xs text-slate-500 mb-3">from hello@fedscout.io · to you</p>
              <p className="text-xs text-slate-400 mb-3">Good morning — here are today&apos;s opportunities matching your profile:</p>

              {/* Opportunity rows */}
              {[
                {
                  borderColor: '#B91C1C',
                  title: 'Cybersecurity Support Services — DHS Network Operations',
                  meta: 'Dept. of Homeland Security · Est. $2.4M',
                  deadline: '3 days left',
                  deadlineColor: '#f87171',
                },
                {
                  borderColor: '#d97706',
                  title: 'IT Modernization — GSA Regional Office Upgrade',
                  meta: 'General Services Administration · Est. $850K',
                  deadline: '11 days left',
                  deadlineColor: '#fbbf24',
                },
                {
                  borderColor: '#16a34a',
                  title: 'Software Development Support — DoD Enterprise Systems',
                  meta: 'Department of Defense · Est. $5.1M',
                  deadline: 'Apr 12',
                  deadlineColor: '#4ade80',
                },
              ].map(({ borderColor, title, meta, deadline, deadlineColor }) => (
                <div
                  key={title}
                  className="rounded-lg p-3 mb-2 border-l-2"
                  style={{ backgroundColor: '#1e293b', borderLeftColor: borderColor }}
                >
                  <p className="text-xs font-semibold text-slate-100 mb-1">{title}</p>
                  <p className="text-xs text-slate-500 mb-2">{meta}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: '#93c5fd' }}>View on SAM.gov →</span>
                    <span className="text-xs font-bold" style={{ color: deadlineColor }}>{deadline}</span>
                  </div>
                </div>
              ))}

              {/* Email footer */}
              <p className="text-xs text-center mt-2" style={{ color: '#475569' }}>
                FedScout · Manage preferences · Unsubscribe
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <div className="border-t" style={{ backgroundColor: '#060d1a', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 py-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x" style={{ borderColor: '#1e293b' }}>
            {[
              { num: '$600B+',  label: 'Federal contracts annually' },
              { num: '$49/mo',  label: 'vs $29k/yr for GovWin' },
              { num: 'Daily',   label: 'Personalized opportunity picks' },
              { num: '14 days', label: 'Free trial, no card required' },
            ].map(({ num, label }) => (
              <div key={num} className="px-4 sm:px-8 py-2 first:pl-0 text-center sm:text-left" style={{ borderColor: '#1e293b' }}>
                <p className="text-xl font-extrabold text-slate-100">{num}</p>
                <p className="text-xs mt-1" style={{ color: '#475569' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Dashboard preview ── */}
      <section className="border-t py-10" style={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#475569' }}>THE DASHBOARD</p>
          <h2 className="text-2xl font-extrabold text-slate-100 mb-2">Your pipeline, always up to date</h2>
          <p className="text-sm text-slate-500 mb-6 max-w-lg">
            Every contract in your digest links back to your dashboard where you can track status, deadlines, and next steps.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                agency: 'DHS', agencyFull: 'Homeland Security',
                title: 'Cybersecurity Support — Network Ops Center',
                naics: '541519', value: '$2.4M',
                deadline: '3 days left', deadlineColor: '#f87171',
                activeBtn: 'Pursuing', activeBtnStyle: { backgroundColor: '#1e3a8a', color: '#93c5fd' },
              },
              {
                agency: 'GSA', agencyFull: 'Gen. Services Admin.',
                title: 'IT Modernization — Regional Office Upgrade',
                naics: '541512', value: '$850K',
                deadline: '11 days left', deadlineColor: '#fbbf24',
                activeBtn: 'Interested', activeBtnStyle: { backgroundColor: '#14532d', color: '#86efac' },
              },
              {
                agency: 'DoD', agencyFull: 'Dept. of Defense',
                title: 'Software Development — Enterprise Systems',
                naics: '541511', value: '$5.1M',
                deadline: 'Apr 12', deadlineColor: '#4ade80',
                activeBtn: null, activeBtnStyle: {},
              },
            ].map(({ agency, agencyFull, title, naics, value, deadline, deadlineColor, activeBtn, activeBtnStyle }) => (
              <div key={title} className="rounded-xl p-3 border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded px-1.5 py-0.5 text-xs font-bold" style={{ backgroundColor: '#1e3a8a', color: '#93c5fd' }}>{agency}</span>
                  <span className="text-xs" style={{ color: '#93c5fd' }}>{agencyFull}</span>
                </div>
                <p className="text-xs font-semibold text-slate-100 mb-1">{title}</p>
                <p className="text-xs text-slate-500 mb-3">{naics} · Est. {value}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{ color: deadlineColor }}>{deadline}</span>
                  <span className="text-sm font-extrabold text-slate-100">{value}</span>
                </div>
                <div className="flex gap-1.5">
                  {['Pursuing', 'Interested', 'Pass'].map((btn) => (
                    <button
                      key={btn}
                      type="button"
                      className="rounded px-2 py-1 text-xs"
                      style={
                        activeBtn === btn
                          ? activeBtnStyle
                          : { backgroundColor: '#0f172a', color: '#64748b' }
                      }
                    >
                      {btn}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="border-t py-10" style={{ backgroundColor: '#0a0f1e', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-8">
            <p className="text-xs tracking-widest mb-2" style={{ color: '#475569' }}>HOW IT WORKS</p>
            <h2 className="text-2xl font-extrabold text-slate-100">Up and running in 2 minutes</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x" style={{ borderColor: '#1e293b' }}>
            {[
              {
                num: '1',
                title: 'Tell us your business',
                desc: 'Select your NAICS codes, target agencies, and keywords. We build your profile in under 2 minutes.',
              },
              {
                num: '2',
                title: 'We scan SAM.gov daily',
                desc: 'Every new federal contract posting gets scored against your profile automatically. Every single day.',
              },
              {
                num: '3',
                title: 'Your picks hit your inbox',
                desc: '8am every morning. A shortlist of contracts matched to your business. Not hundreds — just the right ones.',
              },
            ].map(({ num, title, desc }) => (
              <div key={num} className="px-6 py-6 first:pl-0 last:pr-0" style={{ borderColor: '#1e293b' }}>
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold text-white mb-4"
                  style={{ backgroundColor: '#B91C1C' }}
                >
                  {num}
                </div>
                <h3 className="text-sm font-bold text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ── */}
      <section className="border-t py-8" style={{ backgroundColor: '#060d1a', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-extrabold text-slate-100 mb-2">Built for small contractors GovWin ignores</h2>
            <p className="text-sm text-slate-500">GovWin starts at $13,000/year. We&apos;re $49/month.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* GovWin */}
            <div className="rounded-xl p-4 border" style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}>
              <p className="font-bold text-slate-400 mb-1">GovWin IQ</p>
              <p className="text-2xl font-extrabold text-slate-400 mb-4">$13k–$119k/yr</p>
              <ul className="space-y-2 text-sm text-slate-500">
                {[
                  { check: false, text: 'Built for large contractors' },
                  { check: false, text: 'Complex onboarding' },
                  { check: false, text: 'Overwhelming data' },
                  { check: true,  text: 'Deep market intelligence' },
                ].map(({ check, text }) => (
                  <li key={text} className="flex items-center gap-2">
                    {check
                      ? <span className="text-slate-400">✓</span>
                      : <span style={{ color: '#475569' }}>✕</span>
                    }
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* FedScout */}
            <div className="rounded-xl p-4 border" style={{ backgroundColor: '#1e3a8a', borderColor: '#1d4ed8' }}>
              <p className="font-bold text-white mb-1">FedScout</p>
              <p className="text-2xl font-extrabold text-white mb-4">$49/mo</p>
              <ul className="space-y-2 text-sm" style={{ color: '#bfdbfe' }}>
                {[
                  'Built for 1–10 person shops',
                  'Live in 2 minutes',
                  'Only relevant contracts',
                  'Daily digest to your inbox',
                ].map((text) => (
                  <li key={text} className="flex items-center gap-2">
                    <span style={{ color: '#86efac' }}>✓</span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-10 text-center px-6 sm:px-8" style={{ backgroundColor: '#B91C1C' }}>
        <h2 className="text-2xl font-extrabold text-white mb-2">
          Your next contract is on SAM.gov right now.
        </h2>
        <p className="text-sm mb-6" style={{ color: '#fecaca' }}>
          Start your free trial and see what you&apos;ve been missing.
        </p>
        <Link
          href="/quiz"
          className="inline-block rounded-lg px-8 py-3 text-sm font-extrabold transition-colors"
          style={{ backgroundColor: '#ffffff', color: '#b91c1c' }}
        >
          Find my contracts — free for 14 days
        </Link>
        <p className="text-xs mt-3" style={{ color: '#fca5a5' }}>
          $49/mo after trial. Cancel anytime. No contracts.
        </p>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-5 px-6 sm:px-8" style={{ backgroundColor: '#0a0f1e', borderColor: '#1e293b' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span className="font-bold text-slate-400">
            <span className="text-white">Fed</span><span style={{ color: '#ef4444' }}>Scout</span>
          </span>
          <div className="flex gap-4" style={{ color: '#475569' }}>
            <Link href="/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
          </div>
          <span style={{ color: '#475569' }}>&copy; 2026 FedScout</span>
        </div>
      </footer>

    </div>
  )
}
