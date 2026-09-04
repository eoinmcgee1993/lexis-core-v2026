import React, { useMemo, useState } from 'react';
import { Mic, ShieldCheck, Zap, Globe, ArrowRight, ChevronDown, MessageCircle, TrendingUp, Heart, Gauge } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import WaveRule from '../components/WaveRule';
import HeroLiveDemo from '../components/HeroLiveDemo';
import { buildFaqJsonLd, SITE_URL } from '../data/structuredData';
import { useSeo } from '../lib/useSeo';
import { FAQS, LANDING_DESCRIPTION_EN, LANDING_DESCRIPTION_TH, PRICING_TEASER_EN, PRICING_TEASER_TH } from '../content/facts';
import AppLink from '../components/AppLink';

// Same key LexisApp.jsx reads on session start ('en' = practicing English,
// 'th' = practicing Thai). Setting it here before navigating to /app means
// the direction picked on the landing page is what the first session
// actually uses, without needing a query param or extra plumbing.
const TARGET_LANGUAGE_STORAGE_KEY = 'lexis_target_language';


// Keyed by display language (Stage 4: /th is a real page now, not just a
// client-side toggle) rather than one hardcoded English array.
const HOW_IT_WORKS = {
  en: [
    { icon: Mic, title: 'Start talking', desc: 'Tap one button and start speaking: no typing, no scripts to read from.' },
    { icon: MessageCircle, title: 'LEXIS responds live', desc: "She listens, replies, and corrects you gently mid-conversation, the way a patient tutor would." },
    { icon: TrendingUp, title: 'See what to work on', desc: 'After each session, get a plain-language summary of what you did well and what to practice next.' }
  ],
  th: [
    { icon: Mic, title: 'เริ่มพูด', desc: 'แตะปุ่มเดียวแล้วเริ่มพูดได้เลย ไม่ต้องพิมพ์ ไม่ต้องท่องสคริปต์' },
    { icon: MessageCircle, title: 'LEXIS ตอบกลับสด ๆ', desc: 'ฟัง ตอบกลับ และช่วยแก้ไขให้อย่างอ่อนโยนระหว่างสนทนา เหมือนติวเตอร์ใจเย็น' },
    { icon: TrendingUp, title: 'ดูว่าควรฝึกอะไรต่อ', desc: 'หลังจบแต่ละเซสชัน จะได้สรุปผลแบบเข้าใจง่ายว่าทำได้ดีตรงไหน และควรฝึกอะไรต่อ' }
  ]
};

