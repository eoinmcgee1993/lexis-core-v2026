// frontend/src/pages/CommunityPage.jsx
//
// LEXIS Community — the access/sponsorship initiative, confirmed directly
// by Eoin on 19 Aug 2026. Framed around access and partnership, not
// charity: no "disadvantaged," "poor," or "needy" anywhere on this page,
// deliberately. Two real mechanisms exist today, both described honestly
// rather than oversold:
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
import React from 'react';
import { ArrowLeft, Heart, Building2, Mail } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL } from '../data/structuredData';
import { SPONSOR_ADDON_THB } from '../content/facts';

export default function CommunityPage({ navigateTo }) {
  useSeo({
    title: 'LEXIS Community | LEXIS',
    description: 'LEXIS Community brings real-time voice practice to students and youth groups who couldn’t otherwise access it, funded by paying subscribers who choose to sponsor a seat.',
    canonical: `${SITE_URL}/community`
  });

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-3xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <button
          onClick={() => navigateTo('/')}
          className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </button>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">LEXIS</span>
        </div>
        <div className="w-16" />
      </header>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-3xl mb-2 text-lexis-ink">LEXIS Community</h1>
        <p className="text-sm text-lexis-ink/60 mb-10 leading-relaxed">
          We believe spoken language practice is a bridge to opportunity: interviews,
          travel, work, further study. LEXIS Community exists to extend that practice
          to students and youth groups who couldn't otherwise access it, funded by the
          people already using LEXIS every day.
        </p>

        <div className="space-y-8 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-teal-600" />
              How it's funded
            </h2>
            <p className="mt-2">
              At checkout, every subscriber can choose to add ฿{SPONSOR_ADDON_THB} to
              their plan to sponsor a student's practice time. It's optional, it's the
              same small amount every time, and it rides your regular billing cycle,
              no separate charge to think about. That pool is what funds free and
              discounted access for the students and youth groups we work with.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              For schools and community organizations
            </h2>
            <p className="mt-2">
              We're building out partnerships with schools, youth centers, and
              community organizations in Thailand directly: heavily discounted
              access for real groups of students, not individual case-by-case
              requests. This is genuinely just getting started, so if you run or know
              an organization that would want to be one of the first, we'd like to
              hear from you.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2 flex items-center gap-2">
              <Mail className="w-4 h-4 text-teal-600" />
              Get in touch
            </h2>
            <p className="mt-2">
              Whether you want to sponsor a seat, partner as a school or organization,
              or just have questions about how this works, email{' '}
              <a href="mailto:privacy@learnwithlexis.com" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">
                privacy@learnwithlexis.com
              </a>{' '}
              and it'll reach us directly.
            </p>
          </div>
        </div>
      </section>

      <footer className="w-full max-w-3xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div>© 2026 LEXIS</div>
        <button onClick={() => navigateTo('/pricing')} className="hover:text-lexis-ink transition-colors">
          View pricing
        </button>
      </footer>
    </div>
  );
}
