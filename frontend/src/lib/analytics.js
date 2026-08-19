// frontend/src/lib/analytics.js
//
// First-party, privacy-respecting analytics — no third-party script, no
// cookies, no cross-site tracking, no external network destination at
// all (every event is a fire-and-forget POST to our own backend, which
// was already in the CSP's connect-src for other reasons — this needed
// zero CSP changes). See backend/supabase-schema.sql's analytics_events
// table for where these land, and PrivacyPage.jsx's "What else is
// stored" section for the plain-language disclosure this exists to keep
// accurate — if you add a new event here, that section needs updating
// too, not just this file.
//
// sessionId is a random id kept in sessionStorage only (cleared when the
// tab closes) — enough to de-duplicate a funnel within one visit, not a
// persistent tracking identifier across visits the way a cookie or
// localStorage id would be.
import { supabase } from './supabaseClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const SESSION_KEY = 'lexis_analytics_session';

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    // Privacy-mode sessionStorage throw — group these together under one
    // fixed id rather than dropping the event; still fine for aggregate
    // counts, just not for funnel de-duplication within that one visit.
    return 'no-storage';
  }
}

// Fire-and-forget by design — telemetry must never surface an error to
// the user or block whatever real action (checkout, cancel, sign-up)
// triggered it. `keepalive: true` lets the request actually complete even
// when it's fired right before a navigation (e.g. checkout_started, right
// before redirecting to Stripe).
export function trackEvent(event, { path, lang, metadata } = {}) {
  // scripts/prerender.mjs actually mounts every route in a real headless
  // Chromium as part of every `npm run build` — including this hook's own
  // pageview effect — which would otherwise fire a real event to
  // production analytics on every single build/deploy, not just real
  // visits. navigator.webdriver is true for Puppeteer/Playwright's
  // automated Chromium (both of which that script uses) and false for a
  // genuine visitor's browser — caught by actually testing a real build
  // locally, not assumed.
  if (typeof navigator !== 'undefined' && navigator.webdriver) return;

  (async () => {
    let authHeader = {};
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) authHeader = { Authorization: `Bearer ${data.session.access_token}` };
    } catch {
      // Not expected to throw, but this is telemetry — nothing here
      // should ever be allowed to break the app over its own failure.
    }

    fetch(`${BACKEND_URL}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeader },
      body: JSON.stringify({ event, path, lang, sessionId: getSessionId(), metadata }),
      keepalive: true
    }).catch(() => {});
  })();
}
