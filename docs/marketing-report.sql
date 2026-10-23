-- LEXIS marketing report: which source, campaign and post brings visitors
-- =====================================================================
--
-- For pasting into Supabase's SQL Editor. Every query below is a plain
-- SELECT over public.analytics_events: nothing is written, created or
-- changed, so they are safe to run against production at any time.
--
-- HOW TO RUN
--   Run one numbered query at a time: highlight it and press Run. The
--   editor shows only the result of the last statement it ran, so running
--   the whole file at once shows query 3 and nothing else.
--
--   Each query opens with the same `dates` block, and that is where the
--   date range is set. The default is the last 7 days up to now. For a
--   fixed window, swap in the commented lines (Bangkok calendar days;
--   from_ts is inclusive, to_ts exclusive). It is repeated per query, not
--   set once for the file, because a setting made by one Run is not
--   reliably still there for the next one, and a view would be a write.
--
-- WHAT IS STORED (analytics_events.metadata, JSONB; key names are
-- case-sensitive)
--   Written by frontend/src/lib/analytics.js, kept by SOURCE_KEYS in
--   backend/app.mjs. Any other key is dropped before the row is written.
--
--     src      utm_source, or ?ref= when the link has no utm_source
--     med      utm_medium
--     cmp      utm_campaign
--     cnt      utm_content: the id of the one post or ad the link was on
--     refHost  the referring site's hostname (never its full URL), only
--              when it is not learnwithlexis.com itself
--
--   Values are stored lowercased, cut down to the characters a-z 0-9 . _ -
--   and to 60 characters. So filter with lowercase literals:
--   utm_content=Day01_TikTok!! is stored as 'day01_tiktok'. Thai script is
--   outside that alphabet and is stripped, so keep post ids ASCII. Two ids
--   that differ only in case or punctuation (Day01-TikTok, day01tiktok!)
--   become the same stored id and are merged into one row below, so pick
--   ids that stay distinct once lowercased and stripped.
--
--   The source is read once per visit (per browser tab), on the first
--   event, and attached to every later event in that tab. A second tagged
--   link opened in the same tab keeps the first link's tags.
--
-- EVENTS USED HERE (event_name)
--   pageview               every route change; a visit is one session_id
--   signup_completed       the email + password form only
--   google_signin_started  a tap on "Continue with Google". Google signups
--                          never fire signup_completed (the account is made
--                          on Google's round trip), so this is the only
--                          trace of them
--   checkout_started       a tap on a pass on /pricing, before Stripe
--   checkout_completed     back on the success page from Stripe. This is a
--                          client-side event, not a payment record: a
--                          closed tab never sends it, and Stripe is the
--                          only real count of money received
--
--   Funnel columns count distinct visits (session_id), not rows, so a
--   double tap or a refreshed page is not counted twice.
--
-- WHAT THIS CANNOT TELL YOU (read before trusting a purchase column)
--   * Confirming an email opens a new tab, and a new tab starts with no
--     source. signup_completed fires on the form, in the tab the link
--     opened, so the signup itself is usually attributed. Anything the
--     visitor does after confirming in that new tab, including checking
--     out, lands under 'direct'. So do signups and purchases from someone
--     who saw a post in the TikTok, Instagram or LINE in-app browser and
--     then opened the site in their real browser. The checkout columns
--     here are a floor, not a count.
--   * For purchases, the reliable attribution is the per-channel Stripe
--     promo code: one Stripe Promotion Code per channel or partner (see
--     PARTNER-CODES.md, "One coupon per partner", and the note under
--     ADVERTISING.md's link-tagging table), counted in Stripe. A code
--     is typed at checkout, so it survives new tabs, other browsers and
--     other devices. These queries cannot.
--   * In-app browsers often send no referrer, so an untagged link from
--     them shows as 'direct'. Every link we post should carry its tags.
--   * Rows from before cnt was captured (Oct 2026) have no post id and
--     show as '-'. They cannot be backfilled.
--   * A browser that blocks sessionStorage (some private modes) reports
--     session_id 'no-storage', so all of those visits collapse into one.
--


-- 1. FUNNEL BY SOURCE, MEDIUM, CAMPAIGN AND POST ----------------------------
--    One row per combination of tags. '-' means that tag was not on the
--    link; source 'direct' means no source tag and no outside referrer.
WITH dates AS (
  SELECT now() - interval '7 days' AS from_ts,
         now()                     AS to_ts
  -- SELECT timestamptz '2026-10-20 00:00 Asia/Bangkok' AS from_ts,
  --        timestamptz '2026-10-27 00:00 Asia/Bangkok' AS to_ts
),
ev AS (
  SELECT e.session_id,
         e.event_name,
         coalesce(e.metadata->>'src', e.metadata->>'refHost', 'direct') AS source,
         coalesce(e.metadata->>'med', '-')                              AS medium,
         coalesce(e.metadata->>'cmp', '-')                              AS campaign,
         coalesce(e.metadata->>'cnt', '-')                              AS content
  FROM public.analytics_events e
  CROSS JOIN dates d
  WHERE e.created_at >= d.from_ts
    AND e.created_at <  d.to_ts
)
SELECT source,
       medium,
       campaign,
       content,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'pageview')              AS visits,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'signup_completed')      AS signups,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'google_signin_started') AS google_signin_taps,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'checkout_started')      AS checkouts_started,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'checkout_completed')    AS checkouts_completed