// Sitewide chrome strings (header, badge, section headings, trust strip,
// footer) that aren't part of the direction/display content matrix above
// — these don't depend on which language a visitor is learning, only on
// which language the page itself is displayed in.
const CHROME = {
  en: {
    pricing: 'Pricing',
    getStarted: 'Get Started',
    heroBadge: 'Talk in real time: no awkward pauses, no typing',
    howItWorks: 'How it works',
    trust: [
      'Gentle, real-time grammar correction',
      'Jump in and interrupt LEXIS anytime',
      'Review what you practiced, anytime (paid plans)',
      'No waiting, no scheduling: practice the moment you want to'
    ],
    meetHeading: 'Meet LEXIS',
    meetTitle: 'Real-time voice, built to perform.',
    meetBody: "LEXIS isn't a script or a chatbot with a microphone bolted on. The moment you stop talking, she's already replying, no lag, no waiting your turn. She listens in both English and Thai, adjusts automatically to your level, and corrects you gently mid-conversation, the way a sharp, patient tutor would. Built first for Thailand's English and Thai learners, the same real-time engine works for anyone, anywhere, learning either language out loud.",
    meetSpecs: ['Live, real-time voice', 'Bilingual, both directions', 'Adjusts to your level automatically', 'Available any hour, no booking'],
    communityHeading: 'More than practice for yourself',
    communityBody: "At checkout, you can add a small amount to your plan to help fund free and discounted access for students and youth groups who couldn't otherwise afford it. Learn a language, and help open the same door for someone else.",
    communityCta: 'See how LEXIS Community works',
    faqHeading: 'Frequently asked questions',
    learnEnglish: 'Learn English',
    learnThai: 'Learn Thai',
    heroDemoCaption: 'What a real LEXIS session looks like',
    footerTrust: 'Private & secure • Payments handled by Stripe',
    privacy: 'Privacy',
    terms: 'Terms',
    refunds: 'Refunds',
    community: 'Community'
  },
  th: {
    pricing: 'ราคา',
    getStarted: 'เริ่มเลย',
    heroBadge: 'พูดคุยแบบเรียลไทม์ ไม่ต้องพิมพ์ ไม่ต้องรอ',
    howItWorks: 'วิธีใช้งาน',
    trust: [
      'แก้ไขไวยากรณ์แบบเรียลไทม์อย่างอ่อนโยน',
      'พูดแทรก LEXIS ได้ทุกเมื่อ',
      'ทบทวนสิ่งที่ฝึกได้ทุกเมื่อ (แพ็กเกจแบบเสียเงิน)',
      'ไม่ต้องรอ ไม่ต้องนัดเวลา ฝึกได้ทันทีที่อยากฝึก'
    ],
    meetHeading: 'รู้จัก LEXIS',
    meetTitle: 'เสียงสนทนาแบบเรียลไทม์ สมรรถนะเต็มพิกัด',
    meetBody: 'LEXIS ไม่ใช่สคริปต์หรือแชทบอทที่แปะไมโครโฟนไว้ ทันทีที่คุณพูดจบ เธอตอบกลับทันที ไม่มีอาการหน่วง ไม่ต้องรอคิว เธอฟังได้ทั้งภาษาอังกฤษและภาษาไทย ปรับให้เข้ากับระดับของคุณโดยอัตโนมัติ และช่วยแก้ไขให้อย่างอ่อนโยนระหว่างสนทนา เหมือนติวเตอร์ที่เก่งและใจเย็น สร้างขึ้นมาเพื่อผู้เรียนภาษาอังกฤษและภาษาไทยในไทยเป็นกลุ่มแรก แต่เครื่องยนต์เรียลไทม์ตัวเดียวกันนี้ใช้ได้กับทุกคน ทุกที่ ที่อยากฝึกพูดออกเสียงจริง',
    meetSpecs: ['เสียงสนทนาแบบเรียลไทม์', 'สองภาษา ฝึกได้ทั้งสองทิศทาง', 'ปรับระดับให้อัตโนมัติ', 'ใช้ได้ทุกเวลา ไม่ต้องจอง'],
    communityHeading: 'มากกว่าการฝึกเพื่อตัวเอง',
    communityBody: 'ตอนชำระเงิน คุณสามารถเพิ่มจำนวนเงินเล็กน้อยเข้าไปในแพ็กเกจ เพื่อช่วยสนับสนุนการเข้าถึงแบบฟรีและส่วนลดให้นักเรียนและกลุ่มเยาวชนที่ไม่สามารถจ่ายได้ด้วยตัวเอง ฝึกภาษาของคุณ พร้อมช่วยเปิดโอกาสเดียวกันนี้ให้คนอื่นด้วย',
    communityCta: 'ดูว่า LEXIS Community ทำงานอย่างไร',
    faqHeading: 'คำถามที่พบบ่อย',
    learnEnglish: 'เรียนภาษาอังกฤษ',
    learnThai: 'เรียนภาษาไทย',
    heroDemoCaption: 'ตัวอย่างบทสนทนาจริงกับ LEXIS',
    footerTrust: 'ปลอดภัยและเป็นส่วนตัว • ชำระเงินผ่าน Stripe',
    privacy: 'นโยบายความเป็นส่วนตัว',
    terms: 'ข้อกำหนดการใช้งาน',
    refunds: 'การคืนเงิน',
    community: 'Community'
  }
};

