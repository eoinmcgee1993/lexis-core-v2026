import React, { useState } from 'react';
import { Sparkles, Mic, ShieldCheck, Zap, Globe, Check, ArrowRight } from 'lucide-react';

// Same key LexisApp.jsx reads on session start ('en' = practicing English,
// 'th' = practicing Thai). Setting it here before navigating to /app means
// the direction picked on the landing page is what the first session
// actually uses, without needing a query param or extra plumbing.
const TARGET_LANGUAGE_STORAGE_KEY = 'lexis_target_language';

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
        heroTitle: "Speak English with Confidence — Practice Out Loud with LEXIS",
        heroSub: "A friendly conversation partner who listens, replies, and gently corrects you in real time — practice as much as you want, whenever you want.",
        cta: "Try It Free",
        pricingTeaser: "Free 30-minute trial, then ฿199/week or ฿599/month.",
        viewPricing: "View full pricing"
      },
      th: {
        heroTitle: "ฝึกพูดภาษาอังกฤษอย่างมั่นใจ กับเพื่อนคู่ซ้อม LEXIS",
        heroSub: "LEXIS ฟัง พูดคุย และช่วยแก้ไขให้คุณแบบเรียลไทม์ ฝึกได้เท่าที่อยากฝึก เมื่อไหร่ก็ได้",
        cta: "ลองใช้ฟรี",
        pricingTeaser: "ทดลองฟรี 30 นาที จากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน",
        viewPricing: "ดูแพ็กเกจทั้งหมด"
      }
    },
    th: {
      en: {
        heroTitle: "Speak Thai with Confidence — Practice Out Loud with LEXIS",
        heroSub: "A friendly conversation partner who listens, replies, and gently corrects you in real time — practice as much as you want, whenever you want.",
        cta: "Try It Free",
        pricingTeaser: "Free 30-minute trial, then ฿199/week or ฿599/month.",
        viewPricing: "View full pricing"
      },
      th: {
        heroTitle: "ฝึกพูดภาษาไทยอย่างมั่นใจ กับเพื่อนคู่ซ้อม LEXIS",
        heroSub: "LEXIS ฟัง พูดคุย และช่วยแก้ไขให้คุณแบบเรียลไทม์ ฝึกได้เท่าที่อยากฝึก เมื่อไหร่ก็ได้",
        cta: "ลองใช้ฟรี",
        pricingTeaser: "ทดลองฟรี 30 นาที จากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน",
        viewPricing: "ดูแพ็กเกจทั้งหมด"
      }
    }
  };

  const t = content[direction][lang];

  return (
    <div className="min-h-screen bg-lexis-canvas text-lexis-ink font-sans flex flex-col justify-between">
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

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Talk in real time — no awkward pauses, no typing</span>
        </div>
        <h1 className="font-display font-semibold text-4xl md:text-6xl tracking-tight mb-6 text-lexis-ink leading-tight text-balance">
          {t.heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-lexis-ink/60 mb-6 max-w-2xl mx-auto leading-relaxed">
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
            className="px-8 py-4 bg-lexis-action hover:bg-lexis-action-dark hover:scale-105 transition-transform text-white font-display font-semibold text-lg rounded-2xl shadow-xl shadow-lexis-action/25 flex items-center space-x-3 mx-auto"
          >
            <Mic className="w-5 h-5" />
            <span>{t.cta}</span>
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center space-x-3 text-sm">
          <span className="text-lexis-ink/50">{t.pricingTeaser}</span>
          <button onClick={() => navigateTo('/pricing')} className="text-teal-700 hover:text-teal-800 font-medium underline underline-offset-2">
            {t.viewPricing}
          </button>
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
            <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Jump in and interrupt LEXIS anytime</span>
          </div>
          <div className="flex items-center space-x-2 bg-white border border-lexis-ink/10 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span>Review what you practiced, anytime (paid plans)</span>
          </div>
        </div>
      </section>

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
