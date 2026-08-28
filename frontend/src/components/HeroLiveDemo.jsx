// frontend/src/components/HeroLiveDemo.jsx
//
// The landing page hero. Built in response to the interface re-audit's
// recommendation 01: "Put the conversation in the hero, running." It
// shipped 26 Aug 2026 after running as an opt-in preview on PR #80 —
// replaces the static portrait with the real Live
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
// Both of LEXIS's lines ARE real audio, though. Correcting an earlier
// mistake in this file's own history — LEXIS's actual voice engine is
// OpenAI's Realtime API (see backend/app.mjs's POST /api/session, voice
// 'marin'), not ElevenLabs as previously stated here; there's no
// ElevenLabs integration anywhere in this codebase. All four clips in
// public/audio/ were rendered via OpenAI's standalone /v1/audio/speech
// endpoint with that same voice — one-time syntheses, not live sessions —
// so the hero and the real product sound like the same person. Anything
// added here later must use that same endpoint and voice: a hero in a
// different voice from the product is a small lie.
//
// 22 Aug 2026 shipped only the opening line. 27 Aug 2026 added the
// follow-up, because shipping one of her two lines meant unmuting got you
// 2.5s of speech and then nearly nine seconds of silence while she visibly
// said something else. See LINE_AUDIO below.
//
// Muted by default and gated behind a tap (browsers block
// autoplaying audio with sound anyway, and a marketing page that starts
// talking at you unasked is its own bad experience) — see the mute
// toggle below.
import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import TutorAvatarPhoto from './TutorAvatarPhoto';

// Real synthesized audio for BOTH of LEXIS's lines, matching SCRIPTS below
// word for word. See this file's header comment for how these were made.
//
// The student's line in between is deliberately silent: in a real session
// that beat is the visitor talking, so a voice there would be wrong. What
// was wrong until 27 Aug 2026 was the FOLLOW-UP being silent too, which
// meant unmuting got you 2.5s of speech and then nearly nine seconds of
// nothing while LEXIS visibly said something else. Reported as "audio says
// one line then sound goes off", and that is exactly what it was: the other
// line had never been recorded.
const LINE_AUDIO = {
  en: { opening: '/audio/hero-demo-en.mp3', followup: '/audio/hero-demo-en-followup.mp3' },
  th: { opening: '/audio/hero-demo-th.mp3', followup: '/audio/hero-demo-th-followup.mp3' }
};

// Which transcript step each clip belongs to, so voice and transcript stay
// in step. These index into SCRIPTS below: 0 is LEXIS's opening line alone,
// 3 is the step where her follow-up first appears.
const OPENING_STEP = 0;
const FOLLOWUP_STEP = 3;

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
// Long enough that the follow-up clip always finishes before the loop wraps
// and restarts the opening line over the top of it. The follow-up starts at
// FOLLOWUP_STEP * STEP_MS = 6600ms and the longest clip (Thai) runs 5.11s,
// ending at 11.71s; the cycle is 4 * 2200 + 3600 = 12.4s, leaving ~0.7s of
// air. Shorten this and the Thai line gets cut off mid-sentence.
const END_PAUSE_MS = 3600;

// A marketing hero runs for as long as the tab is open, so nothing here is
// allowed to animate unconditionally. Three gates, all cheap:
//
//   1. prefers-reduced-motion — a visitor who has asked the OS to stop
//      motion gets the finished exchange, complete, held still. That is a
//      better fallback than one line of it, and it is the whole point of
//      the hero either way.
//   2. IntersectionObserver — once the visitor scrolls past the hero there
//      is nobody to animate for. Frozen until it comes back on screen.
//   3. document.visibilityState — browsers throttle rAF in background
//      tabs, but the step timer is a setTimeout and they do not throttle
//      that nearly as hard. Stop both explicitly rather than relying on it.
//
// This matters more here than it looks: the target market is mid-range
// Android in Thailand, and the thing this component replaced was a static
// <picture> that cost exactly nothing once painted.
function useHeroIsOnScreen(ref) {
  const [onScreen, setOnScreen] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return; // no observer: stay animating, as before
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return onScreen;
}

