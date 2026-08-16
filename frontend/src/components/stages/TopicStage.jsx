// frontend/src/components/stages/TopicStage.jsx
//
// State 02 of the LEXIS session flow (see scripts/design/lexis-visual-system.md).
// Picking a card here isn't cosmetic — the choice is sent to POST
// /api/session as `topic` and actually steers buildTutorInstructions() on
// the backend (backend/app.mjs) for the whole session. "Just Talk" sends
// no topic at all, which falls through to LEXIS's original open rotation.
import React from 'react';
import { ArrowLeft, MessageCircle, Briefcase, Plane } from 'lucide-react';

const TOPICS = [
  { key: 'everyday', label: 'Everyday Talk', desc: 'Real conversations — daily life, friends, hobbies', icon: MessageCircle },
  { key: 'work', label: 'Work & Business', desc: 'Meetings, emails, interviews, small talk', icon: Briefcase },
  { key: 'travel', label: 'Travel & Culture', desc: 'Hotels, directions, ordering food, getting help', icon: Plane }
];

export default function TopicStage({ onBack, onPickTopic }) {
  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <div className="w-full max-w-4xl mx-auto flex items-center p-4 md:p-6">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center px-6 py-8">
        <h1 className="font-display font-semibold text-2xl md:text-3xl text-center text-balance">
          What do you want to practice today?
        </h1>
        <p className="mt-2 text-sm text-lexis-ink/50 text-center">
          Pick a topic to steer today's conversation, or skip straight in.
        </p>

        <div className="mt-8 w-full max-w-sm flex flex-col gap-3">
          {TOPICS.map(({ key, label, desc, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onPickTopic(key)}
              className="group flex items-center gap-4 text-left bg-white border border-lexis-ink/10 rounded-2xl p-4 shadow-sm hover:border-teal-500/50 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              <div className="p-2.5 bg-teal-600/10 text-teal-700 rounded-xl flex-shrink-0 transition-colors group-hover:bg-teal-600/15">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="font-semibold text-sm">{label}</div>
                <div className="text-xs text-lexis-ink/50 mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onPickTopic(null)}
          className="mt-8 px-8 py-3.5 bg-lexis-action hover:bg-lexis-action-dark text-white font-display font-semibold rounded-2xl shadow-lg shadow-lexis-action/25 transition-all hover:scale-105 active:scale-95"
        >
          Just Talk
        </button>
      </div>
    </div>
  );
}
