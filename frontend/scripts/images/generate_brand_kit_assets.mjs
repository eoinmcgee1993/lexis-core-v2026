// frontend/scripts/images/generate_brand_kit_assets.mjs
//
// One-off asset-generation script — same pattern as
// scripts/images/generate_hero_srcset.mjs and generate_og_card.mjs: run
// manually, not part of `npm run build`, using the `sharp` install
// already present in frontend/node_modules/.
//
// Why this exists (21 Aug 2026, branding-kit request): every export here
// is a raster/resized version of the ONE brand mark that already exists
// (public/favicon.svg's teal-600 rounded-square + white five-bar
// waveform, matching src/components/LexisMark.jsx) — deliberately not a
// new logo invented for this task. Social platforms all want a square
// profile photo at their own preferred resolution; this generates a
// correctly-sized PNG for each rather than making an account owner
// re-export by hand every time. A single Facebook-cover-sized banner is
// also generated, reusing the same navy canvas + mark treatment as the
// rest of the brand system (scripts/design/lexis-visual-system.md) — the
// one platform in this set that actually expects a separate rectangular
// cover image, not just a square avatar.
//
// Run with: node scripts/images/generate_brand_kit_assets.mjs, invoked
// from inside frontend/.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '..', '..', 'brand-kit', 'assets');
const FAVICON_SVG_PATH = path.join(__dirname, '..', '..', 'public', 'favicon.svg');

// Square profile-picture sizes covering every platform this kit targets.
// Instagram/Facebook/TikTok/LINE all display a circular crop of a square
// upload, so a single rounded-square source (matching the existing
// favicon treatment) works safely for all of them — no separate
// circular-safe-zone artwork needed since the mark is already centered
// with even padding on every side.
const AVATAR_SIZES = [1024, 512, 192, 180, 128];

const LEXIS_NAVY = '#050B14'; // scripts/design/lexis-visual-system.md — "deep focus canvas"
const LEXIS_TEAL = '#0D9488'; // existing "live" accent, same as favicon.svg's background

async function main() {
  // Rasterize directly at each target resolution rather than rendering
  // once and resizing after — sharp renders an SVG input at whatever
  // size .resize() requests, so this stays crisp at every size. Combining
  // an explicit `density` option with a mismatched .resize() (an earlier
  // version of this script did that) produced visibly soft/feathered
  // edges on the rounded-square corners — worth calling out since it's
  // an easy mistake to reintroduce.
  for (const size of AVATAR_SIZES) {
    const outPath = path.join(OUT_DIR, `lexis-avatar-${size}.png`);
    await sharp(FAVICON_SVG_PATH)
      .resize(size, size)
      .png()
      .toFile(outPath);
    console.log(`wrote ${path.basename(outPath)}`);
  }

  // Facebook cover photo (820x312, Facebook's own recommended desktop
  // size) — navy canvas (the brand system's "deep focus" colour, used
  // nowhere on the marketing site itself per the interface re-audit, but
  // legitimate here: a social cover photo is closer in spirit to the Live
  // Conversation screen's own navy canvas than to the warm marketing
  // pages), the same waveform mark scaled up and recoloured teal-on-navy,
  // plus the wordmark next to it.
  const coverWidth = 820;
  const coverHeight = 312;
  const markSize = 140;
  const markSvg = await sharp(FAVICON_SVG_PATH).resize(markSize, markSize).toBuffer();

  const wordmarkSvg = Buffer.from(`
    <svg width="${coverWidth}" height="${coverHeight}" xmlns="http://www.w3.org/2000/svg">
      <text x="${coverWidth / 2}" y="${coverHeight / 2 + markSize / 2 + 56}"
            text-anchor="middle" font-family="Georgia, serif" font-weight="700"
            font-size="52" fill="#FFFFFF" letter-spacing="2">LEXIS</text>
      <text x="${coverWidth / 2}" y="${coverHeight / 2 + markSize / 2 + 88}"
            text-anchor="middle" font-family="Arial, sans-serif"
            font-size="17" fill="${LEXIS_TEAL}">Practice speaking English &amp; Thai, out loud</text>
    </svg>
  `);

  await sharp({
    create: {
      width: coverWidth,
      height: coverHeight,
      channels: 4,
      background: LEXIS_NAVY
    }
  })
    .composite([
      { input: markSvg, left: Math.round((coverWidth - markSize) / 2), top: 28 },
      { input: wordmarkSvg, left: 0, top: 0 }
    ])
    .png()
    .toFile(path.join(OUT_DIR, 'lexis-facebook-cover-820x312.png'));
  console.log('wrote lexis-facebook-cover-820x312.png');

  console.log('done.');
}

main().catch((err) => {
  console.error('generate_brand_kit_assets failed:', err);
  process.exit(1);
});
