// frontend/src/components/stages/FeedbackStage.jsx
//
// State 04 of the LEXIS session flow (see scripts/design/lexis-visual-system.md).
// Everything shown here comes from POST /api/feedback — one real LLM pass
// over the session's actual transcript, run once when this stage mounts
// (see the effect in LexisApp.jsx). There is no static/fabricated score:
// `feedback.insufficient` is a real, distinct state for sessions too short
// to evaluate honestly, and `feedbackError` covers the call failing
// outright — neither of those blocks the student from practicing again.
import React from 'react';
import { CheckCircle2, RotateCcw, Loader2 } from 'lucide-react';

function ConfidenceRing({ value }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#E7E5DE" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={radius} fill="none"
          stroke="#0D9488" strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display font-semibold text-3xl text-lexis-ink">{value}%</span>
        <span className="text-[10px] uppercase tracking-wider text-lexis-ink/40">Confidence</span>
      </div>
    </div>
  );
}

export default function FeedbackStage({ feedback, feedbackLoading, feedbackError, onPracticeAgain, onDone }) {
  return (
    <div className="min-h-screen bg-lexis-canvas text-lexis-ink font-sans flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display font-semibold text-2xl mb-8">Your conversation</h1>

        {feedbackLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-lexis-ink/50">
            <Loader2 className="w-6 h-6 animate-spin" />
            <p className="text-sm">Looking back at your conversation...</p>
          </div>
        )}

        {!feedbackLoading && feedbackError && (
          <div className="py-8">
            <p className="text-sm text-lexis-ink/60">
              Couldn't put together feedback this time — no worries, your practice still counts!
            </p>
          </div>
        )}

        {!feedbackLoading && !feedbackError && feedback?.insufficient && (
          <div className="py-8">
            <p className="text-sm text-lexis-ink/60">{feedback.message}</p>
          </div>
        )}

        {!feedbackLoading && !feedbackError && feedback && !feedback.insufficient && (
          <div className="flex flex-col items-center gap-8">
            <ConfidenceRing value={feedback.confidence} />

            {feedback.strengths?.length > 0 && (
              <div className="w-full text-left">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-3">You did well with</h2>
                <ul className="space-y-2">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-lexis-ink/80">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.improvements?.length > 0 && (
              <div className="w-full text-left">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-lexis-action-dark mb-3">Try improving</h2>
                <ul className="space-y-3">
                  {feedback.improvements.map((imp, i) => (
                    <li key={i} className="bg-white border border-lexis-ink/10 rounded-xl p-3 text-sm">
                      <div className="text-lexis-ink/40 line-through">{imp.original}</div>
                      <div className="text-lexis-ink font-medium mt-0.5">{imp.corrected}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={onPracticeAgain}
            className="px-8 py-3.5 bg-lexis-action hover:bg-lexis-action-dark text-white font-display font-semibold rounded-2xl shadow-lg shadow-lexis-action/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Practice Again</span>
          </button>
          <button onClick={onDone} className="text-xs text-lexis-ink/40 hover:text-lexis-ink/70 transition-colors">
            Done for now
          </button>
        </div>
      </div>
    </div>
  );
}
