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
 * @param {Record<string, object>} [seo.jsonLd] - { [scriptId]: jsonLdObject }
 */
export function useSeo({ title, description, canonical, robots, jsonLd }) {
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

    if (jsonLd) {
      Object.entries(jsonLd).forEach(([id, data]) => upsertJsonLd(id, data));
    }

    // Deliberately no cleanup function — the next route's useSeo call
    // overwrites/removes what it needs to on its own mount. Removing tags
    // on unmount would leave a route-less flash of no title/description
    // during the transition, which is worse.
  }, [title, description, canonical, robots, jsonLd]);
}
