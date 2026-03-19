'use client'

import { useState, useEffect } from 'react'
import { OpportunityWithStatus } from '@/lib/types'

const DIMENSIONS = [
  { key: 'technical_fit',        label: 'Technical fit',          question: 'How well does this match our capabilities?' },
  { key: 'past_performance',     label: 'Past performance',       question: 'Have we done similar work?' },
  { key: 'competitive_position', label: 'Competitive position',   question: 'Can we realistically win this?' },
  { key: 'value_vs_effort',      label: 'Value vs effort',        question: 'Is the contract value worth the bid cost?' },
  { key: 'timeline',             label: 'Timeline',               question: 'Can we respond by the deadline?' },
  { key: 'agency_relationship',  label: 'Agency relationship',    question: 'Do we have existing agency contacts?' },
] as const

type DimensionKey = typeof DIMENSIONS[number]['key']

const RATING_LABELS: Record<number, string> = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Strong', 5: 'Excellent' }

function getRecommendation(total: number): { label: string; color: string; bg: string } {
  if (total >= 20) return { label: 'PURSUE', color: '#4ade80', bg: '#052e16' }
  if (total >= 12) return { label: 'CONSIDER', color: '#fbbf24', bg: '#1c1400' }
  return { label: 'PASS', color: '#f87171', bg: '#1f0a0a' }
}

export default function BidEvaluationPanel({
  opp,
  evaluation,
  onSave,
}: {
  opp: OpportunityWithStatus
  evaluation: Record<string, any> | undefined
  onSave: (ev: Record<string, any>) => void
}) {
  const [scores, setScores] = useState<Record<DimensionKey, number>>(() => ({
    technical_fit:        evaluation?.technical_fit        ?? 3,
    past_performance:     evaluation?.past_performance     ?? 3,
    competitive_position: evaluation?.competitive_position ?? 3,
    value_vs_effort:      evaluation?.value_vs_effort      ?? 3,
    timeline:             evaluation?.timeline             ?? 3,
    agency_relationship:  evaluation?.agency_relationship  ?? 3,
  }))

  const [reasoning, setReasoning] = useState<string>(evaluation?.ai_reasoning ?? '')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiSuggested, setAiSuggested] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const total = Object.values(scores).reduce((a, b) => a + b, 0)
  const rec = getRecommendation(total)

  async function handleAiPrefill() {
    setAiLoading(true)
    try {
      const res = await fetch('/api/bid-evaluation-prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp.id,
          title: opp.title,
          description: opp.description,
          agency: opp.agency,
          naicsCode: opp.naics_code,
          estimatedValue: opp.estimated_value_min ?? opp.estimated_value_max,
        }),
      })
      const data = await res.json()
      if (data.prefill) {
        const { reasoning: r, ...dims } = data.prefill
        setScores(prev => ({ ...prev, ...dims }))
        if (r) setReasoning(r)
        setAiSuggested(true)
      }
    } catch {
      // silently ignore
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await fetch('/api/bid-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: opp.id,
          ...scores,
          recommendation: rec.label.toLowerCase(),
          ai_reasoning: reasoning,
          ai_prefill: aiSuggested,
        }),
      })
      onSave({ ...scores, recommendation: rec.label.toLowerCase(), ai_reasoning: reasoning })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      // silently ignore
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-slate-300 text-xs font-bold uppercase tracking-wide">Go/No-Bid Scorecard</p>
        <button
          type="button"
          onClick={handleAiPrefill}
          disabled={aiLoading}
          className="text-xs px-3 py-1.5 rounded-lg border border-purple-800 text-purple-400 hover:border-purple-600 hover:text-purple-300 transition-colors disabled:opacity-50"
        >
          {aiLoading ? 'Analyzing...' : '✦ AI Suggest'}
        </button>
      </div>

      {aiSuggested && (
        <p className="text-purple-400 text-xs">AI suggested · You can adjust any score</p>
      )}

      {/* Sliders */}
      <div className="space-y-3">
        {DIMENSIONS.map(({ key, label, question }) => (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-slate-400 text-xs font-semibold">{label}</p>
              <span className="text-xs" style={{ color: scores[key] >= 4 ? '#4ade80' : scores[key] >= 3 ? '#fbbf24' : '#f87171' }}>
                {RATING_LABELS[scores[key]]}
              </span>
            </div>
            <p className="text-slate-600 text-xs mb-1">{question}</p>
            <input
              type="range"
              min={1}
              max={5}
              value={scores[key]}
              onChange={e => setScores(prev => ({ ...prev, [key]: Number(e.target.value) }))}
              className="w-full accent-purple-500 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-slate-700 text-xs mt-0.5">
              <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span>
            </div>
          </div>
        ))}
      </div>

      {/* Reasoning */}
      {reasoning && (
        <p className="text-slate-400 text-xs italic border-l-2 border-purple-800 pl-3">{reasoning}</p>
      )}

      {/* Total + recommendation */}
      <div
        className="flex items-center justify-between rounded-xl p-3 border"
        style={{ backgroundColor: rec.bg, borderColor: rec.color + '44' }}
      >
        <div>
          <p className="text-xs font-bold" style={{ color: rec.color }}>
            Recommendation: {rec.label}
          </p>
          <p className="text-slate-500 text-xs mt-0.5">
            Total: {total}/30
            {total >= 20 ? ' — Strong bid candidate' : total >= 12 ? ' — Evaluate carefully' : ' — Consider passing'}
          </p>
        </div>
        <div
          className="text-3xl font-extrabold"
          style={{ color: rec.color }}
        >
          {total}
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:border-slate-500 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save evaluation'}
        </button>
        {saved && <span className="text-green-400 text-xs">Saved!</span>}
      </div>
    </div>
  )
}
