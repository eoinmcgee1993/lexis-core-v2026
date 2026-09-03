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

// learnwithlexis.com is the canonical domain (confirmed by Eoin,
// 17 Aug 2026) — every canonical/hreflang/JSON-LD URL in the app derives
// from this one constant. The .vercel.app URL still resolves (Vercel
// serves the same deployment on it) but is no longer what search
// engines/social unfurlers should treat as the real address; see
// vercel.json's redirect rule, which sends the old domain here.
export const SITE_URL = 'https://learnwithlexis.com';
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
// UnitPriceSpecification with referenceQuantity + unitCode (ISO 8601-ish
// duration codes: WEE = week, MON = month) says what the price BUYS: ฿199
// for one week of access. It used to carry billingDuration instead, which
// says the charge repeats every week — true when LEXIS sold subscriptions,
// and a false claim now that a pass is a single payment that never renews
// (2 Sep 2026). An answer engine repeating "฿199 per week, billed weekly"
// would be quoting us on terms we do not offer.
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
  const passOffer = (name, tier) => ({
    '@type': 'Offer',
    name,
    url: pricingUrl,
    availability: 'https://schema.org/InStock',
    price: String(tier.thb),
    priceCurrency: CURRENCY,
    priceSpecification: {
      '@type': 'UnitPriceSpecification',
      price: String(tier.thb),
      priceCurrency: CURRENCY,
      referenceQuantity: {
        '@type': 'QuantitativeValue',
        value: 1,
        unitCode: tier.unitCode
      }
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
      passOffer(text.weekly, PRICING.weekly),
      passOffer(text.monthly, PRICING.monthly)
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

// BreadcrumbList (21 Aug 2026, re-audit L7) — every page except '/' and
// '/th' gets one; a single-level home page has no trail to show against
// itself. One generic builder rather than a function per page, since the
// shape is identical everywhere: Home > This Page. lang controls only the
// "Home" crumb's label and target, matching whichever language's chrome
// is actually visible on the page calling this.
const HOME_LABEL = { en: 'Home', th: 'หน้าแรก' };

export function buildBreadcrumbJsonLd(pageName, pageUrl, lang = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: HOME_LABEL[lang] || HOME_LABEL.en,
        item: lang === 'th' ? `${SITE_URL}/th` : `${SITE_URL}/`
      },
      { '@type': 'ListItem', position: 2, name: pageName, item: pageUrl }
    ]
  };
}

