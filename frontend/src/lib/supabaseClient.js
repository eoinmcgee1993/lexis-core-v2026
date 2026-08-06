import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '[LEXIS] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
    'Auth and billing will not work until these are set in frontend/.env.local.'
  );
}

// supabase-js persists the session (access/refresh tokens) in localStorage
// and refreshes it automatically — no manual token storage needed.
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
