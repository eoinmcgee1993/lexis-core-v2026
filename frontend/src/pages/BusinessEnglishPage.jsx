// frontend/src/pages/BusinessEnglishPage.jsx
//
// Fourth of the "practice/" long-tail pages — see EverydayEnglishPage.jsx's
// header comment for why this is one honest hub page per real topic
// rather than stretching to the audit's "8-10 pages" figure.
//
// TOPIC_CURRICULA.work in backend/app.mjs: 'work and business — meetings,
// emails, small talk with colleagues, describing your job, job
// interviews'. This page deliberately covers the non-interview parts of
// that same curriculum, meetings, emails, colleague small talk,
// describing your job, since job interviews already has its own page
// (InterviewEnglishPage.jsx, /practice/interview-english). Splitting the
// same curriculum's content across two overlapping pages would be the
// exact thin/duplicate-content problem this whole batch is trying to
// avoid, so the two pages are kept deliberately non-overlapping instead.
//
// /th/practice/business-english added 22 Aug 2026, direct request ("there
// shoukd be a language toggle on each page too") — same lang-prop pattern
// as LandingPage.jsx/PricingPage.jsx. PRACTICE_PROMPTS stay in English on
// both language versions: the literal sentences a student practices
// saying, not page chrome.
import React, { useMemo } from 'react';
import { ArrowLeft, Mic, Briefcase, TrendingUp, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';
import AppLink from '../components/AppLink';

const PRACTICE_PROMPTS = [
  '"Can you give me a quick update on where the project stands?"',
  '"I wanted to follow up on the email I sent yesterday."',
  '"How was your weekend? Anything interesting happen?"',
  '"So, what do you do for work?"',
  '"Sorry I\'m running a couple of minutes behind, shall we get started?"'
];

const TEXT = {
  en: {
    home: 'Home',
    h1: 'Practice business English, out loud.',
    intro: "Most workplace English isn't a big presentation, it's a quick update in a meeting, a follow-up email you'd rather say out loud first, small talk before things start. LEXIS gives you real practice at exactly that: a real spoken exchange, gentle correction on the words that got in the way.",
    why: 'Why spoken practice, specifically',
    whyBody: "A meeting or a colleague's question doesn't wait for you to draft the perfect sentence. LEXIS's Work & Business topic is built around that: you talk, LEXIS replies out loud in real time and corrects grammar or word choice gently mid conversation, the same way a patient colleague would.",
    kind: "The kind of conversation you'll practice",
    kindBody: 'Common workplace situations, the ones that come up regardless of industry:',
    after: 'What you get after each session',
    afterBody: "A plain-language summary of what you did well and what to work on next, grounded in what you actually said, not a generic score. Practice again as many times as you want; there's no limit on repeat sessions.",
    cta: 'Start practicing free',
    trialNote: (minutes) => `Free ${minutes}-minute trial. No card required.`,
    footerPricing: 'View pricing'
  },
  th: {
    home: 'หน้าแรก',
    h1: 'ฝึกพูดภาษาอังกฤษเพื่อการทำงาน',
    intro: 'ภาษาอังกฤษในที่ทำงานส่วนใหญ่ไม่ใช่การพรีเซนต์ใหญ่ ๆ แต่คืออัปเดตสั้น ๆ ในที่ประชุม อีเมลติดตามงานที่อยากพูดออกเสียงก่อน หรือคุยเล่นเล็ก ๆ ก่อนเริ่มงาน LEXIS ให้คุณฝึกพูดจริงกับเรื่องแบบนี้เลย บทสนทนาจริง แก้ไขคำที่ติดขัดอย่างอ่อนโยน',
    why: 'ทำไมต้องฝึกพูดโดยเฉพาะ',
    whyBody: 'การประชุมหรือคำถามจากเพื่อนร่วมงานไม่รอให้คุณร่างประโยคที่สมบูรณ์แบบ หัวข้อ Work & Business ของ LEXIS สร้างมาเพื่อสิ่งนี้โดยเฉพาะ คุณพูด LEXIS ตอบกลับด้วยเสียงจริงแบบเรียลไทม์ และช่วยแก้ไขไวยากรณ์หรือคำศัพท์อย่างอ่อนโยนระหว่างสนทนา เหมือนเพื่อนร่วมงานใจเย็น',
    kind: 'บทสนทนาแบบที่จะได้ฝึก',
    kindBody: 'สถานการณ์ในที่ทำงานจริงที่เจอบ่อย ไม่ว่าจะสายงานไหนก็เจอได้:',
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
      a: 'Everyday workplace English: meetings, emails, small talk with colleagues, and describing your job, part of the same "Work & Business" topic available in the app itself. Job interview practice specifically has its own dedicated page.'
    },
    {
      q: 'Is business English practice free?',
      a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for workplace practice or any other topic.`
    },
    {
      q: 'Is this the same as the interview practice page?',
      a: "No. This page covers the rest of workplace English, meetings, emails, small talk, and describing your job. Interview-specific practice (\"Tell me about yourself,\" strengths and weaknesses, and similar prompts) has its own page at /practice/interview-english."
    }
  ],
  th: [
    {
      q: 'ฝึกอะไรได้บ้างในหน้านี้',
      a: 'ภาษาอังกฤษในที่ทำงานทั่วไป เช่น การประชุม อีเมล คุยเล่นกับเพื่อนร่วมงาน และการอธิบายงานของคุณ ส่วนหนึ่งของหัวข้อ "Work & Business" ที่มีในแอปจริง การฝึกสัมภาษณ์งานมีหน้าแยกต่างหาก'
    },
    {
      q: 'ฝึกภาษาอังกฤษเพื่อการทำงานฟรีไหม',
      a: `ฟรีค่ะ ผู้ใช้ใหม่ทุกคนได้ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร ใช้ฝึกเรื่องงานหรือหัวข้ออื่นก็ได้`
    },
    {
      q: 'หน้านี้เหมือนกับหน้าฝึกสัมภาษณ์งานไหม',
      a: 'ไม่เหมือนค่ะ หน้านี้ครอบคลุมภาษาอังกฤษในที่ทำงานส่วนอื่น เช่น การประชุม อีเมล คุยเล่น และการอธิบายงาน ส่วนการฝึกสัมภาษณ์งานโดยเฉพาะ (เช่น "Tell me about yourself" จุดแข็งจุดอ่อน และคำถามคล้ายกัน) มีหน้าแยกที่ /practice/interview-english'
    }
  ]
};

export default function BusinessEnglishPage({ navigateTo, lang = 'en' }) {
  const enUrl = `${SITE_URL}/practice/business-english`;
  const thUrl = `${SITE_URL}/th/practice/business-english`;
  const pageUrl = lang === 'th' ? thUrl : enUrl;
  const t = TEXT[lang];

  const faqJsonLd = useMemo(() => buildTopicFaqJsonLd(FAQ[lang]), [lang]);
  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'ฝึกภาษาอังกฤษเพื่อการทำงาน' : 'Business English Practice', pageUrl, lang),
    [lang, pageUrl]
  );

  useSeo({
    title: lang === 'th'
      ? 'ฝึกพูดภาษาอังกฤษเพื่อการทำงาน | LEXIS'
      : 'Practice Business English Out Loud | LEXIS',
    description: lang === 'th'
      ? `ฝึกพูดภาษาอังกฤษในที่ทำงานออกเสียงจริง การประชุม อีเมล และคุยเล่นกับเพื่อนร่วมงาน พร้อมคำแนะนำแบบเรียลไทม์อย่างอ่อนโยน ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร`
      : `Practice workplace English out loud: meetings, emails and small talk, with gentle real-time corrections. Free ${TRIAL.minutes}-min trial, no card.`,
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
              <Briefcase className="w-4 h-4 text-teal-600" aria-hidden="true" />
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
