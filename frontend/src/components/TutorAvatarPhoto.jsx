// frontend/src/components/TutorAvatarPhoto.jsx
//
// The photo-based tutor avatar: a real generated portrait (see
// scripts/avatar/lexis-tutor-photo-notes.md) with small synthetic "mouth
// opening" and "eyes closed" accents layered on top. The mouth is driven by
// tutorLevel — the same live remote-analyser signal LexisApp.jsx already
// computes for the ambient waveform ring, straight off the WebRTC audio
// track OpenAI's Realtime API is already streaming. The blink is a local
// idle timer, same cadence as TutorAvatar3D.jsx's morph-target blink. No
// lip-sync vendor, no three.js/WebGL — an <img> plus a couple of
// absolutely-positioned overlay divs.
//
// Why overlays instead of real "mouth open" / "eyes closed" photos:
// generating extra photos of the *same* face reliably needs
// identity-preserving image-to-image editing (a reference-image feature),
// which wasn't available when this was built (Gamma: plan-gated;
// Higgsfield: out of credits, no one-time top-up option). An independently
// generated second photo would drift in lighting/identity and visibly
// "jump" on every crossfade. This overlay keeps the one real photo pristine
// and untouched, and adds motion instead of swapping the whole face. It's a
// deliberate trade — see the notes file for how to upgrade to real photos
// later, if a paid tier ever gets added.
import React, { useEffect, useRef, useState } from 'react';

// Mouth position, hand-measured against the base photo (percent of the
// image box). Re-measure these if the photo changes.
const MOUTH_CENTER_X_PCT = 51.0;
const MOUTH_TOP_PCT = 47.6; // sits right at the lip seam
const MOUTH_WIDTH_PCT = 10.0;
const MOUTH_MAX_HEIGHT_PCT = 5.8;
// A darkened/saturated version of the photo's own lip-seam shadow tone —
// the sampled color as-is blended in too smoothly to read as an opening at
// any usable size; this stays in the same family but keeps enough contrast
// against the lip color to actually show up.
const MOUTH_SHADOW_COLOR = '35, 8, 8';

// Eye positions, same hand-measured approach. cx mirrors around the face's
// vertical midline (roughly 49.25%, not exactly 50 — the photo's framing
// isn't perfectly centered).
const EYE_TOP_PCT = 34.0;
const EYE_WIDTH_PCT = 7.0;
const EYE_HEIGHT_PCT = 3.6;
const EYE_CENTERS_X_PCT = [41.5, 57.0];
// Sampled from the eyelid-crease shadow in the photo itself.
const EYE_SHADOW_COLOR = '21, 10, 5';

const BLINK_DURATION_S = 0.18;
const BLINK_MIN_GAP_S = 2;
const BLINK_MAX_GAP_S = 5;

function MouthOverlay({ openAmount }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `${MOUTH_CENTER_X_PCT}%`,
        top: `${MOUTH_TOP_PCT}%`,
        width: `${MOUTH_WIDTH_PCT}%`,
        height: `${MOUTH_MAX_HEIGHT_PCT}%`,
        transform: `translateX(-50%) scaleY(${0.05 + openAmount * 0.95})`,
        transformOrigin: 'top',
        borderRadius: '50%',
        background: `radial-gradient(ellipse at center, rgba(${MOUTH_SHADOW_COLOR}, ${0.75 + openAmount * 0.25}) 0%, rgba(${MOUTH_SHADOW_COLOR}, ${0.5 + openAmount * 0.3}) 55%, rgba(${MOUTH_SHADOW_COLOR}, 0) 100%)`,
        filter: 'blur(0.5px)',
        transition: 'transform 90ms ease-out, background 90ms ease-out',
        pointerEvents: 'none',
      }}
    />
  );
}

function EyeOverlay({ centerXPct, closeAmount }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        left: `${centerXPct}%`,
        top: `${EYE_TOP_PCT}%`,
        width: `${EYE_WIDTH_PCT}%`,
        height: `${EYE_HEIGHT_PCT}%`,
        transform: `translateX(-50%) scaleY(${0.05 + closeAmount * 0.95})`,
        transformOrigin: 'center',
        borderRadius: '50%',
        background: `radial-gradient(ellipse at center, rgba(${EYE_SHADOW_COLOR}, ${closeAmount * 0.85}) 0%, rgba(${EYE_SHADOW_COLOR}, ${closeAmount * 0.55}) 55%, rgba(${EYE_SHADOW_COLOR}, 0) 100%)`,
        filter: 'blur(0.4px)',
        pointerEvents: 'none',
      }}
    />
  );
}

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

export default function TutorAvatarPhoto({ photoUrl, tutorLevel, isConnected, isConnecting, onError }) {
  const active = isConnected || isConnecting;
  const [failed, setFailed] = useState(false);
  const openAmount = Math.min(1, tutorLevel / 85); // 0 = closed, 1 = fully open
  const blinkAmount = useBlink();

  if (failed) return null;

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
      <MouthOverlay openAmount={openAmount} />
      {EYE_CENTERS_X_PCT.map((cx) => (
        <EyeOverlay key={cx} centerXPct={cx} closeAmount={blinkAmount} />
      ))}
    </div>
  );
}
