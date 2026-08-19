// frontend/src/lib/useSeo.js
//
// Per-route <head> management for a 4-route SPA with no react-router and
// no react-helmet. Deliberately not a dependency — four routes don't
// warrant one, and this is the whole thing:
//
// This exists specifically for scripts/prerender.mjs (see that file):
// prerender.mjs snapshots each pre-rendered route's DOM *after* React has
// mounted and this hook has run, so whatever a page passes here is what
// actually ships as that route's static <head> — title, description,
// canonical, robots, and any JSON-LD — not just a browser-tab nicety.
//
// A re-audit (Digital Renaissance, 17 Aug 2026) found the previous setup
// (a static index.html head shared by every route) serving homepage
// metadata identically on /pricing, /auth, and /app — including a
// canonical tag on /pricing that pointed at the homepage, telling Google
// /pricing was a duplicate. This hook is the fix: every route sets its
// own head tags on mount.
import { useEffect } from 'react';
import { trackEvent } from './analytics';

function upsertMeta(name, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertProperty(property, content) {
  if (content == null) return;
  let el = document.head.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertCanonical(href) {
  if (!href) return;
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

// One <link rel="alternate" hreflang="..."> per language, including
// "x-default". Stage 4 of the remediation brief: index.html previously had
// a self-referencing hreflang cluster with no actual /th pages behind it
// (removed in Stage 1 rather than shipped as a broken signal) — now that
// real /th and /th/pricing routes exist, each language version of a page
// declares every version of itself, itself included, per Google's own
// reciprocal-hreflang requirement (a one-way link is ignored).
function upsertHreflang(alternates) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  if (!alternates) return;
  alternates.forEach(({ hrefLang, href }) => {
    const el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hrefLang);
    el.setAttribute('href', href);
    document.head.appendChild(el);
  });
}

// One <script type="application/ld+json"> per id, so a page can carry
// more than one JSON-LD block (e.g. FAQPage) without them colliding, and
// so switching routes cleanly removes a block that doesn't apply anymore
// (e.g. FAQPage must not linger into a subsequent /pricing visit in the
// same SPA session).
function upsertJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (!data) {
    if (existing) existing.remove();
    return;
  }
  let el = existing;
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * @param {object} seo
 * @param {string} seo.title
 * @param {string} seo.description
 * @param {string} seo.canonical - full absolute URL, self-referencing
 * @param {string} [seo.robots] - e.g. 'noindex, nofollow' for /auth, /app
 * @param {string} [seo.htmlLang] - sets <html lang="..."> (defaults to 'en' if omitted)
 * @param {Array<{hrefLang: string, href: string}>} [seo.hreflang] - reciprocal alternate-language links, this page's own version included
 * @param {Record<string, object>} [seo.jsonLd] - { [scriptId]: jsonLdObject }
 */
export function useSeo({ title, description, canonical, robots, htmlLang, hreflang, jsonLd }) {
  useEffect(() => {
    if (title) {
      document.title = title;
      upsertProperty('og:title', title);
      upsertMeta('twitter:title', title);
    }
    if (description) {
      upsertMeta('description', description);
      upsertProperty('og:description', description);
      upsertMeta('twitter:description', description);
    }
    upsertMeta('robots', robots || null);
    upsertCanonical(canonical);
    if (canonical) upsertProperty('og:url', canonical);
    document.documentElement.lang = htmlLang || 'en';
    upsertProperty('og:locale', htmlLang === 'th' ? 'th_TH' : 'en_US');
    upsertHreflang(hreflang);

    if (jsonLd) {
      Object.entries(jsonLd).forEach(([id, data]) => upsertJsonLd(id, data));
    }

    // Deliberately no cleanup function — the next route's useSeo call
    // overwrites/removes what it needs to on its own mount. Removing tags
    // on unmount would leave a route-less flash of no title/description
    // during the transition, which is worse.
  }, [title, description, canonical, robots, htmlLang, hreflang, jsonLd]);

  // Pageview — a separate effect, deliberately scoped to `title` alone
  // rather than folded into the head-tags effect above. Several callers
  // pass a fresh jsonLd object literal on every render (PricingPage.jsx's
  // `{ 'jsonld-offers': offersJsonLd }`, for one), so that effect's full
  // dependency list re-fires on unrelated re-renders (a loading spinner,
  // an error message) — piggybacking on it would inflate pageview counts
  // with duplicates that aren't real navigation. `title` is a plain
  // string on every caller (compared by value, not reference) and — unlike
  // `canonical` — every route sets it, including the noindexed /app and
  // /auth, which don't pass a canonical at all.
  useEffect(() => {
    if (title) {
      trackEvent('pageview', { path: window.location.pathname, lang: htmlLang || 'en' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
}
