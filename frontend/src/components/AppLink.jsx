// frontend/src/components/AppLink.jsx
//
// A real <a href> that still routes client-side.
//
// Why this exists (27 Aug 2026, site audit H2): every internal navigation on
// this site was a <button onClick={() => navigateTo('/x')}>. That works for a
// mouse and does nothing for anything else:
//
//   - Crawlers see no internal link graph at all. The homepage had ZERO
//     <a href> elements, so Google could only discover pages from
//     sitemap.xml, and no link equity passed between them. Every indexable
//     route, the hreflang pairs and the practice-page hub structure were
//     built on top of a site with no internal links.
//   - Middle-click, cmd/ctrl-click and "open in new tab" did nothing.
//   - "Copy link address" did nothing.
//   - Screen readers announced a button where a link was meant, which is a
//     different promise: a button does something here, a link goes there.
//
// Modified clicks are deliberately left to the browser so opening in a new
// tab behaves exactly as it does on any other site.
import React from 'react';

// A button is display:inline-block by default; an anchor is display:inline,
// where vertical padding does not push the line box around. Most call sites
// carry padding classes that were written against button behaviour, so an
// anchor with no display utility of its own gets inline-block to match. Call
// sites that already declare their own display are left alone.
const DECLARES_DISPLAY = /(^|\s)(inline-flex|inline-grid|inline-block|flex|grid|block|contents|hidden|table)(\s|$)/;

export default function AppLink({ to, navigateTo, className = '', children, ...rest }) {
  const cls = DECLARES_DISPLAY.test(className) ? className : `inline-block ${className}`.trim();

  return (
    <a
      href={to}
      className={cls}
      onClick={(e) => {
        // Let the browser own anything that isn't a plain left click, so
        // new-tab, new-window and download modifiers keep working.
        if (e.defaultPrevented) return;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        navigateTo(to);
      }}
      {...rest}
    >
      {children}
    </a>
  );
}
