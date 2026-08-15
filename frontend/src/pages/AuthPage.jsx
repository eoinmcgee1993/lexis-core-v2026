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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-4">
      <button
        onClick={() => navigateTo('/')}
        className="absolute top-6 left-6 flex items-center space-x-2 text-xs text-slate-400 hover:text-cyan-400 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to home</span>
      </button>

      <div className="w-full max-w-sm bg-slate-900/60 border border-slate-800 rounded-2xl p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            LEXIS
          </span>
        </div>

        <h1 className="text-xl font-bold mb-1">{mode === 'sign_in' ? 'Sign in' : 'Create your account'}</h1>
        <p className="text-xs text-slate-500 mb-6">
          {mode === 'sign_in' ? 'Continue practicing with LEXIS.' : 'Start your free 30-minute trial.'}
        </p>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'sign_up' && (
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60"
                placeholder="Somchai P."
              />
            </div>
          )}

          <div>
            <label className="text-xs text-slate-400 mb-1 flex items-center space-x-1.5">
              <Mail className="w-3 h-3" /><span>Email</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 mb-1 flex items-center space-x-1.5">
              <Lock className="w-3 h-3" /><span>Password</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-cyan-500/60"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}
          {notice && <p className="text-xs text-emerald-400">{notice}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-bold text-sm rounded-xl transition-all flex items-center justify-center space-x-2"
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
          className="w-full text-center text-xs text-slate-400 hover:text-cyan-400 mt-5 transition-colors"
        >
          {mode === 'sign_in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}
