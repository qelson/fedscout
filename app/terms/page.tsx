import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Service Description</h2>
            <p className="text-slate-400">
              FedScout monitors SAM.gov for federal contract opportunities and delivers a personalized daily email digest based on your business profile. By creating an account, you agree to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Subscription</h2>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>FedScout costs <span className="text-slate-300 font-medium">$49/month</span> after a 14-day free trial</li>
              <li>No credit card is required to start your trial</li>
              <li>You may cancel at any time — no long-term commitment</li>
              <li>Refunds are handled on a case-by-case basis; contact us within 7 days of a charge</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">No Guarantee of Results</h2>
            <p className="text-slate-400">
              FedScout surfaces federal contract opportunities that match your profile. We do not guarantee that you will win any contract, receive any award, or generate any revenue as a result of using the service. Contract outcomes depend entirely on your proposals, qualifications, and factors outside our control.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Acceptable Use</h2>
            <p className="text-slate-400 mb-3">You agree not to:</p>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>Scrape, copy, or redistribute contract data surfaced by FedScout</li>
              <li>Resell or sublicense access to the service</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to reverse-engineer or interfere with the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Termination</h2>
            <p className="text-slate-400">
              We reserve the right to suspend or terminate accounts that violate these terms, abuse the service, or engage in fraudulent activity. You may also close your account at any time by contacting us.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Limitation of Liability</h2>
            <p className="text-slate-400">
              FedScout is provided &quot;as is&quot; without warranties of any kind. To the maximum extent permitted by law, FedScout shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p className="text-slate-400">
              Questions about these terms? Email us at{' '}
              <a href="mailto:legal@fedscout.io" className="text-red-400 hover:text-red-300">legal@fedscout.io</a>.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-slate-800">
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">← Back to FedScout</Link>
        </div>

      </div>
    </div>
  )
}
