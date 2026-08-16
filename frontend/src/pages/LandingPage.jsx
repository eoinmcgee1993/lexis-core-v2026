import React, { useState } from 'react';
import { Sparkles, Mic, ShieldCheck, Zap, Globe, Check, ArrowRight, MessageCircle, Repeat, TrendingUp } from 'lucide-react';

// Same key LexisApp.jsx reads on session start ('en' = practicing English,
// 'th' = practicing Thai). Setting it here before navigating to /app means
// the direction picked on the landing page is what the first session
// actually uses, without needing a query param or extra plumbing.
const TARGET_LANGUAGE_STORAGE_KEY = 'lexis_target_language';

// Generated the same way as the in-app avatar photos (see
// scripts/avatar/lexis-tutor-photo-notes.md, "Marketing hero photo") —
// same identity, full body, warm welcoming pose. This is what the hero
// redesign is actually about: a real depiction of LEXIS instead of copy
// floating in empty space.
const HERO_PHOTO_URL = '/marketing/lexis-tutor-hero.jpg';

const HOW_IT_WORKS = [
  { icon: Mic, title: 'Start talking', desc: 'Tap one button and start speaking — no typing, no scripts to read from.' },
  { icon: MessageCircle, title: 'LEXIS responds live', desc: "It listens, replies, and corrects you gently mid-conversation, the way a patient tutor would." },
  { icon: TrendingUp, title: 'See what to work on', desc: 'After each session, get a plain-language summary of what you did well and what to practice next.' }
];

