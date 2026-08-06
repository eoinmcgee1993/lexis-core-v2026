import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Mail, Lock, LogIn, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from './lib/supabaseClient';
import App from './App';

// Gatekeeper mounted at the /app route: shows a sign-in/sign-up form until
// there's a Supabase session, fetches the matching `profiles` row (created
// automatically by the on_auth_user_created trigger), then hands both to
// <App/>. App uses session.access_token to authorize /api/session and
// /api/heartbeat calls against the backend's Supabase-JWT guard.
export default function AuthGate({ onBackToHome }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(null);
  const [profileError, setProfileError] = useState('');

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.error('[LEXIS] Failed to load profile:', error);
      setProfileError('Could not load your account profile. Please refresh, or contact support if this persists.');
      setProfile(null);
    } else {
      setProfileError('');
      setProfile(data);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadProfile(session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return <AuthForm onBackToHome={onBackToHome} />;
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 px-4 text-center">
        {profileError ? (
          <p className="text-rose-400 text-sm max-w-sm">{profileError}</p>
        ) : (
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
        )}
        <button onClick={handleLogout} className="text-xs text-slate-500 hover:text-slate-300 underline">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <App
      session={session}
      profile={profile}
      onProfileRefresh={() => loadProfile(session.user.id)}
      onLogout={handleLogout}
      onBackToHome={onBackToHome}
    />
  );
}

function AuthForm({ onBackToHome }) {
  const [mode, setMode] = useState('sign_in'); // 'sign_in' | 'sign_up'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      if (mode === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;
        setNotice('Account created. Check your email to confirm, then sign in.');
        setMode('sign_in');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
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
        onClick={onBackToHome}
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
            LEXIS OS
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
