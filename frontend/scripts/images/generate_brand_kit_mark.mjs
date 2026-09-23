// frontend/scripts/images/generate_brand_kit_mark.mjs
//
// Regenerates every brand-kit asset that IS the mark — brand-kit/logo/ and
// the mark avatars in brand-kit/avatars/ — from src/brand/lexisMark.js, the
// module the site's LexisMark component and favicon are built from.
//
// This script is the only owner of those files. generate_brand_kit_assets.mjs
// used to write them too, with its own copy of the geometry; that copy had
// already drifted once (it still drew the pre-4-Sep mirrored waveform), so
// since the 23 Sep rebrand it no longer touches logo/ at all.
//
// Rendered through playwright-core + the preinstalled Chromium, no sharp, so
// it runs on a bare checkout. Never run `playwright install`.
//
// THE SET (23 Sep 2026, direction B "L, speaking")
//
//   lexis-mark.svg               the tile: navy, white L, amber waves. The
//                                primary form — favicon, app icon, headers.
//   lexis-mark-square.svg        same, full-bleed. For platforms that apply
//                                their own corner mask.
//   lexis-mark-glyph-light.svg   no tile, navy L + amber waves. On cream or
//                                white, where a tile would be one box too many.
//   lexis-mark-glyph-dark.svg    no tile, white L + amber waves. On navy or
//                                dark photography.
//   lexis-mark-mono-{ink,white}.svg  one colour, outer wave solid rather than
//                                tinted — print, embroidery, stamps.
//   lexis-mark-{32..1024}.png    the tile at every size a platform asks for.
//   lexis-mark-<variant>-1024.png  raster of each other variant.
//   avatars/lexis-mark-avatar-*  full-bleed square with the glyph at 0.8, so
//                                a circular profile crop never clips the
//                                outer wave.
//
// Files from the retired waveform set (lexis-mark-badge*, -teal, -black,
// -white) are deleted, not left beside the new ones: a kit handed to a
// designer or a VA gets used in good faith, and an old logo sitting in the
// folder will get used.
//
// Run with: node scripts/images/generate_brand_kit_mark.mjs
import { chromium } from 'playwright-core';
import { readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { markSvg, MARK_COLORS } from '../../src/brand/lexisMark.js';

const here = dirname(fileURLToPath(import.meta.url));
const kit = join(here, '..', '..', '..', 'brand-kit');
const INK = '#1E293B';

const label = 'LEXIS';
const svgs = {
  'logo/lexis-mark.svg': markSvg({ variant: 'tile', label }),
  'logo/lexis-mark-square.svg': markSvg({ variant: 'square', label }),
  'logo/lexis-mark-glyph-light.svg': markSvg({ variant: 'glyph', letter: MARK_COLORS.tile, label }),
  'logo/lexis-mark-glyph-dark.svg': markSvg({ variant: 'glyph', label }),
  'logo/lexis-mark-mono-ink.svg': markSvg({ variant: 'glyph', letter: INK, waves: INK, solid: true, label }),
  'logo/lexis-mark-mono-white.svg': markSvg({ variant: 'glyph', letter: '#FFFFFF', waves: '#FFFFFF', solid: true, label })
};

const retired = /^lexis-mark-(badge|teal|black|white)/;
for (const f of readdirSync(join(kit, 'logo'))) {
  if (retired.test(f)) { unlinkSync(join(kit, 'logo', f)); console.log(`removed brand-kit/logo/${f}`); }
}

for (const [rel, body] of Object.entries(svgs)) {
  writeFileSync(join(kit, rel), body + '\n');
  console.log(`wrote brand-kit/${rel}`);
}

const avatar = markSvg({ variant: 'square', scale: 0.8 });
const pngs = [
  ...[32, 64, 128, 180, 192, 256, 512, 1024].map((s) => ({
    rel: `logo/lexis-mark-${s}.png`, size: s, svg: svgs['logo/lexis-mark.svg']
  })),
  ...['square', 'glyph-light', 'glyph-dark', 'mono-ink', 'mono-white'].map((v) => ({
    rel: `logo/lexis-mark-${v}-1024.png`, size: 1024, svg: svgs[`logo/lexis-mark-${v}.svg`]
  })),
  ...[128, 180, 400, 512, 1024].map((s) => ({
    rel: `avatars/lexis-mark-avatar-${s}.png`, size: s, svg: avatar
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