const FAQS_EN = [
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
    a: 'Yes. New accounts get a free 30-minute trial. After that, LEXIS is ฿199/week or ฿599/month.'
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

export default function LandingPage({ navigateTo }) {
  const [lang, setLang] = useState('en'); // display language of this page's copy
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
        heroSub: 'A friendly conversation partner who listens, replies, and gently corrects you in real time. Practice as much as you want, whenever you want.',
        cta: 'Try It Free',
        pricingTeaser: 'Free 30-minute trial, then ฿199/week or ฿599/month.',
        viewPricing: 'View full pricing'
      },
      th: {
        heroTitle: 'ฝึกพูดภาษาอังกฤษออกเสียงจริงกับ LEXIS',
        heroSub: 'LEXIS ฟัง พูดคุย และช่วยแก้ไขให้คุณแบบเรียลไทม์ ฝึกได้เท่าที่อยากฝึก เมื่อไหร่ก็ได้',
        cta: 'ลองใช้ฟรี',
        pricingTeaser: 'ทดลองฟรี 30 นาที จากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน',
        viewPricing: 'ดูแพ็กเกจทั้งหมด'
      }
    },
    th: {
      en: {
        heroTitle: 'Practice Speaking Thai Out Loud with LEXIS',
        heroSub: 'A friendly conversation partner who listens, replies, and gently corrects you in real time. Practice as much as you want, whenever you want.',
        cta: 'Try It Free',
        pricingTeaser: 'Free 30-minute trial, then ฿199/week or ฿599/month.',
        viewPricing: 'View full pricing'
      },
      th: {
        heroTitle: 'ฝึกพูดภาษาไทยออกเสียงจริงกับ LEXIS',
        heroSub: 'LEXIS ฟัง พูดคุย และช่วยแก้ไขให้คุณแบบเรียลไทม์ ฝึกได้เท่าที่อยากฝึก เมื่อไหร่ก็ได้',
        cta: 'ลองใช้ฟรี',
        pricingTeaser: 'ทดลองฟรี 30 นาที จากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน',
        viewPricing: 'ดูแพ็กเกจทั้งหมด'
      }
    }
  };

  const t = content[direction][lang];

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <Sparkles className="w-6 h-6" />
          </div>
          <span className="text-xl font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="flex items-center space-x-2 bg-white border border-lexis-ink/10 px-3 py-1.5 rounded-xl text-xs text-lexis-ink/70 hover:border-teal-600/40 transition-all"
          >
            <Globe className="w-4 h-4 text-teal-700" />
            <span>{lang === 'en' ? 'ไทย' : 'English'}</span>
          </button>
          <button
            onClick={() => navigateTo('/pricing')}
            className="hidden sm:inline text-sm text-lexis-ink/70 hover:text-lexis-ink transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={goPractice}
            className="px-5 py-2.5 bg-lexis-action hover:bg-lexis-action-dark text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-lexis-action/20 flex items-center space-x-2"
          >
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero — split layout: copy on the left, an actual photo of LEXIS on
          the right. The previous version was copy floating alone on a flat
          background, which read as generic/faceless. A real depiction of
          who a student is talking to does more for "impressive" than any
          amount of copy polish alone would. */}
      <section className="w-full max-w-6xl mx-auto px-6 py-16 md:py-20 grid md:grid-cols-2 gap-12 items-center">
        <div className="text-center md:text-left">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-6">
            <Zap className="w-3.5 h-3.5" />
            <span>Talk in real time — no awkward pauses, no typing</span>
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
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${direction === 'en' ? 'bg-teal-600 text-white' : 'text-lexis-ink/50 hover:text-lexis-ink'}`}
            >
              Learn English
            </button>
            <button
              onClick={() => selectDirection('th')}
              className={`px-4 py-2 rounded-full font-semibold transition-colors ${direction === 'th' ? 'bg-teal-600 text-white' : 'text-lexis-ink/50 hover:text-lexis-ink'}`}
            >
              เรียนภาษาไทย
            </button>
          </div>

          <div>
            <button
              onClick={goPractice}
              className="px-8 py-4 bg-lexis-action hover:bg-lexis-action-dark hover:scale-105 transition-transform text-white font-display font-semibold text-lg rounded-2xl shadow-xl shadow-lexis-action/25 flex items-center space-x-3 mx-auto md:mx-0"
            >
              <Mic className="w-5 h-5" />
              <span>{t.cta}</span>
            </button>
          </div>
          <div className="mt-6 flex items-center justify-center md:justify-start space-x-3 text-sm">
            <span className="text-lexis-ink/50">{t.pricingTeaser}</span>
            <button onClick={() => navigateTo('/pricing')} className="text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2">
              {t.viewPricing}
            </button>
          </div>
        </div>

        {/* LEXIS herself — a soft teal glow behind the photo ties it to the
            live-session avatar treatment elsewhere in the app, without
            reusing lexis-navy as a background here (this page stays on the
            warm canvas per the visual-system doc's "marketing pages kept
            their existing IA" note). */}
        <div className="relative flex justify-center md:justify-end">
          <div className="absolute w-72 h-72 md:w-96 md:h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="relative w-64 sm:w-80 md:w-full md:max-w-sm aspect-[3/4] rounded-[2rem] overflow-hidden border border-white shadow-2xl shadow-teal-900/10">
            <img
              src={HERO_PHOTO_URL}
              alt="LEXIS, your voice conversation partner, ready to start a practice session"
              className="w-full h-full object-cover"
              width="1200"
              height="1607"
              loading="eager"
              fetchpriority="high"
            />
          </div>
          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 bg-white border border-lexis-ink/10 rounded-2xl shadow-lg px-4 py-2.5 flex items-center gap-2 text-xs font-medium text-lexis-ink whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Live voice — ready when you are</span>
          </div>
        </div>
      </section>

      {/* How it works — three concrete steps instead of adjective-heavy
          copy. Short, literal sentences here also read cleanly to search
          crawlers and answer engines, not just human visitors. */}
      <section className="w-full max-w-5xl mx-auto px-6 py-10">
        <h2 className="font-display font-semibold text-2xl text-center mb-10">How it works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="bg-white border border-lexis-ink/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-full bg-lexis-action/10 text-lexis-action-dark font-display font-semibold text-sm flex-shrink-0">
                  {i + 1}
                </div>
                <Icon className="w-5 h-5 text-teal-700" />
              </div>
              <div className="font-semibold text-sm mb-1.5">{title}</div>
              <div className="text-sm text-lexis-ink/60 leading-relaxed">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-lexis-ink/60">
          <div className="flex items-center space-x-2 bg-white border border-lexis-ink/10 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Gentle, real-time grammar correction</span>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-lexis-ink/10 rounded-xl px-4 py-3">
            <Repeat className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Jump in and interrupt LEXIS anytime</span>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-lexis-ink/10 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Review what you practiced, anytime (paid plans)</span>
          </div>
        </div>
      </section>

      {/* FAQ — plain question/answer pairs, marked up with <details>/<summary>
          (real semantic HTML, not just styled divs) and mirrored as
          FAQPage JSON-LD in index.html. This is squarely aimed at answer
          engines (ChatGPT search, Perplexity, Google's AI overviews) as
          much as human visitors — clear, self-contained Q&A is exactly
          the shape those tools quote from. */}
      {lang === 'en' && (
        <section className="w-full max-w-3xl mx-auto px-6 py-14">
          <h2 className="font-display font-semibold text-2xl text-center mb-8">Frequently asked questions</h2>
          <div className="space-y-3">
            {FAQS_EN.map(({ q, a }) => (
              <details key={q} className="group bg-white border border-lexis-ink/10 rounded-2xl p-4 open:shadow-sm">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-semibold text-sm text-lexis-ink">
                  <span>{q}</span>
                  <ArrowRight className="w-4 h-4 text-lexis-ink/30 flex-shrink-0 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm text-lexis-ink/60 leading-relaxed">{a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Private &amp; secure • Payments handled by Stripe</span>
        </div>
        <div>© 2026 LEXIS</div>
      </footer>
    </div>
  );
}
