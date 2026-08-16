import React, { useState, useEffect } from 'react';
import { Sparkles, Mail, Lock, LogIn, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage({ navigateTo }) {
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState('sign_in'); // 'sign_in' | 'sign_up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
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
        setNotice('Account created. Check your email to confirm, then sign in.');
        setMode('sign_in');
      } else {
        await signIn(email, password);
        navigateTo('/app');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lexis-canvas-gradient text-lexis-ink font-sans flex flex-col items-center justify-center p-4">
      <button
        onClick={() => navigateTo('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-xs text-lexis-ink/50 hover:text-lexis-ink transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </button>

      <div className="w-full max-w-sm bg-white border border-lexis-ink/10 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-teal-600/10 border border-teal-600/20 rounded-xl text-teal-700">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-display font-semibold text-lexis-ink">
            LEXIS
          </span>
        </div>

        <h1 className="text-xl font-bold mb-1 text-lexis-ink">{mode === 'sign_in' ? 'Sign in' : 'Create your account'}</h1>
        <p className="text-xs text-lexis-ink/50 mb-6">
          {mode === 'sign_in' ? 'Continue practicing with LEXIS.' : 'Start your free 30-minute trial.'}
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
              <Mail className="w-3 h-3" /><span>Email</span>
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
              <Lock className="w-3 h-3" /><span>Password</span>
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

          {error && <p className="text-xs text-rose-600">{error}</p>}
          {notice && <p className="text-xs text-teal-700">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-lexis-action hover:bg-lexis-action-dark disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'sign_in' ? (
              <><LogIn className="w-4 h-4" /><span>Sign in</span></>
            ) : (
              <><UserPlus className="w-4 h-4" /><span>Create account</span></>
            )}
          </button>
        </form>

        <button
          onClick={() => { setMode(mode === 'sign_in' ? 'sign_up' : 'sign_in'); setError(''); setNotice(''); }}
          className="w-full text-center text-xs text-lexis-ink/50 hover:text-teal-700 mt-5 transition-colors"
        >
          {mode === 'sign_in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
