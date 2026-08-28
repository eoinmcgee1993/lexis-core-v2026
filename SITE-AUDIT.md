# LEXIS site audit

> **Status: all findings below were fixed on 27 Aug 2026 (PR #90).** The
> report is kept as written, because the measurements are the evidence and
> rewriting them into past tense would lose that. Verified after the fix:
> amber CTA contrast 9.53:1, 76 internal anchors across 17 routes, /app opens
> on "Create your account", 0 of 17 descriptions over 160 chars, 0
> min-h-screen, all 4 icons 200, 0 primary CTAs under 44px, 0 regressions.

27 Aug 2026, against commit `b55ac94`. Verified the local build serves the
byte-identical `index-BwIRkFGb.js` and `index-CEidyXjQ.css` that
learnwithlexis.com serves, so auditing the build is auditing production.

17 routes, desktop (1280) and mobile (375), plus the site files and the
internal link graph.

## What is clean

Genuinely clean, not "no obvious problems":

- **0 console errors and 0 failed requests** on all 17 routes.
- **No horizontal overflow at 375px** anywhere.
- **Exactly one `h1`** per route.
- **Valid JSON-LD** on every route (2-3 blocks each, all parse).
- **Correct `<html lang>`** on all 17, and 3 reciprocal hreflang links on
  every bilingual route.
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.svg`, `llms.txt`
  all 200.
- Page weight 593-602KB on content routes; 1.4-1.5MB on `/` and `/th`, which
  carry the hero demo's avatar frames and audio.

## HIGH

### H1. The primary call to action fails contrast

Measured, not estimated:

```
"Try It Free"   rgb(255,255,255) on rgb(255,158,0)  18px/600
   ratio 2.07:1    WCAG AA needs 4.5:1    FAIL
"Get Started"   rgb(255,255,255) on rgb(255,158,0)  14px/600
   ratio 2.07:1    WCAG AA needs 4.5:1    FAIL
```

White on `lexis-action` amber is **2.07:1**. AA needs 4.5:1 for text this
size. This is not a marginal miss, and it is on the single most important
element on the site: every "Try It Free", "Get Started" and "Start
practicing free" button, on every page, in both languages.

It also fails in ordinary conditions, not just for low-vision users:
outdoors, on a dim phone, at an angle. Thai mobile is a lot of outdoors.

**Fix:** keep the amber, change the text to `lexis-navy` (`#050B14`) or
`lexis-ink` (`#1E293B`). Dark-on-amber clears AA comfortably and the button
stays the same colour, so the brand doesn't move. Darkening the amber enough
to carry white text would change the brand colour, which is the worse
trade.

### H2. The site has no crawlable internal links

The homepage has **zero `<a href>` elements**. All 12 navigation controls are
`<button onClick={() => navigateTo(...)}>`.

This is a router pattern, and it works fine for humans. For crawlers it means
there is **no internal link graph at all**. Google discovers pages only from
`sitemap.xml`, nothing passes link equity between pages, and the deliberate
hub-and-spoke structure built across several PRs (landing → practice pages →
pricing → community) is invisible to a crawler.

Everything else in the SEO work is correct and this undercuts it.

**Fix:** render navigation as real `<a href>` and let the click handler call
`preventDefault()` before routing. Same behaviour for users, real links for
crawlers, and middle-click / open-in-new-tab starts working, which it
currently does not.

## MEDIUM

### M1. "Try It Free" sends new visitors to a sign-in form

Tapping the primary CTA on the homepage lands on a screen headed **"Sign in"**
with the subhead **"Continue practicing with LEXIS."** and email/password
fields. "Sign up" is a text link underneath.

A first-time visitor who just clicked "Try It Free" is being asked to sign in
to an account they don't have, under copy written for a returning user. Every
paid click will land here.

**Fix:** default that screen to sign-up when the visitor arrives from a trial
CTA, or at minimum lead with "Start your free 30 minutes" and put sign-in
underneath.

### M2. Meta descriptions truncated on 4 routes

`/` is 213 characters, `/th` 168, `/practice/everyday-english` 174,
`/th/practice/everyday-english` 169. Google truncates around 155-160, so the
tail is cut in results. Titles are all fine (12-55 chars).

### M3. `min-h-screen` on all 17 routes

Confirmed present sitewide. On iOS Safari `100vh` counts the address bar, so
the bottom of the layout sits under it. Worst on `LiveStage`, which is a
full-bleed voice screen with controls at the bottom edge, mid-conversation.

**Fix:** `min-h-[100dvh]`, `viewport-fit=cover`, and
`env(safe-area-inset-bottom)` padding on the live controls.

### M4. App icons missing

`/apple-touch-icon.png`, `/icon-192.png` and `/icon-512.png` all **404**. The
manifest itself exists and is well-formed, so add-to-homescreen half-works:
it resolves the manifest and then has no icon to show. For a product someone
opens nightly to practise, a home-screen icon is the cheapest retention
mechanism available.

### M5. Tap targets under 44px

Present on every route. The clearest ones:

- Hero mute toggle: **32x32** (mobile 35x35)
- "Get Started" header button: 12-14px text
- Checkout buttons on `/pricing`: 40-43px tall, just under
- Footer and header text links: ~20px tall

WCAG 2.5.8 AA requires 24x24, which most of these pass; 44x44 is Apple's HIG
and WCAG AAA. The checkout buttons are the ones worth fixing first, because
that is the revenue path.

## LOW

- `/pricing` and `/th/pricing` skip a heading level, `h1` straight to `h3`.
- The old `fraunces-600.woff2` still returns 200 from Vercel's edge cache
  though it is deleted from the repo. Nothing references it; it will age out.

## Suggested order

1. **H1, the CTA contrast.** One token change, fixes every page, and it is on
   the button the whole business depends on.
2. **M1, the auth wall.** Gates every paid click. Do it before spending.
3. **H2, real anchors.** Unlocks the SEO work already paid for.
4. **M4 icons, then M2 descriptions.** Both small.
5. **M3 `100dvh`** with the next round of app work.
6. **M5 tap targets**, checkout buttons first.

H1 and M1 are the two I would not leave. One is an accessibility failure on
the primary action; the other means a first-time visitor's first click asks
them to sign in to nothing.
