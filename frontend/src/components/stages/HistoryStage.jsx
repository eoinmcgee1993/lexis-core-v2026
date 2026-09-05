// frontend/src/components/stages/HistoryStage.jsx
//
// Past-session feedback, fetched from GET /api/history (backend/app.mjs) —
// not a fifth "product state" in the sense of scripts/design/lexis-visual-system.md's
// four-stage session flow, but reachable from Welcome as its own screen.
// Each entry is a real, previously-generated feedback result (see
// FeedbackStage.jsx / /api/feedback) — nothing here is synthesized fresh,
// it's just a list of what session_history already has on file.
import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, CheckCircle2, Loader2 } from 'lucide-react';

const TOPIC_LABELS = {
  everyday: 'Everyday Talk',
  work: 'Work & Business',
  travel: 'Travel & Culture'
};

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

function HistoryCard({ entry }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !entry.insufficient && (entry.strengths?.length > 0 || entry.improvements?.length > 0);

  return (
    <div className="bg-white border border-lexis-ink/10 rounded-2xl overflow-hidden">
      <button
        onClick={() => hasDetail && setExpanded((e) => !e)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <div className="text-sm font-semibold text-lexis-ink">
            {entry.direction === 'th' ? 'Thai' : 'English'} · {entry.topic ? TOPIC_LABELS[entry.topic] || entry.topic : 'Just Talk'}
          </div>
          <div className="text-xs text-lexis-ink/40 mt-0.5">{formatDate(entry.created_at)}</div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {entry.insufficient ? (
            <span className="text-[10px] uppercase tracking-wide text-lexis-ink/40">Too short to grade</span>
          ) : (
            <span className="text-sm font-display font-semibold text-teal-700">{entry.confidence}%</span>
          )}
          {hasDetail && (
            <ChevronDown className={`w-4 h-4 text-lexis-ink/40 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
          )}
        </div>
      </button>

      {expanded && hasDetail && (
        <div className="px-4 pb-4 space-y-3 border-t border-lexis-ink/10 pt-3">
          {entry.strengths?.length > 0 && (
            <ul className="space-y-1.5">
              {entry.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-lexis-ink/70">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          )}
          {entry.improvements?.length > 0 && (
            <div className="space-y-2">
              {entry.improvements.map((imp, i) => (
                <div key={i} className="bg-lexis-canvas rounded-lg p-2.5 text-xs">
                  <div className="text-lexis-ink/40 line-through">{imp.original}</div>
                  <div className="text-lexis-ink font-medium mt-0.5">{imp.corrected}</div>
                  {imp.note && <div className="text-lexis-ink/50 mt-1">{imp.note}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryStage({ history, historyLoading, historyError, onBack }) {
  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <div className="w-full max-w-2xl mx-auto flex items-center p-4 md:p-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-6 pb-12">
        <h1 className="font-display font-semibold text-2xl mb-6">Your practice history</h1>

        {historyLoading && (
          <div className="flex flex-col items-center gap-3 py-12 text-lexis-ink/50">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
          </div>
        )}

        {!historyLoading && historyError && (
          <p className="text-sm text-lexis-ink/60 py-8 text-center">Couldn't load your history right now, try again in a moment.</p>
        )}

        {!historyLoading && !historyError && history.length === 0 && (
          <p className="text-sm text-lexis-ink/50 py-8 text-center">No sessions yet. Your practice history will show up here after your first conversation.</p>
        )}

        {!historyLoading && !historyError && history.length > 0 && (
          <div className="space-y-3">
            {history.map((entry) => <HistoryCard key={entry.id} entry={entry} />)}
          </div>
        )}
      </div>
    </div>
  );
}
