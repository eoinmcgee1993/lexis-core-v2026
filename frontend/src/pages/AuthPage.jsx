import React, { useState, useEffect } from 'react';
import { Mail, Lock, LogIn, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import LexisMark from '../components/LexisMark';
import { useAuth } from '../context/AuthContext';
import { useSeo } from '../lib/useSeo';
import { trackEvent } from '../lib/analytics';
import { TRIAL } from '../content/facts';
import AppLink from '../components/AppLink';

// Set once a sign-in actually succeeds, so this device is treated as a
// returning user next time. Deliberately not set on sign_up: an account that
// has been created but never signed into should still land on sign-in only
// after the confirmation round-trip completes.
const RETURNING_KEY = 'lexis_has_signed_in';

export default function AuthPage({ navigateTo }) {
  const { session, signIn, signUp } = useAuth();

  // This one component renders at two different URLs — the explicit
  // /auth route, and as the signed-out fallback for /app (see
  // App.jsx's RouteController) — neither is content a search engine
  // should index, so noindex applies unconditionally rather than
  // branching on which URL actually mounted it.
  useSeo({
    title: 'Sign In | LEXIS',
    description: 'Sign in to LEXIS to continue practicing spoken English or Thai.',
    robots: 'noindex, nofollow'
  });

  // Default to sign_up, not sign_in. The primary CTA everywhere on the
  // marketing site is "Try It Free" / "ลองใช้ฟรี", and it routes here. A
  // first-time visitor who taps that was being shown a form headed "Sign in"
  // with the subhead "Continue practicing with LEXIS.", i.e. asked to sign in
  // to an account they have never had, under copy written for a returning
  // user. Every paid click would land on that.
  //
  // Returning visitors are remembered instead: RETURNING_KEY is set on a
  // successful sign-in below, so a device that has signed in before still
  // opens on the sign-in form. localStorage can throw (private mode, blocked
  // site data), so the read is guarded and falls back to sign_up, which is
  // the safer default of the two.
  const [mode, setMode] = useState(() => {
    try {
      return localStorage.getItem(RETURNING_KEY) ? 'sign_in' : 'sign_up';
    } catch {
      return 'sign_up';
    }
  });
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  // Self-attestation, not verified age-check technology — see
  // PrivacyPage.jsx's "Age and parental consent" section for why the
  // threshold is 20 (Thailand's PDPA minor definition) rather than 13/18.
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Already signed in (e.g. followed a stale /auth link) — go straight in.
  useEffect(() => {
    if (session) navigateTo('/app');
  }, [session, navigateTo]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'sign_up') {
        await signUp(email, password, fullName);
        trackEvent('signup_completed');
        setNotice('Account created. Check your email to confirm, then sign in.');
        setMode('sign_in');
      } else {
        await signIn(email, password);
        try { localStorage.setItem(RETURNING_KEY, '1'); } catch { /* private mode: just default to sign_up next time */ }
        navigateTo('/app');
      }
    } catch (err) {
      if (err.code === 'already_registered') {
        // Not a real failure, just the wrong tab: no confirmation email
        // was ever sent for this one (see AuthContext.jsx's signUp), so
        // pointing at "check your email" here would be a dead end.
        // Password left as typed, in case that's genuinely what's wrong.
        setNotice(err.message);
        setMode('sign_in');
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col items-center justify-center p-4">
      <AppLink
        to="/" navigateTo={navigateTo} className="absolute top-6 left-6 flex items-center space-x-2 text-xs text-lexis-ink/50 hover:text-lexis-ink transition-colors"
          >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to home</span>
      </AppLink>

      <div className="w-full max-w-sm bg-white border border-lexis-ink/10 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <LexisMark className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>

        <h1 className="text-xl font-bold mb-1 text-lexis-ink">{mode === 'sign_in' ? 'Sign in' : 'Create your account'}</h1>
        <p className="text-xs text-lexis-ink/50 mb-6">
          {mode === 'sign_in' ? 'Continue practicing with LEXIS.' : `Start your free ${TRIAL.minutes}-minute trial.`}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'sign_up' && (
            <div>
              <label className="text-xs text-lexis-ink/50 mb-1 block">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-lexis-canvas border border-lexis-ink/10 rounded-xl px-3 py-2.5 text-sm text-lexis-ink focus:outline-none focus:border-teal-600/60"
                placeholder="Somchai P."
              />
            </div>
          )}

          <div>
            <label className="text-xs text-lexis-ink/50 mb-1 flex items-center space-x-1.5">
              <Mail className="w-3 h-3" aria-hidden="true" /><span>Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-lexis-canvas border border-lexis-ink/10 rounded-xl px-3 py-2.5 text-sm text-lexis-ink focus:outline-none focus:border-teal-600/60"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-lexis-ink/50 mb-1 flex items-center space-x-1.5">
              <Lock className="w-3 h-3" aria-hidden="true" /><span>Password</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-lexis-canvas border border-lexis-ink/10 rounded-xl px-3 py-2.5 text-sm text-lexis-ink focus:outline-none focus:border-teal-600/60"
              placeholder="••••••••"
            />
          </div>

          {mode === 'sign_up' && (
            <label className="flex items-start gap-2 text-xs text-lexis-ink/60 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 flex-shrink-0"
              />
              <span>
                I confirm I'm 20 or older, or, if I'm younger, that I
                have my parent or legal guardian's permission to use
                LEXIS.
              </span>
            </label>
          )}

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {notice && <p className="text-xs text-teal-700">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[44px] py-3 bg-lexis-action hover:bg-lexis-action-dark disabled:opacity-50 text-lexis-navy font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : mode === 'sign_in' ? (
              <><LogIn className="w-4 h-4" aria-hidden="true" /><span>Sign in</span></>
            ) : (
              <><UserPlus className="w-4 h-4" aria-hidden="true" /><span>Create account</span></>
            )}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setNotice(''); setAgeConfirmed(false); }}
          className="w-full text-center text-xs text-lexis-ink/50 hover:text-teal-700 mt-5 transition-colors"
        >
          {mode === 'sign_in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
