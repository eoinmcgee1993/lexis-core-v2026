// frontend/src/App.jsx — client-side router
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import LexisApp from './pages/LexisApp';

// Four routes don't warrant a full router dependency. Every page receives
// navigateTo(path). Auth-gating for /app lives here, once, rather than each
// page re-deriving "am I allowed to render?" from useAuth() itself.
function RouteController() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const { user, loading } = useAuth();

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
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
    case '/auth':
      return <AuthPage navigateTo={navigateTo} />;
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
