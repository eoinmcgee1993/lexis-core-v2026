// frontend/src/pages/RefundPage.jsx
//
// Scaffolded per the remediation brief's U6 finding. The cancellation
// mechanism, what happens to time already paid for, and the refund
// policy were all confirmed directly by Eoin on 19 Aug 2026 — no more
// <Todo> markers on this page. The self-serve "Cancel Plan" button this
// page describes lives in WelcomeStage.jsx, calling POST
// /api/stripe/cancel in backend/app.mjs.
import React from 'react';
import LegalPageShell from '../components/LegalPageShell';
import { useSeo } from '../lib/useSeo';
import { SITE_URL } from '../data/structuredData';
import { PRICING } from '../content/facts';

export default function RefundPage({ navigateTo }) {
  useSeo({
    title: 'Refund & Cancellation Policy | LEXIS',
    description: 'How cancelling a LEXIS plan works and the current refund policy.',
    canonical: `${SITE_URL}/refund`
  });

  return (
    <LegalPageShell navigateTo={navigateTo} title="Refund & Cancellation Policy" lastUpdated="19 August 2026">
      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Cancelling a plan</h2>
      <p>
        You can stop a {PRICING.weekly.period}ly or {PRICING.monthly.period}ly
        plan from renewing at any time with the "Cancel Plan" button in
        the app — no need to email support or wait on a reply.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What happens to time you've already paid for</h2>
      <p>
        Cancelling stops future renewal only — it doesn't cut off access
        immediately. You keep full access for the rest of the{' '}
        {PRICING.weekly.period}ly or {PRICING.monthly.period}ly period
        you've already paid for, and it simply won't renew after that.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Refunds</h2>
      <p>
        LEXIS does not offer refunds, including for partial periods.
        Cancelling stops future billing (see above), but past payments
        aren't refunded.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">The free trial</h2>
      <p>
        The free trial itself is not a paid purchase, so no refund
        question applies to it — it simply ends once its practice time
        is used.
      </p>
    </LegalPageShell>
  );
}
