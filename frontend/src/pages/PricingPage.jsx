import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useAuth } from '../context/AuthContext';
import { buildBreadcrumbJsonLd, buildOffersJsonLd, SITE_URL } from '../data/structuredData';
import { useSeo } from '../lib/useSeo';
import { trackEvent } from '../lib/analytics';
import { reportError } from '../lib/errorReporting';
import { MONTHLY_SAVINGS_VS_WEEKLY_PCT, PRICING, PRICING_DESCRIPTION_EN, PRICING_DESCRIPTION_TH, SPONSOR_ADDON_THB, TRIAL, VAT } from '../content/facts';
import AppLink from '../components/AppLink';

// Display-language chrome strings for this page — Stage 4 (real /th and
// /th/pricing routes, not a client-side toggle). Mirrors the same
// pattern as LandingPage.jsx's CHROME object.
const TEXT = {
  en: {
    home: 'Home',
    heading: 'Simple, Transparent Pricing',
    sub: 'One-off passes, nothing auto-renews. Card or PromptPay. Prices in Thai Baht.',
    vat: VAT.registered ? 'Prices include VAT.' : 'No VAT applies: not a VAT-registered business.',
    cancelled: 'Checkout was cancelled. No charge was made.',
    freeTrialTitle: 'Free Trial',
    freeTrialSub: (minutes) => `${minutes} Minutes of Free Practice`,
    freeTrialFeature1: (minutes) => `${minutes} minutes of practice time`,
    freeTrialFeature2: 'Real-time feedback as you speak',
    tryFree: 'Try Free',
    weeklyTitle: 'Weekly Pass',
    weeklySub: 'Unlimited Practice for 7 Days',
    perWeek: 'one-off · 7 days',
    mostPopular: 'Most Popular',
    weeklyFeature1: 'Talk as much as you want',
    weeklyFeature2: 'Full conversation history',
    weeklyFeature3: "LEXIS adjusts to your level as you go",
    noRenew: 'Your pass ends by itself after 7 days — it never renews, and there is nothing to cancel.',
    getStartedNow: 'Get Started Now',
    monthlyTitle: 'Monthly Immersion',
    monthlySub: 'Unlimited Practice for 30 Days',
    perMonth: 'one-off · 30 days',
    monthlyFeature1: (pct) => `Best value: about ${pct}% less than 4 weeks at the weekly rate`,
    monthlyFeature2: 'Talk as much as you want',
    monthlyFeature3: 'Great for building a daily habit',
    noRenewMonthly: 'Your pass ends by itself after 30 days — it never renews, and there is nothing to cancel.',
    signInNote: "You'll be asked to sign in before checkout.",
    sponsorLabel: (thb) => `Add ฿${thb} to sponsor a student's practice time through LEXIS Community`,
    sponsorLearnMore: 'Learn more',
    footerTrust: 'Private & secure • Card & PromptPay, handled by Stripe',
    privacy: 'Privacy',
    terms: 'Terms',
    refunds: 'Refunds',
    community: 'Community'
  },
  th: {
    home: 'หน้าแรก',
    heading: 'ราคาที่เรียบง่ายและโปร่งใส',
    sub: 'จ่ายครั้งเดียว ไม่มีการต่ออายุอัตโนมัติ จ่ายด้วยบัตรหรือพร้อมเพย์ ราคาเป็นเงินบาท',
    vat: VAT.registered ? 'ราคานี้รวมภาษีมูลค่าเพิ่มแล้ว' : 'ไม่มีภาษีมูลค่าเพิ่ม เนื่องจากธุรกิจนี้ไม่ได้จดทะเบียน VAT',
    cancelled: 'การชำระเงินถูกยกเลิก ไม่มีการเรียกเก็บเงิน',
    freeTrialTitle: 'ทดลองใช้ฟรี',
    freeTrialSub: (minutes) => `ฝึกฝนฟรี ${minutes} นาที`,
    freeTrialFeature1: (minutes) => `เวลาฝึกฝน ${minutes} นาที`,
    freeTrialFeature2: 'รับคำแนะนำแบบเรียลไทม์ขณะพูด',
    tryFree: 'ลองใช้ฟรี',
    weeklyTitle: 'แพ็กเกจรายสัปดาห์',
    weeklySub: 'ฝึกได้ไม่จำกัดนาน 7 วัน',
    perWeek: 'จ่ายครั้งเดียว · 7 วัน',
    mostPopular: 'ยอดนิยม',
    weeklyFeature1: 'พูดได้เท่าที่อยากพูด',
    weeklyFeature2: 'ประวัติการสนทนาแบบเต็ม',
    weeklyFeature3: 'LEXIS ปรับให้เหมาะกับระดับของคุณไปเรื่อย ๆ',
    noRenew: 'แพ็กเกจจะสิ้นสุดเองหลังจาก 7 วัน ไม่มีการต่ออายุอัตโนมัติ และไม่ต้องยกเลิก',
    getStartedNow: 'เริ่มเลย',
    monthlyTitle: 'แพ็กเกจรายเดือน',
    monthlySub: 'ฝึกได้ไม่จำกัดนาน 30 วัน',
    perMonth: 'จ่ายครั้งเดียว · 30 วัน',
    monthlyFeature1: (pct) => `คุ้มค่าที่สุด ถูกกว่าจ่ายรายสัปดาห์ 4 สัปดาห์ประมาณ ${pct}%`,
    monthlyFeature2: 'พูดได้เท่าที่อยากพูด',
    monthlyFeature3: 'เหมาะสำหรับสร้างนิสัยฝึกทุกวัน',
    noRenewMonthly: 'แพ็กเกจจะสิ้นสุดเองหลังจาก 30 วัน ไม่มีการต่ออายุอัตโนมัติ และไม่ต้องยกเลิก',
    signInNote: 'คุณจะต้องเข้าสู่ระบบก่อนชำระเงิน',
    sponsorLabel: (thb) => `เพิ่ม ฿${thb} เพื่อสนับสนุนเวลาฝึกพูดให้นักเรียนผ่าน LEXIS Community`,
    sponsorLearnMore: 'อ่านเพิ่มเติม',
    footerTrust: 'ปลอดภัยและเป็นส่วนตัว • บัตรและพร้อมเพย์ ผ่าน Stripe',
    privacy: 'นโยบายความเป็นส่วนตัว',
    terms: 'ข้อกำหนดการใช้งาน',
    refunds: 'การคืนเงิน',
    community: 'Community'
  }
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function PricingPage({ navigateTo, lang = 'en' }) {
  const { session } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null); // 'weekly' | 'monthly' | null
  const [error, setError] = useState('');
  const [sponsorAdd, setSponsorAdd] = useState(false);
  const t = TEXT[lang];

  const cancelled = new URLSearchParams(window.location.search).get('payment') === 'cancelled';

  const enUrl = `${SITE_URL}/pricing`;
  const thUrl = `${SITE_URL}/th/pricing`;

  const offersJsonLd = useMemo(() => buildOffersJsonLd(lang), [lang]);
  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'ราคา' : 'Pricing', lang === 'th' ? thUrl : enUrl, lang),
    [lang, thUrl, enUrl]
  );
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
    jsonLd: { 'jsonld-offers': offersJsonLd, 'jsonld-breadcrumb': breadcrumbJsonLd }
  });

  // priceId used to be chosen client-side (STRIPE_PRICES, a hardcoded
  // live-mode price_... pair shipped in every bundle) and sent straight
  // through to the backend with no server-side check that it matched
  // planTier. Re-audit B2 (21 Aug 2026): the backend now owns that
  // mapping entirely (see backend/app.mjs's own STRIPE_PRICES) — this
  // only ever sends which tier was picked, never a price ID, so there's
  // nothing here for a tampered request to substitute.
  const startCheckout = async (planTier) => {
    setError('');

    if (!session) {
      navigateTo('/auth');
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
        // lang goes with it so Stripe renders Checkout in the language
        // this page is being read in, rather than in whatever the browser
        // is set to — see /api/stripe/checkout's checkoutLocale.
        body: JSON.stringify({ planTier, sponsorAdd, lang })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Checkout error: ${res.status}`);
      if (!data.url) throw new Error('Checkout session did not return a redirect URL.');
      trackEvent('checkout_started', { metadata: { planTier, sponsorAdd } });
      window.location.href = data.url;
    } catch (err) {
      setError(err.message || 'Could not start checkout. Please try again.');
      reportError('Checkout Start Failed', err, { planTier });
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-6xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10 gap-2">
        <AppLink
          to={lang === 'th' ? '/th' : '/'} navigateTo={navigateTo} className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors flex-shrink-0"
          >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t.home}</span>
        </AppLink>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>
        {/* Language toggle — navigates between /pricing and /th/pricing
            (Stage 4), same pattern as LandingPage.jsx's header toggle. */}
        <AppLink
          to={lang === 'th' ? '/pricing' : '/th/pricing'} navigateTo={navigateTo} aria-label={lang === 'en' ? 'Switch page language to Thai' : 'Switch page language to English'}
          className="flex items-center justify-center gap-2 bg-white border border-lexis-ink/10 rounded-xl text-xs text-lexis-ink/70 hover:border-teal-600/40 transition-all min-h-[44px] min-w-[44px] px-2.5 flex-shrink-0"
          >
          <Globe className="w-4 h-4 text-teal-700 flex-shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">{lang === 'en' ? 'ไทย' : 'English'}</span>
        </AppLink>
      </header>

      {/* Same max-w-6xl content edge as the landing page. Type scale lifted
          across the board: a pricing page whose headline is text-2xl and
          whose feature list is text-xs reads as a settings screen, not as
          the page where someone decides to pay. */}
      <section className="flex-1 w-full max-w-6xl mx-auto px-6 py-16 md:py-20">
        {/* The three plan names below are h2, not h3 (4 Sep 2026). They were
            h3 under this h1 with no h2 anywhere on the page, so the outline
            jumped a level: a screen reader announces a missing rank, and a
            crawler reads the page as having a title and no sections. The
            plans ARE the sections of a pricing page. Purely semantic — the
            size comes from text-xl on the element, so nothing moves.
            Checked across all 14 prerendered routes; /pricing and
            /th/pricing were the only two with a broken outline. */}
        <h1 className="font-display font-semibold text-3xl md:text-[2.5rem] leading-[1.15] text-center mb-4 text-lexis-ink text-balance">{t.heading}</h1>
        <p className="text-center text-base text-lexis-ink/60 max-w-xl mx-auto">{t.sub}</p>
        <p className="text-center text-xs text-lexis-ink/40 mt-2 mb-12 md:mb-16">
          {t.vat}
        </p>

        {cancelled && (
          <div className="mb-6 px-4 py-3 bg-lexis-action/10 border border-lexis-action/30 rounded-xl text-lexis-action-dark text-sm text-center">
            {t.cancelled}
          </div>
        )}
        {error && (
          <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center justify-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-white border border-lexis-ink/10 p-7 md:p-8 rounded-3xl flex flex-col justify-between lexis-lift-hover">
            <div>
              <h2 className="font-display font-semibold text-xl text-teal-700 mb-2">{t.freeTrialTitle}</h2>
              <p className="text-sm text-lexis-ink/55 mb-6">{t.freeTrialSub(TRIAL.minutes)}</p>
              <div className="font-display font-semibold text-5xl text-lexis-ink mb-6 tracking-tight">฿0</div>
              <ul className="text-sm space-y-3.5 text-lexis-ink/75 mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.freeTrialFeature1(TRIAL.minutes)}</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.freeTrialFeature2}</span></li>
              </ul>
            </div>
            {/* inline-flex + centring: this CTA is an <a>, and an anchor is
                inline by default, so its label sat left-aligned while the
                two <button> CTAs beside it centred theirs natively. */}
            <AppLink to="/app" navigateTo={navigateTo} className="w-full min-h-[44px] py-3 inline-flex items-center justify-center text-center bg-lexis-canvas hover:bg-lexis-ink/5 border border-lexis-ink/10 text-lexis-ink font-bold rounded-xl text-sm transition-all">
              {t.tryFree}
            </AppLink>
          </div>

          {/* Weekly Pass (Featured) */}
          <div className="bg-white border-2 border-lexis-action p-7 md:p-8 rounded-3xl flex flex-col justify-between relative lexis-lift md:-translate-y-3">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-lexis-action text-lexis-navy font-bold text-[10px] uppercase tracking-wider px-3.5 py-1 rounded-full whitespace-nowrap">
              {t.mostPopular}
            </span>
            <div>
              <h2 className="font-display font-semibold text-xl text-lexis-action-dark mb-2">{t.weeklyTitle}</h2>
              <p className="text-sm text-lexis-ink/55 mb-6">{t.weeklySub}</p>
              <div className="font-display font-semibold text-5xl text-lexis-ink mb-2 tracking-tight">฿{PRICING.weekly.thb} <span className="font-sans text-xs font-normal text-lexis-ink/45 tracking-normal">{t.perWeek}</span></div>
              <p className="text-[11px] leading-snug text-lexis-ink/45 mb-5">{t.noRenew}</p>
              <ul className="text-sm space-y-3.5 text-lexis-ink/75 mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.weeklyFeature1}</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.weeklyFeature2}</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.weeklyFeature3}</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('weekly')}
              disabled={loadingTier === 'weekly'}
              className="w-full min-h-[48px] py-3.5 bg-lexis-action hover:bg-lexis-action-dark disabled:opacity-60 text-lexis-navy font-semibold rounded-2xl text-sm text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'weekly' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <span>{t.getStartedNow}</span>}
            </button>
          </div>

          {/* Monthly Pass */}
          <div className="bg-white border border-lexis-ink/10 p-7 md:p-8 rounded-3xl flex flex-col justify-between lexis-lift-hover">
            <div>
              <h2 className="font-display font-semibold text-xl text-teal-700 mb-2">{t.monthlyTitle}</h2>
              <p className="text-sm text-lexis-ink/55 mb-6">{t.monthlySub}</p>
              <div className="font-display font-semibold text-5xl text-lexis-ink mb-2 tracking-tight">฿{PRICING.monthly.thb} <span className="font-sans text-xs font-normal text-lexis-ink/45 tracking-normal">{t.perMonth}</span></div>
              <p className="text-[11px] leading-snug text-lexis-ink/45 mb-5">{t.noRenewMonthly}</p>
              <ul className="text-sm space-y-3.5 text-lexis-ink/75 mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.monthlyFeature1(MONTHLY_SAVINGS_VS_WEEKLY_PCT)}</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.monthlyFeature2}</span></li>
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.monthlyFeature3}</span></li>
              </ul>
            </div>
            <button
              onClick={() => startCheckout('monthly')}
              disabled={loadingTier === 'monthly'}
              className="w-full min-h-[44px] py-3 bg-lexis-canvas hover:bg-lexis-ink/5 disabled:opacity-60 border border-lexis-ink/10 text-lexis-ink font-bold rounded-xl text-sm text-center transition-all flex items-center justify-center space-x-2"
            >
              {loadingTier === 'monthly' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <span>{t.getStartedNow}</span>}
            </button>
          </div>
        </div>

        {/* LEXIS Community pay-it-forward add-on — one flat amount added
            to whichever pass the visitor buys next (backend/app.mjs's
            /api/stripe/checkout appends it as a second one-time line
            item). Since passes stopped being subscriptions it is a single
            donation per pass rather than a standing commitment, so it
            cannot outlive the purchase that started it. Deliberately
            plan-agnostic here since the checkbox is above all three cards,
            not inside one. */}
        <label className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-8 px-6 text-center text-xs text-lexis-ink/60 cursor-pointer">
          <input
            type="checkbox"
            checked={sponsorAdd}
            onChange={(e) => setSponsorAdd(e.target.checked)}
            className="rounded border-lexis-ink/20 text-teal-600 focus:ring-teal-600"
          />
          <span>{t.sponsorLabel(SPONSOR_ADDON_THB)}</span>
          <AppLink
            to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo} className="text-teal-700 hover:text-teal-800 underline underline-offset-2"
          >
            {t.sponsorLearnMore}
          </AppLink>
        </label>

        {!session && (
          <p className="text-center text-xs text-lexis-ink/40 mt-4">
            {t.signInNote}
          </p>
        )}
      </section>

      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-lexis-ink/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-lexis-ink/40">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" aria-hidden="true" />
          <span>{t.footerTrust}</span>
        </div>
        <div className="flex items-center gap-4">
          {/* Community now has a real /th route too (22 Aug 2026) — link
              destination follows lang like everywhere else on this page.
              Terms/Privacy/Refund still English-only, unchanged. */}
          <AppLink to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{t.community}</AppLink>
          <AppLink to="/privacy" navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{t.privacy}</AppLink>
          <AppLink to="/terms" navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{t.terms}</AppLink>
          <AppLink to="/refund" navigateTo={navigateTo} className="hover:text-lexis-ink transition-colors">{t.refunds}</AppLink>
          <span>© 2026 LEXIS</span>
        </div>
      </footer>
    </div>
  );
}
