// frontend/src/pages/EverydayEnglishPage.jsx
//
// Second of the "practice/" long-tail pages, added 21 Aug 2026 alongside
// TravelEnglishPage.jsx and BusinessEnglishPage.jsx (Digital Renaissance
// re-audit, L10: "8-10 more topic pages"). The audit's number doesn't
// match what the product actually differentiates: TopicStage.jsx offers
// exactly three selectable topics ('everyday', 'work', 'travel', each
// steering backend/app.mjs's buildTutorInstructions via TOPIC_CURRICULA),
// plus interview-english already carved out of 'work'. Splitting each
// curriculum's five-item bullet list into its own thin page (a page for
// "ordering food," a separate page for "asking directions," etc.) would
// be duplicate/thin content competing with itself, not real long-tail
// value — so this ships one honest hub page per real topic instead of
// stretching to a number the product doesn't support without inventing
// content. See PARTNER-CODES.md/InterviewEnglishPage.jsx's own comment
// for the same "one real page over a batch of thin ones" reasoning.
//
// TOPIC_CURRICULA.everyday in backend/app.mjs: 'everyday conversation —
// daily routine, family and friends, hobbies and interests, food,
// weather and plans'. PRACTICE_PROMPTS below are drawn directly from
// that list, not invented for this page.
//
// /th/practice/everyday-english added 22 Aug 2026, direct request ("there
// shoukd be a language toggle on each page too"): only '/' and '/pricing'
// had real Thai routes before this — every other page was English-only
// with no toggle at all. Same lang-prop/TEXT-object pattern as
// LandingPage.jsx/PricingPage.jsx (Stage 4), not a client-side toggle —
// real, indexable, separately-canonical URLs per language. The quoted
// PRACTICE_PROMPTS stay in English on both language versions
// deliberately: they're the literal English sentences a student will
// hear and practice saying, not page chrome to translate.
import React, { useMemo } from 'react';
import { ArrowLeft, Mic, MessageCircle, TrendingUp, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildTopicFaqJsonLd } from '../data/structuredData';
import { TRIAL } from '../content/facts';
import AppLink from '../components/AppLink';

const PRACTICE_PROMPTS = [
  '"Tell me about your day so far."',
  '"What do you usually do on the weekend?"',
  '"Tell me about someone close to you."',
  '"What\'s a hobby you enjoy, and how did you get into it?"',
  '"What\'s the weather like where you are today?"'
];