// FAQPage for /practice/interview-english (21 Aug 2026, re-audit L7) —
// genuine content drawn from what's already on that page (the same
// PRACTICE_PROMPTS list InterviewEnglishPage.jsx renders, and TRIAL from
// facts.js), not written fresh for the structured data. Kept here rather
// than inline in the page component to match how buildFaqJsonLd/
// buildOffersJsonLd already work for LandingPage.jsx/PricingPage.jsx.
// lang param added 22 Aug 2026 alongside /th/practice/interview-english —
// same "structured data matches whichever language is visible" rule
// useSeo.js documents for every other builder here; English text
// preserved exactly as it was so the existing /practice/interview-english
// page's JSON-LD is untouched.
const INTERVIEW_FAQ_TEXT = {
  en: [
    {
      q: 'What interview questions can I practice with LEXIS?',
      a: 'Common, real interview prompts that come up regardless of industry, including "Tell me about yourself," "What are your strengths and weaknesses?," "Why do you want to work here?," "Describe a time you solved a difficult problem," and "Do you have any questions for me?"'
    },
    {
      q: 'Is interview English practice free?',
      a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for interview practice or any other topic.`
    },
    {
      q: 'How is speaking practice different from reading interview questions online?',
      a: "Reading a question and typing out an answer doesn't train what an interview actually tests: thinking and speaking at the same time, in a second language, under a little pressure. LEXIS replies out loud in real time and corrects grammar or word choice gently mid conversation, the same way a patient interviewer's follow up question would."
    }
  ],
  th: [
    {
      q: 'ฝึกคำถามสัมภาษณ์งานแบบไหนได้บ้างกับ LEXIS',
      a: 'คำถามสัมภาษณ์จริงที่เจอบ่อย ไม่ว่าจะสายงานไหนก็เจอได้ เช่น "Tell me about yourself" "What are your strengths and weaknesses?" "Why do you want to work here?" "Describe a time you solved a difficult problem" และ "Do you have any questions for me?"'
    },
    {
      q: 'ฝึกภาษาอังกฤษสำหรับสัมภาษณ์งานฟรีไหม',
      a: `ฟรีค่ะ ผู้ใช้ใหม่ทุกคนได้ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร ใช้ฝึกสัมภาษณ์งานหรือหัวข้ออื่นก็ได้`
    },
    {
      q: 'ฝึกพูดต่างจากอ่านคำถามสัมภาษณ์ทางเว็บอย่างไร',
      a: 'การอ่านคำถามแล้วพิมพ์คำตอบไม่ได้ฝึกสิ่งที่การสัมภาษณ์จริงต้องใช้ คือคิดและพูดพร้อมกัน เป็นภาษาที่สอง ภายใต้ความกดดันเล็กน้อย LEXIS ตอบกลับด้วยเสียงจริงแบบเรียลไทม์ และช่วยแก้ไขไวยากรณ์หรือคำศัพท์อย่างอ่อนโยนระหว่างสนทนา เหมือนคำถามต่อเนื่องจากผู้สัมภาษณ์ใจดี'
    }
  ]
};

export function buildInterviewFaqJsonLd(lang = 'en') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (INTERVIEW_FAQ_TEXT[lang] || INTERVIEW_FAQ_TEXT.en).map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

// Generic FAQPage builder (21 Aug 2026, re-audit L10) for the topic
// practice pages below — takes the page's own {q,a} pairs directly rather
// than needing a dedicated build*FaqJsonLd function per page the way
// buildInterviewFaqJsonLd/buildPrivacyFaqJsonLd (below) do. Those two
// predate this and are left as they are since they already shipped; the
// new topic pages use this one directly, with their content colocated in
// the page file itself (same place InterviewEnglishPage.jsx's
// PRACTICE_PROMPTS already lives).
export function buildTopicFaqJsonLd(entries) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: entries.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a }
    }))
  };
}

// FAQPage for /privacy (21 Aug 2026, re-audit L8) — every answer condenses
// language already on the page itself (PrivacyPage.jsx's own section
// prose); it introduces no new claim. A separate builder rather than
// reusing buildFaqJsonLd, since these aren't FAQS.en/th marketing
// entries, they're this one page's own section headings in question form.
export function buildPrivacyFaqJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What happens to my voice when I use LEXIS?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "A live LEXIS session is a real time voice connection (WebRTC) directly between your device and OpenAI's Realtime API. Your microphone audio is streamed for the duration of the conversation and is not saved as an audio file on LEXIS's own servers. After a session ends, LEXIS saves only a feedback summary (a confidence score, a few strengths, and a few corrections), not a transcript of what you said."
        }
      },
      {
        '@type': 'Question',
        name: 'What other data does LEXIS store about me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Account info (email, name, subscription status), session feedback summaries, usage totals to enforce the free trial and track your plan, and basic first party analytics kept against an anonymous per visit identifier. Payment details are handled entirely by Stripe; LEXIS does not receive or store your card number. No third party analytics or advertising trackers are used anywhere on LEXIS."
        }
      },
      {
        '@type': 'Question',
        name: 'How long does LEXIS keep my data?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Account data and session history are kept for up to 2 years from your last activity on LEXIS, after which they are deleted. You can also ask for earlier deletion at any time.'
        }
      },
      {
        '@type': 'Question',
        name: 'Can I delete my data or ask what LEXIS holds about me?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'There is currently no self serve "delete my account" option in the app itself. Email privacy@learnwithlexis.com to request deletion or a copy of your data, and it will be actioned directly.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is LEXIS suitable for someone under 18?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: "Under Thailand's Personal Data Protection Act, anyone under 20 is legally a minor: under 10s need a parent or guardian's consent to use LEXIS, and those aged 10 to 19 need both their own consent and a parent or guardian's. At sign up, LEXIS asks users to confirm they are 20 or older, or that they have permission to use LEXIS if younger."
        }
      }
    ]
  };
}
