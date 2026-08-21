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
import React from 'react';
import { ArrowLeft, Heart, Building2, Mail, Target, Coins, ArrowRight } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useSeo } from '../lib/useSeo';
import { SITE_URL } from '../data/structuredData';
import { SPONSOR_ADDON_THB } from '../content/facts';

export default function CommunityPage({ navigateTo }) {
  useSeo({
    title: 'LEXIS Community | Speaking Opens Doors',
    description: 'LEXIS Community: every subscription can help fund free and discounted spoken-practice access for students and youth groups who couldn’t otherwise afford it.',
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

      <section className="w-full max-w-3xl mx-auto px-6 pt-16 pb-10 text-center md:text-left">
        <div className="inline-flex items-center space-x-2 px-3 py-1 bg-teal-600/10 border border-teal-600/20 rounded-full text-xs text-teal-700 mb-6">
          <Heart className="w-3.5 h-3.5" />
          <span>LEXIS Community</span>
        </div>
        <h1 className="font-display font-semibold text-5xl md:text-6xl leading-[0.98] text-balance text-lexis-ink">
          Speaking opens doors.
        </h1>
        <p className="mt-6 text-lg text-lexis-ink/70 leading-relaxed max-w-2xl mx-auto md:mx-0">
          A confident conversation can lead to an interview. An interview can lead to a job.
          A job can lead to a whole different life. LEXIS Community exists so that door isn't
          only open to people who can afford to walk through it, funded entirely by the people
          already using LEXIS every day.
        </p>
      </section>

      <section className="w-full py-16 bg-lexis-ink">
        <p className="max-w-3xl mx-auto px-6 font-display font-semibold text-3xl md:text-4xl leading-tight text-center text-white text-balance">
          Your practice can open someone else's door.
        </p>
      </section>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-14">
        <div className="space-y-10 text-sm text-lexis-ink/80 leading-relaxed">
          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <Coins className="w-5 h-5 text-teal-600" />
              How it's funded
            </h2>
            <p className="mt-3 text-base">
              At checkout, every subscriber can choose to add ฿{SPONSOR_ADDON_THB} to
              their plan, no lecture, no guilt trip, just one optional tap. It rides your
              regular billing cycle, so there's never a separate charge to think about. Do
              that, and you're not just paying for your own practice anymore, you're funding
              someone else's first conversation too.
            </p>
          </div>

          <div className="bg-white border-2 border-teal-600/30 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
            <div className="p-2.5 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700 flex-shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-lexis-ink">Our first goal: 100 sponsors</h2>
              <p className="mt-2 text-sm text-lexis-ink/60 leading-relaxed">
                That's enough to genuinely fund a partner school's first cohort, not a symbolic
                gesture. We're not there yet, and we're not pretending otherwise. We'll post an
                update here as we get closer, and shout about it properly once we hit it.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-teal-600" />
              Where the money actually goes
            </h2>
            <p className="mt-3 text-base">
              Every sponsor contribution lands in one shared pool, not a separate account tied
              to one student. As that pool grows, it covers the cost of real LEXIS access for
              real students through partner schools and youth organizations, discounted or free
              seats for a whole group, not one-off case-by-case requests. No hidden layer, no
              admin fee skimmed off the top: subscriptions in, funded access out, for as many
              students as the pool can currently support.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-teal-600" />
              For schools and community organizations
            </h2>
            <p className="mt-3 text-base">
              We're building out partnerships with schools, youth centers, and community
              organizations in Thailand directly, heavily discounted access for real groups of
              students, not individual case-by-case requests. This is genuinely just getting
              started. If you run or know an organization that would want to be one of the
              first through the door, we want to hear from you.
            </p>
          </div>

          <div>
            <h2 className="font-display font-semibold text-xl text-lexis-ink pt-2 flex items-center gap-2">
              <Mail className="w-5 h-5 text-teal-600" />
              Get in touch
            </h2>
            <p className="mt-3 text-base">
              Want to sponsor a seat, partner as a school or organization, or just ask a
              question? Email{' '}
              <a href="mailto:privacy@learnwithlexis.com" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">
                privacy@learnwithlexis.com
              </a>{' '}
              and it'll reach us directly, no ticket system, no runaround.
            </p>
          </div>
        </div>

        <div className="mt-14 text-center">
          <button
            onClick={() => navigateTo('/pricing')}
            className="inline-flex items-center gap-2 bg-lexis-action hover:bg-lexis-action-dark text-white font-bold text-sm px-8 py-3.5 rounded-xl transition-all hover:scale-105"
          >
            <Heart className="w-4 h-4" />
            <span>Add your ฿{SPONSOR_ADDON_THB}, open a door</span>
          </button>
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
