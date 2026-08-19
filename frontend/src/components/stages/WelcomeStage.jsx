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

function formatUsageLabel(profile) {
  if (profile.subscription_status === 'active') {
    return `${profile.subscription_tier} plan — unlimited`;
  }
  const remaining = Math.max(0, (profile.max_allowed_seconds || 0) - (profile.seconds_used || 0));
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  return `${mins}m ${secs}s left in trial`;
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
  upgradeRequired,
  upgradeMessage,
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
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <div className="w-full max-w-4xl mx-auto flex items-center justify-between p-4 md:p-6">
        <button onClick={onGoHome} className="text-sm font-display font-semibold text-lexis-ink/80 hover:text-lexis-ink transition-colors">
          LEXIS
        </button>
        <div className="flex items-center gap-3">
          {profile && (
            <span className="hidden sm:flex items-center gap-1.5 text-xs text-lexis-ink/50">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatUsageLabel(profile)}</span>
            </span>
          )}

          {profile?.subscription_status === 'active' && !cancelAtPeriodEnd && (
            confirmingCancel ? (
              <span className="hidden sm:flex items-center gap-1.5 text-xs">
                <span className="text-lexis-ink/50">Cancel plan?</span>
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
                  className="text-lexis-ink/40 hover:text-lexis-ink"
                >
                  Never mind
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmingCancel(true)}
                className="hidden sm:block text-xs text-lexis-ink/40 hover:text-rose-600 underline underline-offset-2"
              >
                Cancel plan
              </button>
            )
          )}
          {cancelAtPeriodEnd && (
            <span className="hidden sm:block text-xs text-lexis-ink/50">
              Won't renew{cancelPeriodEnd ? ` — access until ${formatPeriodEnd(cancelPeriodEnd)}` : ''}
            </span>
          )}
          {cancelError && (
            <span className="hidden sm:block text-xs text-rose-600">{cancelError}</span>
          )}

          <button onClick={onViewHistory} className="p-2 text-lexis-ink/40 hover:text-lexis-ink transition-colors" title="Practice history">
            <History className="w-4 h-4" />
          </button>
          <button onClick={onSignOut} className="p-2 text-lexis-ink/40 hover:text-lexis-ink transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center">
        {justPaid && (
          <div className="mb-6 px-4 py-3 bg-teal-600/10 border border-teal-600/30 rounded-2xl text-teal-700 text-xs">
            Payment confirmed — your pass is now active. Thank you!
          </div>
        )}

        {upgradeRequired && (
          <div className="mb-6 w-full max-w-sm p-4 bg-lexis-action/10 border border-lexis-action/30 rounded-2xl flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-2 text-lexis-action-dark text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{upgradeMessage || 'Free trial limit reached. Upgrade your pass to continue practicing.'}</span>
            </div>
            <button onClick={onViewPricing} className="px-4 py-1.5 bg-lexis-action text-white font-bold text-xs rounded-xl flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>View Pricing</span>
            </button>
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
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5" />
            <p className="flex-1 text-xs text-rose-700">{sessionError}</p>
            <button onClick={onDismissSessionError} className="text-rose-400 hover:text-rose-600 flex-shrink-0" title="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <h1 className="font-display font-semibold text-4xl md:text-5xl leading-tight text-balance max-w-lg">
          Speak {targetLanguage === 'th' ? 'Thai' : 'English'} with confidence.
        </h1>
        <p className="mt-4 text-base text-lexis-ink/60 max-w-sm">
          Practice real conversations without the pressure of speaking to another person.
        </p>

        <div className="mt-8 inline-flex items-center bg-white border border-lexis-ink/10 rounded-full p-1 text-sm shadow-sm">
          <button
            onClick={() => onSelectLanguage('en')}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${targetLanguage === 'en' ? 'bg-teal-600 text-white' : 'text-lexis-ink/50 hover:text-lexis-ink'}`}
          >
            Learn English
          </button>
          <button
            onClick={() => onSelectLanguage('th')}
            className={`px-4 py-2 rounded-full font-semibold transition-colors ${targetLanguage === 'th' ? 'bg-teal-600 text-white' : 'text-lexis-ink/50 hover:text-lexis-ink'}`}
          >
            เรียนภาษาไทย
          </button>
        </div>

        <button
          onClick={onStartTalking}
          className="mt-10 px-10 py-4 bg-lexis-action hover:bg-lexis-action-dark text-white font-display font-semibold text-lg rounded-2xl shadow-lg shadow-lexis-action/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <Mic className="w-5 h-5" />
          <span>Start Talking</span>
        </button>
      </div>

      <footer className="w-full max-w-4xl mx-auto px-6 py-6 text-xs text-lexis-ink/40 text-center">
        © 2026 LEXIS · Private &amp; secure — only you and LEXIS are on the call
      </footer>
    </div>
  );
}
