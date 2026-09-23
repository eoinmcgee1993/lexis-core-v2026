import React, { useMemo, useRef, useState } from 'react';
import { Mic, ShieldCheck, Zap, Globe, ArrowRight, ChevronDown, MessageCircle, TrendingUp, Gauge, Play } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import WaveRule from '../components/WaveRule';
import HeroLiveDemo from '../components/HeroLiveDemo';
import HeroVideo from '../components/HeroVideo';
import { buildFaqJsonLd, SITE_URL } from '../data/structuredData';
import { useSeo } from '../lib/useSeo';
import { FAQS, LANDING_DESCRIPTION_EN, LANDING_DESCRIPTION_TH, PRICING_TEASER_EN, PRICING_TEASER_TH, SPONSOR_ADDON_THB } from '../content/facts';
import AppLink from '../components/AppLink';
import { useRevealOnScroll } from '../lib/useRevealOnScroll';

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
    communityBadge: 'LEXIS Community',
    communityHeading: "Your practice can open someone else's door.",
    communityBody: `LEXIS Community is our pay-it-forward fund. Add ฿${SPONSOR_ADDON_THB} to any pass at checkout and it goes into one shared pool that will fund free and discounted speaking practice for Thai students who couldn't otherwise afford it.`,
    communityGoal: "Our first goal: 100 sponsors. We're not there yet, and every add-on gets us closer.",
    communityCta: 'Watch LEXIS explain it',
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
    communityBadge: 'LEXIS Community',
    communityHeading: 'การฝึกของคุณเปิดประตูให้คนอื่นได้',
    communityBody: `LEXIS Community คือกองทุนส่งต่อโอกาสของเรา เพิ่ม ฿${SPONSOR_ADDON_THB} ตอนชำระเงินค่าแพ็กเกจใดก็ได้ เงินจะเข้ากองทุนเดียวกัน เพื่อสนับสนุนการฝึกพูดฟรีและลดราคาสำหรับนักเรียนไทยที่ไม่มีโอกาสเข้าถึง`,
    communityGoal: 'เป้าหมายแรกของเรา: ผู้สนับสนุน 100 คน ตอนนี้ยังไปไม่ถึง แต่ทุกการสนับสนุนช่วยให้ใกล้ขึ้น',
    communityCta: 'ดู LEXIS อธิบาย',
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
  //
  // Hero, second pass (23 Sep 2026, owner feedback on the first). The
  // first leads were "without the fear of being judged" and "No app to
  // install". The owner asked for the fear framing to go and for the page
  // to hype LEXIS herself and make starting feel exciting; and "no app" was
  // wrong for a product whose plan is to be an app-store app. So the H1
  // introduces her, and the sub gives her a personality and three concrete
  // things to do with her, each a real topic in TopicStage.jsx.
  //
  // Still held to the copy rule: the experience, never a result. "Warm,
  // quick and endlessly patient" is her character, not an outcome promise.
  // "AI tutor" stays in words, now directly beside a photorealistic video of
  // her talking (HeroVideo.jsx) — the one place it matters most.
  //
  // Rejected from a pasted conversion draft earlier the same day, and must
  // not come back through a later one:
  //   - "join thousands of learners": false; the site makes no usage claims
  //   - "unlimited practice": false, there is a fair-use ceiling (facts.js)
  //   - "instant pronunciation feedback": LEXIS is told NOT to correct
  //     accent, after it was reported doing that to Thai speakers (app.mjs)
  //   - "100% private": audio is streamed to OpenAI; PrivacyPage says so
  //   - "speak fluently" / "เก่งขึ้น": an outcome promise, not an experience
  // Trial and price live in pricingTeaser (facts.js), directly under the
  // button, so heroSub carries no numbers of its own to go stale.
  const content = {
    en: {
      en: {
        heroTitle: 'Meet LEXIS, your English speaking partner',
        heroSub: 'She\'s an AI tutor you talk to out loud: warm, quick and endlessly patient. Chat about your day, rehearse a job interview or plan a trip. She answers instantly, fixes your grammar as you go, and tells you what you did well.',
        cta: 'Start talking free',
        pricingTeaser: PRICING_TEASER_EN,
        viewPricing: 'View full pricing'
      },
      th: {
        heroTitle: 'รู้จัก LEXIS คู่ฝึกพูดภาษาอังกฤษของคุณ',
        heroSub: 'ติวเตอร์ AI ที่คุณคุยด้วยเสียงจริง ใจดี ตอบไว และอดทนเสมอ คุยเรื่องวันของคุณ ซ้อมสัมภาษณ์งาน หรือวางแผนเที่ยว เธอตอบทันที ช่วยแก้ไวยากรณ์ระหว่างคุย และบอกว่าคุณทำอะไรได้ดี',
        cta: 'เริ่มคุยฟรี',
        pricingTeaser: PRICING_TEASER_TH,
        viewPricing: 'ดูแพ็กเกจทั้งหมด'
      }
    },
    th: {
      en: {
        heroTitle: 'Meet LEXIS, your Thai speaking partner',
        heroSub: 'She\'s an AI tutor you talk to out loud: warm, quick and endlessly patient. Chat about your day, rehearse a job interview or plan a trip. She answers instantly, fixes your grammar as you go, and tells you what you did well.',
        cta: 'Start talking free',
        pricingTeaser: PRICING_TEASER_EN,
        viewPricing: 'View full pricing'
      },
      th: {
        heroTitle: 'รู้จัก LEXIS คู่ฝึกพูดภาษาไทยของคุณ',
        heroSub: 'ติวเตอร์ AI ที่คุณคุยด้วยเสียงจริง ใจดี ตอบไว และอดทนเสมอ คุยเรื่องวันของคุณ ซ้อมสัมภาษณ์งาน หรือวางแผนเที่ยว เธอตอบทันที ช่วยแก้ไวยากรณ์ระหว่างคุย และบอกว่าคุณทำอะไรได้ดี',
        cta: 'เริ่มคุยฟรี',
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

  // Below-the-fold sections carry data-reveal and arrive once as they are
  // scrolled to. The hero does not: it is on screen at load and already
  // moves (HeroLiveDemo). See useRevealOnScroll.js for the prerender and
  // no-flicker constraints this is built around.
  const pageRef = useRef(null);
  useRevealOnScroll(pageRef);

  return (
    <div ref={pageRef} className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans">
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
            className="flex items-center justify-center sm:justify-start gap-2 bg-white border border-lexis-ink/10 rounded-xl text-xs text-lexis-ink/75 hover:border-teal-600/40 transition-all min-h-[44px] min-w-[44px] px-2.5 sm:px-3"
          >
            <Globe className="w-4 h-4 text-teal-700 flex-shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">{lang === 'en' ? 'ไทย' : 'English'}</span>
          </AppLink>
          <AppLink
            to={lang === 'th' ? '/th/pricing' : '/pricing'} navigateTo={navigateTo} className="flex items-center text-xs sm:text-sm text-lexis-ink/75 hover:text-lexis-ink transition-colors min-h-[44px] px-1"
          >
            {c.pricing}
          </AppLink>
          <button
            onClick={goPractice}
            className="px-3 sm:px-5 py-2.5 bg-lexis-action hover:bg-lexis-action-dark hover:-translate-y-0.5 active:translate-y-0 motion-safe:active:scale-[0.97] text-lexis-navy font-semibold text-xs sm:text-sm rounded-xl transition-all duration-200 lexis-lift flex items-center gap-1.5 sm:gap-2 min-h-[44px] whitespace-nowrap"
          >
            <span>{c.getStarted}</span>
            <ArrowRight className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          </button>
        </div>
      </header>

      {/* Hero — split layout: copy on the left, an actual photo of LEXIS on
          the right. The previous version was copy floating alone on a flat
          background, which read as generic/faceless. A real depiction of
          who a student is talking to does more for "impressive" than any
          amount of copy polish alone would. */}
      <section className="lexis-clip-x w-full max-w-6xl mx-auto px-6 pt-8 pb-16 md:pt-20 md:pb-28 grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-6">
            <Zap className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{c.heroBadge}</span>
          </div>
          <h1 className="font-display font-semibold text-4xl md:text-5xl tracking-tight mb-6 text-lexis-ink leading-tight text-balance">
            {t.heroTitle}
          </h1>
          <p className="text-lg md:text-xl text-lexis-ink/75 mb-6 max-w-xl mx-auto md:mx-0 leading-relaxed">
            {t.heroSub}
          </p>

          {/* Which language to practice — sets the tutor persona used the
              next time a session starts. Two-way by design: English speakers
              learning Thai and Thai speakers learning English both land here. */}
          <div className="inline-flex items-center bg-white border border-lexis-ink/10 rounded-full p-1 mb-6 text-sm shadow-sm">
            <button
              onClick={() => selectDirection('en')}
              aria-pressed={direction === 'en'}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 motion-safe:active:scale-[0.97] min-h-[44px] ${direction === 'en' ? 'bg-teal-700 text-white' : 'text-lexis-ink/75 hover:text-lexis-ink'}`}
            >
              {c.learnEnglish}
            </button>
            <button
              onClick={() => selectDirection('th')}
              aria-pressed={direction === 'th'}
              className={`px-4 py-2 rounded-full font-semibold transition-all duration-200 motion-safe:active:scale-[0.97] min-h-[44px] ${direction === 'th' ? 'bg-teal-700 text-white' : 'text-lexis-ink/75 hover:text-lexis-ink'}`}
            >
              {c.learnThai}
            </button>
          </div>

          <div>
            <button
              onClick={goPractice}
              className="px-8 py-4 bg-lexis-action hover:bg-lexis-action-dark hover:-translate-y-0.5 active:translate-y-0 motion-safe:active:scale-[0.97] transition-all duration-200 text-lexis-navy font-display font-semibold text-lg rounded-2xl lexis-lift flex items-center space-x-3 mx-auto md:mx-0"
            >
              <Mic className="w-5 h-5" aria-hidden="true" />
              <span>{t.cta}</span>
            </button>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-1 sm:gap-3 text-sm text-center sm:text-left">
            <span className="text-lexis-ink/75">{t.pricingTeaser}</span>
            <AppLink to="/pricing" navigateTo={navigateTo} className="text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2 whitespace-nowrap">
              {t.viewPricing}
            </AppLink>
          </div>
        </div>

        {/* LEXIS introducing herself, on video (23 Sep 2026, owner request).
            This reverses interface re-audit recommendation 01 (26 Aug),
            which had put HeroLiveDemo here in place of a still portrait;
            the reasoning for why a video of her talking is a different
            thing from that portrait, the AI-disclosure decision it
            touches, and how the clip was cut are all in HeroVideo.jsx.
            HeroLiveDemo moved to "Meet LEXIS" below, not deleted.

            order-first on phones: the page's whole first screen used to be
            text, with LEXIS a small circle only after scrolling. On desktop
            it sits in the right column as before. */}
        <div className="lexis-stage flex justify-center md:justify-end order-first md:order-none">
          <HeroVideo lang={lang} className="w-56 sm:w-64 md:w-full md:max-w-sm" />
        </div>

      </section>

      {/* LEXIS Community, second on the page (23 Sep 2026, owner: "very
          little focus on the community aspects, which is a huge main
          factor"). Was the fifth of six sections, a tinted card with a 96px
          thumbnail directly above the FAQ, where it read as a footnote.

          Copy is the Community page's own, not new claims: its headline,
          its shared-pool mechanics, and its public first goal with the
          "we're not there yet" left in. Partner schools are said to be what
          the pool WILL fund, because none exist yet (CommunityPage.jsx) —
          the same line the previous teaser held. The add-on amount comes
          from facts.js, and "any pass" is true: sponsorAdd is independent
          of planTier in /api/stripe/checkout.

          Takes the tinted band that "Meet LEXIS" used to have, so the page
          alternates canvas / band / canvas from the hero down. The image
          links to /community rather than playing inline: the clip lives
          where its content is, and this stays one lazy image on a page
          that now opens with a video. */}
      <section data-reveal className="lexis-band w-full">
        <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid md:grid-cols-12 gap-8 md:gap-12 items-center">
          <AppLink
            to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo}
            className="md:col-span-4 relative block w-44 sm:w-52 md:w-full max-w-[16rem] mx-auto md:mx-0 aspect-[3/4] rounded-3xl overflow-hidden lexis-lift group"
            aria-label={c.communityCta}
          >
            {/* Same three sized variants as before (generate_community_poster_srcset.mjs);
                at this size the browser picks 384 or 768 instead of 192. */}
            <picture>
              <source
                type="image/avif"
                srcSet="/marketing/lexis-community-intro-poster-192.avif 192w, /marketing/lexis-community-intro-poster-384.avif 384w, /marketing/lexis-community-intro-poster-768.avif 768w"
                sizes="(min-width: 768px) 256px, 208px"
              />
              <source
                type="image/webp"
                srcSet="/marketing/lexis-community-intro-poster-192.webp 192w, /marketing/lexis-community-intro-poster-384.webp 384w, /marketing/lexis-community-intro-poster-768.webp 768w"
                sizes="(min-width: 768px) 256px, 208px"
              />
              <img
                src="/marketing/lexis-community-intro-poster-384.jpg"
                width="256"
                height="341"
                loading="lazy"
                decoding="async"
                alt=""
                className="w-full h-full object-cover"
              />
            </picture>
            <span className="absolute inset-0 flex items-end justify-center pb-5 bg-gradient-to-t from-lexis-navy/55 via-transparent to-transparent">
              <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 text-lexis-ink text-xs font-semibold shadow-sm group-hover:-translate-y-0.5 transition-transform">
                <Play className="w-3.5 h-3.5 text-teal-700" fill="currentColor" aria-hidden="true" />
                {c.communityCta}
              </span>
            </span>
          </AppLink>
          <div className="md:col-span-8 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-5">
              <span>{c.communityBadge}</span>
            </div>
            <h2 className="font-display font-semibold text-3xl md:text-[2.75rem] leading-[1.1] text-balance text-lexis-ink">{c.communityHeading}</h2>
            <p className="mt-5 text-base md:text-lg text-lexis-ink/75 leading-relaxed max-w-2xl mx-auto md:mx-0">{c.communityBody}</p>
            <p className="mt-4 text-sm md:text-base font-semibold text-teal-800">{c.communityGoal}</p>
            <AppLink
              to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo}
              className="mt-6 inline-flex items-center gap-2 text-teal-700 hover:text-teal-800 font-semibold underline underline-offset-4"
            >
              {c.communityCta}
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </AppLink>
          </div>
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
      <section data-reveal className="w-full">
       {/* 23 Sep 2026: the copy (heading, body, specs) now shares the left
           half and HeroLiveDemo takes the right, having moved here from the
           hero when the intro video replaced it. The demo is the real Live
           Conversation screen running, so it sits beside the section whose
           whole claim is "real-time voice" — proof next to the promise.
           Was a 5/7 heading/prose split with no visual at all. Lost its
           tinted band to Community, which now sits directly above it; two
           bands back to back read as one. */}
       <div className="max-w-6xl mx-auto px-6 py-20 md:py-24 grid md:grid-cols-12 gap-x-12 gap-y-12 items-center">
        <div className="md:col-span-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-5">
          <Gauge className="w-3.5 h-3.5" aria-hidden="true" />
          <span>{c.meetHeading}</span>
        </div>
        {/* Measure is constrained on the TEXT, not on the section, so the
            content edge stays put while line length stays readable. That
            distinction is what the old per-section max-w-4xl/5xl/3xl was
            reaching for and getting wrong. */}
        <h2 className="font-display font-semibold text-3xl md:text-[2.75rem] leading-[1.1] text-balance text-lexis-ink">{c.meetTitle}</h2>
        <div className="mt-6">
        <p className="text-base md:text-lg text-lexis-ink/70 leading-relaxed mb-8">{c.meetBody}</p>
        {/* 21 Aug 2026 (interface re-audit, "delete the cards" + "icons only
            where they carry meaning"): was four bg-white bordered chips
            each repeating the same Zap icon — the icon carried no distinct
            information four times over. A plain dot-separated row states
            the same four facts without dressing each one up as an object. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-medium text-lexis-ink/75">
          {c.meetSpecs.map((spec, i) => (
            <React.Fragment key={spec}>
              {i > 0 && <span className="text-lexis-ink/20" aria-hidden="true">•</span>}
              <span>{spec}</span>
            </React.Fragment>
          ))}
        </div>
        </div>
        </div>
        <div className="md:col-span-6 lexis-stage flex justify-center md:justify-end">
          <HeroLiveDemo direction={direction} caption={c.heroDemoCaption} />
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
      <section data-reveal className="w-full max-w-6xl mx-auto px-6 py-20 md:py-24">
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
                <Icon className="w-5 h-5 text-teal-700 self-center" aria-hidden="true" />
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
      <section data-reveal className="lexis-band w-full">
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

      {/* FAQ — plain question/answer pairs, marked up with <details>/<summary>
          (real semantic HTML, not just styled divs) and mirrored as
          FAQPage JSON-LD in index.html. This is squarely aimed at answer
          engines (ChatGPT search, Perplexity, Google's AI overviews) as
          much as human visitors — clear, self-contained Q&A is exactly
          the shape those tools quote from. */}
      <section data-reveal className="w-full max-w-6xl mx-auto px-6 pb-20 md:pb-28">
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
                <ChevronDown className="w-4 h-4 text-lexis-ink/35 flex-shrink-0 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
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
       <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-lexis-ink/75">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
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
