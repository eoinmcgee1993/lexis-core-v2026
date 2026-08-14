// frontend/src/components/TutorAvatarPhoto.jsx
//
// The photo-based tutor avatar: a real generated portrait (see
// scripts/avatar/lexis-tutor-photo-notes.md) with a small synthetic "mouth
// opening" accent layered on top, driven by tutorLevel — the same live
// remote-analyser signal LexisApp.jsx already computes for the ambient
// waveform ring, straight off the WebRTC audio track OpenAI's Realtime API
// is already streaming. No lip-sync vendor, no three.js/WebGL — one <img>
// plus one absolutely-positioned overlay div.
//
// Why an overlay instead of a second "mouth open" photo: generating a
// second photo of the *same* face reliably needs identity-preserving
// image-to-image editing (a reference-image feature), which wasn't
// available when this was built (Gamma: not on this workspace's plan;
// Higgsfield: out of credits). An independently generated second photo
// would drift in lighting/identity and visibly "jump" on every crossfade.
// This overlay keeps the one real photo pristine and untouched, and adds
// motion instead of swapping the whole face. It's a deliberate trade —
// see the notes file for how to upgrade to a true second photo later.
import React, { useState } from 'react';

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

export default function TutorAvatarPhoto({ photoUrl, tutorLevel, isConnected, isConnecting, onError }) {
  const active = isConnected || isConnecting;
  const [failed, setFailed] = useState(false);
  const openAmount = Math.min(1, tutorLevel / 85); // 0 = closed, 1 = fully open

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
    </div>
  );
}
