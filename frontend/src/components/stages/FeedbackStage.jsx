// frontend/src/components/stages/FeedbackStage.jsx
//
// State 04 of the LEXIS session flow (see scripts/design/lexis-visual-system.md).
// Everything shown here comes from POST /api/feedback — one real LLM pass
// over the session's actual transcript, run once when this stage mounts
// (see the effect in LexisApp.jsx). There is no static/fabricated score:
// `feedback.insufficient` is a real, distinct state for sessions too short
// to evaluate honestly, and `feedbackError` covers the call failing
// outright — neither of those blocks the student from practicing again.
import React, { useState } from 'react';
import { CheckCircle2, RotateCcw, Loader2, Share2 } from 'lucide-react';
import { makeResultCard, shareResultCard } from '../../lib/resultCard';
import { trackEvent } from '../../lib/analytics';

// The chrome around the report (headings, button labels, loading/error
// copy) is keyed to `direction`, same as buildTutorInstructions on the
// backend — the report needs to be legible in the student's *comfortable*
// language, not the one they're actively learning. The report's own
// content (strengths, correction notes) is separately written in that
// same language by the model itself — see /api/feedback's system prompt
// in backend/app.mjs. 'original'/'corrected' quotes stay in the target
// language regardless, since they're literal example phrases, not prose.
const UI_STRINGS = {
  // direction 'en' = Thai speaker learning English -> comfortable in Thai
  en: {
    title: 'บทสนทนาของคุณ',
    loading: 'กำลังทบทวนบทสนทนาของคุณ...',
    errorFallback: 'ครั้งนี้ยังสรุปผลไม่ได้ ไม่ต้องกังวล การฝึกของคุณยังมีค่าเสมอ!',
    confidenceLabel: 'ความมั่นใจ',
    strengthsHeading: 'สิ่งที่คุณทำได้ดี',
    improvementsHeading: 'ลองปรับปรุงตรงนี้',
    practiceAgain: 'ฝึกอีกครั้ง',
    doneForNow: 'พอแค่นี้ก่อน',
    share: 'แชร์ผลของฉัน',
    downloaded: 'บันทึกรูปแล้ว โพสต์ได้เลย!'
  },
  // direction 'th' = English speaker learning Thai -> comfortable in English
  th: {
    title: 'Your conversation',
    loading: 'Looking back at your conversation...',
    errorFallback: "Couldn't put together feedback this time, no worries, your practice still counts!",
    confidenceLabel: 'Confidence',
    strengthsHeading: 'You did well with',
    improvementsHeading: 'Try improving',
    practiceAgain: 'Practice Again',
    doneForNow: 'Done for now',
    share: 'Share my result',
    downloaded: 'Image saved, ready to post!'
  }
};

function ConfidenceRing({ value, label }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90" aria-hidden="true" focusable="false">
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
        <span className="text-[10px] uppercase tracking-wider text-lexis-ink/65">{label}</span>
      </div>
    </div>
  );
}

export default function FeedbackStage({ feedback, feedbackLoading, feedbackError, direction, onPracticeAgain, onDone }) {
  const t = UI_STRINGS[direction] || UI_STRINGS.en;
  const [sharing, setSharing] = useState(false);
  const [shareNote, setShareNote] = useState('');

  // Only offered for a real, scored session: there's nothing to share for
  // "too short to evaluate" or a failed feedback call. See lib/resultCard.js
  // for what goes on the card and why.
  const share = async () => {
    setSharing(true);
    setShareNote('');
    try {
      const card = await makeResultCard({ confidence: feedback.confidence, strengths: feedback.strengths, direction });
      const method = await shareResultCard(card);
      if (method !== 'cancelled') trackEvent('result_card_shared', { metadata: { method, direction } });
      if (method === 'download') setShareNote(t.downloaded);
    } catch {
      // Canvas or share-sheet failure: nothing useful to tell the learner
      // beyond "it didn't work", and the button stays to try again.
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-md text-center">
        <h1 className="font-display font-semibold text-2xl mb-8">{t.title}</h1>

        {feedbackLoading && (
          <div className="flex flex-col items-center gap-3 py-8 text-lexis-ink/70">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
            <p className="text-sm">{t.loading}</p>
          </div>
        )}

        {!feedbackLoading && feedbackError && (
          <div className="py-8">
            <p className="text-sm text-lexis-ink/75">{t.errorFallback}</p>
          </div>
        )}

        {!feedbackLoading && !feedbackError && feedback?.insufficient && (
          <div className="py-8">
            <p className="text-sm text-lexis-ink/75">{feedback.message}</p>
          </div>
        )}

        {!feedbackLoading && !feedbackError && feedback && !feedback.insufficient && (
          <div className="flex flex-col items-center gap-8">
            <ConfidenceRing value={feedback.confidence} label={t.confidenceLabel} />

            {feedback.strengths?.length > 0 && (
              <div className="w-full text-left">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-3">{t.strengthsHeading}</h2>
                <ul className="space-y-2">
                  {feedback.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-lexis-ink/80">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.improvements?.length > 0 && (
              <div className="w-full text-left">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-lexis-action-dark mb-3">{t.improvementsHeading}</h2>
                <ul className="space-y-3">
                  {feedback.improvements.map((imp, i) => (
                    <li key={i} className="bg-white border border-lexis-ink/10 rounded-xl p-3 text-sm">
                      <div className="text-lexis-ink/65 line-through">{imp.original}</div>
                      <div className="text-lexis-ink font-medium mt-0.5">{imp.corrected}</div>
                      {imp.note && <div className="text-lexis-ink/75 text-xs mt-1.5">{imp.note}</div>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-10 flex flex-col items-center gap-3">
          {!feedbackLoading && !feedbackError && feedback && !feedback.insufficient && (
            <>
              <button
                onClick={share}
                disabled={sharing}
                className="px-6 py-3 bg-white border border-lexis-ink/15 hover:border-lexis-ink/30 disabled:opacity-50 text-lexis-ink font-semibold text-sm rounded-2xl transition-all flex items-center gap-2"
              >
                {sharing ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Share2 className="w-4 h-4" aria-hidden="true" />}
                <span>{t.share}</span>
              </button>
              {shareNote && <p className="text-xs text-teal-700" role="status">{shareNote}</p>}
            </>
          )}
          <button
            onClick={onPracticeAgain}
            className="px-8 py-3.5 bg-lexis-action hover:bg-lexis-action-dark text-lexis-navy font-display font-semibold rounded-2xl lexis-lift transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>{t.practiceAgain}</span>
          </button>
          <button onClick={onDone} className="text-xs text-lexis-ink/65 hover:text-lexis-ink/70 transition-colors">
            {t.doneForNow}
          </button>
        </div>
      </div>
    </div>
  );
}
