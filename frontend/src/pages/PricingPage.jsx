import React, { useMemo, useState } from 'react';
import { Sparkles, ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { buildOffersJsonLd, SITE_URL } from '../data/structuredData';
import { useSeo } from '../lib/useSeo';
import { trackEvent } from '../lib/analytics';
import { reportError } from '../lib/errorReporting';
import { MONTHLY_SAVINGS_VS_WEEKLY_PCT, PRICING, PRICING_DESCRIPTION_EN, PRICING_DESCRIPTION_TH, TRIAL, VAT } from '../content/facts';

// Display-language chrome strings for this page — Stage 4 (real /th and
// /th/pricing routes, not a client-side toggle). Mirrors the same
// pattern as LandingPage.jsx's CHROME object.
const TEXT = {
  en: {
    home: 'Home',
    heading: 'Simple, Transparent Pricing',
    sub: 'Cancel anytime. Prices in Thai Baht.',
    vat: VAT.registered ? 'Prices include VAT.' : 'No VAT applies — not a VAT-registered business.',
    cancelled: 'Checkout was cancelled — no charge was made.',
    freeTrialTitle: 'Free Trial',
    freeTrialSub: (minutes) => `${minutes} Minutes of Free Practice`,
    freeTrialFeature1: (minutes) => `${minutes} minutes of practice time`,
    freeTrialFeature2: 'Real-time feedback as you speak',
    tryFree: 'Try Free',
    weeklyTitle: 'Weekly Pass',
    weeklySub: 'Unlimited Practice for 7 Days',
    perWeek: '/ week',
    mostPopular: 'Most Popular',
    weeklyFeature1: 'Talk as much as you want',
    weeklyFeature2: 'Full conversation history',
    weeklyFeature3: "LEXIS adjusts to your level as you go",
    getStartedNow: 'Get Started Now',
    monthlyTitle: 'Monthly Immersion',
    monthlySub: 'Unlimited Practice for 30 Days',
    perMonth: '/ month',
    monthlyFeature1: (pct) => `Best value — about ${pct}% less than 4 weeks at the weekly rate`,
    monthlyFeature2: 'Talk as much as you want',
    monthlyFeature3: 'Great for building a daily habit',
    signInNote: "You'll be asked to sign in before checkout.",
    footerTrust: 'Private & secure • Payments handled by Stripe',
    privacy: 'Privacy',
    terms: 'Terms',
    refunds: 'Refunds'
  },
  th: {
    home: 'หน้าแรก',
    heading: 'ราคาที่เรียบง่ายและโปร่งใส',
    sub: 'ยกเลิกได้ทุกเมื่อ ราคาคิดเป็นเงินบาท',
    vat: VAT.registered ? 'ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว' : 'ไม่มีภาษีมูลค่าเพิ่ม เนื่องจากธุรกิจนี้ไม่ได้จดทะเบียน VAT',
    cancelled: 'การชำระเงินถูกยกเลิก — ไม่มีการเรียกเก็บเงิน',
    freeTrialTitle: 'ทดลองใช้ฟรี',
    freeTrialSub: (minutes) => `ฝึกฝนฟรี ${minutes} นาที`,
    freeTrialFeature1: (minutes) => `เวลาฝึกฝน ${minutes} นาที`,
    freeTrialFeature2: 'รับคำแนะนำแบบเรียลไทม์ขณะพูด',
    tryFree: 'ลองใช้ฟรี',
    weeklyTitle: 'แพ็กเกจรายสัปดาห์',
    weeklySub: 'ฝึกได้ไม่จำกัดนาน 7 วัน',
    perWeek: '/ สัปดาห์',
    mostPopular: 'ยอดนิยม',
    weeklyFeature1: 'พูดได้เท่าที่อยากพูด',
    weeklyFeature2: 'ประวัติการสนทนาแบบเต็ม',
    weeklyFeature3: 'LEXIS ปรับให้เหมาะกับระดับของคุณไปเรื่อย ๆ',
    getStartedNow: 'เริ่มเลย',
    monthlyTitle: 'แพ็กเกจรายเดือน',
    monthlySub: 'ฝึกได้ไม่จำกัดนาน 30 วัน',
    perMonth: '/ เดือน',
    monthlyFeature1: (pct) => `คุ้มค่าที่สุด — ถูกกว่าจ่ายรายสัปดาห์ 4 สัปดาห์ประมาณ ${pct}%`,
    monthlyFeature2: 'พูดได้เท่าที่อยากพูด',
    monthlyFeature3: 'เหมาะสำหรับสร้างนิสัยฝึกทุกวัน',
    signInNote: 'คุณจะต้องเข้าสู่ระบบก่อนชำระเงิน',
    footerTrust: 'ปลอดภัยและเป็นส่วนตัว • ชำระเงินผ่าน Stripe',
    privacy: 'นโยบายความเป็นส่วนตัว',
    terms: 'ข้อกำหนดการใช้งาน',
    refunds: 'การคืนเงิน'
  }
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Stripe recurring Price IDs — live mode, Clearmark account (acct_1T1zS9F1FdEsYK5E).
// The actual THB amounts these correspond to live in content/facts.js
// (PRICING.weekly.thb / PRICING.monthly.thb) — not repeated here, since a
// mismatch between a comment and the real Stripe-side price would be
// worse than no comment at all.
const STRIPE_PRICES = {
  weekly: 'price_1U1hdLF1FdEsYK5EOSheNGGS',   // LEXIS Weekly Pass
  monthly: 'price_1U1hdOF1FdEsYK5Ec6DgUlil'   // LEXIS Monthly Immersion
};

export default function PricingPage({ navigateTo, lang = 'en' }) {
  const { session } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null); // 'weekly' | 'monthly' | null
  const [error, setError] = useState('');
  const t = TEXT[lang];

  const cancelled = new URLSearchParams(window.location.search).get('payment') === 'cancelled';

  const enUrl = `${SITE_URL}/pricing`;
  const thUrl = `${SITE_URL}/th/pricing`;

  const offersJsonLd = useMemo(() => buildOffersJsonLd(lang), [lang]);
  useSeo({
    title: lang === 'th' ? 'ราคา | LEXIS' : 'Pricing | LEXIS',
    description: lang === 'th' ? PRICING_DESCRIPTION_TH : PRICING_DESCRIPTION_EN,
    canonical: lang === 'th' ? thUrl : enUrl,
    htmlLang: lang,
    hreflang: [
      { hrefLang: 'en', href: enUrl },
      { hrefLang: 'th', href: thUrl },
      { hrefLang: 'x-default', href: enUrl }
    ],
    jsonLd: { 'jsonld-offers': offersJsonLd }
  });

  const startCheckout = async (planTier, priceId) => {
    setError('');

    if (!session) {
      navigateTo('/auth');
      return;
    }
    if (!priceId || priceId.includes('xxxxxxxxxxxxx')) {
      setError(`Missing Stripe price ID for the ${planTier} plan — set STRIPE_PRICES.${planTier} in PricingPage.jsx to your real Stripe price_... ID.`);
      return;
    }

    setLoadingTier(planTier);
    try {
      const res = await fetch(`${BACKEND_URL}/api/stripe/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ priceId, planTier })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Checkout error: ${res.status}`);
      if (!data.url) throw new Error('Checkout session did not return a redirect URL.');
      trackEvent('checkout_started', { metadata: { planTier } });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.');
      reportError('Checkout Start Failed', err, { planTier });
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10 gap-2">
        <button
          onClick={() => navigateTo(lang === 'th' ? '/th' : '/')}
          className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.home}</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>
        {/* Language toggle — navigates between /pricing and /th/pricing
            (Stage 4), same pattern as LandingPage.jsx's header toggle. */}
        <button
          onClick={() => navigateTo(lang === 'th' ? '/pricing' : '/th/pricing')}
          aria-label={lang === 'en' ? 'Switch page language to Thai' : 'Switch page language to English'}
          className="flex items-center justify-center gap-2 bg-white border border-lexis-ink/10 rounded-xl text-xs text-lexis-ink/70 hover:border-teal-600/40 transition-all min-h-[44px] min-w-[44px] px-2.5 flex-shrink-0"
        >
          <Globe className="w-4 h-4 text-teal-700 flex-shrink-0" />
          <span className="hidden sm:inline">{lang === 'en' ? 'ไทย' : 'English'}</span>
        </button>
      </header>

      <section className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-2xl text-center mb-2 text-lexis-ink">{t.heading}</h1>
        <p className="text-center text-sm text-lexis-ink/50">{t.sub}</p>
        <p className="text-center text-xs text-lexis-ink/30 mb-10">
          {t.vat}
        </p>

        {cancelled && (
          <div className="mb-6 px-4 py-3 bg-lexis-action/10 border border-lexis-action/30 rounded-xl text-lexis-action-dark text-sm text-center">
            {t.cancelled}
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-white border border-lexis-ink/10 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-teal-700 mb-2">{t.freeTrialTitle}</h3>
              <p className="text-xs text-lexis-ink/50 mb-4">{t.freeTrialSub(TRIAL.minutes)}</p>
              <div className="text-3xl font-extrabold text-lexis-ink mb-6">฿0</div>
              <ul className="text-xs space-y-3 text-lexis-ink/70 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.freeTrialFeature1(TRIAL.minutes)}</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.freeTrialFeature2}</span></li>
              </ul>
            </div>
            <button onClick={() => navigateTo('/app')} className="w-full py-3 bg-lexis-canvas hover:bg-lexis-ink/5 border border-lexis-ink/10 text-lexis-ink font-bold rounded-xl text-xs transition-all">
              {t.tryFree}
            </button>
          </div>

          {/* Weekly Pass (Featured) */}
          <div className="bg-white border-2 border-lexis-action p-6 rounded-2xl flex flex-col justify-between relative shadow-2xl shadow-lexis-action/10">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lexis-action text-white font-bold text-[10px] uppercase px-3 py-0.5 rounded-full">
              {t.mostPopular}
            </span>
            <div>
              <h3 className="text-lg font-bold text-lexis-action-dark mb-2">{t.weeklyTitle}</h3>
              <p className="text-xs text-lexis-ink/50 mb-4">{t.weeklySub}</p>
              <div className="text-3xl font-extrabold text-lexis-ink mb-6">฿{PRICING.weekly.thb} <span className="text-xs font-normal text-lexis-ink/40">{t.perWeek}</span></div>
              <ul className="text-xs space-y-3 text-lexis-ink/70 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.weeklyFeature1}</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.weeklyFeature2}</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.weeklyFeature3}</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('weekly', STRIPE_PRICES.weekly)}
              disabled={loadingTier === 'weekly'}
              className="w-full py-3 bg-lexis-action hover:bg-lexis-action-dark disabled:opacity-60 text-white font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t.getStartedNow}</span>}
            </button>
          </div>

          {/* Monthly Pass */}
          <div className="bg-white border border-lexis-ink/10 p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-teal-700 mb-2">{t.monthlyTitle}</h3>
              <p className="text-xs text-lexis-ink/50 mb-4">{t.monthlySub}</p>
              <div className="text-3xl font-extrabold text-lexis-ink mb-6">฿{PRICING.monthly.thb} <span className="text-xs font-normal text-lexis-ink/40">{t.perMonth}</span></div>
              <ul className="text-xs space-y-3 text-lexis-ink/70 mb-6">
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.monthlyFeature1(MONTHLY_SAVINGS_VS_WEEKLY_PCT)}</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.monthlyFeature2}</span></li>
                <li className="flex items-center space-x-2"><Check className="w-4 h-4 text-teal-600" /><span>{t.monthlyFeature3}</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('monthly', STRIPE_PRICES.monthly)}
              disabled={loadingTier === 'monthly'}
              className="w-full py-3 bg-lexis-canvas hover:bg-lexis-ink/5 disabled:opacity-60 border border-lexis-ink/10 text-lexis-ink font-bold rounded-xl text-xs text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{t.getStartedNow}</span>}
            </button>
          </div>
        </div>

        {!session && (
          <p className="text-center text-xs text-lexis-ink/40 mt-8">
            {t.signInNote}
          </p>
        )}
      </section>

      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-lexis-ink/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-lexis-ink/40">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>{t.footerTrust}</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigateTo('/privacy')} className="hover:text-lexis-ink transition-colors">{t.privacy}</button>
          <button onClick={() => navigateTo('/terms')} className="hover:text-lexis-ink transition-colors">{t.terms}</button>
          <button onClick={() => navigateTo('/refund')} className="hover:text-lexis-ink transition-colors">{t.refunds}</button>
          <span>© 2026 LEXIS</span>
        </div>
      </footer>
    </div>
  );
}
