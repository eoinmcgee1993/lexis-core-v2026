// frontend/scripts/images/generate_app_icons.mjs
//
// Rasterises public/favicon.svg into the PWA / apple-touch icon set, so the
// mark is drawn ONCE (in the SVG) and every other size is derived from it.
//
// Why this script exists. When the mark was redrawn on 4 Sep 2026 the four
// PNGs were stale by construction: nothing in the repo regenerated them, and
// the only reason they had matched the previous mark was that somebody
// exported them by hand on 29 Aug. A hand step that nobody records is a
// mismatch waiting to happen — the favicon showing one logo and the
// installed app icon showing another is exactly the kind of thing that ships
// unnoticed because no route sweep looks at binaries.
//
// Rendered through playwright-core + the preinstalled Chromium rather than
// sharp: sharp is NOT in this project's node_modules (the older brand-kit
// scripts import it and would fail today), while playwright-core is, and
// Chromium lives at /opt/pw-browsers in the container. Never run
// `playwright install`.
//
// The maskable icon is generated separately and deliberately differently:
// Android crops a maskable icon to its own shape, so it must be full-bleed
// with the artwork inside a centred safe zone of about 80%. Feeding it the
// rounded-square favicon would let the OS round an already-rounded corner
// and clip the outer bars.
//
// Run with: node scripts/images/generate_app_icons.mjs
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', '..', 'public');
const svg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8');

// The waveform rects, lifted out of the favicon rather than restated, so the
// maskable icon cannot drift from the mark either.
const bars = svg.match(/<rect x=[\s\S]*?\/>\s*(?=<\/g>)/)
  ? svg.slice(svg.indexOf('<g fill="#FFFFFF"'), svg.indexOf('</g>'))
      .replace(/^<g[^>]*>/, '')
  : (() => { throw new Error('Could not find the waveform group in favicon.svg'); })();

const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <rect width="24" height="24" fill="#0D9488" />
  <g fill="#FFFFFF" transform="translate(12 12) scale(0.55) translate(-12 -12)">${bars}</g>
</svg>`;

const targets = [
  { file: 'icon-512.png', size: 512, source: svg },
  { file: 'icon-192.png', size: 192, source: svg },
  { file: 'apple-touch-icon.png', size: 180, source: svg },
  { file: 'icon-512-maskable.png', size: 512, source: maskable }
];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
try {
  for (const { file, size, source } of targets) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1
    });
    await page.setContent(
      `<style>html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${size}px;height:${size}px}</style>${source}`
    );
    const buf = await page.screenshot({ omitBackground: true });
    writeFileSync(join(publicDir, file), buf);
    await page.close();
    console.log(`wrote ${file} (${size}x${size}, ${buf.length} bytes)`);
  }
} finally {
  await browser.close();
}
