// frontend/src/components/ErrorBoundary.jsx
//
// App-wide crash net, wrapping <App /> in main.jsx. Without this, a
// render-time error anywhere in the tree unmounts React entirely — the
// visitor gets a blank white screen with no explanation, and (this is
// the part that actually matters for error monitoring) nothing gets
// reported anywhere, since the crash never reaches any of our own code.
// LiveStage.jsx already has a narrow one just for the 3D avatar
// (AvatarErrorBoundary, see PR #13) — this is the same class-component
// pattern, scoped to the whole app instead of one component.
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { reportError } from '../lib/errorReporting';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    reportError('React ErrorBoundary', error, { componentStack: info?.componentStack?.slice(0, 2000) });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-sm bg-white border border-lexis-ink/10 rounded-2xl p-8 shadow-sm">
          <div className="mx-auto w-fit p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-500 mb-4">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-display font-semibold text-lexis-ink mb-1">Something went wrong</h1>
          <p className="text-xs text-lexis-ink/50 mb-6">
            LEXIS hit an unexpected error. Reloading usually fixes it — we've
            been notified.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 bg-lexis-action hover:bg-lexis-action-dark text-white font-bold text-sm rounded-xl transition-all"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
