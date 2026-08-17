// frontend/src/content/facts.js
//
// Single source of truth for every price, trial term, and FAQ answer —
// per the remediation brief's "one fact, one source" rule: no other file
// should hardcode a price, the trial length, or FAQ copy. Everything
// that displays or claims one of these imports it from here instead.
//
// Before this file existed, the trial was described three incompatible
// ways across the app ("Free 30-minute trial" in the hero, "3 Practice
// Sessions (30 Mins)" on the pricing card, "a free 30-minute trial" in
// the FAQ + JSON-LD) — and once a machine-readable version (JSON-LD)
// existed, that inconsistency was being published as fact, not just
// inconsistent in the UI.

export const CURRENCY = 'THB';

// Confirmed directly against backend/app.mjs + backend/supabase-schema.sql
// rather than assumed: the only real enforcement is
// `seconds_used < max_allowed_seconds` (max_allowed_seconds defaults to
// 1800 = 30 minutes total, however split across sessions). There is no
// session-count cap anywhere in the backend — "3 Practice Sessions (30
// Mins)", which used to be on the pricing card, was simply wrong copy,
// not a second real rule that needed reconciling with the 30-minute one.
export const TRIAL = {
  minutes: 30,
  cardRequired: false
};

export const PRICING = {
  weekly: { thb: 199, period: 'week', unitCode: 'WEE' },
  monthly: { thb: 599, period: 'month', unitCode: 'MON' }
};

// Confirmed directly by Eoin (remediation brief §7.3) — no VAT applies
// because the business isn't VAT-registered. Distinct from "VAT is
// included in the displayed price," which would be a different claim.
export const VAT = {
  registered: false
};

// "Best value — about 25% less than 4 weeks at the weekly rate" is
// computed here so the claim can't silently go stale if either price
// ever changes without someone remembering to also update a hand-typed
// percentage on the pricing card.
export const MONTHLY_SAVINGS_VS_WEEKLY_PCT = Math.round(
  ((PRICING.weekly.thb * 4 - PRICING.monthly.thb) / (PRICING.weekly.thb * 4)) * 100
);

// English-language display strings built from the numbers above, so
// every page renders the identical sentence rather than each hand-typing
// its own phrasing of the same facts.
export const PRICING_TEASER_EN = `Free ${TRIAL.minutes}-minute trial, then ฿${PRICING.weekly.thb}/week or ฿${PRICING.monthly.thb}/month.`;
export const PRICING_TEASER_TH = `ทดลองฟรี ${TRIAL.minutes} นาที จากนั้น ฿${PRICING.weekly.thb}/สัปดาห์ หรือ ฿${PRICING.monthly.thb}/เดือน`;

export const LANDING_DESCRIPTION_EN = `LEXIS is a voice conversation partner for Thai speakers practicing English and English speakers practicing Thai. Talk out loud, get gentle real-time corrections, and see what to work on next. Free ${TRIAL.minutes}-minute trial.`;
export const PRICING_DESCRIPTION_EN = `LEXIS pricing: a free ${TRIAL.minutes}-minute trial, then ฿${PRICING.weekly.thb}/week or ฿${PRICING.monthly.thb}/month for unlimited voice practice in English or Thai. ${VAT.registered ? '' : 'No VAT, '}cancel anytime.`;

// FAQ copy — rendered by LandingPage.jsx's <details>/<summary> list and
// mirrored as FAQPage JSON-LD by structuredData.js's buildFaqJsonLd.
// Previously hand-duplicated between those two, which a re-audit flagged
// as a drift risk (mismatched visible text vs structured data is exactly
// what invalidates FAQ rich results) — both now read this array.
//
// th: not written yet — real Thai FAQ copy lands with the /th routes
// (a separate, larger stage of the same remediation brief). Marking it
// explicitly absent rather than reusing the English text under a Thai
// label, which would be worse than not having it.
export const FAQS = {
  en: [
    {
      q: 'What is LEXIS?',
      a: 'LEXIS is a voice-based speaking practice tool for English and Thai. You have a real, spoken conversation with it over your microphone, and it replies in real time, the way a conversation partner would — not a chatbot you type into.'
    },
    {
      q: 'Who is LEXIS for?',
      a: 'Thai speakers who want to practice spoken English, and English speakers who want to practice spoken Thai — students, young professionals, and anyone preparing for interviews, travel, or work who wants low-pressure speaking practice without needing another person available.'
    },
    {
      q: 'Is LEXIS free to try?',
      a: `Yes. New accounts get a free ${TRIAL.minutes}-minute trial — no card required. After that, LEXIS is ฿${PRICING.weekly.thb}/week or ฿${PRICING.monthly.thb}/month.`
    },
    {
      q: 'How is this different from a language exchange app?',
      a: "There's no waiting for a partner to be online, no scheduling, and no awkwardness about correcting a stranger. LEXIS is available any time you are, and its whole job is to help you practice — not make small talk."
    },
    {
      q: 'Can I interrupt LEXIS mid-sentence?',
      a: "Yes — real conversations involve talking over each other sometimes, so you can jump in and interrupt LEXIS at any point, the same as you would with a person."
    },
    {
      q: 'What happens to my voice recording?',
      a: "Your microphone audio streams live to power the conversation and isn't saved as an audio file on LEXIS's own servers. After a session, LEXIS keeps only a short feedback summary (a confidence score and a few corrections) — never a transcript of what you said. See the full Privacy Policy for details."
    }
  ]
};
