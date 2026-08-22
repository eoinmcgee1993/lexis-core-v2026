// frontend/src/pages/CommunityPage.jsx
//
// LEXIS Community — the access/sponsorship initiative, confirmed directly
// by Eoin on 19 Aug 2026. Framed around access and partnership, not
// charity: no "disadvantaged," "poor," or "needy" anywhere on this page,
// deliberately (true of the Thai copy below too — see the "no fabricated
// numbers" note that follows). Two real mechanisms exist today, both
// described honestly rather than oversold:
//   1. The pay-it-forward checkout add-on (PricingPage.jsx, backend
//      /api/stripe/checkout's sponsorAdd) — live now, funds the pool.
//   2. Institutional discount codes via Stripe's existing
//      allow_promotion_codes — the mechanism already works today; what's
//      actually missing is a real school/org partner and a coupon Eoin
//      creates in the Stripe dashboard once one exists. Not claimed as
//      "live" here since no such code exists yet.
// No specific number of students/schools helped is claimed anywhere on
// this page — the program is genuinely just launching, and a fabricated
// impact number would be worse than no number at all.
//
// Rewritten 20 Aug 2026 for tone, not facts: reported live as "bland,
// boring, zero enthusiasm." Every claim below is identical to the
// version before it — same mechanism, same honesty constraints, same
// "no fabricated numbers" rule — only the energy of the language and the
// weight given to the mission statement changed. A related, much larger
// PR (#69, a full Community vertical with live telemetry/a calculator/
// partner-application backend) was reviewed and closed as over-scoped
// for a program with one live mechanism and zero confirmed partners —
// see PARTNER-CODES.md and that PR's closing comment. This page borrows
// exactly one thing from it: the "Speaking opens doors" framing, which
// was genuinely good, without any of what made that PR too big to ship.
//
// /th/community added 22 Aug 2026, direct request ("there shoukd be a
// language toggle on each page too") — same lang-prop pattern as
// LandingPage.jsx/PricingPage.jsx (Stage 4): a real, indexable /th route,
// not a client-side toggle. Same honesty constraints carried over
// exactly — no fabricated numbers, no charity framing, in either
// language.
import React, { useMemo } from 'react';
import { ArrowLeft, Heart, Building2, Mail, Target, Coins, ArrowRight, Globe } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd } from '../data/structuredData';
import { SPONSOR_ADDON_THB } from '../content/facts';

