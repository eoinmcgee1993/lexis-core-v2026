// frontend/src/brand/lexisMark.js
//
// THE LEXIS mark, as data. Rebrand of 23 Sep 2026: direction B, "L,
// speaking" — a geometric L with two sound waves leaving it. The owner
// chose it from four rendered directions (tile icon, home-screen and
// favicon sizes, light and dark lockups); the case for it was that it is
// the only one ownable as a mark (a five-bar waveform is the stock "audio"
// glyph of every voice and podcast app, a speech bubble is every chat app),
// that it holds its silhouette at 32px and below, and that navy + amber is
// the most distinctive pair on an app grid.
//
// It replaces the five-bar waveform (LexisMark.jsx history below the fold
// of that file). The waveform's reason for existing — "the product is a
// live voice conversation, and this is the one form that says so" — is
// kept, not dropped: the waves ARE the voice, the letter is whose voice.
//
// WHY THIS IS A PLAIN MODULE
//
// The old mark's coordinates lived in four places: LexisMark.jsx,
// public/favicon.svg, and restated or regex-scraped inside three brand-kit
// generators. Every one of those files carried a comment worrying about the
// copies drifting apart. This file ends that: it has no JSX and no React,
// so the component AND the Node scripts in scripts/images/ import the same
// numbers, and public/favicon.svg is written from here by
// generate_app_icons.mjs rather than kept by hand. Same principle as
// content/facts.js.
//
// GEOMETRY (viewBox 0 0 100 100)
//
//   - Tile: 100x100, rx 23 — the rounded-square proportion the old 24-unit
//     favicon used (rx 6/24).
//   - L: one stroked path, width 12, round caps and joins. Spans x 22-59,
//     y 21.5-78.5 with its caps.
//   - Waves: two arcs, width 7.5. The concepts used 7; at 16px that is
//     1.1px and the outer arc (at reduced opacity) all but vanished, so it
//     went up half a unit and the outer arc's opacity from .55 to .62.
//   - The whole glyph is optically centred: ink spans x 22-78.6, y
//     21.5-78.5, centre (50.3, 50). The concepts sat 3 units right and 2.5
//     high of centre, which read as the L drifting up-left inside the tile.
//
// Colours are the palette's own (tailwind.config.js): lexis-navy for the
// tile, white for the letter, lexis-action amber for the waves — amber is
// already this product's "do something" colour, and the waves are the one
// part of the mark that is doing something.

export const MARK_COLORS = {
  tile: '#050B14',   // lexis-navy
  letter: '#FFFFFF',
  waves: '#FF9E00'   // lexis-action
};

export const MARK_GEOMETRY = {
  viewBox: '0 0 100 100',
  tileRadius: 23,
  letter: { d: 'M28 27.5v45h25', strokeWidth: 12 },
  waves: [
    { d: 'M58 41a13.5 13.5 0 0 1 0 19', strokeWidth: 7.5, opacity: 1 },
    { d: 'M67 31.5a27 27 0 0 1 0 38', strokeWidth: 7.5, opacity: 0.62 }
  ]
};

// Inner SVG markup for the glyph (letter + waves), no outer <svg>.
// `solid` drops the outer wave's reduced opacity, for one-colour
// reproduction (embroidery, a rubber stamp) where a tint is not available.
export function markGlyphMarkup({ letter = MARK_COLORS.letter, waves = MARK_COLORS.waves, solid = false } = {}) {
  const g = MARK_GEOMETRY;
  const L = `<path d="${g.letter.d}" fill="none" stroke="${letter}" stroke-width="${g.letter.strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const W = g.waves.map((w) =>
    `<path d="${w.d}" fill="none" stroke="${waves}" stroke-width="${w.strokeWidth}" stroke-linecap="round"${w.opacity < 1 && !solid ? ` opacity="${w.opacity}"` : ''}/>`
  ).join('');
  return L + W;
}

// A complete, standalone SVG document string. Used by the Node generators
// (favicon, PWA icons, brand kit) and by the social templates.
//
//   variant 'tile'      rounded navy tile, white L, amber waves (default)
//   variant 'square'    same, full-bleed square — for OS-masked icons
//                       (maskable PWA, apple-touch), where the platform
//                       applies its own corner shape; `scale` shrinks the
//                       glyph into the platform's safe zone
//   variant 'glyph'     no tile: the letter and waves alone, for dark
//                       surfaces, where a navy tile disappears into the
//                       background
export function markSvg({ variant = 'tile', size, scale = 1, letter, waves, solid, tile = MARK_COLORS.tile, label } = {}) {
  const dims = size ? ` width="${size}" height="${size}"` : '';
  const a11y = label ? ` role="img" aria-label="${label}"` : '';
  let bg = '';
  if (variant === 'tile') bg = `<rect width="100" height="100" rx="${MARK_GEOMETRY.tileRadius}" fill="${tile}"/>`;
  if (variant === 'square') bg = `<rect width="100" height="100" fill="${tile}"/>`;
  const glyph = markGlyphMarkup({ letter, waves, solid });
  const body = scale === 1 ? glyph : `<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${glyph}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_GEOMETRY.viewBox}"${dims}${a11y}>${bg}${body}</svg>`;
}