FROM ev
GROUP BY source, medium, campaign, content
ORDER BY visits DESC, signups DESC, checkouts_completed DESC, source, campaign, content;


-- 2. TOP POSTS -----------------------------------------------------------
--    One row per post id (cnt), added up across every platform it was
--    posted to, so a video cross-posted to TikTok and Instagram under one
--    id is one row, with both in `sources`. Untagged visits are left out.
--    Times are Bangkok local.
WITH dates AS (
  SELECT now() - interval '7 days' AS from_ts,
         now()                     AS to_ts
  -- SELECT timestamptz '2026-10-20 00:00 Asia/Bangkok' AS from_ts,
  --        timestamptz '2026-10-27 00:00 Asia/Bangkok' AS to_ts
),
ev AS (
  SELECT e.session_id,
         e.event_name,
         e.created_at,
         e.metadata->>'cnt'                                             AS content,
         coalesce(e.metadata->>'src', e.metadata->>'refHost', 'direct') AS source,
         e.metadata->>'cmp'                                             AS campaign
  FROM public.analytics_events e
  CROSS JOIN dates d
  WHERE e.created_at >= d.from_ts
    AND e.created_at <  d.to_ts
    AND e.metadata->>'cnt' IS NOT NULL
)
SELECT content                                                                     AS post,
       string_agg(DISTINCT source, ', ')                                           AS sources,
       string_agg(DISTINCT campaign, ', ')                                         AS campaigns,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'pageview')              AS visits,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'signup_completed')      AS signups,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'google_signin_started') AS google_signin_taps,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'checkout_started')      AS checkouts_started,
       count(DISTINCT session_id) FILTER (WHERE event_name = 'checkout_completed')    AS checkouts_completed,
       (min(created_at) FILTER (WHERE event_name = 'pageview')) AT TIME ZONE 'Asia/Bangkok' AS first_visit,
       (max(created_at) FILTER (WHERE event_name = 'pageview')) AT TIME ZONE 'Asia/Bangkok' AS last_visit
FROM ev
GROUP BY content
ORDER BY visits DESC, signups DESC, checkouts_completed DESC, post
LIMIT 25;


-- 3. ARE POST IDS ARRIVING? ------------------------------------------------
--    Tagged visits per source, split by whether the link carried a post
--    id. Run it after a deploy, or whenever query 2 comes back emptier than
--    expected. A high `without_post_id` on a channel we post to means its
--    links are going out without utm_content. Some sources never carry
--    one, and that is expected: partner ?ref= tags, 'share' (a learner's
--    result card) and 'email' (the trial reminder).
WITH dates AS (
  SELECT now() - interval '7 days' AS from_ts,
         now()                     AS to_ts
  -- SELECT timestamptz '2026-10-20 00:00 Asia/Bangkok' AS from_ts,
  --        timestamptz '2026-10-27 00:00 Asia/Bangkok' AS to_ts
)
SELECT e.metadata->>'src'                                                       AS source,
       count(DISTINCT e.session_id)                                             AS tagged_visits,
       count(DISTINCT e.session_id) FILTER (WHERE e.metadata->>'cnt' IS NOT NULL) AS with_post_id,
       count(DISTINCT e.session_id) FILTER (WHERE e.metadata->>'cnt' IS NULL)     AS without_post_id
FROM public.analytics_events e
CROSS JOIN dates d
WHERE e.event_name = 'pageview'
  AND e.metadata->>'src' IS NOT NULL
  AND e.created_at >= d.from_ts
  AND e.created_at <  d.to_ts
GROUP BY 1
ORDER BY tagged_visits DESC, source;
