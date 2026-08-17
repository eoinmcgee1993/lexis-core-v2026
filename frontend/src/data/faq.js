// frontend/src/data/faq.js
//
// Single source of truth for the landing page's FAQ content — previously
// hand-duplicated between LandingPage.jsx's rendered copy and index.html's
// static FAQPage JSON-LD, which a re-audit flagged as a drift risk (an
// English source review: mismatched visible text vs structured data is
// exactly what gets FAQ rich-result markup penalized/ignored). Both now
// import from here. App.jsx reads this to build the FAQPage JSON-LD block
// and injects it only on '/' (see injectJsonLd in App.jsx) — the audit's
// other finding was that a static <script> in index.html gets served
// identically on every route, including /auth, which had no business
// claiming to be an FAQPage.
export const FAQS_EN = [
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
    a: 'Yes. New accounts get a free 30-minute trial — no card required. After that, LEXIS is ฿199/week or ฿599/month.'
  },
  {
    q: 'How is this different from a language exchange app?',
    a: "There's no waiting for a partner to be online, no scheduling, and no awkwardness about correcting a stranger. LEXIS is available any time you are, and its whole job is to help you practice — not make small talk."
  },
  {
    q: 'Can I interrupt LEXIS mid-sentence?',
    a: "Yes — real conversations involve talking over each other sometimes, so you can jump in and interrupt LEXIS at any point, the same as you would with a person."
  }
];
