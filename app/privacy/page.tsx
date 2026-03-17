import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300">
      <div className="max-w-2xl mx-auto px-6 py-16">

        <div className="mb-10">
          <Link href="/" className="text-4xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>
        </div>

        <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="text-slate-500 text-sm mb-10">Last updated: March 2026</p>

        <div className="space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-bold text-white mb-3">What We Collect</h2>
            <p className="text-slate-400">We collect the following information when you use FedScout:</p>
            <ul className="mt-3 space-y-2 text-slate-400 list-disc list-inside">
              <li><span className="text-slate-300 font-medium">Email address</span> — used to create your account and send your daily digest</li>
              <li><span className="text-slate-300 font-medium">Usage data</span> — pages visited, features used, and preferences you set during onboarding</li>
              <li><span className="text-slate-300 font-medium">Payment information</span> — processed securely by Stripe; we never store your card details</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">How We Use It</h2>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li>To provide and improve the FedScout service</li>
              <li>To send your personalized daily contract digest</li>
              <li>To process subscription payments</li>
              <li>To respond to support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">We Never Sell Your Data</h2>
            <p className="text-slate-400">
              We do not sell, rent, or share your personal information with third parties for marketing purposes. Ever.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Third-Party Services</h2>
            <p className="text-slate-400 mb-3">We use the following services to operate FedScout:</p>
            <ul className="space-y-2 text-slate-400 list-disc list-inside">
              <li><span className="text-slate-300 font-medium">Supabase</span> — database and authentication</li>
              <li><span className="text-slate-300 font-medium">Stripe</span> — payment processing</li>
              <li><span className="text-slate-300 font-medium">Resend</span> — transactional email delivery</li>
            </ul>
            <p className="text-slate-500 mt-3 text-xs">Each of these services has their own privacy policy governing how they handle data.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Data Deletion</h2>
            <p className="text-slate-400">
              You can request deletion of your account and all associated data at any time by emailing us at{' '}
              <a href="mailto:privacy@fedscout.io" className="text-red-400 hover:text-red-300">privacy@fedscout.io</a>.
              We will process your request within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">Contact</h2>
            <p className="text-slate-400">
              Questions about this policy? Email us at{' '}
              <a href="mailto:privacy@fedscout.io" className="text-red-400 hover:text-red-300">privacy@fedscout.io</a>.
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
