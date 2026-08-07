import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage.jsx';
import AuthGate from './AuthGate.jsx';
import './index.css';

// Minimal client router — two routes ('/' and '/app') don't warrant a full
// router dependency.
function MainRouter() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setCurrentRoute(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
  };

  return (
    <React.StrictMode>
      {currentRoute === '/app' ? (
        <AuthGate onBackToHome={() => navigateTo('/')} />
      ) : (
        <LandingPage onLaunchApp={() => navigateTo('/app')} />
      )}
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MainRouter />);
