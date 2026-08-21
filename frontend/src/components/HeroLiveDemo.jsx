// frontend/src/components/HeroLiveDemo.jsx
//
// PREVIEW, not yet wired into production — see LandingPage.jsx's hero
// section for how it's currently gated. Built in response to the
// interface re-audit's recommendation 01: "Put the conversation in the
// hero, running." replace the static portrait with the real Live
// Conversation screen's own visual language (navy canvas, teal glow ring,
// a transcript with real English/Thai lines arriving one at a time) —
// see LiveStage.jsx, this component deliberately reuses its exact color
// system (bg-lexis-navy, teal-950/teal-800/teal-100 transcript bubbles,
// the same glow-ring treatment) rather than inventing a new one.
//
// What this is NOT: a real WebRTC connection. There is no live audio or
// model call here — it's a scripted, looping animation of what a real
// session looks like, honestly, not presented as an actual live feed.
// The transcript lines below are illustrative (drawn from the real
// "everyday" topic curriculum already live in the product, see
// backend/app.mjs's TOPIC_CURRICULA.everyday and
// EverydayEnglishPage.jsx's own practice prompts), not a real recording
// of a real session.
//
// "Hear her voice" deliberately does NOT play a canned audio clip —
// generating one costs real ElevenLabs credits, which shouldn't be spent
// without asking first (same rule as GROWTH-DELEGATION-BRIEF.md's ad-spend
// caution). It routes straight into starting a real trial instead, which
// is arguably more honest anyway: that's actually her voice, not a demo
// recording of it.
import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';

// direction: 'en' | 'th' — which language LEXIS is teaching, same value
// LandingPage.jsx already tracks. LEXIS speaks the target language;
// the translation line is whichever language the student already knows.
const SCRIPTS = {
  en: [
    [{ speaker: 'lexis', text: 'What did you get up to this weekend?' }],
    [{ speaker: 'lexis', text: 'What did you get up to this weekend?', translation: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง' }],
    [
      { speaker: 'lexis', text: 'What did you get up to this weekend?', translation: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง' },
      { speaker: 'you', text: 'I went to Chiang Mai with my friends.' }
    ],
    [
      { speaker: 'lexis', text: 'What did you get up to this weekend?', translation: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง' },
      { speaker: 'you', text: 'I went to Chiang Mai with my friends.' },
      { speaker: 'lexis', text: 'That sounds lovely! Did you try any new food there?' }
    ],
    [
      { speaker: 'lexis', text: 'What did you get up to this weekend?', translation: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง' },
      { speaker: 'you', text: 'I went to Chiang Mai with my friends.' },
      { speaker: 'lexis', text: 'That sounds lovely! Did you try any new food there?', translation: 'ฟังดูดีมากเลย ได้ลองกินอะไรใหม่ๆ ที่นั่นไหม' }
    ]
  ],
  th: [
    [{ speaker: 'lexis', text: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง' }],
    [{ speaker: 'lexis', text: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง', translation: 'What did you get up to this weekend?' }],
    [
      { speaker: 'lexis', text: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง', translation: 'What did you get up to this weekend?' },
      { speaker: 'you', text: 'ผมไปเที่ยวเชียงใหม่กับเพื่อน' }
    ],
    [
      { speaker: 'lexis', text: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง', translation: 'What did you get up to this weekend?' },
      { speaker: 'you', text: 'ผมไปเที่ยวเชียงใหม่กับเพื่อน' },
      { speaker: 'lexis', text: 'ฟังดูดีมากเลย ได้ลองกินอะไรใหม่ๆ ที่นั่นไหม' }
    ],
    [
      { speaker: 'lexis', text: 'สุดสัปดาห์นี้ทำอะไรมาบ้าง', translation: 'What did you get up to this weekend?' },
      { speaker: 'you', text: 'ผมไปเที่ยวเชียงใหม่กับเพื่อน' },
      { speaker: 'lexis', text: 'ฟังดูดีมากเลย ได้ลองกินอะไรใหม่ๆ ที่นั่นไหม', translation: 'That sounds lovely! Did you try any new food there?' }
    ]
  ]
};

const STEP_MS = 2200;
const END_PAUSE_MS = 2400; // hold the finished exchange on screen before looping

const WAVE_BARS = 5; // matches LexisMark's five-bar shape, animated instead of static

export default function HeroLiveDemo({ direction, caption, listenLabel, onListen }) {
  const script = SCRIPTS[direction] || SCRIPTS.en;
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0); // direction changed (language toggle) — restart the loop from the top
  }, [direction]);

  useEffect(() => {
    const isLastStep = step === script.length - 1;
    const delay = isLastStep ? END_PAUSE_MS : STEP_MS;
    const timer = setTimeout(() => {
      setStep((s) => (s + 1) % script.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [step, script.length]);

  const visibleLines = script[step];
  const lexisIsTalking = visibleLines[visibleLines.length - 1]?.speaker === 'lexis';

  return (
    <div className="relative w-64 sm:w-80 md:w-full md:max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-teal-900/10 bg-lexis-navy">
      {/* Same ambient glow LiveStage.jsx uses so this reads as the same
          screen, not a lookalike. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <div className="relative p-5 flex flex-col items-center">
        {/* Waveform ring — animated, not audio-reactive (there's no real
            audio here to react to), but intentionally busier while
            "LEXIS" is the one talking vs. resting during the pause, so it
            doesn't feel like decoration running on autopilot. */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-teal-600/20 via-teal-500/10 to-teal-400/20 border border-teal-400/40 shadow-[0_0_40px_rgba(45,212,191,0.2)] mb-4">
          <div className="flex items-end gap-1 h-10">
            {Array.from({ length: WAVE_BARS }).map((_, i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-teal-300"
                style={{
                  height: '100%',
                  animation: `lexis-hero-wave 1.1s ease-in-out ${i * 0.12}s infinite`,
                  animationPlayState: lexisIsTalking ? 'running' : 'paused',
                  opacity: lexisIsTalking ? 1 : 0.35
                }}
              />
            ))}
          </div>
        </div>

        {/* Transcript — same bubble treatment as LiveStage.jsx's real one:
            teal-tinted for LEXIS with an italic translation line, plain
            white/5 for the student. min-height keeps the panel from
            resizing/jumping as lines are added each step. */}
        <div className="w-full min-h-[168px] bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2.5">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Conversation</div>
          {visibleLines.map((line, i) => (
            <div
              key={i}
              className={`text-xs p-2.5 rounded-xl ${
                line.speaker === 'lexis'
                  ? 'bg-teal-950/40 border border-teal-800/30 text-teal-100 ml-3'
                  : 'bg-white/5 border border-white/10 text-slate-300 mr-3'
              }`}
            >
              <span className="font-bold uppercase mr-1.5 opacity-60 text-[10px]">
                {line.speaker === 'lexis' ? 'LEXIS' : 'You'}
              </span>
              {line.text}
              {line.speaker === 'lexis' && line.translation && (
                <div className="mt-1 pt-1 border-t border-teal-800/30 text-teal-300/70 italic">
                  {line.translation}
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={onListen}
          className="mt-4 flex items-center gap-2 text-xs text-teal-200/80 hover:text-teal-100 transition-colors"
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{listenLabel}</span>
        </button>
      </div>

      {caption && (
        <div className="relative border-t border-white/10 px-5 py-2.5 text-center text-[11px] text-slate-400">
          {caption}
        </div>
      )}

      <style>{`
        @keyframes lexis-hero-wave {
          0%, 100% { transform: scaleY(0.35); }
          50% { transform: scaleY(1); }
        }
      `}</style>
    </div>
  );
}
