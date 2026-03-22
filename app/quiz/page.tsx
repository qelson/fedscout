'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

// ─── Data ─────────────────────────────────────────────────────────────────────

const Q1 = {
  id: 'business_type',
  question: 'What best describes your business?',
  multi: false,
  options: [
    { value: 'it_tech',       label: 'IT & Technology Services' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'consulting',    label: 'Management Consulting' },
    { value: 'construction',  label: 'Construction & Facilities' },
    { value: 'engineering',   label: 'Engineering & Technical' },
    { value: 'other',         label: 'Other' },
  ],
}

const Q2 = {
  id: 'current_method',
  question: 'How do you currently find federal contracts?',
  multi: false,
  options: [
    { value: 'manual',    label: 'I check SAM.gov manually every day' },
    { value: 'paid_tool', label: 'I use a paid tool like GovWin' },
    { value: 'network',   label: 'I rely on word of mouth / teaming partners' },
    { value: 'new',       label: "I'm just getting started with government contracting" },
  ],
}

const Q3 = {
  id: 'biggest_challenge',
  question: "What's your biggest challenge with SAM.gov?",
  multi: false,
  options: [
    { value: 'time',      label: 'Too time-consuming to check daily' },
    { value: 'deadlines', label: 'Missing deadlines' },
    { value: 'noise',     label: 'Finding relevant contracts in all the noise' },
    { value: 'unsure',    label: "Not sure where to start" },
  ],
}

const QUESTIONS = [Q1, Q2, Q3]

// ─── Personalization logic ─────────────────────────────────────────────────────

function getPersonalizedLines(answers: Record<string, string>): string[] {
  const lines: string[] = []
  const bt = answers['business_type']
  const cm = answers['current_method']
  const ch = answers['biggest_challenge']

  if (bt === 'it_tech') {
    lines.push("Based on your IT services background, we'll prioritize NAICS 541511 and 541512 contracts from DoD, DHS, and GSA.")
  } else if (bt === 'cybersecurity') {
    lines.push("For cybersecurity work, we'll focus on NAICS 541519 and 541512 opportunities — especially from DoD, DHS, and NSA.")
  } else if (bt === 'consulting') {
    lines.push("For management consulting, we'll highlight NAICS 541611 contracts from civilian agencies like HHS, GSA, and VA.")
  } else if (bt === 'construction') {
    lines.push("For construction and facilities work, we'll surface NAICS 236220 and 561210 opportunities across DoD installations and GSA.")
  } else if (bt === 'engineering') {
    lines.push("For engineering and technical services, we'll focus on NAICS 541330 and 541690 contracts from DoD, DOE, and NASA.")
  } else {
    lines.push("We'll tailor your contract feed once you set your NAICS codes — takes about 60 seconds during onboarding.")
  }

  if (cm === 'manual') {
    lines.push("Since you're already checking SAM.gov manually, FedScout will save you that time and surface only the contracts that fit your profile.")
  } else if (cm === 'paid_tool') {
    lines.push("FedScout gives you the daily contract intelligence of enterprise tools — at a fraction of the cost.")
  } else if (cm === 'network') {
    lines.push("You'll stop relying on your network to surface opportunities and start seeing every relevant posting the moment it goes live.")
  } else if (cm === 'new') {
    lines.push("We'll walk you through setup in 2 minutes and start surfacing real opportunities right away — no SAM.gov expertise needed.")
  }

  if (ch === 'time') {
    lines.push("Your daily digest will replace manual SAM.gov searches entirely — one email, every morning, with only what matters.")
  } else if (ch === 'deadlines') {
    lines.push("Every opportunity in your digest includes a deadline countdown, and we'll flag anything closing within 7 days.")
  } else if (ch === 'noise') {
    lines.push("Unlike raw SAM.gov feeds, FedScout scores each contract against your profile so you only see the relevant ones.")
  } else if (ch === 'unsure') {
    lines.push("We'll guide you through every step — from setting up your profile to reading your first digest.")
  }

  return lines
}

// ─── Results Screen ────────────────────────────────────────────────────────────

