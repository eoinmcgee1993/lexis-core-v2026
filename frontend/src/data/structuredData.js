// frontend/src/data/structuredData.js
//
// JSON-LD builders for pages that need them, injected per-route by
// App.jsx (see setJsonLd/removeJsonLd) rather than living as static
// <script> tags in index.html. A re-audit (Digital Renaissance, 17 Aug
// 2026) found the previous static blocks being served identically on
// every route — a sign-in page declaring itself an FAQPage, /app
// advertising subscription offers via schema.org Offer markup it has no
// business making. That's exactly the kind of markup/page mismatch that
// gets a site's structured data stopped being trusted generally, not
// just the offending block ignored.
import { FAQS_EN } from './faq';

export const SITE_URL = 'https://lexis-core-v2026.vercel.app';
const ORG_ID = `${SITE_URL}/#organization`;
const APP_ID = `${SITE_URL}/#software`;

// Sitewide — appropriate on every route, per the re-audit ("the
// SoftwareApplication block is sitewide-appropriate and can stay").
// Stays a static <script> in index.html (see that file) rather than
// JS-injected, so it's present even for crawlers that don't execute JS.
// Kept here anyway as the documented source of truth for that static
// block's shape — update both together if this changes.
//
// No `sameAs` (social profile URLs) — omitted rather than fabricated.
// Add LINE/TikTok/Instagram URLs to the Organization node once they exist.
export function buildAppJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': ORG_ID,
        name: 'LEXIS',
        url: SITE_URL
      },
      {
        '@type': 'SoftwareApplication',
        '@id': APP_ID,
        name: 'LEXIS',
        applicationCategory: 'EducationApplication',
        operatingSystem: 'Web',
        url: SITE_URL,
        description: 'A voice conversation partner for practicing spoken English and Thai in real time.',
        publisher: { '@id': ORG_ID }
      }
    ]
  };
}

// '/pricing' only, injected by App.jsx. UnitPriceSpecification with
// billingDuration + unitCode (ISO 8601-ish duration codes: WEE = week,
// MON = month) signals these are recurring charges, not one-time
// prices — the re-audit's N4 finding was that a bare {"price": "199"}
// with only a priceValidUntil reads to an answer engine as "LEXIS costs
// ฿199, full stop," which understates what a subscriber actually pays
// over time.
export function buildOffersJsonLd() {
  const recurringOffer = (name, price, unitCode) => ({
    '@type': 'Offer',
    name,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price,
      priceCurrency: 'THB',
      billingDuration: 1,
      unitCode
    }
  });
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': APP_ID,
    name: 'LEXIS',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free trial',
        price: '0',
        priceCurrency: 'THB',
        description: '30 minutes of free practice, no card required to start.'
      },
      recurringOffer('Weekly pass', '199', 'WEE'),
      recurringOffer('Monthly pass', '599', 'MON')
    ]
  };
}

// '/' only, injected by App.jsx. Sourced from the same FAQS_EN array
// LandingPage.jsx renders — previously hand-duplicated between the two,
// which a re-audit flagged as a drift risk (mismatched visible text vs
// structured data is exactly what invalidates FAQ rich results).
export function buildFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQS_EN.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}
