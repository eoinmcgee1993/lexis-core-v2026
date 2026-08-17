// frontend/src/pages/RefundPage.jsx
//
// Scaffolded per the remediation brief's U6 finding. Unlike Privacy/Terms,
// there is genuinely no code-verifiable fact to state here at all —
// backend/app.mjs has no refund endpoint or logic anywhere (checkout
// creation and a Stripe webhook handler exist; nothing that issues a
// refund). Every substantive claim on this page is a decision LEXIS
// hasn't made yet, not something this scaffold can respond to with a
// verified fact the way the other two pages could.
import React from 'react';
import LegalPageShell, { Todo } from '../components/LegalPageShell';
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
    <LegalPageShell navigateTo={navigateTo} title="Refund & Cancellation Policy" lastUpdated="17 August 2026">
      <p>
        Almost everything on this page is currently a decision LEXIS
        hasn't made yet, not a policy that's just unwritten — there is no
        refund-issuing code anywhere in the product today. Nothing below
        should be treated as an actual promise to a customer until the
        <Todo>—</Todo> items are answered for real.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Cancelling a plan</h2>
      <p>
        You can stop a {PRICING.weekly.period}ly or {PRICING.monthly.period}ly
        plan from renewing at any time. <Todo>Confirm exactly how — a
        self-serve "Cancel" button in the app, or a request to a real
        support contact — since neither exists in the product today.</Todo>
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What happens to time you've already paid for</h2>
      <p>
        <Todo>Decide and state whether cancelling stops access
        immediately or lets the current paid period run out first (the
        more common approach for subscriptions like this), and whether
        any of that need be expressed differently for the {PRICING.weekly.period}ly
        vs. {PRICING.monthly.period}ly plan.</Todo>
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Refunds</h2>
      <p>
        <Todo>Decide the actual refund policy — e.g. no refunds for
        partial periods, a short cooling-off window, refunds at LEXIS's
        discretion for a real service problem — and state it plainly.
        Whatever it is, it should match what Stripe is actually
        configured to allow, not be aspirational.</Todo>
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
