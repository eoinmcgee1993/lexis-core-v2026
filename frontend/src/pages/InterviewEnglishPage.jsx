// frontend/src/pages/InterviewEnglishPage.jsx
//
// First of the "practice/" pages — long-tail, search-intent-specific
// landing pages that point at the same real product and the same signup
// flow as the homepage, just angled at one concrete use case instead of
// the general pitch. This one: job-interview practice. Not a new feature
// — the 'work' curriculum topic (TopicStage.jsx / backend/app.mjs's
// TOPIC_PROMPTS.work) already explicitly includes "job interviews" today,
// so every claim here describes something the product actually does, not
// something built to justify the page. See PARTNER-CODES.md's sibling
// growth work from the same day for the reasoning behind starting with
// one real page instead of a batch of thin ones.
//
// /th/practice/interview-english added 22 Aug 2026, direct request
// ("there shoukd be a language toggle on each page too"): same lang-prop
// pattern as LandingPage.jsx/PricingPage.jsx (Stage 4) — a real,
// indexable /th route, not a client-side toggle. PRACTICE_PROMPTS stay in
// English on both language versions deliberately: they're the literal
// English sentences a student practices saying, not page chrome.
import React, { useMemo } from 'react';
import { ArrowLeft, Mic, MessageSquare, TrendingUp, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildInterviewFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';
import AppLink from '../components/AppLink';

const PRACTICE_PROMPTS = [
  '"Tell me about yourself."',
  '"What are your strengths and weaknesses?"',
  '"Why do you want to work here?"',
  '"Describe a time you solved a difficult problem."',
  '"Do you have any questions for me?"'
];

const TEXT = {
  en: {
    home: 'Home',
    h1: 'Practice interview English, out loud.',
    intro: "The hardest part of an English job interview usually isn't the vocabulary, it's answering out loud, at speed, without a script in front of you. LEXIS gives you that exact practice: real spoken questions, a real spoken answer, gentle correction on the words and grammar that got in the way.",
    why: 'Why spoken practice, specifically',
    whyBody: "Reading interview questions and typing out answers doesn't train the thing an interview actually tests: thinking and speaking at the same time, in a second language, under a little pressure. LEXIS's Work & Career topic is built around that gap. You talk, LEXIS replies out loud in real time and corrects grammar or word choice gently mid-conversation, the same way a patient interviewer's follow-up question would.",
    kind: "The kind of questions you'll practice",
    kindBody: 'Common, real interview prompts, the ones that come up regardless of industry:',
    after: 'What you get after each session',
    afterBody: "A plain-language summary of what you did well and what to work on next, grounded in what you actually said, not a generic score. Practice again as many times as you want — there's no limit on repeat sessions, only the practice time your pass carries.",
    cta: 'Start practicing free',
    trialNote: (minutes) => `Free ${minutes}-minute trial. No card required.`,
    footerPricing: 'View pricing'
  },
  th: {
    home: 'หน้าแรก',
    h1: 'ฝึกพูดภาษาอังกฤษสำหรับสัมภาษณ์งาน',
    intro: 'ส่วนที่ยากที่สุดของการสัมภาษณ์งานเป็นภาษาอังกฤษมักไม่ใช่คำศัพท์ แต่คือการตอบด้วยเสียงจริง ทันที โดยไม่มีสคริปต์ให้อ่าน LEXIS ให้คุณฝึกแบบนั้นจริง ๆ คำถามจริงเป็นเสียงพูด คำตอบจริงเป็นเสียงพูด แก้ไขคำและไวยากรณ์ที่ติดขัดอย่างอ่อนโยน',
    why: 'ทำไมต้องฝึกพูดโดยเฉพาะ',
    whyBody: 'การอ่านคำถามสัมภาษณ์แล้วพิมพ์คำตอบไม่ได้ฝึกสิ่งที่การสัมภาษณ์จริงต้องใช้ คือคิดและพูดพร้อมกัน เป็นภาษาที่สอง ภายใต้ความกดดันเล็กน้อย หัวข้อ Work & Career ของ LEXIS สร้างมาเพื่อช่องว่างนี้โดยเฉพาะ คุณพูด LEXIS ตอบกลับด้วยเสียงจริงแบบเรียลไทม์ และช่วยแก้ไขไวยากรณ์หรือคำศัพท์อย่างอ่อนโยนระหว่างสนทนา เหมือนคำถามต่อเนื่องจากผู้สัมภาษณ์ใจดี',
    kind: 'คำถามแบบที่จะได้ฝึก',
    kindBody: 'คำถามสัมภาษณ์จริงที่เจอบ่อย ไม่ว่าจะสายงานไหนก็เจอได้:',
    after: 'สิ่งที่ได้หลังจบแต่ละเซสชัน',
    afterBody: 'สรุปผลแบบเข้าใจง่ายว่าทำได้ดีตรงไหนและควรฝึกอะไรต่อ อ้างอิงจากสิ่งที่คุณพูดจริง ไม่ใช่คะแนนทั่วไป ฝึกซ้ำได้ไม่จำกัดจำนวนครั้ง จำกัดเพียงเวลาฝึกที่แพ็กเกจของคุณมี',
    cta: 'เริ่มฝึกฟรี',
    trialNote: (minutes) => `ทดลองใช้ฟรี ${minutes} นาที ไม่ต้องผูกบัตร`,
    footerPricing: 'ดูราคา'
  }
};

export default function InterviewEnglishPage({ navigateTo, lang = 'en' }) {
  const enUrl = `${SITE_URL}/practice/interview-english`;
  const thUrl = `${SITE_URL}/th/practice/interview-english`;
  const pageUrl = lang === 'th' ? thUrl : enUrl;
  const t = TEXT[lang];

  const faqJsonLd = useMemo(() => buildInterviewFaqJsonLd(lang), [lang]);
  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'ฝึกภาษาอังกฤษสัมภาษณ์งาน' : 'Interview English Practice', pageUrl, lang),
    [lang, pageUrl]
  );

  useSeo({
    title: lang === 'th'
      ? 'ฝึกพูดภาษาอังกฤษสัมภาษณ์งาน | LEXIS'
      : 'Practice English for Job Interviews Out Loud | LEXIS',
    description: lang === 'th'
      ? `ฝึกตอบคำถามสัมภาษณ์งานจริงด้วยเสียงพูดภาษาอังกฤษ พร้อมคำแนะนำแบบเรียลไทม์อย่างอ่อนโยน ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร`
      : `Practice answering real interview questions out loud in English, with gentle real-time corrections. Free ${TRIAL.minutes}-minute trial, no card required.`,
    canonical: pageUrl,
    htmlLang: lang,
    hreflang: [
      { hrefLang: 'en', href: enUrl },
      { hrefLang: 'th', href: thUrl },
      { hrefLang: 'x-default', href: enUrl }
    ],
    jsonLd: { 'jsonld-faq': faqJsonLd, 'jsonld-breadcrumb': breadcrumbJsonLd }
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
              <MessageSquare className="w-4 h-4 text-teal-600" aria-hidden="true" />
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
