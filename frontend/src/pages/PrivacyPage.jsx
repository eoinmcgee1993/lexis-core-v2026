// frontend/src/pages/PrivacyPage.jsx
//
// Scaffolded per the remediation brief's U6 finding: both other pages'
// footers assert "Private & secure" with nothing behind the claim, and
// nothing anywhere answered "what happens to my voice recording" — the
// single most likely question a parent evaluating this product for
// their kid would have. Every factual claim below is checked directly
// against this repo's actual code (backend/app.mjs, supabase-schema.sql)
// rather than assumed — see the inline comments next to each one.
// Every business/legal decision (OpenAI data-policy link, retention
// period, deletion process, age/parental consent, legal entity) was
// confirmed directly by Eoin on 19 Aug 2026 — no more <Todo> markers on
// this page. The OpenAI Realtime API retention specifics were verified
// directly against https://developers.openai.com/api/docs/guides/your-data
// on that date, not assumed.
import React, { useMemo } from 'react';
import LegalPageShell from '../components/LegalPageShell';
import { useSeo } from '../lib/useSeo';
import { SITE_URL, buildBreadcrumbJsonLd, buildPrivacyFaqJsonLd } from '../data/structuredData';

export default function PrivacyPage({ navigateTo }) {
  const pageUrl = `${SITE_URL}/privacy`;
  const faqJsonLd = useMemo(() => buildPrivacyFaqJsonLd(), []);
  const breadcrumbJsonLd = useMemo(() => buildBreadcrumbJsonLd('Privacy Policy', pageUrl), [pageUrl]);

  useSeo({
    title: 'Privacy Policy | LEXIS',
    description: 'What LEXIS collects, what happens to your voice during a session, and what is and is not stored.',
    canonical: pageUrl,
    jsonLd: { 'jsonld-faq': faqJsonLd, 'jsonld-breadcrumb': breadcrumbJsonLd }
  });

  return (
    <LegalPageShell navigateTo={navigateTo} title="Privacy Policy" lastUpdated="19 August 2026">
      <p>
        This page describes what LEXIS actually does with your data, based
        on how the product is built today.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What happens to your voice</h2>
      <p>
        A live LEXIS session is a real-time voice connection (WebRTC)
        directly between your device and OpenAI's Realtime API. Your
        microphone audio is streamed for the duration of the
        conversation and is not saved as an audio file on LEXIS's own
        servers. What OpenAI itself retains or uses that audio for is
        governed by OpenAI's own data policy for the Realtime API, not
        LEXIS's; see{' '}
        <a href="https://developers.openai.com/api/docs/guides/your-data" target="_blank" rel="noopener noreferrer" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">
          OpenAI's API data usage policy
        </a>{' '}
        for the current terms. As of this policy's last update, OpenAI
        states the Realtime API retains audio for up to 30 days for
        abuse-monitoring purposes only, and does not retain it as
        "application state" beyond that.
      </p>
      <p>
        After a session ends, LEXIS generates a feedback summary (a
        confidence score, a few strengths, and a few corrections) and
        saves <em>only that summary</em>, not a transcript of what you
        said. This is a deliberate choice in how the database is built,
        not just a policy statement: the table that stores this
        (<code className="text-xs bg-lexis-ink/5 px-1 py-0.5 rounded">session_history</code>)
        has no column for raw speech or a full transcript at all.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">What else is stored</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>Account info: your email, name, and subscription status.</li>
        <li>Session feedback summaries, as described above (confidence score, strengths, suggested corrections), not transcripts or audio.</li>
        <li>Usage totals: how many seconds of practice you've used, to enforce the free trial and track your plan.</li>
        <li>Payment details are handled entirely by Stripe; LEXIS does not receive or store your card number.</li>
        <li>Basic first-party analytics (which page you visited, and whether you signed up, started a practice session, checked out, or cancelled a plan), kept only against an anonymous per-visit identifier, not sold or shared with any third party. No third-party analytics or advertising trackers are used anywhere on LEXIS.</li>
        <li>If something breaks, technical error details (what failed and a code-level description of why), used only to fix bugs, not tied to anything you said or did in a session.</li>
      </ul>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">How long data is kept</h2>
      <p>
        Account data and session history are kept for up to 2 years
        from your last activity on LEXIS, after which they're deleted.
        You can also ask for earlier deletion at any time; see below.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Deleting your data</h2>
      <p>
        There is currently no self-serve "delete my account" option in
        the app itself. Email{' '}
        <a href="mailto:privacy@learnwithlexis.com" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">privacy@learnwithlexis.com</a>{' '}
        to request deletion or a copy of your data, and we'll action it
        directly.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Age and parental consent</h2>
      <p>
        LEXIS is positioned for Thai youth learning English (and English
        speakers learning Thai). Under Thailand's Personal Data
        Protection Act, anyone under 20 is legally a minor: under-10s
        need a parent or guardian's consent to use LEXIS, and those
        aged 10–19 need both their own consent and a parent or
        guardian's. At sign-up, LEXIS asks you to confirm you're 20 or
        older, or that you have your parent or legal guardian's
        permission to use LEXIS if you're younger. This is a
        self-attestation, not verified age-check technology.
      </p>

      <h2 className="font-display font-semibold text-lg text-lexis-ink pt-2">Who operates LEXIS</h2>
      <p>
        LEXIS is operated by Eoin McGee, trading as Lexis (a sole
        trader), registered at 154 Moo 5, Suthep, Mueang, Chiang Mai
        50200, Thailand. Payments are processed under the Clearmark
        Stripe account. For privacy questions or requests, contact{' '}
        <a href="mailto:privacy@learnwithlexis.com" className="text-teal-700 hover:text-teal-800 underline underline-offset-2">privacy@learnwithlexis.com</a>.
        This policy is governed by the laws of Thailand.
      </p>
    </LegalPageShell>
  );
}
