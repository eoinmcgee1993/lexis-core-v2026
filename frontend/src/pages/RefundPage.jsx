// frontend/src/pages/RefundPage.jsx
//
// Scaffolded per the remediation brief's U6 finding. The cancellation
// mechanism, what happens to time already paid for, and the refund
// policy were all confirmed directly by Eoin on 19 Aug 2026 — no more
// <Todo> markers on this page. The self-serve "Cancel Plan" button this
// page describes lives in WelcomeStage.jsx, calling POST
// /api/stripe/cancel in backend/app.mjs.
//
// Rewritten 2 Sep 2026: paid access is now a one-off pass, so the main
// case this page describes is "there is nothing to cancel". The recurring
// half is kept, not as legacy tidiness but because real subscriptions
// bought before that date are still live in Stripe and still charge every
// week — the people holding them need this page to still describe their
// situation accurately.
import React from 'react';
import LegalPageShell from '../components/LegalPageShell';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd } from '../data/structuredData';
import { PRICING } from '../content/facts';

export default function RefundPage({ navigateTo }) {
  useSeo({
    title: 'Refund & Cancellation Policy | LEXIS',
    description: 'How cancelling a LEXIS plan works and the current refund policy.',
    canonical: `${SITE_URL}/refund`,
    jsonLd: { 'jsonld-breadcrumb': buildBreadcrumbJsonLd('Refund & Cancellation Policy', `${SITE_URL}/refund`) }
  });

  return (
    <LegalPageShell navigateTo={navigateTo} title="Refund & Cancellation Policy" lastUpdated="2 September 2026">
      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Passes don't need cancelling</h2>
      <p>
        A LEXIS pass is a single payment for a fixed number of days:{' '}
        {PRICING.weekly.days} days for ฿{PRICING.weekly.thb},{' '}
        {PRICING.monthly.days} days for ฿{PRICING.monthly.thb}. It ends by
        itself when those days are up. Nothing renews, no card is kept on
        file for a future charge, and you are never billed again unless
        you choose to buy another pass. There is nothing to cancel.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Buying again before your pass ends</h2>
      <p>
        If you buy a new pass while one is still running, the new days are
        added on top of the days you have left rather than replacing them.
        Renewing early never costs you time you've already paid for.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">If you have an older recurring plan</h2>
      <p>
        Accounts that started a weekly or monthly plan before 2 September
        2026 are on recurring billing and are still charged automatically.
        You can stop one from renewing at any time with the "Cancel Plan"
        button in the app, no need to email support or wait on a reply.
        Cancelling stops future renewal only; it doesn't cut off access
        immediately. You keep full access for the rest of the period
        you've already paid for, and it simply won't renew after that.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Refunds</h2>
      <p>
        LEXIS does not offer refunds, including for the unused days of a
        pass or for a partial billing period. Passes end on their own and
        cancelling an older plan stops future billing, but past payments
        aren't refunded.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">The free trial</h2>
      <p>
        The free trial itself is not a paid purchase, so no refund
        question applies to it; it simply ends once its practice time
        is used.
      </p>
    </LegalPageShell>
  );
}
