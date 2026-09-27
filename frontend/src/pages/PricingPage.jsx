import React, { useMemo, useState } from 'react';
import { ArrowLeft, Check, Loader2, AlertCircle, ShieldCheck, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useAuth } from '../context/AuthContext';
import { buildBreadcrumbJsonLd, buildOffersJsonLd, SITE_URL } from '../data/structuredData';
import { useSeo } from '../lib/useSeo';
import { trackEvent } from '../lib/analytics';
import { reportError } from '../lib/errorReporting';
import { FAIR_USE, LAUNCH_OFFER, LAUNCH_OFFER_PRICE_THB, launchOfferActive, MONTHLY_MINUTES_MULTIPLE, PRICING, PRICING_DESCRIPTION_EN, PRICING_DESCRIPTION_TH, SPONSOR_ADDON_THB, TRIAL, VAT } from '../content/facts';
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
    freeTrialNote: (minutes) => `No card required. ${minutes} minutes in total, however you split them across sessions.`,
    tryFree: 'Try Free',
    weeklyTitle: 'Weekly Pass',
    weeklySub: (mins) => `${mins} Minutes of Practice, ${PRICING.weekly.days} Days`,
    perWeek: `one-off · ${PRICING.weekly.days} days`,
    // "Most Popular" stood here until 23 Sep 2026. It was a claim about
    // other buyers with no buyers behind it (zero paid purchases at the
    // time), which facts.js's rule makes a false statement, not phrasing.
    // The featured card now says something true about itself instead.
    badgeOffer: `Launch offer · ${LAUNCH_OFFER.percentOff}% off`,
    badgeStart: 'Start here',
    offerPrice: (price, code) => `฿${price} with code ${code}`,
    offerBanner: (pct, code, max) => `Launch offer: ${pct}% off your first Weekly Pass with code ${code}. First ${max} buyers, while codes last, until 23 October.`,
    offerHow: 'Enter the code on the payment page.',
    weeklyFeature1: 'Use it in one sitting or across the week',
    weeklyFeature2: 'Full conversation history',
    weeklyFeature3: "LEXIS adjusts to your level as you go",
    noRenew: `Your pass ends by itself after ${PRICING.weekly.days} days — it never renews, and there is nothing to cancel.`,
    getStartedNow: 'Get Started Now',
    fairUse: () => 'That practice time is a fair-use ceiling, not a target — if you reach it, live practice pauses until you buy another pass.',
    monthlyTitle: 'Monthly Immersion',
    monthlySub: (mins) => `${mins} Minutes of Practice, ${PRICING.monthly.days} Days`,
    perMonth: `one-off · ${PRICING.monthly.days} days`,
    monthlyFeature1: (x) => `${x}× the practice time of a weekly pass`,
    monthlyFeature2: 'Use it in one sitting or across the month',
    monthlyFeature3: 'Great for building a daily habit',
    noRenewMonthly: `Your pass ends by itself after ${PRICING.monthly.days} days — it never renews, and there is nothing to cancel.`,
    signInNote: "You'll be asked to sign in before checkout.",
    sponsorLabel: (thb) => `Add ฿${thb} to sponsor a student's practice time through LEXIS Community`,
    // Names its destination (25 Sep 2026): a Semrush Site Audit flagged the
    // old bare "Learn more" as the site's one non-descriptive anchor. Link
    // text is what a crawler and a screen-reader link list see out of context.
    sponsorLearnMore: 'How LEXIS Community works',
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
    freeTrialNote: (minutes) => `ไม่ต้องผูกบัตร รวมทั้งหมด ${minutes} นาที จะแบ่งใช้กี่ครั้งก็ได้`,
    tryFree: 'ลองใช้ฟรี',
    weeklyTitle: 'แพ็กเกจรายสัปดาห์',
    weeklySub: (mins) => `ฝึกพูดได้ ${mins} นาที ใน ${PRICING.weekly.days} วัน`,
    perWeek: `จ่ายครั้งเดียว · ${PRICING.weekly.days} วัน`,
    badgeOffer: `โปรเปิดตัว ลด ${LAUNCH_OFFER.percentOff}%`,
    badgeStart: 'เริ่มต้นที่นี่',
    offerPrice: (price, code) => `฿${price} เมื่อใช้โค้ด ${code}`,
    offerBanner: (pct, code, max) => `โปรเปิดตัว: ลด ${pct}% สำหรับแพ็กเกจรายสัปดาห์แรกของคุณ ด้วยโค้ด ${code} เฉพาะ ${max} คนแรกเท่านั้น ถึง 23 ตุลาคม`,
    offerHow: 'ใส่โค้ดในหน้าชำระเงิน',
    weeklyFeature1: 'ใช้รวดเดียวหรือแบ่งใช้ทั้งสัปดาห์ก็ได้',
    weeklyFeature2: 'ประวัติการสนทนาแบบเต็ม',
    weeklyFeature3: 'LEXIS ปรับให้เหมาะกับระดับของคุณไปเรื่อย ๆ',
    noRenew: `แพ็กเกจจะสิ้นสุดเองหลังจาก ${PRICING.weekly.days} วัน ไม่มีการต่ออายุอัตโนมัติ และไม่ต้องยกเลิก`,
    getStartedNow: 'เริ่มเลย',
    fairUse: () => 'เวลาดังกล่าวเป็นเพดานการใช้งานอย่างเป็นธรรม ไม่ใช่เป้าหมาย หากใช้ครบ การฝึกพูดสดจะหยุดจนกว่าจะซื้อแพ็กเกจใหม่',
    monthlyTitle: 'แพ็กเกจรายเดือน',
    monthlySub: (mins) => `ฝึกพูดได้ ${mins} นาที ใน ${PRICING.monthly.days} วัน`,
    perMonth: `จ่ายครั้งเดียว · ${PRICING.monthly.days} วัน`,
    monthlyFeature1: (x) => `เวลาฝึกมากกว่าแพ็กเกจรายสัปดาห์ ${x} เท่า`,
    monthlyFeature2: 'ใช้รวดเดียวหรือแบ่งใช้ทั้งเดือนก็ได้',
    monthlyFeature3: 'เหมาะสำหรับสร้างนิสัยฝึกทุกวัน',
    noRenewMonthly: `แพ็กเกจจะสิ้นสุดเองหลังจาก ${PRICING.monthly.days} วัน ไม่มีการต่ออายุอัตโนมัติ และไม่ต้องยกเลิก`,
    signInNote: 'คุณจะต้องเข้าสู่ระบบก่อนชำระเงิน',
    sponsorLabel: (thb) => `เพิ่ม ฿${thb} เพื่อสนับสนุนเวลาฝึกพูดให้นักเรียนผ่าน LEXIS Community`,
    sponsorLearnMore: 'LEXIS Community ทำงานอย่างไร',
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
  const offerOn = launchOfferActive();
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
          to={lang === 'th' ? '/th' : '/'} navigateTo={navigateTo} className="flex items-center space-x-2 text-sm text-lexis-ink/70 hover:text-lexis-ink transition-colors flex-shrink-0"
          >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>{t.home}</span>
        </AppLink>
        <div className="flex items-center space-x-3">
          <LexisMark className="w-9 h-9" />
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
        <p className="text-center text-base text-lexis-ink/75 max-w-xl mx-auto">{t.sub}</p>
        <p className="text-center text-xs text-lexis-ink/65 mt-2 mb-12 md:mb-16">
          {t.vat}
        </p>

        {/* Launch offer (facts.js LAUNCH_OFFER). Real discount, real cap,
            real deadline: the only urgency on the page, and it switches
            itself off at endsAt. Amber because it is a call to act. */}
        {offerOn && (
          <div className="mb-8 md:mb-10 mx-auto max-w-2xl px-5 py-4 rounded-2xl bg-lexis-action/10 border border-lexis-action/40 text-center">
            <p className="text-sm md:text-base font-semibold text-lexis-ink">{t.offerBanner(LAUNCH_OFFER.percentOff, LAUNCH_OFFER.code, LAUNCH_OFFER.maxRedemptions)}</p>
            <p className="mt-1 text-xs md:text-sm text-lexis-ink/70">{t.offerHow}</p>
          </div>
        )}

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

        {/* LEXIS Community pay-it-forward add-on — one flat amount added to
            whichever pass the visitor buys next (backend/app.mjs's
            /api/stripe/checkout puts it in as a second one-time line item).
            Since passes stopped being subscriptions it is a single donation
            per pass rather than a standing commitment, so it cannot outlive
            the purchase that started it. Plan-agnostic because it sits
            outside all three cards rather than inside one.

            It used to sit BELOW the grid — which meant it was below every
            buy button on the page, so the ordinary path was to click Get
            Started and never see it. An add-on offered after the checkout
            has already begun is not an offer. It reads slightly oddly above
            the prices it modifies, and that is the trade: being seen beats
            being in the tidiest place.

            Missing it here is no longer final either — Stripe now shows the
            same add-on on the checkout page itself for anyone who arrives
            with the box unticked (optional_items, same endpoint). */}
        <div className="flex justify-center mb-12">
          {/* Given a border and a ground rather than left as loose text. As
              bare copy it sat a few pixels off the MOST POPULAR badge on the
              middle card and read as a stray caption belonging to it; as a
              bounded control it reads as its own offer, which is what it is.
              rounded-2xl, not -full: the label wraps to two lines on a phone
              and a pill shape does not survive that. */}
          {/* The box is a sibling of the <label> rather than wrapped by it,
              which is not the shorter spelling and is the correct one here:
              Learn more is a LINK inside that copy, and a click on a link
              nested in a label both follows it and toggles the box. htmlFor
              keeps the association a screen reader needs while leaving the
              link outside the thing being toggled.

              items-start with a fixed-width box, rather than a wrapping
              centred row: on a phone the label runs to two lines, and
              centring left the checkbox stranded alone above them. */}
          <div className="inline-flex items-start gap-2.5 max-w-xl px-4 py-2.5 bg-white/70 border border-lexis-ink/10 hover:border-teal-600/40 rounded-2xl text-left text-xs text-lexis-ink/75 transition-colors">
            <input
              id="sponsor-add"
              type="checkbox"
              checked={sponsorAdd}
              onChange={(e) => setSponsorAdd(e.target.checked)}
              className="mt-0.5 flex-shrink-0 rounded border-lexis-ink/20 text-teal-600 focus:ring-teal-600 cursor-pointer"
            />
            <span>
              <label htmlFor="sponsor-add" className="cursor-pointer">{t.sponsorLabel(SPONSOR_ADDON_THB)}</label>{' '}
              <AppLink
                to={lang === 'th' ? '/th/community' : '/community'} navigateTo={navigateTo} className="text-teal-700 hover:text-teal-800 underline underline-offset-2 whitespace-nowrap"
              >
                {t.sponsorLearnMore}
              </AppLink>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="bg-white border border-lexis-ink/10 p-7 md:p-8 rounded-3xl flex flex-col justify-between lexis-lift-hover">
            <div>
              <h2 className="font-display font-semibold text-xl text-teal-700 mb-2">{t.freeTrialTitle}</h2>
              <p className="text-sm text-lexis-ink/70 mb-6">{t.freeTrialSub(TRIAL.minutes)}</p>
              <div className="font-display font-semibold text-5xl text-lexis-ink mb-2 tracking-tight">฿0</div>
              {/* The free card had two bullets against the paid cards' three
                  plus a note, so in an equal-height 3-up grid it rendered
                  with ~110px of dead space above its CTA — visible only by
                  screenshotting the built page, not by reading the JSX.
                  Filled with facts already canonical in facts.js rather
                  than invented copy: TRIAL.cardRequired is false, and the
                  trial is 15 minutes TOTAL (max_allowed_seconds = 900,
                  however split across sessions). The second half earns its
                  place independently — people assume a free trial resets
                  daily, and this one does not. */}
              <p className="text-[11px] leading-snug text-lexis-ink/45 mb-5">{t.freeTrialNote(TRIAL.minutes)}</p>
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
              {offerOn ? t.badgeOffer : t.badgeStart}
            </span>
            <div>
              <h2 className="font-display font-semibold text-xl text-lexis-action-dark mb-2">{t.weeklyTitle}</h2>
              <p className="text-sm text-lexis-ink/70 mb-6">{t.weeklySub(FAIR_USE.weekly.minutes)}</p>
              <div className="font-display font-semibold text-5xl text-lexis-ink mb-2 tracking-tight">฿{PRICING.weekly.thb} <span className="font-sans text-xs font-normal text-lexis-ink/45 tracking-normal">{t.perWeek}</span></div>
              {offerOn && (
                <p className="text-sm font-semibold text-lexis-action-dark mb-2">{t.offerPrice(LAUNCH_OFFER_PRICE_THB, LAUNCH_OFFER.code)}</p>
              )}
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
              <p className="text-sm text-lexis-ink/70 mb-6">{t.monthlySub(FAIR_USE.monthly.minutes)}</p>
              <div className="font-display font-semibold text-5xl text-lexis-ink mb-2 tracking-tight">฿{PRICING.monthly.thb} <span className="font-sans text-xs font-normal text-lexis-ink/45 tracking-normal">{t.perMonth}</span></div>
              <p className="text-[11px] leading-snug text-lexis-ink/45 mb-5">{t.noRenewMonthly}</p>
              <ul className="text-sm space-y-3.5 text-lexis-ink/75 mb-8">
                <li className="flex items-start gap-2.5"><Check className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" aria-hidden="true" /><span>{t.monthlyFeature1(MONTHLY_MINUTES_MULTIPLE)}</span></li>
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

        {/* Fair use, stated BEFORE the buy button rather than only in the
            Terms, and deliberately NOT inside the !session branch — a
            signed-in returning buyer needs it as much as a new one.

            The cards used to say "Unlimited Practice for 7 Days" while the
            backend enforced a per-period ceiling disclosed nowhere. The
            first fix (4 Sep, morning) was this line: state the clause and
            leave the word, since plenty of products do exactly that. The
            word is now gone too, at the owner's request — the cards lead
            with the minutes themselves.

            So this line no longer repeats the numbers, which are three
            inches above it. It says the thing the numbers do not: that the
            ceiling is real, and what actually happens when you hit it. */}
        <p className="text-center text-xs text-lexis-ink/65 mt-8">
          {t.fairUse()}
        </p>

        {!session && (
          <p className="text-center text-xs text-lexis-ink/65 mt-4">
            {t.signInNote}
          </p>
        )}
      </section>

      <footer className="w-full max-w-6xl mx-auto p-6 border-t border-lexis-ink/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-lexis-ink/65">
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
