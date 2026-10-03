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

// Off until Google is enabled as a provider in Supabase (Authentication →
// Providers → Google, with an OAuth client from Google Cloud). Shipping the
// button before that would hand every tap a "provider is not enabled" error,
// so it is a build-time switch in .env.production, flipped once the
// dashboard side is done.
const GOOGLE_SIGN_IN = import.meta.env.VITE_GOOGLE_SIGN_IN === 'on';

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="w-4 h-4" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function AuthPage({ navigateTo }) {
  const { session, signIn, signUp, signInWithGoogle } = useAuth();

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

  // Google signs a brand-new user up just as readily from the "Sign in" tab,
  // so the 20+/guardian attestation can't hang off the sign-up checkbox
  // alone. On sign-up the same checkbox gates both buttons; on sign-in the
  // statement sits under the button instead, which is where a returning
  // user (already attested) skims past it and a new one still sees it.
  const continueWithGoogle = async () => {
    if (mode === 'sign_up' && !ageConfirmed) {
      setError('Please tick the age confirmation first.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      trackEvent('google_signin_started');
      try { localStorage.setItem(RETURNING_KEY, '1'); } catch { /* private mode */ }
      await signInWithGoogle(); // navigates away on success
    } catch (err) {
      setError(err.message || 'Google sign-in is unavailable right now. Please use email instead.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] lexis-canvas-gradient text-lexis-ink font-sans flex flex-col items-center justify-center p-4">
      <AppLink
        to="/" navigateTo={navigateTo} className="absolute top-6 left-6 flex items-center space-x-2 text-xs text-lexis-ink/70 hover:text-lexis-ink transition-colors"
          >
        <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        <span>Back to home</span>
      </AppLink>

      <div className="w-full max-w-sm bg-white border border-lexis-ink/10 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <LexisMark className="w-9 h-9" />
          <span className="text-lg font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>

        <h1 className="text-xl font-bold mb-1 text-lexis-ink">{mode === 'sign_in' ? 'Sign in' : 'Create your account'}</h1>
        <p className="text-xs text-lexis-ink/70 mb-6">
          {mode === 'sign_in' ? 'Continue practicing with LEXIS.' : `Start your free ${TRIAL.minutes}-minute trial.`}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'sign_up' && (
            <div>
              <label className="text-xs text-lexis-ink/70 mb-1 block">Full name</label>
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
            <label className="text-xs text-lexis-ink/70 mb-1 flex items-center space-x-1.5">
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
            <label className="text-xs text-lexis-ink/70 mb-1 flex items-center space-x-1.5">
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
            <label className="flex items-start gap-2 text-xs text-lexis-ink/75 cursor-pointer">
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

        {GOOGLE_SIGN_IN && (
          <>
            <div className="flex items-center gap-3 my-4" aria-hidden="true">
              <span className="flex-1 h-px bg-lexis-ink/10" />
              <span className="text-[11px] text-lexis-ink/60">or</span>
              <span className="flex-1 h-px bg-lexis-ink/10" />
            </div>
            <button
              type="button"
              onClick={continueWithGoogle}
              disabled={loading}
              className="w-full min-h-[44px] py-3 bg-white border border-lexis-ink/15 hover:border-lexis-ink/30 disabled:opacity-50 text-lexis-ink font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <GoogleG />
              <span>Continue with Google</span>
            </button>
            {mode === 'sign_in' && (
              <p className="text-[11px] text-lexis-ink/60 mt-2 text-center">
                New here? Continuing with Google confirms you're 20 or older, or have a parent or guardian's permission.
              </p>
            )}
          </>
        )}

        <button
          onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setNotice(''); setAgeConfirmed(false); }}
          className="w-full text-center text-xs text-lexis-ink/70 hover:text-teal-700 mt-5 transition-colors"
        >
          {mode === 'sign_in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
