import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import LandingPage from './pages/LandingPage.jsx';
import PricingPage from './pages/PricingPage.jsx';
import AuthPage from './pages/AuthPage.jsx';
import LexisApp from './pages/LexisApp.jsx';

export default function App() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  if (currentPath === '/app' && !user) {
    return <AuthPage onNavigate={navigateTo} />;
  }

  switch (currentPath) {
    case '/app':
      return <LexisApp navigateTo={navigateTo} />;
    case '/pricing':
      return <PricingPage onNavigate={navigateTo} />;
    case '/auth':
      return <AuthPage onNavigate={navigateTo} />;
    case '/':
    case '/landing':
    default:
      return <LandingPage onNavigate={navigateTo} />;
  }
}
