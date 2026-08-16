import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext(undefined);

// Wraps the whole app. Holds the Supabase session (JWT used as the
// Authorization: Bearer header against the backend) and the matching
// `profiles` row (created automatically by the on_auth_user_created
// trigger — see backend/supabase-schema.sql).
export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still checking
  const [profile, setProfile] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (error) {
      console.error('[LEXIS] Failed to load profile:', error);
      setProfile(null);
    } else {
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

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email, password, fullName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        // Without this, Supabase falls back to whatever "Site URL" is set
        // in the project's Auth settings — on this project that's still
        // the default http://localhost:3000, so every confirmation email
        // sent a link that only ever worked on a laptop with a local dev
        // server running (reported live: a phone browser hitting
        // localhost:3000 got ERR_CONNECTION_REFUSED, blocking sign-up
        // entirely). window.location.origin is whatever this page is
        // actually running on — production, a Vercel preview, or
        // localhost in local dev — so this stays correct without
        // hardcoding a domain. NOTE: Supabase also requires this exact
        // origin to be present in Authentication → URL Configuration →
        // Redirect URLs in the dashboard, or it silently ignores this and
        // falls back to Site URL anyway — that allowlist entry can't be
        // set from application code, only the dashboard.
        emailRedirectTo: `${window.location.origin}/auth`
      }
    });
    if (error) throw error;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = useCallback(() => {
    if (session?.user) loadProfile(session.user.id);
  }, [session, loadProfile]);

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    loading: session === undefined,
    signIn,
    signUp,
    signOut,
    refreshProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