const TEXT = {
  en: {
    home: 'Home',
    h1: 'Practice everyday English, out loud.',
    intro: "Most spoken English you'll actually use isn't a job interview or a big presentation, it's the ordinary stuff: catching up with someone, describing your day, talking about what you like. LEXIS gives you real practice at exactly that: a real spoken exchange, gentle correction, at whatever pace you're actually at.",
    why: 'Why spoken practice, specifically',
    whyBody: "Everyday conversation moves fast and doesn't wait for you to think of the perfect sentence. LEXIS's Everyday Talk topic is built around that: you talk, LEXIS replies out loud in real time and corrects grammar or word choice gently mid conversation, the same way a patient friend would.",
    kind: "The kind of conversation you'll practice",
    kindBody: 'Real everyday topics, the ones that come up constantly regardless of where you are:',
    after: 'What you get after each session',
    afterBody: "A plain-language summary of what you did well and what to work on next, grounded in what you actually said, not a generic score. Practice again as many times as you want; there's no limit on repeat sessions.",
    cta: 'Start practicing free',
    trialNote: (minutes) => `Free ${minutes}-minute trial. No card required.`,
    footerPricing: 'View pricing'
  },
  th: {
    home: 'หน้าแรก',
    h1: 'ฝึกพูดภาษาอังกฤษในชีวิตประจำวัน',
    intro: 'ภาษาอังกฤษที่คุณใช้จริงส่วนใหญ่ไม่ใช่การสัมภาษณ์งานหรือการพรีเซนต์ใหญ่ ๆ แต่เป็นเรื่องธรรมดา ๆ เช่น คุยไถ่ถามสารทุกข์สุกดิบ เล่าว่าวันนี้ทำอะไรมา พูดถึงสิ่งที่ชอบ LEXIS ให้คุณฝึกพูดจริงกับเรื่องแบบนี้เลย บทสนทนาจริง แก้ไขให้อย่างอ่อนโยน ตามจังหวะที่คุณเป็นจริง ๆ',
    why: 'ทำไมต้องฝึกพูดโดยเฉพาะ',
    whyBody: 'บทสนทนาในชีวิตประจำวันดำเนินไปเร็ว ไม่รอให้คุณคิดประโยคที่สมบูรณ์แบบ หัวข้อ Everyday Talk ของ LEXIS สร้างมาเพื่อสิ่งนี้โดยเฉพาะ คุณพูด LEXIS ตอบกลับด้วยเสียงจริงแบบเรียลไทม์ และช่วยแก้ไขไวยากรณ์หรือคำศัพท์อย่างอ่อนโยนระหว่างสนทนา เหมือนเพื่อนใจเย็นคนหนึ่ง',
    kind: 'บทสนทนาแบบที่จะได้ฝึก',
    kindBody: 'หัวข้อในชีวิตประจำวันจริง ๆ ที่เจอบ่อยไม่ว่าจะอยู่ที่ไหน:',
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
      a: 'Real everyday conversation: daily routine, family and friends, hobbies and interests, food, and weather and plans, the same "Everyday Talk" topic available in the app itself.'
    },
    {
      q: 'Is everyday conversation practice free?',
      a: `Yes. LEXIS gives every new user a free ${TRIAL.minutes} minute trial with no card required, which you can use for everyday conversation practice or any other topic.`
    },
    {
      q: 'Do I need to already speak well to start?',
      a: "No. LEXIS meets you at whatever level you're at, from single words and short phrases up to full natural conversation, and adjusts as you go."
    }
  ],
  th: [
    {
      q: 'ฝึกอะไรได้บ้างในหน้านี้',
      a: 'บทสนทนาในชีวิตประจำวันจริง ๆ เช่น กิจวัตรประจำวัน ครอบครัวและเพื่อน งานอดิเรกและความสนใจ อาหาร และสภาพอากาศกับแผนการ หัวข้อเดียวกับ "Everyday Talk" ที่มีในแอปจริง'
    },
    {
      q: 'ฝึกบทสนทนาในชีวิตประจำวันฟรีไหม',
      a: `ฟรีค่ะ ผู้ใช้ใหม่ทุกคนได้ทดลองใช้ฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร ใช้ฝึกบทสนทนาในชีวิตประจำวันหรือหัวข้ออื่นก็ได้`
    },
    {
      q: 'ต้องพูดเก่งอยู่แล้วก่อนเริ่มไหม',
      a: 'ไม่จำเป็นค่ะ LEXIS ปรับให้เข้ากับระดับของคุณ ตั้งแต่คำเดี่ยวหรือวลีสั้น ๆ ไปจนถึงบทสนทนาเต็มรูปแบบ และปรับไปเรื่อย ๆ ตามที่คุณฝึก'
    }
  ]
};

export default function EverydayEnglishPage({ navigateTo, lang = 'en' }) {
  const enUrl = `${SITE_URL}/practice/everyday-english`;
  const thUrl = `${SITE_URL}/th/practice/everyday-english`;
  const pageUrl = lang === 'th' ? thUrl : enUrl;
  const t = TEXT[lang];

  const faqJsonLd = useMemo(() => buildTopicFaqJsonLd(FAQ[lang]), [lang]);
  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'ฝึกภาษาอังกฤษในชีวิตประจำวัน' : 'Everyday English Practice', pageUrl, lang),
    [lang, pageUrl]
  );

  useSeo({
    title: lang === 'th'
      ? 'ฝึกพูดภาษาอังกฤษในชีวิตประจำวัน | LEXIS'
      : 'Practice Everyday English Conversation Out Loud | LEXIS',
    description: lang === 'th'
      ? `ฝึกพูดภาษาอังกฤษในชีวิตประจำวันออกเสียงจริง กิจวัตร ครอบครัว งานอดิเรก และอาหาร พร้อมคำแนะนำอย่างอ่อนโยน ทดลองฟรี ${TRIAL.minutes} นาที`
      : `Practice everyday English out loud: routine, family, hobbies, food and weather, with gentle real-time corrections. Free ${TRIAL.minutes}-min trial.`,
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
              <MessageCircle className="w-4 h-4 text-teal-600" aria-hidden="true" />
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
