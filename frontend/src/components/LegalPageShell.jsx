// frontend/src/components/LegalPageShell.jsx
//
// Shared header/footer chrome for the three legal pages (Terms, Privacy,
// Refund) — same lexis-canvas-gradient/header/footer pattern every other
// marketing page uses, factored out once rather than tripling identical
// JSX across three files. Content-only children; each page brings its
// own <h1>/<h2>/<p> structure.
import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import LexisMark from './LexisMark';
import AppLink from './AppLink';

// Loud, visible placeholder for any claim this page can't honestly make
// yet (specific data-retention period, refund window, registered
// address, age policy, governing law) — per the remediation brief:
// "Placeholders must be loud. If a value is unknown, use a literal
// TODO(lexis): marker that fails a grep check, never a plausible-looking
// guess." This makes that marker visually loud too, not just grep-able —
// if one of these ever ships to a real visitor, it should look
// obviously unfinished, not like completed legal copy.
export function Todo({ children }) {
  return (
    <mark className="bg-lexis-action/20 text-lexis-action-dark px-1 rounded font-medium not-italic">
      TODO(lexis): {children}
    </mark>
  );
}

export default function LegalPageShell({ navigateTo, title, lastUpdated, children }) {
  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col">
      <header className="w-full max-w-3xl mx-auto p-6 flex items-center justify-between border-b border-lexis-ink/10">
        <AppLink
          to="/" navigateTo={navigateTo} className="flex items-center space-x-2 text-sm text-lexis-ink/50 hover:text-lexis-ink transition-colors"
          >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </AppLink>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">LEXIS</span>
        </div>
        <div className="w-16" />
      </header>

      <section className="flex-1 w-full max-w-3xl mx-auto px-6 py-12">
        <h1 className="font-display font-semibold text-3xl mb-2 text-lexis-ink">{title}</h1>
        <p className="text-xs text-lexis-ink/40 mb-10">Last updated {lastUpdated}</p>
        <div className="space-y-6 text-sm text-lexis-ink/80 leading-relaxed">
          {children}
        </div>
      </section>

      <footer className="w-full max-w-3xl mx-auto p-6 border-t border-lexis-ink/10 flex items-center justify-between text-xs text-lexis-ink/40">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Private &amp; secure • Payments handled by Stripe</span>
        </div>
        <div>© 2026 LEXIS</div>
      </footer>
    </div>
  );
}
