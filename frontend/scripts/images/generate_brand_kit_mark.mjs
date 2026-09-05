// frontend/scripts/images/generate_brand_kit_mark.mjs
//
// Regenerates every brand-kit asset DERIVED FROM THE MARK — the five logo
// SVGs, the badge PNG ladder, the three flat-colour PNGs and the mark
// avatars — from the single set of rect coordinates in
// src/components/LexisMark.jsx.
//
// Why it is separate from generate_brand_kit_assets.mjs. That script covers
// the whole kit including the photography and the Fraunces wordmark
// lockups, and it imports `sharp`, which is NOT in this project's
// node_modules any more — running it today fails at the import. The
// photo-derived assets are unaffected by a mark change, so rather than
// resurrect a dependency to rebuild things that did not change, this does
// the mark-derived subset through playwright-core and the preinstalled
// Chromium, which the repo does have. Never run `playwright install`.
//
// Why it exists at all. The mark was redrawn on 4 Sep 2026, and ~30 files
// in brand-kit/ carried the previous one. A brand kit that disagrees with
// the product's own favicon is worse than no brand kit, because it is the
// thing handed to a designer or a VA who will then use the wrong logo in
// good faith. Nothing here invents a colour or a variant that did not
// already exist — it is a re-render of the same set.
//
// Coordinates are READ from LexisMark.jsx rather than restated, for the
// same reason favicon.svg reuses them under a transform: three copies of a
// logo's geometry is three chances to drift.
//
// Run with: node scripts/images/generate_brand_kit_mark.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const kit = join(root, 'brand-kit');

const src = readFileSync(join(root, 'frontend/src/components/LexisMark.jsx'), 'utf8');
const rects = src.match(/<rect x="[^"]+"[^>]*\/>/g);
if (!rects || rects.length !== 5) {
  throw new Error(`Expected 5 <rect>s in LexisMark.jsx, found ${rects ? rects.length : 0}`);
}

const TEAL = '#0D9488';
const NAVY = '#050B14';

const bars = (fill) => rects.map((r) => `  ${r.replace('/>', `fill="${fill}" />`)}`).join('\n');
const plain = (fill) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="LEXIS">\n${bars(fill)}\n</svg>\n`;
const badge = (bg) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="LEXIS">\n` +
  `  <rect width="24" height="24" rx="6" fill="${bg}" />\n${bars('#FFFFFF')}\n</svg>\n`;

const svgs = {
  'logo/lexis-mark-teal.svg': plain(TEAL),
  'logo/lexis-mark-black.svg': plain(NAVY),
  'logo/lexis-mark-white.svg': plain('#FFFFFF'),
  'logo/lexis-mark-badge.svg': badge(TEAL),
  'logo/lexis-mark-badge-navy.svg': badge(NAVY)
};
for (const [rel, body] of Object.entries(svgs)) {
  writeFileSync(join(kit, rel), body);
  console.log(`wrote brand-kit/${rel}`);
}

// PNG ladder. Sizes are exactly the ones already in the kit — this replaces
// what is there, it does not add or drop a size.
const pngs = [
  ...[32, 64, 128, 180, 192, 256, 512, 1024].map((s) => ({
    rel: `logo/lexis-mark-badge-${s}.png`, size: s, svg: svgs['logo/lexis-mark-badge.svg'], flat: true
  })),
  { rel: 'logo/lexis-mark-teal-1024.png', size: 1024, svg: svgs['logo/lexis-mark-teal.svg'] },
  { rel: 'logo/lexis-mark-black-1024.png', size: 1024, svg: svgs['logo/lexis-mark-black.svg'] },
  { rel: 'logo/lexis-mark-white-1024.png', size: 1024, svg: svgs['logo/lexis-mark-white.svg'] },
  ...[128, 180, 400, 512, 1024].map((s) => ({
    rel: `avatars/lexis-mark-avatar-${s}.png`, size: s, svg: svgs['logo/lexis-mark-badge.svg'], flat: true
  }))
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
try {
  for (const { rel, size, svg } of pngs) {
    const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
    );
    writeFileSync(join(kit, rel), await page.screenshot({ omitBackground: true }));
    await page.close();
    console.log(`wrote brand-kit/${rel} (${size}x${size})`);
  }
} finally {
  await browser.close();
}
