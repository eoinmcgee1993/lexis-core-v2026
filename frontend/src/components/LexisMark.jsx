// frontend/src/components/LexisMark.jsx
//
// LEXIS's brand mark. Used as the logo badge in LandingPage/PricingPage/
// AuthPage/LegalPageShell and mirrored in public/favicon.svg and the three
// PWA icons.
//
// WHAT IT IS AND WHY IT STAYS A WAVEFORM
//
// It replaced lucide-react's Sparkles icon (18-19 Aug 2026) because a
// four-point sparkle reads as generic-AI-product iconography rather than as
// anything specific to LEXIS, and that undercuts the trust a voice product
// needs from a skeptical audience — the same parents the hero photo's
// AI-disclosure caption exists for. That reasoning is unchanged and the
// waveform stays: LEXIS's entire product is a live voice conversation, and
// this is the one form that says so. It is also the shape the live session
// screen already uses for its audio-level meter.
//
// WHAT CHANGED, 4 SEP 2026, AND WHY
//
// Redrawn with the owner's explicit agreement, recorded here because the
// version it replaces was itself a deliberate decision.
//
// The old geometry was five bars at heights 8, 14, 20, 14, 8 — a perfect
// mirror, evenly stepped. That is the stock equalizer glyph shipped with
// every icon set and used by most of the voice apps LEXIS sits beside; the
// mark said "audio" but said nothing about LEXIS. The brief was a
// higher-end interface, and a logo that is indistinguishable from the
// category's default is the first place that fails.
//
// So the contour is now 7, 13, 21, 16, 10: a fast rise into the peak and a
// slower fall away from it. That is not an arbitrary asymmetry — it is the
// envelope of an actual spoken syllable, which has a sharp onset and a
// longer release. The mark now describes speech rather than a level meter,
// which is the distinction the whole product rests on.
//
// Constraints the redraw had to respect, and did:
//   - 16px legibility. Eight of nine call sites render this at 20px and one
//     at 16px. The shortest bar is 7/24, i.e. 4.7px tall at 16px, so it
//     survives; an earlier draft used 5 (3.3px) and vanished.
//   - Uniform bar width and full stadium caps (rx = half the width). Varying
//     the widths was tried and reads as a rendering fault at 16px, not as
//     rhythm.
//   - Five bars. Four stops reading as a waveform; six turn to mush small.
//   - Vertically centred on y=12, so the mark's optical centre matches the
//     text baseline it sits beside.
//
// public/favicon.svg reuses these exact rect coordinates under a single
// transform rather than restating them, so the two cannot drift apart.
//
// ACCESSIBILITY
//
// Decorative by default. All nine call sites place this immediately beside
// a <span>LEXIS</span>, so a role="img" + aria-label="LEXIS" here — which is
// what it used to carry — made every page announce "LEXIS LEXIS". The label
// prop exists for a future standalone use where the mark is the only thing
// naming the product; passing it opts back into being an image with a name.
export default function LexisMark({ className, label }) {
  const decorative = !label;
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...(decorative
        ? { 'aria-hidden': 'true', focusable: 'false' }
        : { role: 'img', 'aria-label': label })}
    >
      <rect x="1.5" y="8.5" width="3" height="7" rx="1.5" />
      <rect x="6" y="5.5" width="3" height="13" rx="1.5" />
      <rect x="10.5" y="1.5" width="3" height="21" rx="1.5" />
      <rect x="15" y="4" width="3" height="16" rx="1.5" />
      <rect x="19.5" y="7" width="3" height="10" rx="1.5" />
    </svg>
  );
}
