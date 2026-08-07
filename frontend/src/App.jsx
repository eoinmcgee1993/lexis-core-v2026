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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 font-mono text-xs flex items-center justify-center">
        Loading LEXIS…
      </div>
    );
  }

  // Auth guard: force /auth if an unauthenticated user requests /app directly.
  if (currentPath === '/app' && !user) {
    return <AuthPage navigateTo={navigateTo} />;
  }

  switch (currentPath) {
    case '/pricing':
      return <PricingPage navigateTo={navigateTo} />;
    case '/auth':
      return <AuthPage navigateTo={navigateTo} />;
    case '/app':
      return <LexisApp navigateTo={navigateTo} />;
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
