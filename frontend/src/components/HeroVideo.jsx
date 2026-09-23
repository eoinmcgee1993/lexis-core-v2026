// frontend/src/components/HeroVideo.jsx
//
// LEXIS introducing herself, as the landing page hero (23 Sep 2026, owner's
// direct request: "hype her up", "is an introduction video ... as the hero
// viable?"). This reverses interface re-audit recommendation 01 (26 Aug),
// which replaced a still portrait of LEXIS with HeroLiveDemo on the
// reasoning that a picture of a person who does not exist was standing in
// for a product that is entirely about talking. A video of her TALKING is a
// different object from that still: it is the product's own voice and
// manner, which is what a visitor is deciding to try. HeroLiveDemo is not
// deleted — it moved to the "Meet LEXIS" section, where it proves the
// real-time claim that section makes.
//
// AI disclosure: the hero copy beside this video says "AI tutor" in words
// (LandingPage.jsx). That is the deliberate answer to the question the old
// hero comment flagged as open, not a side effect: a photorealistic face
// speaking in first person must never be left to imply a human. No
// separate caption badge was reintroduced; that was removed on 20 Aug on
// direct instruction and stays removed.
//
// What she says (transcribed, eleven_scribe_v1, and checked against
// facts.js): "Hi, I'm LEXIS. I'm your voice conversation partner for
// practicing spoken English and Thai. No scheduling, no waiting. I'm here
// whenever you want to practice. Curious? Try me free. Fifteen minutes, no
// card required." The fifteen minutes is spoken audio, so it cannot follow
// facts.js the way page copy does — if TRIAL.minutes changes, this clip and
// its two .vtt files are stale and must be re-cut, same hazard as the
// brand kit.
//
// Built from two renders: the first was generated from a 29.9s voice-over
// but only 15s of video was rendered, so it stops mid-sentence. It is cut
// at 8.30s, inside the 1.3s pause after "...English and Thai.", and joined
// to the second render with a hard cut. A crossfade was tried first and
// dropped: the two head positions dissolved into a double-exposed face for
// seven frames, which on a synthetic face reads as uncanny, where a jump
// cut reads as ordinary talking-head editing. 720x966, 19.3s, 1.05MB WebM /
// 1.21MB MP4 — the two source renders were ~14MB together.
//
// Motion rules are the page's existing ones (HeroLiveDemo.jsx): nothing
// plays unconditionally. Muted autoplay only while on screen and the tab
// is visible; never for prefers-reduced-motion or Save-Data, which get the
// poster and a play button instead (a play the visitor chose is fine under
// both). Tapping for sound restarts from "Hi" — unmuting mid-sentence
// drops the visitor into "...no card required" with no context.
import React, { useEffect, useRef, useState } from 'react';
import { Play, Volume2, VolumeX } from 'lucide-react';

// VP9/WebM first, H.264/MP4 second: the browser plays the first it can.
// WebM is 1.05MB against the MP4's 1.21MB and is native on Android Chrome,
// which is most of the Thai audience; the MP4 is there for Safari versions
// without VP9. Open-source Chromium (this repo's test browser) also has no
// H.264 at all, so an MP4-only player could not be exercised by the
// scripts that verify this page.
const SRC_WEBM = '/marketing/lexis-intro-hero.webm';
const SRC_MP4 = '/marketing/lexis-intro-hero.mp4';
const POSTER = '/marketing/lexis-intro-hero-poster.webp';

const LABELS = {
  en: { sound: 'Tap for sound', mute: 'Mute', watch: 'Watch LEXIS say hi', video: 'LEXIS introducing herself' },
  th: { sound: 'แตะเพื่อเปิดเสียง', mute: 'ปิดเสียง', watch: 'ดู LEXIS ทักทาย', video: 'LEXIS แนะนำตัว' }
};

function prefersNoAutoplay() {
  if (typeof window === 'undefined') return true;
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const saveData = typeof navigator !== 'undefined' && navigator.connection && navigator.connection.saveData;
  return Boolean(reduced || saveData);
}

