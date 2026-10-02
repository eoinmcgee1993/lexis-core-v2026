# Leaving Supabase: the exit plan

Written 2 Oct 2026, when the owner asked how dependent LEXIS is on Supabase.
LEXIS is staying on Supabase for now. This file exists so that leaving, if it
is ever needed, is a day's work rather than a crisis. It contains no data;
backups live outside this repo (see "Backups" below).

## What Supabase actually holds

| Piece | Where it lives | Portable? |
|---|---|---|
| Tables (`profiles`, `redeemed_checkout_sessions`, `usage_logs`, `session_history`, `generations`, `analytics_events`, `error_logs`) | Plain Postgres, `public` schema | Yes. `pg_dump` / `pg_restore` onto any Postgres. |
| `redeem_pass`, `record_heartbeat`, `increment_sessions`, `handle_new_user` | plpgsql in `backend/supabase-schema.sql` | Yes, unchanged, except `handle_new_user` (a trigger on `auth.users`, see Logins). |
| Logins (email + password, sessions/JWTs) | Supabase Auth, `auth.users` | Yes, with work. Password hashes are standard bcrypt and can be imported into Clerk, so users do not have to reset. |
| Row-level security | Postgres policies | Mostly irrelevant after a move: the backend uses the service role, and the only client-side read is a user's own `profiles` row. |

## Where the code touches it

- Backend `backend/app.mjs`: ~38 references. `supabase.auth.getUser(token)` to
  verify a request, `.from(...)` reads/writes, three `.rpc(...)` calls.
- Frontend: 9 files, all through `src/lib/supabase` (sign up, sign in, sign
  out, `getSession`, `onAuthStateChange`, read own profile).

## The move, step by step (Neon + Clerk)

1. **Freeze**: put the site in a short maintenance window so no purchase lands mid-move.
2. **Database**: `pg_dump --schema=public` from Supabase → `pg_restore` into a new
   Neon project. Re-run the GRANT/REVOKE block from `supabase-schema.sql`, then
   run the "Public Can Execute SECURITY DEFINER Function" check (the 10 Sep lesson).
3. **Logins**: export `auth.users` (id, email, `encrypted_password`) from the
   Supabase dashboard **by the owner** (it contains password hashes; it must not
   pass through a chat or a repo). Import into Clerk with `password_hasher: bcrypt`,
   keeping the Supabase user id as Clerk `external_id` so `profiles.id` still matches.
4. **Backend**: replace `supabase.auth.getUser(token)` with Clerk's token check
   (map Clerk user → `external_id`), and swap `.from()/.rpc()` for a Postgres
   client (`pg` or `@neondatabase/serverless`) calling the same SQL.
5. **Frontend**: swap `src/lib/supabase` auth calls for Clerk's React components;
   the profile read moves behind a backend endpoint.
6. **Replace `handle_new_user`**: it's a trigger on `auth.users`; with Clerk,
   create the `profiles` row from a Clerk `user.created` webhook instead.
7. **Prove it**: `npm test` (both suites), then one real purchase end to end,
   which is the only proof the revenue path works.
8. Keep Supabase read-only for 30 days, then delete.

Estimate: 1–2 focused days of code plus the purchase test.

## Backups

The goal is a weekly copy of the database somewhere Supabase doesn't control.
It holds customer emails and purchase history, so it must never go in this
repo. An automated copy into Google Drive by the assistant was blocked
(2 Oct 2026) as moving personal data off-platform; the owner decides how
backups are taken. Options, simplest first:

- **Manual, monthly**: Supabase dashboard → Table Editor → each table → Export
  to CSV, saved into the private Drive folder "LEXIS backups".
- **Automated**: a scheduled `pg_dump` (GitHub Action or any cron host) using
  the database connection string as a secret, uploading to Drive/R2. Needs the
  owner to create the secret and approve the destination.
