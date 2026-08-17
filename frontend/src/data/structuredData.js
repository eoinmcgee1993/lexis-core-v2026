// frontend/src/data/structuredData.js
//
// JSON-LD builders for pages that need them, injected per-route by each
// page component via useSeo (frontend/src/lib/useSeo.js) rather than
// living as static <script> tags in index.html. A re-audit (Digital
// Renaissance, 17 Aug 2026) found the previous static blocks being
// served identically on every route — a sign-in page declaring itself
// an FAQPage, /app advertising subscription offers via schema.org Offer
// markup it has no business making. That's exactly the kind of
// markup/page mismatch that gets a site's structured data stopped being
// trusted generally, not just the offending block ignored.
//
// Every number/string below is sourced from frontend/src/content/facts.js
// — the "one fact, one source" rule from the same remediation brief.
// Nothing here hardcodes a price or trial term independently.
import { CURRENCY, FAQS, PRICING, TRIAL } from '../content/facts';

export const SITE_URL = 'https://lexis-core-v2026.vercel.app';
export const ORG_ID = `${SITE_URL}/#organization`;
export const APP_ID = `${SITE_URL}/#software`;

// The Organization + SoftwareApplication graph is sitewide-appropriate
// (per the re-audit: "can stay") and lives as a static <script> directly
// in index.html, NOT injected by this module — it needs to be present
// even for crawlers/social unfurlers that never execute JS, which is the
// whole reason it's the one JSON-LD block the pre-render work
// deliberately left alone. ORG_ID/APP_ID above are exported so the
// per-route builders below can reference the same @id via `publisher`
// without hand-retyping the URL — keep them in sync with index.html's
// static block if either changes.

// '/pricing' only, injected by PricingPage.jsx via useSeo.
// UnitPriceSpecification with billingDuration + unitCode (ISO 8601-ish
// duration codes: WEE = week, MON = month) signals these are recurring
// charges, not one-time prices — a re-audit's N4 finding was that a bare
// {"price": "199"} with only a priceValidUntil reads to an answer engine
// as "LEXIS costs ฿199, full stop," which understates what a subscriber
// actually pays over time.
// lang defaults to 'en'; '/th/pricing' passes 'th' (Stage 4) so the
// offer names/description read naturally in Thai rather than mixing an
// English label into an otherwise-Thai page's structured data. The
// price/currency/duration fields are language-independent, so only the
// human-readable strings below branch on lang.
const OFFER_TEXT = {
  en: {
    freeTrial: 'Free trial',
    freeTrialDesc: (minutes) => `${minutes} minutes of free practice, no card required to start.`,
    weekly: 'Weekly pass',
    monthly: 'Monthly pass'
  },
  th: {
    freeTrial: 'ทดลองใช้ฟรี',
    freeTrialDesc: (minutes) => `ฝึกฝนฟรี ${minutes} นาที ไม่ต้องผูกบัตรเพื่อเริ่มต้น`,
    weekly: 'แพ็กเกจรายสัปดาห์',
    monthly: 'แพ็กเกจรายเดือน'
  }
};

export function buildOffersJsonLd(lang = 'en') {
  const text = OFFER_TEXT[lang];
  const pricingUrl = `${SITE_URL}${lang === 'th' ? '/th/pricing' : '/pricing'}`;
  const recurringOffer = (name, tier) => ({
    '@type': 'Offer',
    name,
    url: pricingUrl,
    availability: 'https://schema.org/InStock',
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: String(tier.thb),
      priceCurrency: CURRENCY,
      billingDuration: 1,
      billingIncrement: 1,
      unitCode: tier.unitCode
    }
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: 'LEXIS',
    publisher: { '@id': ORG_ID },
    offers: [
      {
        '@type': 'Offer',
        name: text.freeTrial,
        url: pricingUrl,
        availability: 'https://schema.org/InStock',
        price: '0',
        priceCurrency: CURRENCY,
        description: text.freeTrialDesc(TRIAL.minutes)
      },
      recurringOffer(text.weekly, PRICING.weekly),
      recurringOffer(text.monthly, PRICING.monthly)
    ]
  };
}

// '/' and '/th' only, injected by LandingPage.jsx via useSeo. Sourced from
// facts.js's FAQS[lang] — previously hand-duplicated between the rendered
// page and this JSON-LD, which a re-audit flagged as a drift risk
// (mismatched visible text vs structured data is exactly what
// invalidates FAQ rich results). lang defaults to 'en'; /th passes 'th'
// (Stage 4) so the structured data matches whichever FAQ text is actually
// visible on that page, never the other language's.
export function buildFaqJsonLd(lang = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS[lang].map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}
