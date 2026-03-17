'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

// ─── Data ─────────────────────────────────────────────────────────────────────

const Q1 = {
  id: 'business_type',
  question: 'What best describes your business?',
  options: [
    { value: 'it_tech',      label: 'IT & Technology Services' },
    { value: 'cybersecurity', label: 'Cybersecurity' },
    { value: 'consulting',   label: 'Management Consulting' },
    { value: 'construction', label: 'Construction & Facilities' },
    { value: 'engineering',  label: 'Engineering & Technical' },
    { value: 'other',        label: 'Other' },
  ],
}

const Q2 = {
  id: 'current_method',
  question: 'How do you currently find federal contracts?',
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

  // Line 1: NAICS + agency recommendation based on business type
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

  // Line 2: based on current method
  if (cm === 'manual') {
    lines.push("Since you're already checking SAM.gov manually, FedScout will save you that time and surface only the contracts that fit your profile.")
  } else if (cm === 'paid_tool') {
    lines.push("FedScout gives you the daily contract intelligence of enterprise tools — at a fraction of the cost.")
  } else if (cm === 'network') {
    lines.push("You'll stop relying on your network to surface opportunities and start seeing every relevant posting the moment it goes live.")
  } else if (cm === 'new') {
    lines.push("We'll walk you through setup in 2 minutes and start surfacing real opportunities right away — no SAM.gov expertise needed.")
  }

  // Line 3: based on challenge
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

// ─── Components ───────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="w-full h-0.5 bg-gray-100 rounded-full mb-10">
      <div
        className="h-full bg-gray-900 rounded-full transition-all duration-500"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  )
}

function QuestionStep({
  q,
  stepNum,
  totalSteps,
  onSelect,
}: {
  q: typeof Q1
  stepNum: number
  totalSteps: number
  onSelect: (value: string) => void
}) {
  return (
    <div className="w-full max-w-lg mx-auto">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
        Question {stepNum} of {totalSteps}
      </p>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-8 leading-snug">
        {q.question}
      </h2>
      <div className="grid grid-cols-1 gap-3">
        {q.options.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelect(value)}
            className="w-full text-left rounded-xl border border-gray-200 px-5 py-4 text-sm font-medium text-gray-700 hover:border-gray-900 hover:text-gray-900 hover:bg-gray-50 transition-all group"
          >
            <span className="flex items-center justify-between">
              {label}
              <svg className="h-4 w-4 text-gray-300 group-hover:text-gray-600 transition-colors shrink-0 ml-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ResultsScreen({ answers }: { answers: Record<string, string> }) {
  const lines = getPersonalizedLines(answers)

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3 py-1 mb-6">
        <svg className="h-3.5 w-3.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
        </svg>
        <span className="text-xs font-semibold text-green-700">Profile ready</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 leading-snug">
        Your FedScout profile is ready
      </h2>

      <div className="space-y-3 mb-8">
        {lines.map((line, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl bg-gray-50 px-4 py-3.5">
            <svg className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-gray-700 leading-relaxed">{line}</p>
          </div>
        ))}
      </div>

      <Link
        href="/signup"
        className="block w-full rounded-xl bg-gray-900 px-6 py-4 text-center text-sm font-semibold text-white hover:bg-gray-700 transition-colors mb-3"
      >
        Create your account to see your matches →
      </Link>
      <p className="text-center text-xs text-gray-400">Takes 2 minutes. 14-day free trial.</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function QuizPage() {
  const [step, setStep] = useState(0) // 0-2 = questions, 3 = results
  const [answers, setAnswers] = useState<Record<string, string>>({})

  // Persist answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem('fedscout_quiz', JSON.stringify(answers))
    }
  }, [answers])

  function handleSelect(value: string) {
    const q = QUESTIONS[step]
    const next = { ...answers, [q.id]: value }
    setAnswers(next)
    setStep((s) => s + 1)
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-100 shrink-0">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-base font-semibold tracking-tight text-gray-900 hover:text-gray-600 transition-colors">
            fedscout
          </Link>
          <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 py-12">
        <div className="max-w-lg mx-auto w-full">
          {step < QUESTIONS.length ? (
            <>
              <ProgressBar step={step + 1} total={QUESTIONS.length} />
              <QuestionStep
                q={QUESTIONS[step]}
                stepNum={step + 1}
                totalSteps={QUESTIONS.length}
                onSelect={handleSelect}
              />
            </>
          ) : (
            <>
              <ProgressBar step={QUESTIONS.length} total={QUESTIONS.length} />
              <ResultsScreen answers={answers} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
