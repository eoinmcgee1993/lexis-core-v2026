// frontend/src/App.jsx — client-side router
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import LexisApp from './pages/LexisApp';

// Per-route <title> — index.html's static title only ever matches the
// landing page; every other route was silently keeping that same title
// forever (no react-helmet-style head management in this app). A crawler
// that actually executes JS (Google, and most answer-engine crawlers do)
// sees whichever title was last set here, so this is a real SEO/AEO win
// for the cost of one lookup table, not just a browser-tab nicety.
const ROUTE_TITLES = {
  '/pricing': 'Pricing | LEXIS',
  '/auth': 'Sign In | LEXIS',
  '/app': 'LEXIS'
};

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

  useEffect(() => {
    document.title = ROUTE_TITLES[currentPath] || 'LEXIS | Practice Speaking English & Thai Out Loud';
  }, [currentPath]);

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
