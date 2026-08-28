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

// LEXIS Community's pay-it-forward checkout add-on (PricingPage.jsx,
// CommunityPage.jsx). Kept in sync by hand with the identical constant in
// backend/app.mjs (SPONSOR_ADDON_THB) — the two can't share an import
// across the frontend/backend deploy boundary, same situation as
// STRIPE_PRICES' comment above about the Stripe-side amounts.
export const SPONSOR_ADDON_THB = 50;

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

// Kept under 160 characters so Google does not truncate it in results. The
// longer version (213) was cut mid-sentence, losing the trial offer, which is
// the part most likely to earn the click. Site audit M2, 27 Aug 2026.
export const LANDING_DESCRIPTION_EN = `A voice conversation partner for practicing spoken English and Thai. Talk out loud, get gentle real-time corrections. Free ${TRIAL.minutes}-min trial, no card.`;
export const PRICING_DESCRIPTION_EN = `LEXIS pricing: a free ${TRIAL.minutes}-minute trial, then ฿${PRICING.weekly.thb}/week or ฿${PRICING.monthly.thb}/month for unlimited voice practice in English or Thai. ${VAT.registered ? '' : 'No VAT, '}cancel anytime.`;

// Thai-language versions of the two page descriptions above, for the /th
// and /th/pricing routes' own <meta name="description"> and og:description
// (Stage 4 of the remediation brief — real /th pages, not the page's copy
// re-served under a Thai URL). Same facts, translated, not a separate set
// of numbers to keep in sync.
export const LANDING_DESCRIPTION_TH = `คู่สนทนาสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย พูดออกเสียงจริง รับคำแนะนำแบบเรียลไทม์อย่างอ่อนโยน ทดลองฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร`;
export const PRICING_DESCRIPTION_TH = `ราคา LEXIS: ทดลองฟรี ${TRIAL.minutes} นาที จากนั้น ฿${PRICING.weekly.thb}/สัปดาห์ หรือ ฿${PRICING.monthly.thb}/เดือน สำหรับฝึกพูดภาษาอังกฤษหรือภาษาไทยได้ไม่จำกัด ${VAT.registered ? '' : 'ไม่มี VAT '}ยกเลิกได้ทุกเมื่อ`;

// FAQ copy — rendered by LandingPage.jsx's <details>/<summary> list and
// mirrored as FAQPage JSON-LD by structuredData.js's buildFaqJsonLd.
// Previously hand-duplicated between those two, which a re-audit flagged
// as a drift risk (mismatched visible text vs structured data is exactly
// what invalidates FAQ rich results) — both now read this array.
//
// Trimmed from six questions to three (19 Aug 2026) — cognitive load on
// a landing page's own conversion, not a content-quality problem with the
// three that got cut. Their content still exists, just not as a separate
// FAQ block each:
//   - "Who is LEXIS for?" — folded into the hero subheadline instead
//     (LandingPage.jsx's heroSub), so it's read on the way in rather than
//     requiring a scroll + click to expand.
//   - "How is this different from a language exchange app?" — condensed
//     into a trust-strip bullet ("No waiting, no scheduling — practice
//     the moment you want to").
//   - "What happens to my voice recording?" — this is a real, detailed
//     answer that deserves more than an FAQ-box sentence; it now lives
//     only in PrivacyPage.jsx's "What happens to your voice" section,
//     which the footer already links to right below this FAQ block.
export const FAQS = {
  en: [
    {
      q: 'What is LEXIS?',
      a: 'LEXIS is a voice-based speaking practice tool for English and Thai. You have a real, spoken conversation with her over your microphone, and she replies in real time, the way a conversation partner would, not a chatbot you type into.'
    },
    {
      q: 'Is LEXIS free to try?',
      a: `Yes. New accounts get a free ${TRIAL.minutes}-minute trial, no card required. After that, LEXIS is ฿${PRICING.weekly.thb}/week or ฿${PRICING.monthly.thb}/month.`
    },
    {
      q: 'Do I need to be fluent to start?',
      a: 'No. LEXIS adjusts to your level as you go, so complete beginners and advanced speakers alike can start practicing with her right away, from wherever you actually are.'
    }
  ],
  // Real Thai translations, not machine-generated placeholders — same
  // three questions as FAQS.en, same facts (TRIAL.minutes/PRICING
  // interpolated the same way), written for the /th and /th/pricing
  // routes (Stage 4). Kept exactly parallel in length/order to FAQS.en so
  // buildFaqJsonLd's structured data and the visible <details> list never
  // drift between languages the way the old hand-duplicated copy did.
  th: [
    {
      q: 'LEXIS คืออะไร',
      a: 'LEXIS คือเครื่องมือฝึกพูดด้วยเสียงสำหรับภาษาอังกฤษและภาษาไทย คุณจะได้สนทนาจริงผ่านไมโครโฟน และ LEXIS จะตอบกลับแบบเรียลไทม์เหมือนคู่สนทนาจริง ๆ ไม่ใช่แชทบอทที่ต้องพิมพ์คุย'
    },
    {
      q: 'ทดลองใช้ LEXIS ฟรีได้ไหม',
      a: `ได้ บัญชีใหม่ทุกบัญชีจะได้ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร หลังจากนั้น LEXIS มีราคา ฿${PRICING.weekly.thb}/สัปดาห์ หรือ ฿${PRICING.monthly.thb}/เดือน`
    },
    {
      q: 'ต้องพูดคล่องก่อนถึงจะเริ่มได้ไหม',
      a: 'ไม่ต้อง LEXIS จะปรับให้เหมาะกับระดับของคุณไปเรื่อย ๆ ทั้งมือใหม่และคนที่พูดเก่งอยู่แล้วก็ใช้ได้ เริ่มจากจุดที่คุณอยู่จริง ๆ'
    }
  ]
};
