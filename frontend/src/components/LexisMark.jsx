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
//
// DECORATIVE BY DEFAULT (4 Sep 2026). This carried role="img"
// aria-label="LEXIS" unconditionally, and every one of its nine call sites
// puts it immediately beside a <span>LEXIS</span> wordmark — LandingPage,
// PricingPage, AuthPage, CommunityPage, LegalPageShell and all four
// practice pages. So a screen reader announced "LEXIS LEXIS" at the top of
// every page on the site. The mark is not carrying the name there; the text
// beside it is. Doubling a brand name is the accessible-name equivalent of
// the "say it twice" pattern the interface re-audit removed everywhere else.
//
// `label` opts a standalone instance back in, for a future use with no
// wordmark next to it. Nothing passes it today — the prop exists so the
// correct choice is available rather than requiring this file to be edited
// again, and so the default cannot silently become wrong.
export default function LexisMark({ className, label = null }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': 'true', focusable: 'false' })}
    >
      <rect x="1.5" y="8" width="3" height="8" rx="1.5" />
      <rect x="6" y="5" width="3" height="14" rx="1.5" />
      <rect x="10.5" y="2" width="3" height="20" rx="1.5" />
      <rect x="15" y="5" width="3" height="14" rx="1.5" />
      <rect x="19.5" y="8" width="3" height="8" rx="1.5" />
    </svg>
  );
}
