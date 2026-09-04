// frontend/src/pages/TravelEnglishPage.jsx
//
// Third of the "practice/" long-tail pages — see EverydayEnglishPage.jsx's
// header comment for why this is one honest hub page per real topic
// (matching TopicStage.jsx's exact three selectable topics) rather than
// stretching to the audit's "8-10 pages" by splitting one curriculum's
// bullet list into several thin pages.
//
// TOPIC_CURRICULA.travel in backend/app.mjs: 'travel — hotels, asking for
// directions, ordering food, getting help, airports and transport'.
// PRACTICE_PROMPTS below are drawn directly from that list.
//
// /th/practice/travel-english added 22 Aug 2026, direct request ("there
// shoukd be a language toggle on each page too") — same lang-prop pattern
// as LandingPage.jsx/PricingPage.jsx. PRACTICE_PROMPTS stay in English on
// both language versions: the literal sentences a student practices
// saying, not page chrome.
import React, { useMemo } from 'react';
import { ArrowLeft, Mic, Plane, TrendingUp, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';
import AppLink from '../components/AppLink';

const PRACTICE_PROMPTS = [
  '"I\'d like to check in, please. I have a reservation."',
  '"Could you tell me how to get to the train station from here?"',
  '"Could I see the menu, please? What would you recommend?"',
  '"Excuse me, I think I\'m lost, could you help me?"',
  '"What gate does this flight leave from?"'
];

const TEXT = {
  en: {
    home: 'Home',
    h1: 'Practice travel English, out loud.',
    intro: "Checking into a hotel, asking for directions, ordering food somewhere new, all of it happens fast, out loud, with a stranger, and no time to look anything up. LEXIS gives you that exact practice ahead of time: a real spoken exchange, gentle correction, so the real version doesn't catch you off guard.",
    why: 'Why spoken practice, specifically',
    whyBody: "Reading a list of useful travel phrases doesn't train the thing travel actually tests: understanding a reply you didn't expect and responding on the spot. LEXIS's Travel & Culture topic is built around that gap. You talk, LEXIS replies out loud in real time and corrects grammar or word choice gently mid conversation, the same way a patient local would.",
    kind: "The kind of conversation you'll practice",
    kindBody: 'Common, real travel situations, the ones that come up regardless of destination:',
    after: 'What you get after each session',
    afterBody: "A plain-language summary of what you did well and what to work on next, grounded in what you actually said, not a generic score. Practice again as many times as you want; there's no limit on repeat sessions.",
    cta: 'Start practicing free',
    trialNote: (minutes) => `Free ${minutes}-minute trial. No card required.`,
    footerPricing: 'View pricing'
  },
  th: {
    home: 'หน้าแรก',
    h1: 'ฝึกพูดภาษาอังกฤษสำหรับการเดินทาง',
    intro: 'เช็คอินโรงแรม ถามทาง สั่งอาหารในที่ที่ไม่คุ้นเคย ทุกอย่างเกิดขึ้นเร็ว เป็นเสียงพูด กับคนแปลกหน้า และไม่มีเวลาเปิดหาคำศัพท์ LEXIS ให้คุณฝึกแบบนั้นล่วงหน้าได้จริง บทสนทนาจริง แก้ไขให้อย่างอ่อนโยน เพื่อให้สถานการณ์จริงไม่ทำให้คุณตั้งตัวไม่ทัน',
    why: 'ทำไมต้องฝึกพูดโดยเฉพาะ',
    whyBody: 'การอ่านรายการวลีท่องเที่ยวไม่ได้ฝึกสิ่งที่การเดินทางจริงต้องใช้ คือการเข้าใจคำตอบที่ไม่คาดคิดและตอบสนองได้ทันที หัวข้อ Travel & Culture ของ LEXIS สร้างมาเพื่อช่องว่างนี้โดยเฉพาะ คุณพูด LEXIS ตอบกลับด้วยเสียงจริงแบบเรียลไทม์ และช่วยแก้ไขไวยากรณ์หรือคำศัพท์อย่างอ่อนโยนระหว่างสนทนา เหมือนคนท้องถิ่นใจดี',
    kind: 'บทสนทนาแบบที่จะได้ฝึก',
    kindBody: 'สถานการณ์การเดินทางจริงที่เจอบ่อย ไม่ว่าจะไปที่ไหนก็เจอได้:',
    after: 'สิ่งที่ได้หลังจบแต่ละเซสชัน',
    afterBody: 'สรุปผลแบบเข้าใจง่ายว่าทำได้ดีตรงไหนและควรฝึกอะไรต่อ อ้างอิงจากสิ่งที่คุณพูดจริง ไม่ใช่คะแนนทั่วไป ฝึกซ้ำได้เท่าที่อยากฝึก ไม่จำกัดจำนวนครั้ง',
    cta: 'เริ่มฝึกฟรี',
    trialNote: (minutes) => `ทดลองใช้ฟรี ${minutes} นาที ไม่ต้องผูกบัตร`,
    footerPricing: 'ดูราคา'
  }
};

const FAQ = {
  en: [
    {
      q: 'What can I practice on this page?',
      a: 'Real travel English: hotels, asking for directions, ordering food, getting help when something goes wrong, and airports and transport, the same "Travel & Culture" topic available in the app itself.'
    },
    {
      q: 'Is travel English practice free?',
      a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for travel practice or any other topic.`
    },
    {
      q: 'How is this different from a phrasebook or a translation app?',
      a: "A phrasebook gives you a script to read from someone else's mouth. LEXIS gives you a real back-and-forth: you speak, LEXIS replies out loud in real time, and corrects gently mid conversation, so you're actually practicing the exchange, not just memorizing lines."
    }
  ],
  th: [
    {
      q: 'ฝึกอะไรได้บ้างในหน้านี้',
      a: 'ภาษาอังกฤษสำหรับการเดินทางจริง ๆ เช่น โรงแรม ถามทาง สั่งอาหาร ขอความช่วยเหลือเมื่อมีปัญหา และสนามบินกับการเดินทาง หัวข้อเดียวกับ "Travel & Culture" ที่มีในแอปจริง'
    },
    {
      q: 'ฝึกภาษาอังกฤษสำหรับการเดินทางฟรีไหม',
      a: `ฟรีค่ะ ผู้ใช้ใหม่ทุกคนได้ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร ใช้ฝึกการเดินทางหรือหัวข้ออื่นก็ได้`
    },
    {
      q: 'ต่างจากหนังสือวลีหรือแอปแปลภาษาอย่างไร',
      a: 'หนังสือวลีให้แค่สคริปต์ให้อ่านตามคนอื่น แต่ LEXIS ให้บทสนทนาโต้ตอบจริง คุณพูด LEXIS ตอบกลับด้วยเสียงจริงแบบเรียลไทม์ และช่วยแก้ไขอย่างอ่อนโยนระหว่างสนทนา ทำให้คุณได้ฝึกการโต้ตอบจริง ไม่ใช่แค่ท่องจำประโยค'
    }
  ]
};

export default function TravelEnglishPage({ navigateTo, lang = 'en' }) {
  const enUrl = `${SITE_URL}/practice/travel-english`;
  const thUrl = `${SITE_URL}/th/practice/travel-english`;
  const pageUrl = lang === 'th' ? thUrl : enUrl;
  const t = TEXT[lang];

  const faqJsonLd = useMemo(() => buildTopicFaqJsonLd(FAQ[lang]), [lang]);
  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'ฝึกภาษาอังกฤษเพื่อการเดินทาง' : 'Travel English Practice', pageUrl, lang),
    [lang, pageUrl]
  );

  useSeo({
    title: lang === 'th'
      ? 'ฝึกพูดภาษาอังกฤษเพื่อการเดินทาง | LEXIS'
      : 'Practice Travel English Out Loud | LEXIS',
    description: lang === 'th'
      ? `ฝึกพูดภาษาอังกฤษเพื่อการเดินทางออกเสียงจริง โรงแรม ถามทาง สั่งอาหาร และสนามบิน พร้อมคำแนะนำแบบเรียลไทม์อย่างอ่อนโยน ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร`
      : `Practice travel English out loud, hotels, directions, ordering food, and airports, with gentle real-time corrections. Free ${TRIAL.minutes}-minute trial, no card required.`,
    canonical: pageUrl,
    htmlLang: lang,
    hreflang: [
      { hrefLang: 'en', href: enUrl },
      { hrefLang: 'th', href: thUrl },
      { hrefLang: 'x-default', href: enUrl }
    ],
    jsonLd: {
      'jsonld-faq': faqJsonLd,
      'jsonld-breadcrumb': breadcrumbJsonLd
    }
  });

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-3xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <AppLink
          to={lang === 'th' ? '/th' : '/'} navigateTo={navigateTo} className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors"
          >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t.home}</span>
        </AppLink>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">LEXIS</span>
        </div>
        <AppLink
          to={lang === 'en' ? thUrl.replace(SITE_URL, '') : enUrl.replace(SITE_URL, '')} navigateTo={navigateTo} aria-label={lang === 'en' ? 'Switch page language to Thai' : 'Switch page language to English'}
          className="flex items-center gap-1 text-xs text-lexis-ink/50 hover:text-lexis-ink transition-colors min-h-[44px] px-1"
          >
          <Globe className="w-4 h-4 text-teal-700" aria-hidden="true" />
          <span>{lang === 'en' ? 'ไทย' : 'EN'}</span>
        </AppLink>
      </header>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-3xl md:text-4xl mb-3 text-lexis-ink leading-tight">
          {t.h1}
        </h1>
        <p className="text-sm md:text-base text-lexis-ink/60 mb-10 leading-relaxed">
          {t.intro}
        </p>

        <div className="space-y-8 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Mic className="w-4 h-4 text-teal-600" aria-hidden="true" />
              {t.why}
            </h2>
            <p className="mt-2">{t.whyBody}</p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Plane className="w-4 h-4 text-teal-600" aria-hidden="true" />
              {t.kind}
            </h2>
            <p className="mt-2">{t.kindBody}</p>
            <ul className="mt-3 space-y-1.5 list-disc pl-5 marker:text-teal-600">
              {PRACTICE_PROMPTS.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-600" aria-hidden="true" />
              {t.after}
            </h2>
            <p className="mt-2">{t.afterBody}</p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <AppLink
            to="/app" navigateTo={navigateTo} className="inline-flex min-h-[44px] items-center gap-2 bg-lexis-action hover:bg-lexis-action-dark text-lexis-navy font-bold text-sm px-8 py-3.5 rounded-xl transition-all"
          >
            <Mic className="w-4 h-4" aria-hidden="true" />
            <span>{t.cta}</span>
          </AppLink>
          <p className="mt-3 text-xs text-lexis-ink/50">
            {t.trialNote(TRIAL.minutes)}
          </p>
        </div>
      </section>

      <footer className="w-full max-w-3xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div>© 2026 LEXIS</div>
        <AppLink to={lang === 'th' ? '/th/pricing' : '/pricing'} navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">
          {t.footerPricing}
        </AppLink>
      </footer>
    </div>
  );
}