function ResultsScreen({ answers }: { answers: Record<string, string> }) {
  const lines = getPersonalizedLines(answers)

  return (
    <>
      {/* Green checkmark */}
      <div className="w-16 h-16 bg-green-950 border-2 border-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h2 className="text-slate-100 text-2xl font-bold text-center mb-3">
        Your FedScout profile is ready
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8 leading-relaxed">
        {lines[0]}
      </p>

      {lines.slice(1).map((line, i) => (
        <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 mb-3">
          <p className="text-slate-300 text-sm leading-relaxed">{line}</p>
        </div>
      ))}

      <Link
        href="/signup"
        className="block w-full bg-red-700 hover:bg-red-600 text-white font-bold py-4 rounded-xl text-base text-center transition-colors mt-6"
      >
        Create your account to see your matches
      </Link>
      <p className="text-center text-xs text-slate-600 mt-3">Takes 2 minutes. 14-day free trial.</p>
    </>
  )
}

// ─── NAICS mapping from quiz business_type ────────────────────────────────────

const BUSINESS_TYPE_NAICS: Record<string, string[]> = {
  it_tech:      ['541511', '541512'],
  cybersecurity:['541519', '541512'],
  consulting:   ['541611'],
  construction: ['236220', '561210'],
  engineering:  ['541330', '541690'],
  other:        [],
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [selected, setSelected] = useState<string | null>(null)

  const totalSteps = QUESTIONS.length
  const isResults = step >= totalSteps
  const currentQ = QUESTIONS[step]

  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('fedscout_quiz', JSON.stringify(answers))
    }
  }, [answers])

  async function saveQuizAnswers(finalAnswers: Record<string, string>) {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return // not logged in — skip Supabase save

      const naicsCodes = BUSINESS_TYPE_NAICS[finalAnswers.business_type] ?? []

      // Save safe columns — guaranteed to exist
      const { error } = await supabase
        .from('user_preferences')
        .upsert(
          {
            user_id: user.id,
            naics_codes: naicsCodes,
            keywords: [],
            agencies: [],
            min_value: null,
            max_value: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        )

      if (error) {
        console.error('[quiz] core save failed:', error)
        return
      }

      // Save extra columns separately — skip if column doesn't exist yet
      try {
        await supabase
          .from('user_preferences')
          .update({ certifications: [] })
          .eq('user_id', user.id)
      } catch (e) {
        console.warn('[quiz] extra columns save failed, ignoring:', e)
      }
    } catch (e) {
      console.error('[quiz] saveQuizAnswers error:', e)
    }
  }

  function handleContinue() {
    if (!selected || !currentQ) return
    const next = { ...answers, [currentQ.id]: selected }
    setAnswers(next)
    setSelected(null)

    const nextStep = step + 1
    setStep(nextStep)

    // On last question, save and redirect
    if (nextStep >= totalSteps) {
      saveQuizAnswers(next).finally(() => {
        router.push('/signup')
      })
    }
  }

  function handleBack() {
    if (step === 0) return
    setSelected(null)
    setStep((s) => s - 1)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-8">

        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="text-3xl font-extrabold tracking-tight">
            <span className="text-white">Fed</span><span className="text-red-500">Scout</span>
          </Link>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-800 rounded-full mt-6 mb-2">
          <div
            className="h-full bg-red-600 rounded-full transition-all duration-300"
            style={{ width: `${((isResults ? totalSteps : step) / totalSteps) * 100}%` }}
          />
        </div>
        <p className="text-slate-600 text-xs text-right mb-6">
          {isResults ? `${totalSteps} of ${totalSteps}` : `Step ${step + 1} of ${totalSteps}`}
        </p>

        {isResults ? (
          <ResultsScreen answers={answers} />
        ) : (
          <>
            {/* Question */}
            <h2 className="text-slate-100 text-xl font-bold leading-snug mb-6">
              {currentQ.question}
            </h2>

            {/* Options */}
            <div className="flex flex-col gap-3">
              {currentQ.options.map(({ value, label }) => {
                const isSelected = selected === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setSelected(value)}
                    className={`w-full text-left rounded-xl px-5 py-4 text-sm transition-all cursor-pointer border ${
                      isSelected
                        ? 'border-red-600 bg-red-950/50 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
                >
                  ← Back
                </button>
              ) : (
                <span />
              )}
              <button
                type="button"
                onClick={handleContinue}
                disabled={!selected}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold px-8 py-3 rounded-xl text-sm transition-colors"
              >
                Continue
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
