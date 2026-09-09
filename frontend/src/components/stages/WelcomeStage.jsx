// frontend/src/components/stages/WelcomeStage.jsx
//
// State 01 of the LEXIS session flow (see scripts/design/lexis-visual-system.md).
// Warm, spacious, single CTA — no dashboard, nothing competing with
// "Start Talking". The language pill here is now the *only* place
// direction gets picked before a session (the old always-shown modal this
// replaced existed specifically to make the choice unmissable on mobile —
// a full always-visible screen satisfies that even more directly than a
// modal did, so the modal was removed rather than kept alongside this).
import React, { useState } from 'react';
import { Mic, LogOut, AlertCircle, CreditCard, Clock, X, History } from 'lucide-react';
import LexisMark from '../LexisMark';

function formatUsageLabel(profile) {
  if (profile.subscription_status === 'active') {
    // Was "unlimited". A per-period fair-use ceiling now exists
    // (FAIR_USE_MINUTES in backend/app.mjs), so this meter must not claim
    // otherwise on the same screen that is about to enforce it.
    //
    // It deliberately shows no remaining-minutes figure. The ceiling lives
    // in the backend's environment, and `profile` here comes straight from
    // supabase.from('profiles').select('*') in AuthContext — the client
    // never sees that number, and hardcoding a second copy of it in the
    // frontend would drift the moment the env var is tuned (which is the
    // whole point of it being an env var). A subscriber who reaches the
    // ceiling is told the exact limit by the FAIR_USE_REACHED message,
    // which is generated server-side from the real value.
    // A pass has an end date, and it is the one number the holder
    // actually needs — nothing renews, so "4 days left" is the difference
    // between buying another one in time and losing access mid-week. Only
    // passes have it; the recurring plans sold before 2 Sep 2026 leave
    // access_expires_at NULL and fall back to the bare plan name.
    const daysLeft = passDaysLeft(profile);
    if (daysLeft === null) return `${profile.subscription_tier} plan`;
    // 0 is only ever reachable once the pass has actually run out — days
    // are rounded up, so the final partial day reads as "last day". That
    // matters: subscription_status stays 'active' after a pass expires
    // (nothing in Stripe fires to change it), so without this branch a
    // lapsed pass would keep displaying a day count forever while the
    // backend was already refusing to start sessions.
    if (daysLeft <= 0) return `${profile.subscription_tier} pass ended`;
    if (daysLeft === 1) return `${profile.subscription_tier} pass · last day`;
    return `${profile.subscription_tier} pass · ${daysLeft} days left`;
  }
  const remaining = Math.max(0, (profile.max_allowed_seconds || 0) - (profile.seconds_used || 0));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}m ${secs}s left in trial`;
}

// Whole days remaining on a one-off pass, or null when this profile has no
// pass (never paid, or on one of the pre-2 Sep 2026 recurring plans, which
// leave access_expires_at NULL because Stripe reports their liveness
// instead). Rounded UP so the last partial day still reads as "1 day left"
// rather than "ends today" while the pass is genuinely still usable.
function passDaysLeft(profile) {
  if (!profile?.access_expires_at) return null;
  const expiresAt = Date.parse(profile.access_expires_at);
  if (!Number.isFinite(expiresAt)) return null;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
}

// Mirrors paidAccessActive() in backend/app.mjs. The backend is the only
// authority on entitlement; this exists purely so the UI doesn't announce
// something the backend hasn't agreed to yet.
function hasLiveAccess(profile) {
  if (profile?.subscription_status !== 'active') return false;
  const daysLeft = passDaysLeft(profile);
  return daysLeft === null || daysLeft > 0;
}

// currentPeriodEnd comes straight from Stripe's subscription object — a
// Unix timestamp in seconds, hence the *1000.
function formatPeriodEnd(currentPeriodEnd) {
  if (!currentPeriodEnd) return '';
  return new Date(currentPeriodEnd * 1000).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function WelcomeStage({
  targetLanguage,
  onSelectLanguage,
  onStartTalking,
  profile,
  justPaid,
  justSponsored,
  upgradeRequired,
  upgradeMessage,
  upgradeIsFairUse = false,
  sessionError,
  onDismissSessionError,
  onViewPricing,
  onViewHistory,
  onSignOut,
  onGoHome,
  onCancelPlan,
  cancelLoading,
  cancelError,
  cancelAtPeriodEnd,
  cancelPeriodEnd
}) {
  // Local two-step confirmation UI — this codebase has no modal system, so
  // "cancel" doesn't fire on the first click. See RefundPage.jsx's
  // "Cancelling a plan" section, which this button is the implementation of.
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <div className="w-full max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-y-2 p-4 md:p-6">
        {/* The mark belongs here as much as on the marketing pages — more,
            arguably. Every other surface (Landing, Pricing, Auth,
            LegalPageShell) pairs LexisMark with the wordmark; the app, the
            thing people actually pay for, was the one place shipping a bare
            text button. Same teal-tinted rounded badge those four use, at
            the smaller scale this compact header wants. */}
        <button
          onClick={onGoHome}
          className="group flex items-center gap-2.5 text-sm font-display font-semibold text-lexis-ink/80 hover:text-lexis-ink transition-colors"
        >
          <span className="p-1.5 bg-teal-600/10 border border-teal-600/20 rounded-lg text-teal-700 transition-colors group-hover:bg-teal-600/15">
            <LexisMark className="w-4 h-4 block" />
          </span>
          LEXIS
        </button>
        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
          {profile && (
            <span className="flex items-center gap-1.5 text-xs text-lexis-ink/70">
              <Clock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{formatUsageLabel(profile)}</span>
            </span>
          )}

          {/* Only a recurring plan can be cancelled, and only those have a
              stripe_subscription_id — the same condition the backend's
              /api/stripe/cancel checks. Showing this to a pass holder
              would offer them an action that does nothing and imply their
              pass is charging them again, which it isn't. */}
          {profile?.subscription_status === 'active' && profile?.stripe_subscription_id && !cancelAtPeriodEnd && (
            confirmingCancel ? (
              <span className="flex items-center gap-1.5 text-xs">
                <span className="text-lexis-ink/70">Cancel plan?</span>
                <button
                  onClick={onCancelPlan}
                  disabled={cancelLoading}
                  className="text-rose-600 hover:text-rose-700 font-semibold disabled:opacity-50"
                >
                  {cancelLoading ? 'Cancelling…' : 'Yes, cancel'}
                </button>
                <button
                  onClick={() => setConfirmingCancel(false)}
                  disabled={cancelLoading}
                  className="text-lexis-ink/65 hover:text-lexis-ink"
                >
                  Never mind
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingCancel(true)}
                className="block text-xs text-lexis-ink/65 hover:text-rose-600 underline underline-offset-2"
              >
                Cancel plan
              </button>
            )
          )}
          {cancelAtPeriodEnd && (
            <span className="block text-xs text-lexis-ink/70">
              Won't renew{cancelPeriodEnd ? ` (access until ${formatPeriodEnd(cancelPeriodEnd)})` : ''}
            </span>
          )}
          {cancelError && (
            <span className="block text-xs text-rose-600" role="alert">{cancelError}</span>
          )}

          <button onClick={onViewHistory} className="p-2 text-lexis-ink/65 hover:text-lexis-ink transition-colors" title="Practice history">
            <History className="w-4 h-4" aria-hidden="true" />
          </button>
          <button onClick={onSignOut} className="p-2 text-lexis-ink/65 hover:text-lexis-ink transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* justify-center from md up, not justify-start. The column is about
          640px tall and the viewport between header and footer is nearer
          760, so top-aligning it left ~40% of the screen as a dead band at
          the bottom — which is what "bland and bare" was actually pointing
          at, as much as the missing content. Stays top-aligned below md,
          where the content is taller than the viewport and centring would
          push the CTA under the fold. */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col items-center justify-start md:justify-center pt-8 md:pt-0 pb-12 px-6 text-center">
        {/* justPaid is only the ?payment=success redirect, which says the
            customer finished Checkout — not that the money arrived. For a
            card those are the same moment; for PromptPay and other delayed
            methods the bank confirms afterwards, and the backend
            deliberately withholds the pass until it does. Announcing
            "confirmed" off the redirect alone would tell someone their pass
            was active while every session start was still being refused,
            so the profile decides which of the two messages this is. */}
        {justPaid && (
          hasLiveAccess(profile) ? (
            <div className="mb-6 px-4 py-3 bg-teal-600/10 border border-teal-600/30 rounded-2xl text-teal-700 text-xs">
              Payment confirmed. Your pass is now active. Thank you!
              {justSponsored && ' Thank you for adding a LEXIS Community sponsorship, it means a lot.'}
            </div>
          ) : (
            <div className="mb-6 px-4 py-3 bg-lexis-action/10 border border-lexis-action/30 rounded-2xl text-lexis-action-dark text-xs">
              Thanks — we're waiting for your bank to confirm the payment.
              This is usually only a few seconds. Refresh this page and your
              pass will appear; you won't be charged twice.
            </div>
          )
        )}

        {upgradeRequired && (
          <div className="mb-6 w-full max-w-sm p-4 bg-lexis-action/10 border border-lexis-action/30 rounded-2xl flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-lexis-action-dark text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              <span>{upgradeMessage || 'Free trial limit reached. Upgrade your pass to continue practicing.'}</span>
            </div>
            {/* No pricing CTA on a fair-use stop: this person already pays,
                and the only thing that resolves it is their next billing
                period starting, not a purchase. */}
            {!upgradeIsFairUse && (
              <button onClick={onViewPricing} className="px-4 py-1.5 bg-lexis-action text-lexis-navy font-bold text-xs rounded-xl flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" aria-hidden="true" />
                <span>View Pricing</span>
              </button>
            )}
          </div>
        )}

        {/* A session that failed before ever connecting (mic denied, a
            dropped SDP exchange, a token-broker error) lands back here —
            this is the one place that failure is visible at all, since
            LiveStage (where the equivalent status text used to always be
            on screen pre-v2026.4) never mounts for an attempt that never
            connected. */}
        {sessionError && (
          <div className="mb-6 w-full max-w-sm p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-left">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" aria-hidden="true" />
            <p className="flex-1 text-xs text-rose-700">{sessionError}</p>
            <button onClick={onDismissSessionError} className="text-rose-400 hover:text-rose-600 flex-shrink-0" title="Dismiss">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Two columns from md up, replacing a single centred stack that ran
            out of content about 40% down the viewport and left the rest as
            empty cream. Reported directly, and it was fair.

            The right column is the actual fix. LEXIS is a person you talk
            to, her portrait has been in this repo since 15 Aug, and the one
            screen where somebody decides whether to talk to her showed no
            face at all — only the marketing pages did. Putting her here is
            not decoration filling a gap; it is the subject of the page
            finally being on it.

            Same optimised srcset the landing hero uses (avif -> webp ->
            jpg), so this costs ~18KB on a phone and nothing new is added to
            the repo. Deliberately a still <picture> rather than
            TutorAvatarPhoto: that component's blink loop is lovely mid
            session, but animating her before a word has been said is the
            kind of motion this page does not need, and it renders idle at
            70% opacity — washed out is exactly what we just spent this pass
            removing.

            No card per item, and no icon standing in for meaning: the 21 Aug
            re-audit removed both deliberately and this keeps to it. */}
        <div className="w-full grid md:grid-cols-[1fr_auto] md:gap-12 lg:gap-16 items-center text-center md:text-left">
          <div className="flex flex-col items-center md:items-start">
            {/* Phone gets her too, just compactly. Hiding the portrait
                below md left the same dead band this pass exists to remove,
                and a 96px round crop costs ~110px of vertical space against
                a CTA that was already comfortably above the fold at 390x844.
                object-top because the source is a full-length standing shot;
                centre-cropping it lands on her collar. */}
            <img
              src="/marketing/lexis-tutor-hero-480.jpg"
              width="96"
              height="96"
              loading="eager"
              decoding="async"
              alt=""
              aria-hidden="true"
              className="md:hidden mb-6 w-24 h-24 rounded-full object-cover object-top border border-lexis-ink/10 lexis-lift-soft"
            />
        <h1 className="font-display font-semibold text-4xl md:text-5xl leading-tight text-balance max-w-lg">
          Ready to talk {targetLanguage === 'th' ? 'Thai' : 'English'}?
        </h1>
        <p className="mt-4 text-base text-lexis-ink/75 max-w-sm">
          She's listening whenever you are. Pick a language and start talking.
        </p>

        <div className="mt-8 inline-flex items-center bg-white border border-lexis-ink/10 rounded-full p-1 text-sm shadow-sm">
          <button
            onClick={() => onSelectLanguage('en')}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${targetLanguage === 'en' ? 'bg-teal-700 text-white' : 'text-lexis-ink/70 hover:text-lexis-ink'}`}
          >
            Learn English
          </button>
          <button
            onClick={() => onSelectLanguage('th')}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${targetLanguage === 'th' ? 'bg-teal-700 text-white' : 'text-lexis-ink/70 hover:text-lexis-ink'}`}
          >
            เรียนภาษาไทย
          </button>
        </div>

        <button
          onClick={onStartTalking}
          className="mt-10 px-10 py-4 bg-lexis-action hover:bg-lexis-action-dark text-lexis-navy font-display font-semibold text-lg rounded-2xl lexis-lift transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-3"
        >
          <Mic className="w-5 h-5" aria-hidden="true" />
          <span>Start Talking</span>
        </button>

            {/* One quiet line rather than a row of stat cards. It answers
                the two questions somebody actually has at this moment —
                how long have I got, and where is what I did before — and
                onViewHistory was previously reachable only from a 16px
                unlabelled icon in the header. */}
            <p className="mt-6 text-xs text-lexis-ink/65 flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1">
              <span>No booking. Start and stop whenever you like.</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={onViewHistory}
                className="underline underline-offset-2 hover:text-lexis-ink transition-colors"
              >
                Past sessions
              </button>
            </p>
          </div>

          {/* Hidden below md: at phone width she would push the CTA under
              the fold, and the decision has to stay reachable without a
              scroll. */}
          <div className="hidden md:block relative flex-shrink-0">
            <div className="lexis-stage" aria-hidden="true" />
            <picture>
              <source
                type="image/avif"
                srcSet="/marketing/lexis-tutor-hero-480.avif 480w, /marketing/lexis-tutor-hero-800.avif 800w"
                sizes="320px"
              />
              <source
                type="image/webp"
                srcSet="/marketing/lexis-tutor-hero-480.webp 480w, /marketing/lexis-tutor-hero-800.webp 800w"
                sizes="320px"
              />
              <img
                src="/marketing/lexis-tutor-hero-480.jpg"
                width="320"
                height="400"
                loading="eager"
                decoding="async"
                alt="LEXIS, the voice tutor you practise with"
                className="relative w-[280px] lg:w-[320px] h-[350px] lg:h-[400px] object-cover object-top rounded-3xl border border-lexis-ink/10 lexis-lift"
              />
            </picture>
          </div>
        </div>
      </div>

      <footer className="w-full max-w-4xl mx-auto px-6 py-6 text-xs text-lexis-ink/65 text-center">
        © 2026 LEXIS · Your audio is never saved on our servers, and we store no transcripts
      </footer>
    </div>
  );
}