const TEXT = {
  en: {
    home: 'Home',
    badge: 'LEXIS Community',
    h1: 'Speaking opens doors.',
    intro: "A confident conversation can lead to an interview. An interview can lead to a job. A job can lead to a whole different life. LEXIS Community exists so that door isn't only open to people who can afford to walk through it, funded entirely by the people already using LEXIS every day.",
    bigLine: "Your practice can open someone else's door.",
    fundedHeading: "How it's funded",
    fundedBody: `At checkout, every subscriber can choose to add ฿${SPONSOR_ADDON_THB} to their plan, no lecture, no guilt trip, just one optional tap. It rides your regular billing cycle, so there's never a separate charge to think about. Do that, and you're not just paying for your own practice anymore, you're funding someone else's first conversation too.`,
    goalHeading: 'Our first goal: 100 sponsors',
    goalBody: "That's enough to genuinely fund a partner school's first cohort, not a symbolic gesture. We're not there yet, and we're not pretending otherwise. We'll post an update here as we get closer, and shout about it properly once we hit it.",
    whereHeading: 'Where the money actually goes',
    whereBody: 'Every sponsor contribution lands in one shared pool, not a separate account tied to one student. As that pool grows, it covers the cost of real LEXIS access for real students through partner schools and youth organizations, discounted or free seats for a whole group, not one-off case-by-case requests. No hidden layer, no admin fee skimmed off the top: subscriptions in, funded access out, for as many students as the pool can currently support.',
    schoolsHeading: 'For schools and community organizations',
    schoolsBody: "We're building out partnerships with schools, youth centers, and community organizations in Thailand directly, heavily discounted access for real groups of students, not individual case-by-case requests. This is genuinely just getting started. If you run or know an organization that would want to be one of the first through the door, we want to hear from you.",
    contactHeading: 'Get in touch',
    contactBody1: 'Want to sponsor a seat, partner as a school or organization, or just ask a question? Email',
    contactBody2: 'and it\'ll reach us directly, no ticket system, no runaround.',
    ctaButton: `Add your ฿${SPONSOR_ADDON_THB}, open a door`,
    footerPricing: 'View pricing',
    seoTitle: 'LEXIS Community | Speaking Opens Doors',
    seoDescription: 'LEXIS Community: every subscription can help fund free and discounted spoken-practice access for students and youth groups who couldn’t otherwise afford it.'
  },
  th: {
    home: 'หน้าแรก',
    badge: 'LEXIS Community',
    h1: 'การพูดเปิดประตูได้',
    intro: 'บทสนทนาที่มั่นใจนำไปสู่การสัมภาษณ์ได้ การสัมภาษณ์นำไปสู่งานได้ งานนำไปสู่ชีวิตที่ต่างออกไปได้ LEXIS Community มีอยู่เพื่อให้ประตูบานนั้นไม่ได้เปิดเฉพาะคนที่จ่ายไหวเท่านั้น ทุนทั้งหมดมาจากคนที่ใช้ LEXIS อยู่ทุกวันนี้เอง',
    bigLine: 'การฝึกของคุณเปิดประตูให้คนอื่นได้',
    fundedHeading: 'ทุนมาจากไหน',
    fundedBody: `ตอนชำระเงิน สมาชิกทุกคนเลือกเพิ่ม ฿${SPONSOR_ADDON_THB} เข้าไปในแพ็กเกจได้ ไม่มีการสอน ไม่มีการกดดัน แค่แตะเลือกเพิ่มเติมครั้งเดียว รวมอยู่ในรอบบิลปกติ จึงไม่มีการเรียกเก็บแยกให้ต้องคิดถึง ทำแบบนั้นแล้ว คุณไม่ได้จ่ายแค่เพื่อการฝึกของตัวเองอีกต่อไป แต่กำลังสนับสนุนบทสนทนาแรกของคนอื่นด้วย`,
    goalHeading: 'เป้าหมายแรกของเรา: ผู้สนับสนุน 100 คน',
    goalBody: 'จำนวนนี้เพียงพอที่จะสนับสนุนรุ่นแรกของโรงเรียนพันธมิตรได้จริง ไม่ใช่แค่ท่าทีเชิงสัญลักษณ์ เรายังไปไม่ถึงตรงนั้น และเราไม่แสร้งว่าถึงแล้ว จะอัปเดตความคืบหน้าไว้ที่นี่ และประกาศให้เต็มที่เมื่อถึงเป้าหมายจริง',
    whereHeading: 'เงินไปไหนจริง ๆ',
    whereBody: 'เงินสนับสนุนทุกบาทเข้ากองทุนเดียวกัน ไม่ใช่บัญชีแยกผูกกับนักเรียนคนใดคนหนึ่ง เมื่อกองทุนโตขึ้น จะครอบคลุมค่าใช้จ่ายให้นักเรียนจริงเข้าถึง LEXIS ได้จริงผ่านโรงเรียนและกลุ่มเยาวชนพันธมิตร เป็นที่นั่งลดราคาหรือฟรีให้ทั้งกลุ่ม ไม่ใช่คำขอเป็นรายกรณี ไม่มีชั้นซ่อนเร้น ไม่มีค่าธรรมเนียมบริหารหักออก สมัครสมาชิกเข้ามา ทุนการเข้าถึงออกไป เท่าที่กองทุนรองรับได้ในตอนนั้น',
    schoolsHeading: 'สำหรับโรงเรียนและองค์กรชุมชน',
    schoolsBody: 'เรากำลังสร้างความร่วมมือกับโรงเรียน ศูนย์เยาวชน และองค์กรชุมชนในไทยโดยตรง เป็นการเข้าถึงลดราคาอย่างมากสำหรับกลุ่มนักเรียนจริง ไม่ใช่คำขอรายบุคคล นี่เพิ่งเริ่มต้นจริง ๆ ถ้าคุณดำเนินการหรือรู้จักองค์กรที่อยากเป็นกลุ่มแรก ๆ เราอยากได้ยินจากคุณ',
    contactHeading: 'ติดต่อเรา',
    contactBody1: 'อยากสนับสนุนที่นั่ง เป็นพันธมิตรในฐานะโรงเรียนหรือองค์กร หรือแค่มีคำถาม อีเมลมาที่',
    contactBody2: 'ข้อความจะถึงเราโดยตรง ไม่มีระบบตั๋ว ไม่มีการวนไปวนมา',
    ctaButton: `เพิ่ม ฿${SPONSOR_ADDON_THB} ของคุณ เปิดประตูให้คนอื่น`,
    footerPricing: 'ดูราคา',
    seoTitle: 'LEXIS Community | การพูดเปิดประตูได้',
    seoDescription: 'LEXIS Community: การสมัครสมาชิกทุกครั้งช่วยสนับสนุนการเข้าถึงการฝึกพูดแบบฟรีและลดราคาให้นักเรียนและกลุ่มเยาวชนที่ไม่สามารถจ่ายได้ด้วยตัวเอง'
  }
};

