// frontend/src/pages/TermsPage.jsx
//
// Scaffolded per the remediation brief's U6 finding (no terms page
// existed at all). Every business/legal decision this page needed
// (abuse definition, change-notification process, governing law/entity)
// was confirmed directly by Eoin on 19 Aug 2026 — no more <Todo> markers
// on this page. See PrivacyPage.jsx for the shared entity/jurisdiction
// facts (same underlying answer, stated in both places).
import React from 'react';
import LegalPageShell from '../components/LegalPageShell';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd } from '../data/structuredData';
import { FAIR_USE, PRICING, TRIAL, VAT } from '../content/facts';
import AppLink from '../components/AppLink';

export default function TermsPage({ navigateTo }) {
  useSeo({
    title: 'Terms of Service | LEXIS',
    description: 'The terms for using LEXIS and subscribing to a paid plan.',
    canonical: `${SITE_URL}/terms`,
    jsonLd: { 'jsonld-breadcrumb': buildBreadcrumbJsonLd('Terms of Service', `${SITE_URL}/terms`) }
  });

  return (
    <LegalPageShell navigateTo={navigateTo} title="Terms of Service" lastUpdated="2 September 2026">
      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What LEXIS is</h2>
      <p>
        LEXIS is a voice conversation practice tool for spoken English
        and Thai, delivered through a web browser. A free trial gives
        every new account {TRIAL.minutes} minutes of practice
        {TRIAL.cardRequired ? '' : ', no card required'}. Paid access is
        sold as a pass: a single payment of ฿{PRICING.weekly.thb} for{' '}
        {PRICING.weekly.days} days, or ฿{PRICING.monthly.thb} for{' '}
        {PRICING.monthly.days} days, of unlimited practice. Payment is
        taken once through Stripe, by card or PromptPay. A pass does not
        renew and no further payment is taken unless you buy another one.
        {' '}{VAT.registered ? '' : 'No VAT applies: LEXIS is not a VAT-registered business.'}
      </p>

      {/* Fair use, added 4 Sep 2026. The paragraph above sells "unlimited
          practice" and the backend has always enforced a per-period ceiling
          (FAIR_USE_MINUTES in backend/app.mjs) that was disclosed in no
          user-facing copy at all — not here, not in the FAQ, not on the
          pricing page. An enforced-but-undisclosed limit is what makes the
          word "unlimited" a false claim rather than ordinary marketing;
          stating the clause is what makes it ordinary marketing again.
          Numbers come from facts.js so this cannot drift away from the
          pricing page the way the trial length once did. */}
      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Fair use</h2>
      <p>
        Practice on a pass is unlimited in the ordinary sense — there is
        no session limit and no daily allowance — subject to a fair-use
        ceiling of {FAIR_USE.weekly.minutes} minutes of live practice on a{' '}
        {PRICING.weekly.days}-day pass and {FAIR_USE.monthly.minutes}{' '}
        minutes on a {PRICING.monthly.days}-day pass. The ceiling exists
        because every minute of conversation costs LEXIS money in real
        time; it is not a soft target. A pass is one fair-use period, so
        if you reach the ceiling, live practice pauses for the rest of
        that pass and the rest of your account stays available. Buying
        another pass starts a fresh window straight away. Nothing renews
        by itself, here or anywhere else in LEXIS. Almost nobody reaches
        the ceiling: it works out at about{' '}
        {Math.round(FAIR_USE.weekly.minutes / PRICING.weekly.days)} minutes
        of talking every single day on the {PRICING.weekly.days}-day pass,
        and{' '}
        {Math.round(FAIR_USE.monthly.minutes / PRICING.monthly.days)} a day
        on the {PRICING.monthly.days}-day one.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Your account</h2>
      <p>
        You're responsible for keeping your login credentials to
        yourself and for activity on your account. LEXIS reserves the
        right to suspend an account for abuse of the service, which
        means: sharing one paid account across multiple people,
        attempting to extract the underlying AI model's system prompt
        or otherwise interfere with how it's instructed, and
        automated or bot usage of the service.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Cancelling</h2>
      <p>
        A pass is a one-off purchase, so there is no recurring payment to
        cancel: it simply ends when its days run out. Accounts that
        started a recurring plan before 2 September 2026 still have one,
        and can still stop it renewing from inside the app. See the
        {' '}<AppLink to="/refund" navigateTo={navigateTo} className="text-teal-700 hover:text-teal-800 underline underline-offset-2">Refund &amp; Cancellation Policy</AppLink>{' '}
        for both cases.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What LEXIS is not</h2>
      <p>
        LEXIS is a practice tool, not a certified language qualification,
        a substitute for professional language instruction, or a
        guarantee of any specific learning outcome. Feedback and
        corrections are generated by an AI model and may occasionally be
        wrong.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Changes to these terms</h2>
      <p>
        If these terms change in a material way, we'll show an in-app
        notice the next time you sign in. There's no separate email
        or SMS notification, so the in-app notice is the one place to
        check.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Governing law</h2>
      <p>
        LEXIS is operated by Eoin McGee, trading as Lexis (a sole
        trader), registered at 154 Moo 5, Suthep, Mueang, Chiang Mai
        50200, Thailand. These terms are governed by the laws of
        Thailand.
      </p>
    </LegalPageShell>
  );
}
