import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import AuthPage from './pages/AuthPage';
import LexisApp from './pages/LexisApp';
import './index.css';

// Minimal client router — four routes don't warrant a full router
// dependency. Every page receives `navigateTo(path)`.
const ROUTES = {
  '/': LandingPage,
  '/pricing': PricingPage,
  '/auth': AuthPage,
  '/app': LexisApp
};

function Router() {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (to) => {
    window.history.pushState({}, '', to);
    setPath(to);
  };

  const Page = ROUTES[path] || LandingPage;
  return <Page navigateTo={navigateTo} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <Router />
    </AuthProvider>
  </React.StrictMode>
);
