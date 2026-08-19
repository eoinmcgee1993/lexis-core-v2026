import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { reportError } from './lib/errorReporting';
import './index.css';

// Catches what <ErrorBoundary> can't: React's error boundaries only ever
// see render-time throws inside the component tree, not a rejected
// promise or a stray synchronous error in an event handler/async callback
// (e.g. a fetch .catch that forgot to catch, a setTimeout callback that
// throws) — both bypass React entirely and would otherwise vanish into
// the browser console with nobody watching.
window.addEventListener('error', (event) => {
  reportError('window.onerror', event.error || new Error(event.message));
});
window.addEventListener('unhandledrejection', (event) => {
  reportError('unhandledrejection', event.reason instanceof Error ? event.reason : new Error(String(event.reason)));
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