export default function HeroVideo({ lang = 'en', className = '' }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);
  // Autoplay allowed until the visitor's settings or the browser say no,
  // or the visitor pauses it themselves (then we stop resuming it).
  const autoplayRef = useRef(true);
  const onScreenRef = useRef(true);
  const t = LABELS[lang] || LABELS.en;

  // Show the caption track for the page language, hide the other. `default`
  // alone is unreliable across browsers once more than one track exists.
  const syncCaptions = () => {
    const v = videoRef.current;
    if (!v) return;
    for (const track of Array.from(v.textTracks || [])) {
      track.mode = track.language === lang ? 'showing' : 'hidden';
    }
  };

  const tryAutoplay = () => {
    const v = videoRef.current;
    if (!v || !autoplayRef.current || !onScreenRef.current || document.hidden) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === 'function') {
      p.catch(() => { autoplayRef.current = false; setPlaying(false); });
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    syncCaptions();
    if (prefersNoAutoplay()) autoplayRef.current = false;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    v.addEventListener('play', onPlay);
    v.addEventListener('pause', onPause);
    v.addEventListener('loadedmetadata', syncCaptions);

    let observer;
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(([entry]) => {
        onScreenRef.current = entry.isIntersecting;
        if (entry.isIntersecting) tryAutoplay();
        else if (!v.paused) v.pause();
      }, { threshold: 0.25 });
      observer.observe(v);
    } else {
      tryAutoplay();
    }

    const onVisibility = () => {
      if (document.hidden) { if (!v.paused) v.pause(); } else tryAutoplay();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      v.removeEventListener('play', onPlay);
      v.removeEventListener('pause', onPause);
      v.removeEventListener('loadedmetadata', syncCaptions);
      document.removeEventListener('visibilitychange', onVisibility);
      if (observer) observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(syncCaptions, [lang]);

  const toggleSound = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      v.currentTime = 0;
      v.play().catch(() => {});
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
  };

  // A play the visitor chose: with sound, from the start.
  const watch = () => {
    const v = videoRef.current;
    if (!v) return;
    autoplayRef.current = true;
    v.muted = false;
    setMuted(false);
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden bg-lexis-navy lexis-lift ${className}`}>
      <video
        ref={videoRef}
        className="block w-full h-auto aspect-[720/966] object-cover"
        poster={POSTER}
        preload={prefersNoAutoplay() ? 'none' : 'metadata'}
        muted
        loop
        playsInline
        aria-label={t.video}
      >
        <source src={SRC_WEBM} type="video/webm" />
        <source src={SRC_MP4} type="video/mp4" />
        <track kind="captions" src="/marketing/lexis-intro-hero.en.vtt" srcLang="en" label="English" default={lang !== 'th'} />
        <track kind="captions" src="/marketing/lexis-intro-hero.th.vtt" srcLang="th" label="ไทย" default={lang === 'th'} />
      </video>

      {!playing && (
        <button
          type="button"
          onClick={watch}
          className="absolute inset-0 flex items-center justify-center bg-lexis-navy/20 hover:bg-lexis-navy/30 transition-colors"
          aria-label={t.watch}
        >
          <span className="flex items-center gap-2 px-5 py-3 rounded-full bg-white/95 text-lexis-ink font-semibold text-sm shadow-lg motion-safe:active:scale-[0.97] transition-transform">
            <Play className="w-4 h-4 text-teal-700" fill="currentColor" aria-hidden="true" />
            {t.watch}
          </span>
        </button>
      )}

      {playing && (
        <button
          type="button"
          onClick={toggleSound}
          className="absolute top-3 right-3 flex items-center gap-2 pl-3 pr-3.5 py-2 min-h-[44px] rounded-full bg-lexis-navy/70 backdrop-blur text-white text-xs font-semibold hover:bg-lexis-navy/85 transition-colors motion-safe:active:scale-[0.97]"
          aria-label={muted ? t.sound : t.mute}
        >
          {muted
            ? <VolumeX className="w-4 h-4" aria-hidden="true" />
            : <Volume2 className="w-4 h-4" aria-hidden="true" />}
          {muted ? t.sound : t.mute}
        </button>
      )}
    </div>
  );
}
