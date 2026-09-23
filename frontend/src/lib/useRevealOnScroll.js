// frontend/src/lib/useRevealOnScroll.js
//
// One-shot scroll reveal for the marketing page's below-the-fold sections
// (23 Sep 2026, launch). Each `[data-reveal]` element inside `rootRef`
// fades and rises into place once, the first time it scrolls into view,
// and is then left alone. Approved as a bounded proposal against the
// design record, and it has to stay inside the same rules the rest of this
// page's motion already keeps:
//
//   - Nothing loops. HeroLiveDemo.jsx's rule for a marketing page is that
//     nothing animates unconditionally, because the target is mid-range
//     Android in Thailand. This runs one transition per section, ever, and
//     disconnects its observer as each one lands.
//   - prefers-reduced-motion gets no reveal at all: every section is
//     simply there. index.css also forces them visible under that query,
//     in case the setting flips after something was already hidden.
//
// The part that is easy to get wrong is what the page looks like BEFORE
// this runs. main.jsx mounts with createRoot, so the prerendered HTML is
// painted first and then React replaces it. If the hidden state lived in
// the markup, three things break at once:
//   1. the prerender snapshot (scripts/prerender.mjs) would bake
//      below-the-fold sections in as invisible — the static HTML that
//      crawlers and no-JS visitors get would be blank past the hero;
//   2. anything already on screen would blink out and fade back in on
//      every load;
//   3. a failure anywhere in this hook would leave content stuck hidden.
// So the markup carries no hidden state. This effect adds it, before first
// paint (useLayoutEffect), and only to sections that are ENTIRELY below
// the viewport at that moment — nothing a visitor can already see is ever
// hidden. It skips the prerender's automated Chromium the same way
// analytics.js does (navigator.webdriver), and every other failure path
// (no IntersectionObserver, an exception, React rewriting a className)
// ends with the section visible, never stuck at opacity 0.
import { useLayoutEffect } from 'react';

export function useRevealOnScroll(rootRef) {
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === 'undefined') return undefined;
    if (typeof navigator !== 'undefined' && navigator.webdriver) return undefined;
    if (typeof IntersectionObserver === 'undefined') return undefined;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const viewportH = window.innerHeight || document.documentElement.clientHeight;
    const pending = Array.from(root.querySelectorAll('[data-reveal]'))
      .filter((el) => el.getBoundingClientRect().top >= viewportH);
    if (pending.length === 0) return undefined;

    pending.forEach((el) => el.classList.add('lexis-reveal'));

    // threshold 0 with the bottom edge pulled in 8%: a section starts
    // arriving as soon as its top clears the lower part of the screen.
    // A proportional threshold would hold a tall section (the FAQ)
    // invisible until a fraction of its own height had scrolled past.
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-in');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0 });
    pending.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
      // Leave nothing hidden behind if the page unmounts mid-scroll.
      pending.forEach((el) => el.classList.remove('lexis-reveal', 'is-in'));
    };
  }, [rootRef]);
}