function useTabIsVisible() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    onChange();
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    setReduced(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

// Simulated speech energy driving TutorAvatarPhoto's mouth — the same
// component the real Live Conversation screen uses, fed a fake tutorLevel
// instead of real audio-frequency data (there's no real audio here). A
// sine wave plus a little noise reads as talking; TutorAvatarPhoto's own
// internal easing (useSmoothed) is what turns this into a natural-looking
// mouth open/close rather than us re-implementing that smoothing here too.
//
// The loop only exists while she is actually mid-line. An earlier version
// of this hook ran requestAnimationFrame from mount to unmount and called
// setLevel on every single frame forever, including while she was silent
// and including after the visitor had scrolled the hero out of view — a
// 60fps React re-render on a marketing page, permanently. Starting and
// stopping the loop with `isTalking` is the whole fix.
function useSimulatedTutorLevel(isTalking) {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(null);
  const tRef = useRef(0);

  useEffect(() => {
    if (!isTalking) {
      setLevel(0); // mouth closed, and no loop running at all
      return;
    }
    const tick = () => {
      tRef.current += 0.09;
      setLevel(30 + Math.abs(Math.sin(tRef.current * 2.2)) * 35 + Math.random() * 12);
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
  const openingRef = useRef(null);
  const followupRef = useRef(null);
  const wasMutedRef = useRef(true);
  const containerRef = useRef(null);

  const onScreen = useHeroIsOnScreen(containerRef);
  const tabVisible = useTabIsVisible();
  const prefersReducedMotion = usePrefersReducedMotion();
  // The single answer to "should anything be moving right now?"
  const animating = onScreen && tabVisible && !prefersReducedMotion;

  // Where the transcript should sit whenever the language changes or the
  // motion preference changes. Under reduced motion that is the finished
  // exchange, held still: same information as the full loop, no animation,
  // and a better fallback than freezing on the opening line alone.
  // Otherwise it is the top of the loop, so a language toggle restarts it.
  useEffect(() => {
    setStep(prefersReducedMotion ? script.length - 1 : 0);
    // pick up the new-language srcs (see LINE_AUDIO) before the next play()
    openingRef.current?.load();
    followupRef.current?.load();
  }, [direction, prefersReducedMotion, script.length]);

  useEffect(() => {
    if (!animating) return; // off-screen, backgrounded, or reduced motion: hold where we are
    const isLastStep = step === script.length - 1;
    const delay = isLastStep ? END_PAUSE_MS : STEP_MS;
    const timer = setTimeout(() => {
      setStep((s) => (s + 1) % script.length);
    }, delay);
    return () => clearTimeout(timer);
  }, [step, script.length, animating]);

  // Plays whichever of LEXIS's two lines the transcript is currently on, and
  // stops everything when muted or when nothing is animating (scrolled past,
  // background tab, reduced motion). Without that last part, scrolling away
  // from an unmuted hero leaves a voice talking to an empty screen.
  useEffect(() => {
    const clips = [openingRef.current, followupRef.current].filter(Boolean);
    const justUnmuted = wasMutedRef.current && !muted;
    wasMutedRef.current = muted;

    if (muted || !animating) {
      clips.forEach((a) => { a.pause(); a.currentTime = 0; });
      return;
    }

    let el =
      step === OPENING_STEP ? openingRef.current :
      step === FOLLOWUP_STEP ? followupRef.current : null;

    // Unmuting on a silent step should still produce her voice rather than
    // nothing at all. That includes reduced motion, which parks the
    // transcript on its final step where no clip belongs.
    if (!el && justUnmuted) el = openingRef.current;
    if (!el) return; // a silent beat mid-loop: leave whatever is playing alone

    clips.forEach((a) => { if (a !== el) { a.pause(); a.currentTime = 0; } });
    el.currentTime = 0;
    el.play().catch(() => {}); // a blocked autoplay just means try again next loop
  }, [step, muted, animating]);

  // Playback is owned entirely by the effect above, so this only flips state.
  // Having both try to drive the elements is how you get a clip restarting
  // over itself on a single tap.
  function toggleMute() {
    setMuted((wasMuted) => !wasMuted);
  }


  const visibleLines = script[step];
  const lexisIsTalking = visibleLines[visibleLines.length - 1]?.speaker === 'lexis';
  const simulatedTutorLevel = useSimulatedTutorLevel(lexisIsTalking && animating);

  return (
    <div
      ref={containerRef}
      className="relative w-64 sm:w-80 md:w-full md:max-w-sm rounded-2xl overflow-hidden border border-white/10 shadow-xl shadow-teal-900/10 bg-lexis-navy"
    >
      {/* Real audio, not a stand-in — see this file's header comment. */}
      <audio ref={openingRef} src={(LINE_AUDIO[direction] || LINE_AUDIO.en).opening} preload="auto" />
      <audio ref={followupRef} src={(LINE_AUDIO[direction] || LINE_AUDIO.en).followup} preload="auto" />

      {/* Same ambient glow LiveStage.jsx uses so this reads as the same
          screen, not a lookalike. */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`w-56 h-56 bg-teal-500/10 rounded-full blur-3xl ${animating ? 'animate-pulse-slow' : ''}`} />
      </div>

      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? "Unmute LEXIS's voice" : "Mute LEXIS's voice"}
        aria-pressed={!muted}
        className="absolute top-3 right-3 z-10 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
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
                paused={!animating}
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
