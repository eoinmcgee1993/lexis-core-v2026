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
        heroTitle: "Master Conversational English with Sub-300ms AI Immersion",
        heroSub: "Speak naturally, fix grammar instantly, and build real confidence — no expensive human tutors required.",
        cta: "Start Free Practice",
        pricingTeaser: "Free 30-minute trial, then ฿199/week or ฿599/month.",
        viewPricing: "View full pricing"
      },
      th: {
        heroTitle: "ฝึกพูดภาษาอังกฤษอย่างมั่นใจ ด้วยระบบ AI เสียงเรียลไทม์",
        heroSub: "พูดได้อย่างเป็นธรรมชาติ ปรับไวยากรณ์ทันที ไม่ต้องเสียค่าเรียนแพงๆ",
        cta: "เริ่มฝึกใช้งานฟรี",
        pricingTeaser: "ทดลองฟรี 30 นาที จากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน",
        viewPricing: "ดูแพ็กเกจทั้งหมด"
      }
    },
    th: {
      en: {
        heroTitle: "Master Conversational Thai with Sub-300ms AI Immersion",
        heroSub: "Speak naturally, fix grammar instantly, and build real confidence — no expensive human tutors required.",
        cta: "Start Free Practice",
        pricingTeaser: "Free 30-minute trial, then ฿199/week or ฿599/month.",
        viewPricing: "View full pricing"
      },
      th: {
        heroTitle: "ฝึกพูดภาษาไทยอย่างมั่นใจ ด้วยระบบ AI เสียงเรียลไทม์",
        heroSub: "พูดได้อย่างเป็นธรรมชาติ ปรับไวยากรณ์ทันที ไม่ต้องเสียค่าเรียนแพงๆ",
        cta: "เริ่มฝึกใช้งานฟรี",
        pricingTeaser: "ทดลองฟรี 30 นาที จากนั้น ฿199/สัปดาห์ หรือ ฿599/เดือน",
        viewPricing: "ดูแพ็กเกจทั้งหมด"
      }
    }
  };

  const t = content[direction][lang];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between">
      {/* Header */}
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <span className="text-xl font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            LEXIS OS
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setLang(lang === 'en' ? 'th' : 'en')}
            className="flex items-center space-x-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300 hover:border-cyan-500/50 transition-all"
          >
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>{lang === 'en' ? 'ไทย' : 'English'}</span>
          </button>
          <button
            onClick={() => navigateTo('/pricing')}
            className="hidden sm:inline text-sm text-slate-300 hover:text-cyan-400 transition-colors"
          >
            Pricing
          </button>
          <button
            onClick={goPractice}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
          >
            <span>Launch App</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full text-xs font-mono text-cyan-400 mb-6">
          <Zap className="w-3.5 h-3.5" />
          <span>Sub-300ms Latency • Powered by WebRTC</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-cyan-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent leading-tight">
          {t.heroTitle}
        </h1>
        <p className="text-lg md:text-xl text-slate-400 mb-6 max-w-2xl mx-auto leading-relaxed">
          {t.heroSub}
        </p>

        {/* Which language to practice — sets the tutor persona used the
            next time a session starts. Two-way by design: English speakers
            learning Thai and Thai speakers learning English both land here. */}
        <div className="inline-flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 mb-6 text-sm">
          <button
            onClick={() => selectDirection('en')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${direction === 'en' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Learn English
          </button>
          <button
            onClick={() => selectDirection('th')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${direction === 'th' ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
          >
            เรียนภาษาไทย
          </button>
        </div>

        <div>
          <button
            onClick={goPractice}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:scale-105 transition-transform text-slate-950 font-extrabold text-lg rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center space-x-3 mx-auto"
          >
            <Mic className="w-5 h-5" />
            <span>{t.cta}</span>
          </button>
        </div>
        <div className="mt-6 flex items-center justify-center space-x-3 text-sm">
          <span className="text-slate-500">{t.pricingTeaser}</span>
          <button onClick={() => navigateTo('/pricing')} className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-2">
            {t.viewPricing}
          </button>
        </div>
      </section>

      {/* Trust strip */}
      <section className="w-full max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Real-time gentle grammar correction</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Barge-in — interrupt LEXIS naturally</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Full transcript history on paid plans</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Encrypted WebRTC Gateway • Stripe Thailand Compliant</span>
        </div>
        <div>Digital Renaissance System Architecture © 2026</div>
      </footer>
    </div>
  );
}
