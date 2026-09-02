// frontend/scripts/images/generate_brand_kit_assets.mjs
//
// One-off asset-generation script — same pattern as
// generate_hero_srcset.mjs and generate_og_card.mjs: run manually, not
// part of `npm run build`, using the `sharp` and `playwright-core`
// installs already present in frontend/node_modules/.
//
// Regenerates the ENTIRE brand kit in brand-kit/ from sources that
// already exist in this repo:
//
//   - public/favicon.svg          the one real brand mark (five-bar waveform)
//   - public/avatar/lexis-tutor-photo.jpg   the one real depiction of LEXIS
//   - public/fonts/fraunces-600-var.woff2       the real display face (variable, optical size live)
//   - public/fonts/ibm-plex-sans-thai-*.woff2   the real Thai face
//   - src/content/facts.js        the one source of truth for prices/trial
//
// Nothing here invents a second logo, a new face, a slogan nobody
// approved, or a number that isn't in facts.js. Superseded the earlier
// version of this script (21 Aug 2026), which produced only five square
// mark avatars and one Facebook cover.
//
// Typographic lockups are rendered to PNG rather than SVG on purpose: an
// SVG wordmark would either need the Fraunces outlines converted to paths
// (no such tool in this repo) or would reference a font family by name and
// silently fall back to Georgia on any machine without Fraunces installed,
// which is worse than a raster in a brand kit. The MARK itself is pure
// rectangles, so it ships as real, editable SVG.
//
// Run with: node scripts/images/generate_brand_kit_assets.mjs
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TRIAL as TRIAL_FACT, PRICING } from '../../src/content/facts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(__dirname, '..', '..');
const KIT = path.join(FRONTEND, '..', 'brand-kit');
const PUBLIC = path.join(FRONTEND, 'public');

// Palette — mirrors tailwind.config.js's lexis-* tokens exactly. Not a
// separate "marketing palette"; the same values the live site paints with.
const TEAL = '#0D9488';
const AMBER = '#FF9E00';
const NAVY = '#050B14';
const INK = '#1E293B';
const CANVAS = '#FAFAF7';

// Imported, never re-declared — same reason as the social generator: these
// were a second copy of numbers that already live in facts.js, and they
// silently went stale when the trial was halved to 15 (PR #92).
const TRIAL_MINUTES = TRIAL_FACT.minutes;
const WEEKLY_THB = PRICING.weekly.thb;
const MONTHLY_THB = PRICING.monthly.thb;

const PITCH_EN = 'Voice-first speaking practice, English and Thai.';
const PITCH_TH = 'ฝึกพูดภาษาอังกฤษและภาษาไทยด้วยเสียงจริง';
// Same sentence with the line break authored in. Thai has no spaces between
// words, and this Chromium does not apply dictionary-based Thai breaking
// even with lang="th" set, so left to wrap on its own it splits ภาษาไทย
// ("Thai language") straight down the middle, which a Thai reader sees
// immediately. The break below falls between clauses instead:
//   ฝึกพูดภาษาอังกฤษ      practice speaking English
//   และภาษาไทยด้วยเสียงจริง   and Thai, with real voice
// Any headline-sized Thai here uses this version; small single-line Thai
// (which never wraps) uses PITCH_TH above.
const PITCH_TH_LINES = 'ฝึกพูดภาษาอังกฤษ<br>และภาษาไทยด้วยเสียงจริง';
const TERMS_EN = `Free ${TRIAL_MINUTES}-minute trial. No card required.`;
// A pass is a one-off purchase, so "฿199/week" would advertise a
// recurring charge that does not exist (facts.js BILLING.autoRenews).
const PRICE_EN = `฿${WEEKLY_THB} for ${PRICING.weekly.days} days or ฿${MONTHLY_THB} for ${PRICING.monthly.days}. One-off.`;
const SITE = 'learnwithlexis.com';

// --- the mark, as real SVG -------------------------------------------
// Five bars, same geometry as public/favicon.svg and LexisMark.jsx.
const BARS = [
  { x: 1.5, y: 8, h: 8 },
  { x: 6, y: 5, h: 14 },
  { x: 10.5, y: 2, h: 20 },
  { x: 15, y: 5, h: 14 },
  { x: 19.5, y: 8, h: 8 }
];

