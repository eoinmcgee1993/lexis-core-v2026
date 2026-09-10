// Entitlement, as the UI understands it.
//
// The backend is the only authority — paidAccessActive() in backend/app.mjs
// decides whether a session may start, and this file exists purely so the
// interface does not announce something the backend has not agreed to.
// It lives here rather than inside a component because two places need it
// now (WelcomeStage, to pick which post-payment message to show; LexisApp,
// to know when to stop polling for a webhook that has just landed), and a
// second private copy of entitlement logic is exactly the kind of drift
// CLAUDE.md's "fix the shared fact" rule is about.
//
// Keep in step with paidAccessActive(). If that function's rules change,
// change them here in the same commit.

// Whole days remaining on a one-off pass, or null when this profile has no
// pass (never paid, or on one of the pre-2 Sep 2026 recurring plans, which
// leave access_expires_at NULL because Stripe reports their liveness
// instead). Rounded UP so the last partial day still reads as "1 day left"
// rather than "ends today" while the pass is genuinely still usable.
export function passDaysLeft(profile) {
  if (!profile?.access_expires_at) return null;
  const expiresAt = Date.parse(profile.access_expires_at);
  if (!Number.isFinite(expiresAt)) return null;
  return Math.max(0, Math.ceil((expiresAt - Date.now()) / 86400000));
}

// Mirrors paidAccessActive() in backend/app.mjs, including its last clause:
// a lapsed pass does not revoke access that a still-billing legacy
// subscription is paying for. redeem_pass overwrites a legacy subscriber's
// NULL expiry with a real timestamp and nothing ever writes NULL back, so
// without that fallback a single pass purchase would make this function
// report "expired" forever while Stripe went on charging them.
//
// stripe_subscription_id is only ever set by a subscription created before
// 2 Sep 2026, and customer.subscription.deleted clears it — so a non-null
// value here means Stripe has not told us the subscription is gone.
export function hasLiveAccess(profile) {
  if (profile?.subscription_status !== 'active') return false;
  const daysLeft = passDaysLeft(profile);
  if (daysLeft === null || daysLeft > 0) return true;
  return Boolean(profile?.stripe_subscription_id);
}