export default function LandingPage({ navigateTo, lang = 'en' }) {
  // Display language is now which route you're on ('/' = en, '/th' = th —
  // Stage 4), not local component state — a crawler or a visitor who
  // shares a link needs a real, indexable URL per language, not a client-
  // side toggle invisible to anything that doesn't run JS. The toggle
  // button below now navigates instead of calling a setter.
  const c = CHROME[lang];
  const [direction, setDirection] = useState(() => {
    try {
      return localStorage.getItem(TARGET_LANGUAGE_STORAGE_KEY) === 'th' ? 'th' : 'en';
    } catch {
      return 'en'; // localStorage can throw in some privacy modes — default, don't crash the page.
    }
  });

  const selectDirection = (dir) => {
    setDirection(dir);
    try {
      localStorage.setItem(TARGET_LANGUAGE_STORAGE_KEY, dir);
    } catch {
      // Privacy-mode localStorage throw — the choice just won't persist across visits.
    }
  };

  const goPractice = () => {
    // Direction is already persisted by selectDirection; this just launches
    // the app with whichever direction is currently selected.
    navigateTo('/app');
  };

  // content[direction][displayLang] — direction is which language the student
  // is learning (en = English, th = Thai), displayLang is which language
  // this page's own copy is shown in. Independent axes: an English speaker
  // learning Thai and a Thai speaker learning English both toggle `lang` to
  // read the page comfortably regardless of which direction they picked.
  const content = {
    en: {
      en: {
        heroTitle: 'Practice Speaking English Out Loud with LEXIS',
        heroSub: "A real spoken conversation, not a chatbot or a course. She listens, replies instantly, and corrects you gently, live.",
        cta: 'Try It Free',
        pricingTeaser: PRICING_TEASER_EN,
        viewPricing: 'View full pricing'
      },
      th: {
        heroTitle: 'ฝึกพูดภาษาอังกฤษออกเสียงจริงกับ LEXIS',
        heroSub: 'บทสนทนาจริง ไม่ใช่แชทบอทหรือคอร์สเรียน เธอฟัง ตอบกลับทันที และช่วยแก้ไขให้อย่างอ่อนโยนแบบสด ๆ',
        cta: 'ลองใช้ฟรี',
        pricingTeaser: PRICING_TEASER_TH,
        viewPricing: 'ดูแพ็กเกจทั้งหมด'
      }
    },
    th: {
      en: {
        heroTitle: 'Practice Speaking Thai Out Loud with LEXIS',
        heroSub: "A real spoken conversation, not a chatbot or a course. She listens, replies instantly, and corrects you gently, live.",
        cta: 'Try It Free',
        pricingTeaser: PRICING_TEASER_EN,
        viewPricing: 'View full pricing'
      },
      th: {
        heroTitle: 'ฝึกพูดภาษาไทยออกเสียงจริงกับ LEXIS',
        heroSub: 'บทสนทนาจริง ไม่ใช่แชทบอทหรือคอร์สเรียน เธอฟัง ตอบกลับทันที และช่วยแก้ไขให้อย่างอ่อนโยนแบบสด ๆ',
        cta: 'ลองใช้ฟรี',
        pricingTeaser: PRICING_TEASER_TH,
        viewPricing: 'ดูแพ็กเกจทั้งหมด'
      }
    }
  };

  const t = content[direction][lang];
  const enUrl = `${SITE_URL}/`;
  const thUrl = `${SITE_URL}/th`;

  // FAQ JSON-LD now mirrors whichever language's FAQ text is actually
  // visible below (FAQS.en or FAQS.th, both real content since Stage 4) —
  // no longer gated to English only.
  const faqJsonLd = useMemo(() => buildFaqJsonLd(lang), [lang]);

  // Title order flipped 21 Aug 2026 (re-audit L9): every other page on the
  // site is already descriptive-first, brand-last ("Pricing | LEXIS",
  // "Privacy Policy | LEXIS") — the home page was the one holdout leading
  // with the brand instead. That matters most here specifically: this is
  // the page most likely to be found by an unfamiliar search/answer-engine
  // query, and both surfaces weight the first phrase in a title tag more
  // heavily. Nobody searches "LEXIS" yet; they search what LEXIS does.
  useSeo({
    title: lang === 'th' ? 'ฝึกพูดภาษาอังกฤษและภาษาไทยออกเสียงจริง | LEXIS' : 'Practice Speaking English & Thai Out Loud | LEXIS',
    description: lang === 'th' ? LANDING_DESCRIPTION_TH : LANDING_DESCRIPTION_EN,
    canonical: lang === 'th' ? thUrl : enUrl,
    htmlLang: lang,
    // Reciprocal per Google's hreflang requirement — each language version
    // lists every version including itself. x-default points at the
    // English page (the site's language-neutral fallback).
    hreflang: [
      { hrefLang: 'en', href: enUrl },
      { hrefLang: 'th', href: thUrl },
      { hrefLang: 'x-default', href: enUrl }
    ],
    jsonLd: { 'jsonld-faq': faqJsonLd }
  });

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto p-4 sm:p-6 flex items-center justify-between border-b border-lexis-ink/10 gap-2">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700 flex-shrink-0">
            <LexisMark className="w-6 h-6" />
          </div>
          <span className="text-lg sm:text-xl font-display font-semibold text-lexis-ink whitespace-nowrap">
            LEXIS
          </span>
        </div>

        {/* Four interactive elements (language, pricing, CTA) genuinely
            don't fit a 375px-wide header with full labels on everything —
            an earlier pass just hid Pricing below `sm`, which a re-audit
            correctly called out (a mobile visitor literally cannot find
            pricing). The fix here is to actually make everything fit —
            icon-only language toggle and a tighter CTA on small screens —
            rather than hide the thing that didn't fit. */}
        <div className="flex items-center gap-1.5 sm:gap-4 flex-shrink-0">
          <AppLink
            to={lang === 'en' ? '/th' : '/'} navigateTo={navigateTo} aria-label={lang === 'en' ? 'Switch page language to Thai' : 'Switch page language to English'}
            className="flex items-center justify-center sm:justify-start gap-2 bg-white border border-lexis-ink/10 rounded-xl text-xs text-lexis-ink/60 hover:border-teal-600/40 transition-all min-h-[44px] min-w-[44px] px-2.5 sm:px-3"
          >
            <Globe className="w-4 h-4 text-teal-700 flex-shrink-0" />
            <span className="hidden sm:inline">{lang === 'en' ? 'ไทย' : 'English'}</span>
          </AppLink>
          <AppLink
            to={lang === 'th' ? '/th/pricing' : '/pricing'} navigateTo={navigateTo} className="flex items-center text-xs sm:text-sm text-lexis-ink/60 hover:text-lexis-ink transition-colors min-h-[44px] px-1"
          >
            {c.pricing}
          </AppLink>
          <button
            onClick={goPractice}
            className="px-3 sm:px-5 py-2.5 bg-lexis-action hover:bg-lexis-action-dark text-lexis-navy font-semibold text-xs sm:text-sm rounded-xl transition-all lexis-lift flex items-center gap-1.5 sm:gap-2 min-h-[44px] whitespace-nowrap"
          >
            <span>{c.getStarted}</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </button>
        </div>
      </header>

      {/* Hero — split layout: copy on the left, an actual photo of LEXIS on
          the right. The previous version was copy floating alone on a flat
          background, which read as generic/faceless. A real depiction of
          who a student is talking to does more for "impressive" than any
          amount of copy polish alone would. */}
      <section className="lexis-clip-x w-full max-w-6xl mx-auto px-6 pt-14 pb-20 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>{c.heroBadge}</span>
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight mb-6 text-lexis-ink leading-tight text-balance">
            {t.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-lexis-ink/60 mb-6 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {t.heroSub}
          </p>

          {/* Which language to practice — sets the tutor persona used the
              next time a session starts. Two-way by design: English speakers
              learning Thai and Thai speakers learning English both land here. */}
          <div className="inline-flex items-center bg-white border border-lexis-ink/10 rounded-full p-1 mb-6 text-sm shadow-sm">
            <button
              onClick={() => selectDirection('en')}
              aria-pressed={direction === 'en'}
              className={`px-4 py-2 rounded-full font-semibold transition-colors min-h-[44px] ${direction === 'en' ? 'bg-teal-600 text-white' : 'text-lexis-ink/60 hover:text-lexis-ink'}`}
            >
              {c.learnEnglish}
            </button>
            <button
              onClick={() => selectDirection('th')}
              aria-pressed={direction === 'th'}
              className={`px-4 py-2 rounded-full font-semibold transition-colors min-h-[44px] ${direction === 'th' ? 'bg-teal-600 text-white' : 'text-lexis-ink/60 hover:text-lexis-ink'}`}
            >
              {c.learnThai}
            </button>
          </div>

          <div>
            <button
              onClick={goPractice}
              className="px-8 py-4 bg-lexis-action hover:bg-lexis-action-dark hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 text-lexis-navy font-display font-semibold text-lg rounded-2xl lexis-lift flex items-center space-x-3 mx-auto md:mx-0"
            >
              <Mic className="w-5 h-5" />
              <span>{t.cta}</span>
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center md:justify-start space-x-3 text-sm">
            <span className="text-lexis-ink/60">{t.pricingTeaser}</span>
            <AppLink to="/pricing" navigateTo={navigateTo} className="text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2">
              {t.viewPricing}
            </AppLink>
          </div>
        </div>

        {/* The hero is the conversation, running — interface re-audit
            recommendation 01, shipped 26 Aug 2026 after running as a
            preview on PR #80. What stood here before was a generated
            photorealistic portrait of LEXIS with a "Live voice, ready
            when you are" badge: a picture of a person who does not
            exist, standing in for a product that is entirely about the
            talking. HeroLiveDemo shows the real Live Conversation
            screen's own visual language instead, with LEXIS's actual
            synthesized voice behind a tap.

            The portrait and its responsive srcset are deleted rather
            than commented out — /marketing/lexis-tutor-hero*.{avif,webp,
            jpg} all still ship (the -og.jpg is still the social card),
            and this commit is the revert path if the demo has to come
            back out.

            Note the AI-disclosure caption question is NOT reopened here:
            it was removed from this page on 20 Aug on direct
            product-positioning instruction and stays removed. This
            change happens to reduce the surface of it — the large
            photorealistic portrait is gone, only the small in-app avatar
            remains — but that was not the reason for it, and it is still
            a live decision to make deliberately rather than by side
            effect. */}
        {/* lexis-stage puts a contained pool of light under the demo (see
            index.css). It was rendering as a small dark rectangle floating
            in the corner despite being the most persuasive thing on the
            page — the real product, running, with LEXIS's real voice one
            tap away. */}
        <div className="lexis-stage flex justify-center md:justify-end">
          <HeroLiveDemo direction={direction} caption={c.heroDemoCaption} />
        </div>

      </section>

      {/* Meet LEXIS — a technical-credibility intro ahead of the 3-step
          "How it works" breakdown, requested directly (20 Aug 2026) as a
          "high spec" introduction to LEXIS herself. Deliberately makes no
          "only/first/best in Thailand" claim — that's an unverifiable
          superlative the same way the Partner Brief and PARTNER-CODES.md
          both flag elsewhere in this codebase. Every sentence here
          describes a real, shipped capability (live voice, bilingual both
          directions, level-adaptive, no scheduling); the "nothing else
          quite like this" impression comes from specificity, not from
          asserting market uniqueness as fact. */}
      <section className="lexis-band w-full">
       {/* Asymmetric two-column: heading anchors the left, prose occupies
           the right. Unifying the container width fixed the wandering left
           edge but left a narrow measure hugging one side of a wide
           section, which is just dead space by another name. A 5/7 split
           uses the width without letting the line length run past what is
           comfortable to read. */}
       <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-12 gap-x-12 gap-y-8">
        <div className="md:col-span-5">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-5">
          <Gauge className="w-3.5 h-3.5" />
          <span>{c.meetHeading}</span>
        </div>
        {/* Measure is constrained on the TEXT, not on the section, so the
            content edge stays put while line length stays readable. That
            distinction is what the old per-section max-w-4xl/5xl/3xl was
            reaching for and getting wrong. */}
        <h2 className="font-display font-semibold text-3xl md:text-[2.75rem] leading-[1.1] text-balance text-lexis-ink">{c.meetTitle}</h2>
        </div>
        <div className="md:col-span-7 md:pt-2">
        <p className="text-base md:text-lg text-lexis-ink/70 leading-relaxed mb-8">{c.meetBody}</p>
        {/* 21 Aug 2026 (interface re-audit, "delete the cards" + "icons only
            where they carry meaning"): was four bg-white bordered chips
            each repeating the same Zap icon — the icon carried no distinct
            information four times over. A plain dot-separated row states
            the same four facts without dressing each one up as an object. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-lexis-ink/60">
          {c.meetSpecs.map((spec, i) => (
            <React.Fragment key={spec}>
              {i > 0 && <span className="text-lexis-ink/20" aria-hidden="true">•</span>}
              <span>{spec}</span>
            </React.Fragment>
          ))}
        </div>
        </div>
       </div>
      </section>

      {/* How it works — three concrete steps instead of adjective-heavy
          copy. Short, literal sentences here also read cleanly to search
          crawlers and answer engines, not just human visitors.

          21 Aug 2026 (interface re-audit, "delete the cards"): was three
          bg-white bordered boxes, each giving a four-word step the same
          visual weight as a full sentence. Large display numerals now
          carry the hierarchy instead of a box — nothing bounds the
          content, so the sequence itself (1, 2, 3) is what a visitor's
          eye follows down the page. */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="flex items-center gap-6 mb-12 md:mb-16">
          <h2 className="font-display font-semibold text-2xl md:text-3xl flex-shrink-0">{c.howItWorks}</h2>
          <WaveRule className="flex-1 min-w-0" />
        </div>
        {/* The numerals carry the hierarchy (the re-audit's call, kept),
            but at a size that can actually hold it, over a rule that makes
            the three read as one sequence rather than three orphans. Still
            no box per step. */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 lg:gap-12">
          {HOW_IT_WORKS[lang].map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="relative sm:pt-8">
              <div
                className="hidden sm:block absolute top-0 left-0 right-0 h-px bg-lexis-ink/10"
                aria-hidden="true"
              />
              <div className="flex items-baseline gap-3 mb-4">
                <span className="font-display font-semibold text-5xl md:text-6xl text-lexis-action-dark leading-none tabular-nums">
                  {i + 1}
                </span>
                <Icon className="w-5 h-5 text-teal-700 self-center" />
              </div>
              <div className="font-display font-semibold text-lg text-lexis-ink mb-2">{title}</div>
              <div className="text-sm md:text-base text-lexis-ink/65 leading-relaxed max-w-xs">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip — four short bullets, not three. The fourth
          ("No waiting, no scheduling...") is where "How is this different
          from a language exchange app?" moved to when the FAQ list below
          got trimmed (19 Aug 2026) — a punchy differentiator fits a bullet
          better than a whole FAQ block, and this is the section that
          already exists for exactly this kind of claim.

          21 Aug 2026 (interface re-audit, "delete the cards"): was four
          bg-white bordered boxes, each carrying a Check/Repeat/Check/Zap
          icon that illustrated nothing (two identical checkmarks next to
          two unrelated claims). A hairline-ruled row states the same four
          facts as text, at equal weight, without borrowed "trust badge"
          iconography standing in for actual trust signals. */}
      {/* Still four plain facts at equal weight with no borrowed trust-badge
          iconography — the re-audit's decision. What changed is only the
          density: a 4-column hairline table at text-xs read as a spec sheet
          footnote. Same text, given the room to be read. */}
      <section className="lexis-band w-full">
        <div className="max-w-6xl mx-auto px-6 py-14 md:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-8">
            {c.trust.map((claim) => (
              <div key={claim} className="flex items-start gap-3">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-teal-600/70 flex-shrink-0" aria-hidden="true" />
                <span className="text-sm text-lexis-ink/70 leading-relaxed">{claim}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LEXIS Community teaser — the real, honest version of this lives at
          /community (CommunityPage.jsx); this is a short pointer to it, not
          a re-statement. Deliberately doesn't claim partner schools or
          impact numbers that don't exist yet (see CommunityPage.jsx's own
          header comment) — only the pay-it-forward checkout add-on, which
          is actually live today. */}
      {/* Was a full-width strip with no background, a text-xl heading and
          body at 60% opacity, sitting directly above the much larger FAQ
          heading — so the eye skipped it entirely and it read as a caption
          rather than a section. Given a tinted card, a heading that holds
          its own, and body copy at readable contrast. */}
      <section className="w-full max-w-6xl mx-auto px-6 py-20 md:py-24">
        <div className="rounded-3xl border border-teal-600/20 bg-teal-600/[0.06] p-8 md:p-12 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 text-center md:text-left lexis-lift-soft">
          <span className="flex-shrink-0 w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center">
            <Heart className="w-5 h-5 text-teal-600" />
          </span>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-lexis-ink">{c.communityHeading}</h2>
            <p className="mt-3 text-sm md:text-base text-lexis-ink/75 leading-relaxed max-w-xl">{c.communityBody}</p>
          </div>
          <AppLink
            to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo} className="flex-shrink-0 text-teal-700 hover:text-teal-800 font-semibold text-sm underline underline-offset-2 whitespace-nowrap md:mt-1"
          >
            {c.communityCta}
          </AppLink>
        </div>
      </section>

      {/* FAQ — plain question/answer pairs, marked up with <details>/<summary>
          (real semantic HTML, not just styled divs) and mirrored as
          FAQPage JSON-LD in index.html. This is squarely aimed at answer
          engines (ChatGPT search, Perplexity, Google's AI overviews) as
          much as human visitors — clear, self-contained Q&A is exactly
          the shape those tools quote from. */}
      <section className="w-full max-w-6xl mx-auto px-6 pb-20 md:pb-28">
        <div className="grid md:grid-cols-12 gap-x-12 gap-y-8">
        <div className="md:col-span-4">
          <h2 className="font-display font-semibold text-2xl md:text-3xl text-balance">{c.faqHeading}</h2>
          <WaveRule className="mt-5 max-w-[220px]" />
        </div>
        <div className="md:col-span-8">
        {/* 21 Aug 2026 (interface re-audit, "delete the cards"): was one
            bg-white bordered box per question. <details>/<summary> markup
            is unchanged (still real semantic HTML, still mirrored as
            FAQPage JSON-LD) — only the visual container is gone, replaced
            by hairline rules between rows, plain-list style. */}
        {/* <details>/<summary> markup unchanged — still real semantic HTML,
            still mirrored as FAQPage JSON-LD. The row just behaves like
            something you can press now: a hover tint, and a chevron that
            rotates to point down when open rather than a right-arrow that
            reads as "go somewhere else". */}
        <div className="divide-y divide-lexis-ink/10 border-t border-b border-lexis-ink/10">
          {FAQS[lang].map(({ q, a }) => (
            <details key={q} className="group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-base text-lexis-ink py-5 px-2 -mx-2 rounded-lg hover:bg-lexis-ink/[0.03] transition-colors">
                <span>{q}</span>
                <ChevronDown className="w-4 h-4 text-lexis-ink/35 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="pb-5 px-2 -mx-2 -mt-1 text-sm md:text-base text-lexis-ink/65 leading-relaxed max-w-2xl">{a}</p>
            </details>
          ))}
        </div>
        </div>
        </div>
      </section>

      {/* Footer — the "Private & secure" claim used to have nothing
          behind it (flagged in a re-audit: U6). Now links to the actual
          Privacy Policy that explains what that claim means. */}
      <footer className="lexis-band w-full">
       <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-lexis-ink/60">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{c.footerTrust}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Community now has a real /th route too (22 Aug 2026) — link
              destination follows lang like every other nav link on this
              page. Terms/Privacy/Refund are still English-only (legal
              text held for a separate translation pass — see those
              pages' own scope notes), so those three still point at
              their single English URL regardless of display language. */}
          <AppLink to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{c.community}</AppLink>
          <AppLink to="/privacy" navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{c.privacy}</AppLink>
          <AppLink to="/terms" navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{c.terms}</AppLink>
          <AppLink to="/refund" navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{c.refunds}</AppLink>
          <span>© 2026 LEXIS</span>
        </div>
       </div>
      </footer>
    </div>
  );
}
