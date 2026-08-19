// frontend/src/lib/errorReporting.js
//
// No third-party service (Sentry etc.) — same first-party pattern as
// analytics.js, same reasons: no new account needed, one less external
// destination, and this backend endpoint was already covered by the
// CSP's connect-src. Three real sources feed this: main.jsx's global
// 'error'/'unhandledrejection' listeners (catches anything outside
// React's render cycle — a rejected promise, a stray synchronous throw)
// and <ErrorBoundary> (catches a render-time crash anywhere in the tree,
// which React's own default behavior would otherwise turn into a silent
// blank white screen with nothing reported anywhere).
import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Same reasoning as analytics.js: scripts/prerender.mjs mounts every
// route in a real headless Chromium on every build — without this guard,
// any error surfaced during that (or a future flaky one) would report a
// fake crash from a robot, not a real visitor, to production monitoring.
function isAutomatedBrowser() {
  return typeof navigator !== 'undefined' && navigator.webdriver;
}

export function reportError(context, err, extra = {}) {
  if (isAutomatedBrowser()) return;

  (async () => {
    let authHeader = {};
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) authHeader = { Authorization: `Bearer ${data.session.access_token}` };
    } catch {
      // Telemetry — must never itself throw or block anything.
    }

    fetch(`${BACKEND_URL}/api/errors/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({
        context,
        message: err?.message || String(err),
        stack: err?.stack || null,
        url: typeof window !== 'undefined' ? window.location.href : null,
        extra
      }),
      keepalive: true
    }).catch(() => {});
  })();
}
