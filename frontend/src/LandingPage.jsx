import React, { useState } from 'react';
import { Sparkles, Mic, ShieldCheck, Zap, Globe, Check, ArrowRight } from 'lucide-react';

const WEEKLY_LINK = import.meta.env.VITE_STRIPE_WEEKLY_LINK || 'https://buy.stripe.com/YOUR_STRIPE_WEEKLY_LINK';
const MONTHLY_LINK = import.meta.env.VITE_STRIPE_MONTHLY_LINK || 'https://buy.stripe.com/YOUR_STRIPE_MONTHLY_LINK';

export default function LandingPage({ onLaunchApp }) {
  const [lang, setLang] = useState('en');

  const content = {
    en: {
      heroTitle: "Master Conversational English with Sub-300ms AI Immersion",
      heroSub: "Designed specifically for Thai youth. Speak naturally, fix grammar instantly, and build real confidence without expensive human tutors.",
      cta: "Start Free Practice",
      pricingTitle: "Simple, Transparent Pricing",
      freeTier: "Free Trial",
      freeDesc: "3 Practice Sessions (30 Mins)",
      weeklyTier: "Weekly Pass",
      weeklyDesc: "Unlimited Practice for 7 Days",
      monthlyTier: "Monthly Immersion",
      monthlyDesc: "Unlimited Practice for 30 Days",
      buyNow: "Get Started Now"
    },
    th: {
      heroTitle: "ฝึกพูดภาษาอังกฤษอย่างมั่นใจ ด้วยระบบ AI เสียงเรียลไทม์",
      heroSub: "ออกแบบมาเพื่อเยาวชนไทยโดยเฉพาะ พูดได้อย่างเป็นธรรมชาติ ปรับไวยากรณ์ทันที ไม่ต้องเสียค่าเรียนแพงๆ",
      cta: "เริ่มฝึกใช้งานฟรี",
      pricingTitle: "แพ็กเกจราคาที่เข้าถึงง่าย",
      freeTier: "ทดลองใช้งานฟรี",
      freeDesc: "ฝึกซ้อม 3 ครั้ง (รวม 30 นาที)",
      weeklyTier: "บัตรผ่านรายสัปดาห์",
      weeklyDesc: "ใช้งานได้ไม่จำกัด 7 วัน",
      monthlyTier: "แพ็กเกจรายเดือน",
      monthlyDesc: "ใช้งานได้ไม่จำกัด 30 วัน",
      buyNow: "เริ่มต้นใช้งาน"
    }
  };

  const t = content[lang];

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
            onClick={onLaunchApp}
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
        <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          {t.heroSub}
        </p>
        <button
          onClick={onLaunchApp}
          className="px-8 py-4 bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 hover:scale-105 transition-transform text-slate-950 font-extrabold text-lg rounded-2xl shadow-xl shadow-cyan-500/25 flex items-center space-x-3 mx-auto"
        >
          <Mic className="w-5 h-5" />
          <span>{t.cta}</span>
        </button>
      </section>

      {/* Pricing Cards */}
      <section className="w-full max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center mb-10 text-slate-200">{t.pricingTitle}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-cyan-400 mb-2">{t.freeTier}</h3>
              <p className="text-xs text-slate-400 mb-4">{t.freeDesc}</p>
              <div className="text-3xl font-extrabold text-slate-100 mb-6">฿0</div>
              <ul className="text-xs space-y-3 text-slate-300 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>30 Total Mins Usage</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Real-Time Feedback</span></li>
              </ul>
            </div>
            <button onClick={onLaunchApp} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-all">
              Try Free
            </button>
          </div>

          {/* Weekly Pass (Featured) */}
          <div className="bg-slate-900 border-2 border-cyan-500 p-6 rounded-2xl flex flex-col justify-between relative shadow-2xl shadow-cyan-500/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 font-bold text-[10px] uppercase px-3 py-0.5 rounded-full">
              Most Popular
            </span>
            <div>
              <h3 className="text-lg font-bold text-cyan-300 mb-2">{t.weeklyTier}</h3>
              <p className="text-xs text-slate-400 mb-4">{t.weeklyDesc}</p>
              <div className="text-3xl font-extrabold text-slate-100 mb-6">฿199 <span className="text-xs font-normal text-slate-500">/ week</span></div>
              <ul className="text-xs space-y-3 text-slate-300 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Unlimited Speaking Time</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Full Transcript History</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Thai ESL Tuning Active</span></li>
              </ul>
            </div>
            <a href={WEEKLY_LINK} className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs text-center transition-all">
              {t.buyNow}
            </a>
          </div>

          {/* Monthly Pass */}
          <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-emerald-400 mb-2">{t.monthlyTier}</h3>
              <p className="text-xs text-slate-400 mb-4">{t.monthlyDesc}</p>
              <div className="text-3xl font-extrabold text-slate-100 mb-6">฿599 <span className="text-xs font-normal text-slate-500">/ month</span></div>
              <ul className="text-xs space-y-3 text-slate-300 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Best Value (Save 25%)</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Unlimited Speaking Time</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-emerald-400" /><span>Priority Server Queue</span></li>
              </ul>
            </div>
            <a href={MONTHLY_LINK} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs text-center transition-all">
              {t.buyNow}
            </a>
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
