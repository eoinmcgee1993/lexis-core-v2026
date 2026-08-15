// frontend/src/components/TutorAvatarPhoto.jsx
//
// The photo-based tutor avatar: four real photos of the same generated
// identity (see scripts/avatar/lexis-tutor-photo-notes.md) — neutral,
// mouth-open, eyes-closed, and mouth-open-with-eyes-closed — crossfaded by
// tutorLevel (mouth) and a local blink timer (eyes). No lip-sync vendor, no
// three.js/WebGL — four absolutely-positioned <img> layers blended with
// opacity. This replaced an earlier version that painted small dark
// radial-gradient "shadow" shapes over a single static photo to fake mouth
// and eye movement; live-verified that read as a smudge/bruise appearing
// and disappearing on the face rather than a mouth opening, unsettling
// enough to be called out directly. Real photos of the actual expressions
// (via Higgsfield identity-preserving image-to-image editing once credits
// were available — see the notes file) fix that at the root instead of
// tuning the illusion further.
//
// Why four images, not two: mouth and eyes change independently and
// concurrently (LEXIS blinks *while* talking most of the time, since
// talking dominates a session). Crossfading "mouth-open" and "eyes-closed"
// as two independent layers would conflict whenever both are partially
// visible at once — each single-feature photo bakes in the *other*
// feature's neutral state, so blending them fights itself. Standard
// bilinear interpolation across all four corners of the mouth x eyes grid
// avoids that: each of the three non-base layers gets an opacity that is
// the product of how "on" each of its two features is, and the base layer
// (mouth closed, eyes open) is always fully opaque underneath. At any
// combination of openAmount/blinkAmount the four opacities sum to 1 and
// blend to the correct point in that 2x2 space — see the render() below.
import React, { useEffect, useRef, useState } from 'react';

const BLINK_DURATION_S = 0.18;
const BLINK_MIN_GAP_S = 2;
const BLINK_MAX_GAP_S = 5;

