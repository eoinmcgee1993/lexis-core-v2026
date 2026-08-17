// frontend/src/App.jsx — client-side router
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import LexisApp from './pages/LexisApp';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import RefundPage from './pages/RefundPage';

// Seven routes still don't warrant a full router dependency. Every page
// receives navigateTo(path). Auth-gating for /app lives here, once,
// rather than each page re-deriving "am I allowed to render?" from
// useAuth() itself.

// The switch below matches currentPath exactly, and dist/th/index.html
// (a real directory, per prerender.mjs's output layout — same as every
// other route) is what a static host serves for BOTH /th and /th/.
// Caught while verifying Stage 4: a request/bookmark/crawler hit on the
// trailing-slash form fell through to the English default because '/th/'
// !== '/th'. Not new to /th specifically — /pricing/, /terms/, etc. had
// the same gap since Stage 1 — fixed once here for every route rather
// than only the two this PR adds.
function normalizePath(path) {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

function RouteController() {
  const [currentPath, setCurrentPath] = useState(normalizePath(window.location.pathname));
  const { user, loading } = useAuth();

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(normalizePath(path));
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPath(normalizePath(window.location.pathname));
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Per-route <title>/<meta>/canonical/JSON-LD is now each page's own
  // job (see frontend/src/lib/useSeo.js) — this used to be one lookup
  // table here, but that only ever covered <title>, and prerender.mjs
  // needs the real per-page description/canonical/JSON-LD to be set by
  // the same component it's snapshotting, not a separate router-level table.

  // Only /app needs a definitive signed-in/out answer before it can decide
  // what to render. Gating every route (including the public landing page)
  // behind the initial Supabase session check means every marketing visitor
  // — the entire point of a landing page — sees a blank loading spinner
  // before the hero ever paints, for an auth check they don't need.
  if (currentPath === '/app') {
    if (loading) {
      return (
        <div className="min-h-screen bg-slate-950 text-slate-400 font-mono text-xs flex items-center justify-center">
          Loading LEXIS…
        </div>
      );
    }
    return user ? <LexisApp navigateTo={navigateTo} /> : <AuthPage navigateTo={navigateTo} />;
  }

  switch (currentPath) {
    case '/pricing':
      return <PricingPage navigateTo={navigateTo} />;
    // Real Thai-language routes (Stage 4 of the remediation brief) — not
    // a client-side toggle over '/' and '/pricing', separate indexable
    // URLs with their own <html lang>, canonical, and reciprocal hreflang
    // (see LandingPage.jsx/PricingPage.jsx's useSeo calls). Same
    // components, `lang="th"` prop drives which copy renders.
    case '/th':
      return <LandingPage navigateTo={navigateTo} lang="th" />;
    case '/th/pricing':
      return <PricingPage navigateTo={navigateTo} lang="th" />;
    case '/auth':
      return <AuthPage navigateTo={navigateTo} />;
    case '/terms':
      return <TermsPage navigateTo={navigateTo} />;
    case '/privacy':
      return <PrivacyPage navigateTo={navigateTo} />;
    case '/refund':
      return <RefundPage navigateTo={navigateTo} />;
    default:
      return <LandingPage navigateTo={navigateTo} />;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <RouteController />
    </AuthProvider>
  );
}
