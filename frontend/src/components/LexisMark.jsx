// frontend/src/components/LexisMark.jsx
//
// LEXIS's brand mark — replaces lucide-react's Sparkles icon, which was
// used as the logo badge in LandingPage.jsx/PricingPage.jsx/AuthPage.jsx/
// LegalPageShell.jsx (and mirrored in public/favicon.svg). A generic
// four-point sparkle reads as generic-AI-product iconography rather than
// anything specific to LEXIS — flagged directly (18 Aug 2026) as
// undercutting the trust a voice product needs from a skeptical audience
// (parents deciding whether to trust it with their kid, same audience the
// hero photo's AI-disclosure caption already exists for).
//
// A five-bar waveform instead: literal, not decorative — LEXIS's entire
// product is a live voice conversation, and this is the same visual
// language the live session screen already uses for its audio-level
// waveform (see LiveStage.jsx). Solid fill via currentColor, no gradient,
// so it inherits whatever text color wraps it (text-teal-700 everywhere
// it's currently used) exactly the way the lucide icon it replaces did.
export default function LexisMark({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} role="img" aria-label="LEXIS">
      <rect x="1.5" y="8" width="3" height="8" rx="1.5" />
      <rect x="6" y="5" width="3" height="14" rx="1.5" />
      <rect x="10.5" y="2" width="3" height="20" rx="1.5" />
      <rect x="15" y="5" width="3" height="14" rx="1.5" />
      <rect x="19.5" y="8" width="3" height="8" rx="1.5" />
    </svg>
  );
}