// Idle blink timer — a local rAF loop, independent of tutorLevel. Same
// cadence/shape as TutorAvatar3D.jsx's blink morph target: a quick sine
// pulse every 2-5s. Returns a 0 (open) to 1 (closed) value.
function useBlink() {
  const [closeAmount, setCloseAmount] = useState(0);
  const clockRef = useRef(0);
  const nextBlinkAtRef = useRef(BLINK_MIN_GAP_S + Math.random() * (BLINK_MAX_GAP_S - BLINK_MIN_GAP_S));
  const lastTsRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const delta = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      clockRef.current += delta;
      if (clockRef.current >= nextBlinkAtRef.current) {
        const t = clockRef.current - nextBlinkAtRef.current;
        if (t < BLINK_DURATION_S) {
          setCloseAmount(Math.sin((t / BLINK_DURATION_S) * Math.PI));
        } else {
          setCloseAmount(0);
          clockRef.current = 0;
          nextBlinkAtRef.current = BLINK_MIN_GAP_S + Math.random() * (BLINK_MAX_GAP_S - BLINK_MIN_GAP_S);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return closeAmount;
}

// LexisApp.jsx recomputes tutorLevel every animation frame (~60/sec)
// straight off raw audio byte-frequency data — no smoothing at all. That's
// fine for the old overlay (a shape scaling continuously) but live-verified
// to look wrong here: crossfading between full photos at that raw, jittery
// rate reads as the mouth flickering too fast to actually watch, not a
// person talking. TutorAvatar3D.jsx already has this exact problem solved
// for its morph target (`current + (target - current) * min(1, delta*12)`,
// an exponential ease) — same fix, applied to the derived openAmount here
// instead of to tutorLevel itself, so it stays local to this component
// rather than changing the shared audio-analysis signal every other avatar
// tier also reads.
function useSmoothed(target, rate = 10) {
  const [value, setValue] = useState(target);
  const valueRef = useRef(target);
  const lastTsRef = useRef(null);
  const rafRef = useRef(null);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const tick = (ts) => {
      if (lastTsRef.current == null) lastTsRef.current = ts;
      const delta = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      const next = valueRef.current + (targetRef.current - valueRef.current) * Math.min(1, delta * rate);
      valueRef.current = next;
      setValue(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return value;
}

// photoUrl is the base (mouth-closed, eyes-open) photo; the other three
// variants are derived from it by filename convention — see
// scripts/avatar/lexis-tutor-photo-notes.md for how they were generated.
// Keeping this derivation here (rather than threading three more props
// through LexisApp.jsx) means the naming convention lives in one place.
function deriveVariantUrls(photoUrl) {
  const base = photoUrl.replace(/\.jpg$/i, '');
  return {
    open: `${base}-open.jpg`,
    blink: `${base}-blink.jpg`,
    openBlink: `${base}-open-blink.jpg`,
  };
}

export default function TutorAvatarPhoto({ photoUrl, tutorLevel, isConnected, isConnecting, onError }) {
  const active = isConnected || isConnecting;
  const [failed, setFailed] = useState(false);
  // Each overlay variant fails independently of the base photo and of each
  // other — if e.g. only the open-mouth photo 404s, the right response is
  // "keep the static base photo, don't animate the mouth", not "the whole
  // avatar is broken, fall back to 3D/SVG". Only the base photo's onError
  // triggers that full fallback.
  const [variantFailed, setVariantFailed] = useState({ open: false, blink: false, openBlink: false });
  // Live-verified: after fixing the flicker (useSmoothed below), the mouth
  // still barely moved during actual speech — "speaking" screenshots
  // looked nearly identical to idle. Two compounding causes:
  // 1. /85 was carried over unchanged from the original overlay code, but
  //    TutorAvatar3D.jsx calibrates the exact same tutorLevel signal
  //    against /70 for its mouth morph target — the photo tier was
  //    already tuned to need more signal than its sibling to reach fully
  //    "open", for no principled reason. Lowered further, to /55, since
  //    normal speech volume apparently doesn't reach even the 3D tier's
  //    threshold reliably on a full-photo crossfade (a partial-opacity
  //    blend of two whole faces reads far more subtly than a morph target
  //    or a small shape ever did, so this tier needs more headroom, not
  //    the same amount, to look equally alive).
  // 2. A linear amplitude-to-opacity mapping under-represents ordinary
  //    speech: real speech spends most of its time at low-to-mid energy
  //    with only occasional peaks, so a linear map keeps the mouth mostly
  //    faint and only briefly near "open". A perceptual curve (**0.6)
  //    boosts that low-to-mid range toward visibility without letting loud
  //    peaks overshoot past 1.
  const normalizedLevel = Math.min(1, tutorLevel / 55);
  const rawOpenAmount = Math.pow(normalizedLevel, 0.6); // 0 = mouth closed, 1 = fully open
  const openAmount = useSmoothed(rawOpenAmount, 13); // eased — see useSmoothed above for why
  const blinkAmount = useBlink(); // 0 = eyes open, 1 = fully closed

  if (failed) return null;

  const { open, blink, openBlink } = deriveVariantUrls(photoUrl);
  const markVariantFailed = (key) => setVariantFailed((prev) => (prev[key] ? prev : { ...prev, [key]: true }));

  // Bilinear blend across the four corners of the mouth x eyes grid — see
  // the file header for why this avoids the two-layer conflict. The base
  // photo is always fully opaque underneath; these three layers fade in on
  // top of it and of each other.
  const mouthOnlyOpacity = openAmount * (1 - blinkAmount);
  const blinkOnlyOpacity = blinkAmount * (1 - openAmount);
  const bothOpacity = openAmount * blinkAmount;

  return (
    <div className={`relative w-full h-full transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>
      <img
        src={photoUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        onError={() => {
          setFailed(true);
          onError?.();
        }}
      />
      {!variantFailed.open && (
        <img
          src={open}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-75 ease-out"
          style={{ opacity: mouthOnlyOpacity }}
          draggable={false}
          onError={() => markVariantFailed('open')}
        />
      )}
      {!variantFailed.blink && (
        <img
          src={blink}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: blinkOnlyOpacity }}
          draggable={false}
          onError={() => markVariantFailed('blink')}
        />
      )}
      {!variantFailed.openBlink && (
        <img
          src={openBlink}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: bothOpacity }}
          draggable={false}
          onError={() => markVariantFailed('openBlink')}
        />
      )}
    </div>
  );
}
