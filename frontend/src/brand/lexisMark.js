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
// The 23 Sep version drew the L as a 12-unit round-capped stroke with two
// 7.5-unit amber arcs on a navy tile, optically centred at (50.3, 50).
// Superseded on 27 Sep; the current numbers and why are below.
//
// 27 SEP 2026: SAME IDEA, HEAVIER AND WARMER
//
// The owner called the 23 Sep mark "weak" and the site "bleak". Direction
// B's idea is kept (the L is whose voice it is, the waves are the voice);
// what changed is weight and colour. Four heavier versions were rendered
// against the old mark at 160, 64, 40, 32 and 16px and on light and dark
// grounds; this one ("concept B" in that sheet) was picked because it is
// the only one that is still unmistakable at 16px and the only one that
// does not disappear on the dark surfaces the Digital Renaissance material
// uses. The concept that put the L inside a speech bubble was rejected for
// the same reason B was chosen in the first place: a bubble is every chat
// app.
//
//   - Tile: amber gradient, top-left #FFB23A to bottom-right #FF6A1A. Amber
//     is already the site's "do something" colour (lexis-action), so the
//     mark and the primary buttons are now one colour family instead of
//     navy mark / amber button.
//   - L: a filled block, not a 12-unit stroke. At 32px the stroke L was a
//     2px line; the block is 5px. Corners softened with a 4-unit stroke of
//     the same colour rather than by redrawing the path, so the letter's
//     outer edge still sits on whole units.
//   - Waves: white, 9.5 wide (was 7.5 amber). The outer wave is at .85,
//     not .62: on amber a .62 white read as a smudge at small sizes.
//
// Ink spans x 19-80.5, y 18-82, centre (49.75, 50).

export const MARK_COLORS = {
  tileFrom: '#FFB23A',
  tileTo: '#FF6A1A',
  tile: '#FF9E00',   // flat fallback where a gradient is not possible
  letter: '#0B1422', // lexis ink navy
  waves: '#FFFFFF',
  glyphOnDark: { letter: '#FF9E00', waves: '#FFFFFF' },
  glyphOnLight: { letter: '#0B1422', waves: '#FF7A1A' }
};

export const MARK_GEOMETRY = {
  viewBox: '0 0 100 100',
  tileRadius: 24,
  letter: { d: 'M21 20h17v42h24v18H21z', round: 4 },
  waves: [
    { d: 'M61 36a15 15 0 0 1 0 22', strokeWidth: 9.5, opacity: 1 },
    { d: 'M71 25a30 30 0 0 1 0 44', strokeWidth: 9.5, opacity: 0.85 }
  ]
};

// Inner SVG markup for the glyph (letter + waves), no outer <svg>.
// `solid` drops the outer wave's reduced opacity, for one-colour
// reproduction (embroidery, a rubber stamp) where a tint is not available.
export function markGlyphMarkup({ letter = MARK_COLORS.letter, waves = MARK_COLORS.waves, solid = false } = {}) {
  const g = MARK_GEOMETRY;
  const L = `<path d="${g.letter.d}" fill="${letter}" stroke="${letter}" stroke-width="${g.letter.round}" stroke-linejoin="round"/>`;
  const W = g.waves.map((w) =>
    `<path d="${w.d}" fill="none" stroke="${waves}" stroke-width="${w.strokeWidth}" stroke-linecap="round"${w.opacity < 1 && !solid ? ` opacity="${w.opacity}"` : ''}/>`
  ).join('');
  return L + W;
}

export function tileGradientDef(id) {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${MARK_COLORS.tileFrom}"/><stop offset="1" stop-color="${MARK_COLORS.tileTo}"/></linearGradient>`;
}

// A complete, standalone SVG document string. Used by the Node generators
// (favicon, PWA icons, brand kit) and by the social templates.
//
//   variant 'tile'      rounded amber tile, navy L, white waves (default)
//   variant 'square'    same, full-bleed square — for OS-masked icons
//                       (maskable PWA, apple-touch), where the platform
//                       applies its own corner shape; `scale` shrinks the
//                       glyph into the platform's safe zone
//   variant 'glyph'     no tile: the letter and waves alone. Defaults to
//                       the on-dark colours (amber L, white waves)
export function markSvg({ variant = 'tile', size, scale = 1, letter, waves, solid, tile, label } = {}) {
  const dims = size ? ` width="${size}" height="${size}"` : '';
  const a11y = label ? ` role="img" aria-label="${label}"` : '';
  const fill = tile || 'url(#lexis-tile)';
  const defs = tile ? '' : `<defs>${tileGradientDef('lexis-tile')}</defs>`;
  let bg = '';
  if (variant === 'tile') bg = `${defs}<rect width="100" height="100" rx="${MARK_GEOMETRY.tileRadius}" fill="${fill}"/>`;
  if (variant === 'square') bg = `${defs}<rect width="100" height="100" fill="${fill}"/>`;
  // With no tile behind it the navy L would vanish on a dark surface, so
  // the bare glyph defaults to the on-dark colours; callers pass the
  // on-light pair explicitly.
  const glyphDefaults = variant === 'glyph' ? MARK_COLORS.glyphOnDark : {};
  const glyph = markGlyphMarkup({ letter: letter ?? glyphDefaults.letter, waves: waves ?? glyphDefaults.waves, solid });
  const body = scale === 1 ? glyph : `<g transform="translate(50 50) scale(${scale}) translate(-50 -50)">${glyph}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_GEOMETRY.viewBox}"${dims}${a11y}>${bg}${body}</svg>`;
}