function markSvg({ fill, badge = null }) {
  const bars = BARS.map((b) =>
    `  <rect x="${b.x}" y="${b.y}" width="3" height="${b.h}" rx="1.5" fill="${fill}" />`
  ).join('\n');
  const bg = badge ? `  <rect width="24" height="24" rx="6" fill="${badge}" />\n` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-label="LEXIS">
${bg}${bars}
</svg>
`;
}

// --- HTML canvas rendering -------------------------------------------
let fontCss = '';
async function loadFontCss() {
  const [fraunces, thai400, thai600] = await Promise.all([
    fs.readFile(path.join(PUBLIC, 'fonts', 'fraunces-600-var.woff2')),
    fs.readFile(path.join(PUBLIC, 'fonts', 'ibm-plex-sans-thai-400.woff2')),
    fs.readFile(path.join(PUBLIC, 'fonts', 'ibm-plex-sans-thai-600.woff2'))
  ]);
  const face = (family, weight, buf) =>
    `@font-face{font-family:'${family}';font-weight:${weight};font-style:normal;font-display:block;` +
    `src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2');}`;
  fontCss = [
    face('Fraunces', 600, fraunces),
    face('IBMPlexThai', 400, thai400),
    face('IBMPlexThai', 600, thai600)
  ].join('');
}

// Thai has no spaces between words, so a browser with no locale hint
// breaks Thai lines at arbitrary character boundaries. The first version of
// this kit shipped a story and a square post that split ภาษาไทย ("Thai
// language") across two lines, which a Thai reader spots immediately.
// Every Thai element below carries lang="th" so Chromium uses ICU's
// dictionary-based Thai line breaking instead of guessing.
function page({ w, h, body, bg = 'transparent', pad = 0 }) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px}
body{background:${bg};display:flex;align-items:center;justify-content:center;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  color:${INK};padding:${pad}px;-webkit-font-smoothing:antialiased}
.display{font-family:'Fraunces',Georgia,serif;font-weight:600;letter-spacing:-0.02em}
.thai{font-family:'IBMPlexThai',sans-serif}
.mark{display:block}
</style></head><body>${body}</body></html>`;
}

// Inline mark for use inside rendered HTML.
function inlineMark(size, fill, badge = null, radius = null) {
  const bars = BARS.map((b) =>
    `<rect x="${b.x}" y="${b.y}" width="3" height="${b.h}" rx="1.5" fill="${fill}"/>`
  ).join('');
  const bg = badge
    ? `<rect width="24" height="24" rx="${radius ?? 6}" fill="${badge}"/>`
    : '';
  return `<svg class="mark" width="${size}" height="${size}" viewBox="0 0 24 24">${bg}${bars}</svg>`;
}

let browser;
async function shot(file, { w, h, body, bg = 'transparent', scale = 1, pad = 0 }) {
  const p = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: scale
  });
  await p.setContent(page({ w, h, body, bg, pad }), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const out = path.join(KIT, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await p.screenshot({ path: out, omitBackground: bg === 'transparent' });
  await p.close();
  console.log('  ' + file);
}

async function writeSvg(file, svg) {
  const out = path.join(KIT, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, svg, 'utf8');
  console.log('  ' + file);
}

async function pngFromSvg(file, svg, size) {
  const out = path.join(KIT, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log('  ' + file);
}

async function main() {
  await loadFontCss();
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ================================================================
  console.log('\nlogo/ — the mark');
  // ================================================================
  const badgeSvg = markSvg({ fill: '#FFFFFF', badge: TEAL });
  await writeSvg('logo/lexis-mark-badge.svg', badgeSvg);
  await writeSvg('logo/lexis-mark-teal.svg', markSvg({ fill: TEAL }));
  await writeSvg('logo/lexis-mark-white.svg', markSvg({ fill: '#FFFFFF' }));
  await writeSvg('logo/lexis-mark-black.svg', markSvg({ fill: INK }));
  await writeSvg('logo/lexis-mark-badge-navy.svg', markSvg({ fill: '#FFFFFF', badge: NAVY }));

  for (const s of [1024, 512, 256, 192, 180, 128, 64, 32]) {
    await pngFromSvg(`logo/lexis-mark-badge-${s}.png`, badgeSvg, s);
  }
  await pngFromSvg('logo/lexis-mark-teal-1024.png', markSvg({ fill: TEAL }), 1024);
  await pngFromSvg('logo/lexis-mark-white-1024.png', markSvg({ fill: '#FFFFFF' }), 1024);
  await pngFromSvg('logo/lexis-mark-black-1024.png', markSvg({ fill: INK }), 1024);

  // ================================================================
  console.log('\nwordmark/ — text logos and lockups');
  // ================================================================
  const word = (color, size = 220) =>
    `<div class="display" style="font-size:${size}px;color:${color};line-height:1">LEXIS</div>`;

  for (const [name, color] of [['ink', INK], ['white', '#FFFFFF'], ['teal', TEAL]]) {
    await shot(`wordmark/lexis-wordmark-${name}.png`, {
      w: 900, h: 300, body: word(color), scale: 2
    });
  }

  // Horizontal lockup: mark + wordmark.
  const hLockup = (color, markFill, badge) => `
    <div style="display:flex;align-items:center;gap:44px">
      ${inlineMark(180, markFill, badge)}
      <div class="display" style="font-size:190px;color:${color};line-height:1">LEXIS</div>
    </div>`;
  await shot('wordmark/lexis-lockup-horizontal-light.png', {
    w: 1200, h: 320, body: hLockup(INK, '#FFFFFF', TEAL), scale: 2
  });
  await shot('wordmark/lexis-lockup-horizontal-dark.png', {
    w: 1200, h: 320, body: hLockup('#FFFFFF', '#FFFFFF', TEAL), scale: 2
  });

  // Stacked lockup with the verified one-line pitch.
  const vLockup = (color, sub) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:34px;text-align:center">
      ${inlineMark(200, '#FFFFFF', TEAL)}
      <div class="display" style="font-size:170px;color:${color};line-height:1">LEXIS</div>
      <div style="font-size:40px;color:${color};opacity:.62;letter-spacing:.01em">${sub}</div>
    </div>`;
  await shot('wordmark/lexis-lockup-stacked-light.png', {
    w: 1200, h: 900, body: vLockup(INK, PITCH_EN), scale: 2
  });
  await shot('wordmark/lexis-lockup-stacked-dark.png', {
    w: 1200, h: 900, body: vLockup('#FFFFFF', PITCH_EN), scale: 2
  });
  await shot('wordmark/lexis-lockup-stacked-th.png', {
    w: 1200, h: 900,
    body: `<div style="display:flex;flex-direction:column;align-items:center;gap:34px;text-align:center">
      ${inlineMark(200, '#FFFFFF', TEAL)}
      <div class="display" style="font-size:170px;color:${INK};line-height:1">LEXIS</div>
      <div class="thai" lang="th" style="font-size:38px;color:${INK};opacity:.62">${PITCH_TH}</div>
    </div>`,
    scale: 2
  });

  // ================================================================
  console.log('\navatars/ — LEXIS herself, and the mark');
  // ================================================================
  // The source (public/avatar/lexis-tutor-photo.jpg) is already a
  // circular crop sitting on white corners. Rebuild those corners
  // properly instead of shipping the white ones: transparent for
  // platforms that mask to a circle, navy for anywhere it shows square.
  const PHOTO = path.join(PUBLIC, 'avatar', 'lexis-tutor-photo.jpg');
  const S = 1024;
  const circleMask = Buffer.from(
    `<svg width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2}" fill="#fff"/></svg>`
  );
  const photoCircle = await sharp(PHOTO)
    .resize(S, S)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  async function writeAvatar(file, buf, size) {
    const out = path.join(KIT, file);
    await fs.mkdir(path.dirname(out), { recursive: true });
    await sharp(buf).resize(size, size).png().toFile(out);
    console.log('  ' + file);
  }

  // Transparent corners.
  for (const size of [1024, 512, 400, 180, 128]) {
    await writeAvatar(`avatars/lexis-photo-circle-${size}.png`, photoCircle, size);
  }

  // Navy square, for anywhere the platform does not mask to a circle.
  const photoNavy = await sharp({
    create: { width: S, height: S, channels: 4, background: NAVY }
  })
    .composite([{ input: photoCircle }])
    .png()
    .toBuffer();
  for (const size of [1024, 512, 400]) {
    await writeAvatar(`avatars/lexis-photo-navy-${size}.png`, photoNavy, size);
  }

  // Teal ring, matching the treatment the live conversation screen uses.
  const RING = 26;
  const ringInner = await sharp(photoCircle).resize(S - RING * 2, S - RING * 2).toBuffer();
  const photoRing = await sharp({
    create: { width: S, height: S, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${S}" height="${S}"><circle cx="${S / 2}" cy="${S / 2}" r="${S / 2 - 2}" fill="${TEAL}"/></svg>`
        )
      },
      { input: ringInner, top: RING, left: RING }
    ])
    .png()
    .toBuffer();
  for (const size of [1024, 512, 400]) {
    await writeAvatar(`avatars/lexis-photo-ring-${size}.png`, photoRing, size);
  }

  // The mark as an avatar, for a brand-voice account rather than a
  // persona account. See the README on choosing between the two.
  for (const size of [1024, 512, 400, 180, 128]) {
    await pngFromSvg(`avatars/lexis-mark-avatar-${size}.png`, badgeSvg, size);
  }

  // ================================================================
  // covers/ — deliberately NOT written here.
  // ================================================================
  // This script used to render all six covers/*.png as flat colour
  // panels. generate_brand_kit_social.mjs writes those exact same six
  // paths from the real photography (PR #87), and it runs second, so the
  // only thing this block achieved was to silently revert every cover to
  // the superseded flat design whenever this script was run on its own.
  // Covers have one owner now: the social generator. Run that for covers.
  // ================================================================
  console.log('\ntemplates/ — ready-to-post, all copy verified');
  // ================================================================
  const squareLight = (headline, sub) => `
    <div style="width:100%;height:100%;background:${CANVAS};display:flex;flex-direction:column;
      justify-content:space-between;padding:96px">
      <div style="display:flex;align-items:center;gap:20px">
        ${inlineMark(56, '#FFFFFF', TEAL)}
        <div class="display" style="font-size:58px;color:${INK};line-height:1">LEXIS</div>
      </div>
      <div class="display" style="font-size:80px;color:${INK};line-height:1.2">${headline}</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end">
        <div style="font-size:30px;color:${INK};opacity:.6;line-height:1.45">${sub}</div>
        <div style="font-size:26px;color:${TEAL};letter-spacing:.05em">${SITE}</div>
      </div>
    </div>`;

  await shot('templates/post-square-1080-speak.png', {
    w: 1080, h: 1080, bg: CANVAS,
    body: squareLight('Practice speaking English out loud, not typing.', TERMS_EN)
  });
  await shot('templates/post-square-1080-partner.png', {
    w: 1080, h: 1080, bg: CANVAS,
    body: squareLight('A real conversation partner, not a course.', `${TERMS_EN}<br>${PRICE_EN}`)
  });
  await shot('templates/post-square-1080-th.png', {
    w: 1080, h: 1080, bg: CANVAS,
    body: `<div style="width:100%;height:100%;background:${CANVAS};display:flex;flex-direction:column;
        justify-content:space-between;padding:96px">
        <div style="display:flex;align-items:center;gap:20px">
          ${inlineMark(56, '#FFFFFF', TEAL)}
          <div class="display" style="font-size:58px;color:${INK};line-height:1">LEXIS</div>
        </div>
        <div class="thai" lang="th" style="font-size:66px;font-weight:600;color:${INK};line-height:1.35">${PITCH_TH_LINES}</div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end">
          <div class="thai" lang="th" style="font-size:30px;color:${INK};opacity:.6">ทดลองฟรี ${TRIAL_MINUTES} นาที ไม่ต้องผูกบัตร</div>
          <div style="font-size:26px;color:${TEAL};letter-spacing:.05em">${SITE}</div>
        </div>
      </div>`
  });

  const story = (headlineHtml, subHtml, ctaText) => `
    <div style="width:100%;height:100%;background:${NAVY};display:flex;flex-direction:column;
      justify-content:center;align-items:center;gap:60px;padding:120px 90px;text-align:center">
      <img src="data:image/png;base64,${photoRing.toString('base64')}" width="420" height="420"/>
      ${headlineHtml}
      ${subHtml}
      <div style="background:${AMBER};color:#fff;font-size:40px;font-weight:700;
        padding:30px 62px;border-radius:24px">${ctaText}</div>
      <div style="font-size:30px;color:#fff;opacity:.5;letter-spacing:.06em">${SITE}</div>
    </div>`;

  await shot('templates/story-1080x1920-en.png', {
    w: 1080, h: 1920, bg: NAVY,
    body: story(
      `<div class="display" style="font-size:84px;color:#fff;line-height:1.2">Talk. She listens,<br>and corrects you<br>gently.</div>`,
      `<div style="font-size:36px;color:#fff;opacity:.65;line-height:1.5">${TERMS_EN}</div>`,
      'Try It Free'
    )
  });
  await shot('templates/story-1080x1920-th.png', {
    w: 1080, h: 1920, bg: NAVY,
    body: story(
      `<div class="thai" lang="th" style="font-size:72px;font-weight:600;color:#fff;line-height:1.45">${PITCH_TH_LINES}</div>`,
      `<div class="thai" lang="th" style="font-size:34px;color:#fff;opacity:.65;line-height:1.6">ทดลองฟรี ${TRIAL_MINUTES} นาที ไม่ต้องผูกบัตร</div>`,
      'ลองใช้ฟรี'
    )
  });

  await browser.close();
  console.log('\nBrand kit regenerated.');
}

main().catch((e) => { console.error(e); process.exit(1); });
