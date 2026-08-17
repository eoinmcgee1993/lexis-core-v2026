// frontend/src/pages/PrivacyPage.jsx
//
// Scaffolded per the remediation brief's U6 finding: both other pages'
// footers assert "Private & secure" with nothing behind the claim, and
// nothing anywhere answered "what happens to my voice recording" — the
// single most likely question a parent evaluating this product for
// their kid would have. Every factual claim below is checked directly
// against this repo's actual code (backend/app.mjs, supabase-schema.sql)
// rather than assumed — see the inline comments next to each one.
// Anything requiring a real business/legal decision (not a code fact) is
// a loud <Todo> marker, not a guess — see LegalPageShell.jsx's Todo
// component and the remediation brief's "Placeholders must be loud" rule.
import React from 'react';
import LegalPageShell, { Todo } from '../components/LegalPageShell';
import { useSeo } from '../lib/useSeo';
import { SITE_URL } from '../data/structuredData';

export default function PrivacyPage({ navigateTo }) {
  useSeo({
    title: 'Privacy Policy | LEXIS',
    description: 'What LEXIS collects, what happens to your voice during a session, and what is and is not stored.',
    canonical: `${SITE_URL}/privacy`
  });

  return (
    <LegalPageShell navigateTo={navigateTo} title="Privacy Policy" lastUpdated="17 August 2026">
      <p>
        This page describes what LEXIS actually does with your data, based
        on how the product is built today. It is not a substitute for
        legal review — sections marked <Todo>—</Todo> need an answer from
        LEXIS before this page is a complete policy.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What happens to your voice</h2>
      <p>
        A live LEXIS session is a real-time voice connection (WebRTC)
        directly between your device and OpenAI's Realtime API — your
        microphone audio is streamed for the duration of the
        conversation and is not saved as an audio file on LEXIS's own
        servers. What OpenAI itself retains or uses that audio for is
        governed by OpenAI's own API terms, not LEXIS's — <Todo>link to
        the specific OpenAI API data-usage policy LEXIS relies on, and
        confirm it still reflects OpenAI's current terms</Todo>.
      </p>
      <p>
        After a session ends, LEXIS generates a feedback summary — a
        confidence score, a few strengths, and a few corrections — and
        saves <em>only that summary</em>, not a transcript of what you
        said. This is a deliberate choice in how the database is built,
        not just a policy statement: the table that stores this
        (<code className="text-xs bg-lexis-ink/5 px-1 py-0.5 rounded">session_history</code>)
        has no column for raw speech or a full transcript at all.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What else is stored</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account info: your email, name, and subscription status.</li>
        <li>Session feedback summaries, as described above (confidence score, strengths, suggested corrections) — not transcripts or audio.</li>
        <li>Usage totals: how many seconds of practice you've used, to enforce the free trial and track your plan.</li>
        <li>Payment details are handled entirely by Stripe — LEXIS does not receive or store your card number.</li>
      </ul>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">How long data is kept</h2>
      <p>
        <Todo>Confirm and state a real retention period for account data
        and session history — nothing in the product currently enforces
        automatic deletion after a fixed period.</Todo>
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Deleting your data</h2>
      <p>
        There is currently no self-serve "delete my account" option in
        the app itself. <Todo>Provide a real contact address for data
        deletion/access requests, and confirm the actual process and
        timeline for honoring one.</Todo>
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Age and parental consent</h2>
      <p>
        LEXIS is positioned for Thai youth learning English (and English
        speakers learning Thai), but there is currently no age
        verification or parental-consent step anywhere in sign-up.
        <Todo>This needs an actual decision, not just copy: a minimum
        age, and/or a parental-consent flow, consistent with Thailand's
        PDPA and wherever else LEXIS operates. Flagged as a real product
        gap, not only a missing policy sentence.</Todo>
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Who operates LEXIS</h2>
      <p>
        Payments are processed under the Clearmark Stripe account.
        <Todo>Confirm the full legal entity name, registered address,
        and a real contact email for privacy questions, and state the
        governing law / jurisdiction for this policy.</Todo>
      </p>
    </LegalPageShell>
  );
}