export default function CommunityPage({ navigateTo, lang = 'en' }) {
  const enUrl = `${SITE_URL}/community`;
  const thUrl = `${SITE_URL}/th/community`;
  const pageUrl = lang === 'th' ? thUrl : enUrl;
  const t = TEXT[lang];

  const breadcrumbJsonLd = useMemo(
    () => buildBreadcrumbJsonLd(lang === 'th' ? 'LEXIS Community' : 'LEXIS Community', pageUrl, lang),
    [lang, pageUrl]
  );

  useSeo({
    title: t.seoTitle,
    description: t.seoDescription,
    canonical: pageUrl,
    htmlLang: lang,
    hreflang: [
      { hrefLang: 'en', href: enUrl },
      { hrefLang: 'th', href: thUrl },
      { hrefLang: 'x-default', href: enUrl }
    ],
    jsonLd: { 'jsonld-breadcrumb': breadcrumbJsonLd }
  });

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-3xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <button
          onClick={() => navigateTo(lang === 'th' ? '/th' : '/')}
          className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.home}</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">LEXIS</span>
        </div>
        <button
          onClick={() => navigateTo(lang === 'en' ? thUrl.replace(SITE_URL, '') : enUrl.replace(SITE_URL, ''))}
          aria-label={lang === 'en' ? 'Switch page language to Thai' : 'Switch page language to English'}
          className="flex items-center gap-1 text-xs text-lexis-ink/50 hover:text-lexis-ink transition-colors min-h-[44px] px-1"
        >
          <Globe className="w-4 h-4 text-teal-700" />
          <span>{lang === 'en' ? 'ไทย' : 'EN'}</span>
        </button>
      </header>

      <section className="w-full max-w-3xl mx-auto px-6 pt-16 pb-10 text-center md:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-6">
          <Heart className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </div>
        <h1 className="font-display font-semibold text-5xl md:text-6xl leading-[0.98] text-balance text-lexis-ink">
          {t.h1}
        </h1>
        <p className="mt-6 text-lg text-lexis-ink/70 leading-relaxed max-w-2xl mx-auto md:mx-0">
          {t.intro}
        </p>
      </section>

      <section className="w-full py-16 bg-lexis-ink">
        <p className="max-w-3xl mx-auto px-6 font-display font-semibold text-3xl md:text-4xl leading-tight text-center text-white text-balance">
          {t.bigLine}
        </p>
      </section>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-14">
        <div className="space-y-10 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              {t.fundedHeading}
            </h2>
            <p className="mt-3 text-base">{t.fundedBody}</p>
          </div>

          <div className="bg-white border-2 border-teal-600/30 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
            <div className="p-2.5 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700 flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-lexis-ink">{t.goalHeading}</h2>
              <p className="mt-2 text-sm text-lexis-ink/60 leading-relaxed">{t.goalBody}</p>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-teal-600" />
              {t.whereHeading}
            </h2>
            <p className="mt-3 text-base">{t.whereBody}</p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              {t.schoolsHeading}
            </h2>
            <p className="mt-3 text-base">{t.schoolsBody}</p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              {t.contactHeading}
            </h2>
            <p className="mt-3 text-base">
              {t.contactBody1}{' '}
              <a href="mailto:privacy@learnwithlexis.com" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">
                privacy@learnwithlexis.com
              </a>{' '}
              {t.contactBody2}
            </p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => navigateTo(lang === 'th' ? '/th/pricing' : '/pricing')}
            className="inline-flex items-center gap-2 bg-lexis-action hover:bg-lexis-action-dark text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all hover:scale-105"
          >
            <Heart className="w-4 h-4" />
            <span>{t.ctaButton}</span>
          </button>
        </div>
      </section>

      <footer className="w-full max-w-3xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div>© 2026 LEXIS</div>
        <button onClick={() => navigateTo(lang === 'th' ? '/th/pricing' : '/pricing')} className="hover:text-lexis-ink transition-colors">
          {t.footerPricing}
        </button>
      </footer>
    </div>
  );
}
