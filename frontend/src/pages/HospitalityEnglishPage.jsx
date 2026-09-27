// frontend/src/pages/HospitalityEnglishPage.jsx
//
// Fifth "practice/" page, added 27 Sep 2026 together with the app's
// Hotel & Hospitality topic (TOPIC_CURRICULA.hospitality in
// backend/app.mjs, the card in TopicStage.jsx). The rule these pages follow
// (EverydayEnglishPage.jsx's header) is one honest page per topic the app
// really has, so the topic shipped first and this page describes it.
//
// Who it is for: Thailand's hotel, restaurant and tourism staff, who speak
// English with foreign guests every working day and whom the Travel page
// (the guest's side) does not serve. LEXIS plays the guest; the student
// practises the staff lines. PRACTICE_PROMPTS are staff-side sentences and
// stay in English on both language versions, like the other practice
// pages: they are what the student says, not page chrome.
import React, { useMemo } from 'react';
import { ArrowLeft, Mic, ConciergeBell, TrendingUp, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';
import AppLink from '../components/AppLink';

const PRACTICE_PROMPTS = [
  '"Good afternoon, welcome. May I see your passport, please?"',
  '"Your room is on the fifth floor. Breakfast is from six-thirty to ten."',
  '"Are you ready to order, or would you like a few more minutes?"',
  '"I\'m so sorry about that. Let me sort it out for you right away."',
  '"The night market is about ten minutes away. Shall I call you a taxi?"'
];

const TEXT = {
  en: {
    home: 'Home',
    h1: 'Practice hotel and hospitality English, out loud.',
    intro: "At the front desk, the restaurant table or the tour counter, the English comes fast, from a guest you have never met, with a question you didn't expect. LEXIS lets you rehearse your side of that conversation first: she plays the guest, you play the staff, and she corrects you gently as you go.",
    why: 'Why spoken practice, specifically',
    whyBody: "Knowing the phrases for a check-in is not the hard part. The hard part is understanding a guest's accent, a request you didn't plan for, or a complaint, and answering politely on the spot. In the Hotel & Hospitality topic LEXIS takes the guest's role, so what you practise is the listening and the reply, in real time, the way the job actually happens.",
    kind: "The kind of conversation you'll practice",
    kindBody: 'Everyday moments of hotel, restaurant and tourism work, with you on the staff side:',
    after: 'What you get after each session',
    afterBody: "A plain-language summary of what you did well and what to work on next, grounded in what you actually said, not a generic score. Practice again as many times as you want — there's no limit on repeat sessions, only the practice time your pass carries.",
    cta: 'Start practicing free',
    trialNote: (minutes) => `Free ${minutes}-minute trial. No card required.`,
    footerPricing: 'View pricing'
  },
  th: {
    home: 'หน้าแรก',
    h1: 'ฝึกพูดภาษาอังกฤษสำหรับงานโรงแรมและบริการ',
    intro: 'ที่เคาน์เตอร์ต้อนรับ ที่โต๊ะอาหาร หรือที่เคาน์เตอร์ทัวร์ ภาษาอังกฤษมาเร็ว จากแขกที่ไม่เคยเจอ กับคำถามที่ไม่ได้เตรียมไว้ LEXIS ให้คุณซ้อมบทของคุณก่อน เธอรับบทเป็นแขก คุณรับบทเป็นพนักงาน และเธอช่วยแก้ให้อย่างอ่อนโยนระหว่างคุย',
    why: 'ทำไมต้องฝึกพูดโดยเฉพาะ',
    whyBody: 'การรู้ประโยคสำหรับเช็คอินไม่ใช่ส่วนที่ยาก ส่วนที่ยากคือการฟังสำเนียงของแขก คำขอที่ไม่ได้คาดไว้ หรือคำร้องเรียน แล้วตอบอย่างสุภาพได้ทันที ในหัวข้อ Hotel & Hospitality LEXIS รับบทเป็นแขก สิ่งที่คุณได้ฝึกจึงเป็นการฟังและการตอบแบบเรียลไทม์ เหมือนตอนทำงานจริง',
    kind: 'บทสนทนาแบบที่จะได้ฝึก',
    kindBody: 'สถานการณ์ในงานโรงแรม ร้านอาหาร และการท่องเที่ยวที่เจอทุกวัน โดยคุณเป็นฝั่งพนักงาน:',
    after: 'สิ่งที่ได้หลังจบแต่ละเซสชัน',
    afterBody: 'สรุปผลแบบเข้าใจง่ายว่าทำได้ดีตรงไหนและควรฝึกอะไรต่อ อ้างอิงจากสิ่งที่คุณพูดจริง ไม่ใช่คะแนนทั่วไป ฝึกซ้ำได้ไม่จำกัดจำนวนครั้ง จำกัดเพียงเวลาฝึกที่แพ็กเกจของคุณมี',
    cta: 'เริ่มฝึกฟรี',
    trialNote: (minutes) => `ทดลองใช้ฟรี ${minutes} นาที ไม่ต้องผูกบัตร`,
    footerPricing: 'ดูราคา'
  }
};

const FAQ = {
  en: [
    {
      q: 'What can I practice on this page?',
      a: 'English for hotel, restaurant and tourism work: welcoming and checking in guests, taking orders, handling requests and complaints politely, and giving recommendations and directions, the same "Hotel & Hospitality" topic available in the app, where LEXIS plays the guest.'
    },
    {
      q: 'Is hospitality English practice free?',
      a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for hospitality practice or any other topic.`
    },
    {
      q: 'Can I practise with a guest who is difficult or has a complaint?',
      a: 'Yes. Complaints and awkward requests are part of the topic, and you can simply ask LEXIS to play an unhappy guest so you can practise staying calm and polite in English.'
    }
  ],
  th: [
    {
      q: 'ฝึกอะไรได้บ้างในหน้านี้',
      a: 'ภาษาอังกฤษสำหรับงานโรงแรม ร้านอาหาร และการท่องเที่ยว เช่น ต้อนรับและเช็คอินแขก รับออเดอร์ รับมือคำขอและคำร้องเรียนอย่างสุภาพ และแนะนำสถานที่หรือบอกทาง หัวข้อเดียวกับ "Hotel & Hospitality" ในแอป ซึ่ง LEXIS รับบทเป็นแขก'
    },
    {
      q: 'ฝึกภาษาอังกฤษสำหรับงานบริการฟรีไหม',
      a: `ฟรีค่ะ ผู้ใช้ใหม่ทุกคนได้ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร ใช้ฝึกงานบริการหรือหัวข้ออื่นก็ได้`
    },
    {
      q: 'ฝึกรับมือแขกที่ไม่พอใจหรือมีคำร้องเรียนได้ไหม',
      a: 'ได้ค่ะ คำร้องเรียนและคำขอที่ยุ่งยากเป็นส่วนหนึ่งของหัวข้อนี้ และคุณบอกให้ LEXIS รับบทเป็นแขกที่ไม่พอใจได้เลย เพื่อฝึกตอบอย่างใจเย็นและสุภาพเป็นภาษาอังกฤษ'
    }
  ]
};

export default function HospitalityEnglishPage({ navigateTo, lang = 'en' }) {
  const enUrl = `${SITE_URL}/practice/hospitality-english`;
  const thUrl = `${SITE_URL}/th/practice/hospitality-english`;
  const pageUrl = lang === 'th' ? thUrl : enUrl;
  const t = TEXT[lang];

  const faqJsonLd = useMemo(() => buildTopicFaqJsonLd(FAQ[lang]), [lang]);
  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'ฝึกภาษาอังกฤษสำหรับงานโรงแรมและบริการ' : 'Hospitality English Practice', pageUrl, lang),
    [lang, pageUrl]
  );

  useSeo({
    title: lang === 'th'
      ? 'ฝึกพูดภาษาอังกฤษสำหรับงานโรงแรมและร้านอาหาร | LEXIS'
      : 'Practice Hotel & Hospitality English Out Loud | LEXIS',
    description: lang === 'th'
      ? `ฝึกพูดภาษาอังกฤษสำหรับงานโรงแรม ร้านอาหาร และท่องเที่ยว ต้อนรับแขก เช็คอิน รับออเดอร์ และรับมือคำขอ โดย LEXIS รับบทเป็นแขก ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร`
      : `Practice hotel and hospitality English out loud: check-ins, taking orders, guest requests and complaints, with LEXIS playing the guest. Free ${TRIAL.minutes}-minute trial, no card required.`,
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
          to={lang === 'th' ? '/th' : '/'} navigateTo={navigateTo} className="flex items-center space-x-2 text-sm text-lexis-ink/70 hover:text-lexis-ink transition-colors"
          >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t.home}</span>
        </AppLink>
        <div className="flex items-center space-x-3">
          <LexisMark className="w-9 h-9" />
          <span className="text-lg font-display font-semibold text-lexis-ink">LEXIS</span>
        </div>
        <AppLink
          to={lang === 'en' ? thUrl.replace(SITE_URL, '') : enUrl.replace(SITE_URL, '')} navigateTo={navigateTo} aria-label={lang === 'en' ? 'Switch page language to Thai' : 'Switch page language to English'}
          className="flex items-center gap-1 text-xs text-lexis-ink/70 hover:text-lexis-ink transition-colors min-h-[44px] px-1"
          >
          <Globe className="w-4 h-4 text-teal-700" aria-hidden="true" />
          <span>{lang === 'en' ? 'ไทย' : 'EN'}</span>
        </AppLink>
      </header>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-3xl md:text-4xl mb-3 text-lexis-ink leading-tight">
          {t.h1}
        </h1>
        <p className="text-sm md:text-base text-lexis-ink/75 mb-10 leading-relaxed">
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
              <ConciergeBell className="w-4 h-4 text-teal-600" aria-hidden="true" />
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
          <p className="mt-3 text-xs text-lexis-ink/70">
            {t.trialNote(TRIAL.minutes)}
          </p>
        </div>
      </section>

      <footer className="w-full max-w-3xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/65">
        <div>© 2026 LEXIS</div>
        <AppLink to={lang === 'th' ? '/th/pricing' : '/pricing'} navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">
          {t.footerPricing}
        </AppLink>
      </footer>
    </div>
  );
}
