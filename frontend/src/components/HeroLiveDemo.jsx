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
// What this is NOT: a real WebRTC connection. There is no live model call
// here — it's a scripted, looping animation of what a real session looks
// like, honestly, not presented as an actual live feed. The transcript
// lines below are illustrative (drawn from the real "everyday" topic
// curriculum already live in the product, see backend/app.mjs's
// TOPIC_CURRICULA.everyday and EverydayEnglishPage.jsx's own practice
// prompts), not a real recording of a real session.
//
// The opening line IS real audio, though (22 Aug 2026): a one-off
// text-to-speech render of the exact same line LEXIS's real Live
// Conversation session uses, in the same voice. Correcting an earlier
// mistake in this file's own history — LEXIS's actual voice engine is
// OpenAI's Realtime API (see backend/app.mjs's POST /api/session, voice
// 'marin'), not ElevenLabs as previously stated here; there's no
// ElevenLabs integration anywhere in this codebase. These two clips
// (public/audio/hero-demo-en.mp3, -th.mp3) were rendered via OpenAI's
// standalone /v1/audio/speech endpoint with that same voice — a one-time
// synthesis, not a live session — for exactly the opening question, in
// both languages, so the hero and the real product sound like the same
// person. Muted by default and gated behind a tap (browsers block
// autoplaying audio with sound anyway, and a marketing page that starts
// talking at you unasked is its own bad experience) — see the mute
// toggle below.
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import TutorAvatarPhoto from './TutorAvatarPhoto';

// Real synthesized audio of the exact opening line, matching SCRIPTS
// below — see this file's header comment for how these were made.
const OPENING_LINE_AUDIO = {
  en: '/audio/hero-demo-en.mp3',
  th: '/audio/hero-demo-th.mp3'
};

// Same env var LiveStage.jsx/LexisApp.jsx read for the real session's
// avatar — one source of truth for which photo identity is in use, not a
// second hardcoded path that could drift from it.
const AVATAR_PHOTO_URL = import.meta.env.VITE_AVATAR_PHOTO_URL;

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

// Simulated speech energy driving TutorAvatarPhoto's mouth — the same
// component the real Live Conversation screen uses, fed a fake tutorLevel
// instead of real audio-frequency data (there's no real audio here). A
// sine wave plus a little noise reads as talking; TutorAvatarPhoto's own
// internal easing (useSmoothed) is what turns this into a natural-looking
// mouth open/close rather than us re-implementing that smoothing here too.
function useSimulatedTutorLevel(isTalking) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      tRef.current += 0.09;
      const target = isTalking
        ? 30 + Math.abs(Math.sin(tRef.current * 2.2)) * 35 + Math.random() * 12
        : 0;
      setLevel(target);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isTalking]);

  return level;
}

export default function HeroLiveDemo({ direction, caption }) {
  const script = SCRIPTS[direction] || SCRIPTS.en;
  const [step, setStep] = useState(0);
  // Muted by default: browsers block autoplaying audio-with-sound anyway,
  // and a marketing page that starts talking at a visitor unasked is a bad
  // experience even where the browser would allow it. The visitor opts in.
  const [muted, setMuted] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    setStep(0); // direction changed (language toggle) — restart the loop from the top
    audioRef.current?.load(); // pick up the new-language src (see OPENING_LINE_AUDIO) before the next play()
  }, [direction]);

  useEffect(() => {
    const isLastStep = step === script.length - 1;
    const delay = isLastStep ? END_PAUSE_MS : STEP_MS;
    const timer = setTimeout(() => {
      setStep((s) => (s + 1) % script.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [step, script.length]);

  // Step 0 is the moment LEXIS's opening line first appears on its own —
  // exactly what OPENING_LINE_AUDIO was rendered to match. Re-fires on
  // every loop, and also whenever `muted` flips (so unmuting mid-loop
  // doesn't have to wait for the next cycle if it happens to land on
  // step 0 already).
  useEffect(() => {
    if (step !== 0 || muted) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {}); // a blocked autoplay here just means try again next loop — not worth surfacing
  }, [step, muted]);

  function toggleMute() {
    setMuted((wasMuted) => {
      const audio = audioRef.current;
      if (wasMuted) {
        // unmuting: play immediately rather than making the visitor wait
        // for the loop to come back around to step 0
        if (audio) {
          audio.currentTime = 0;
          audio.play().catch(() => {});
        }
      } else {
        audio?.pause();
      }
      return !wasMuted;
    });
  }

  const visibleLines = script[step];
  const lexisIsTalking = visibleLines[visibleLines.length - 1]?.speaker === 'lexis';
  const simulatedTutorLevel = useSimulatedTutorLevel(lexisIsTalking);

  return (
    <div className="relative w-64 sm:w-80 md:w-full md:max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-teal-900/10 bg-lexis-navy">
      {/* Real audio, not a stand-in — see this file's header comment. */}
      <audio ref={audioRef} src={OPENING_LINE_AUDIO[direction] || OPENING_LINE_AUDIO.en} preload="auto" />

      {/* Same ambient glow LiveStage.jsx uses so this reads as the same
          screen, not a lookalike. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-56 h-56 bg-teal-500/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute LEXIS's voice" : "Mute LEXIS's voice"}
        aria-pressed={!muted}
        className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
      >
        {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
      </button>

      <div className="relative p-5 flex flex-col items-center">
        {/* LEXIS herself — the same TutorAvatarPhoto component and glow-
            ring treatment the real Live Conversation screen uses
            (LiveStage.jsx), not an abstract waveform standing in for her.
            Reported live as "looks stupid, it's just a voice box, it
            should be LEXIS herself speaking" — correct: a marketing hero
            about a voice conversation partner should show the partner,
            not an audio icon. */}
        <div className="w-28 h-28 rounded-full flex items-center justify-center bg-gradient-to-tr from-teal-600/20 via-teal-500/10 to-teal-400/20 border border-teal-400/40 shadow-[0_0_40px_rgba(45,212,191,0.2)] mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border border-teal-400/50 bg-teal-950/40 shadow-inner">
            {AVATAR_PHOTO_URL && (
              <TutorAvatarPhoto
                photoUrl={AVATAR_PHOTO_URL}
                tutorLevel={simulatedTutorLevel}
                isConnected
                isConnecting={false}
              />
            )}
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
      </div>

      {caption && (
        <div className="relative border-t border-white/10 px-5 py-2.5 text-center text-[11px] text-slate-400">
          {caption}
        </div>
      )}
    </div>
  );
}
