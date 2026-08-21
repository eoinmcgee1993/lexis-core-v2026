// frontend/scripts/images/generate_og_card.mjs
//
// One-off asset-generation script — same pattern as
// scripts/images/generate_hero_srcset.mjs: run manually, not part of
// `npm run build`, using the `sharp` install already present in
// frontend/node_modules/ (added via `npm install --no-save sharp`, not a
// tracked dependency in package.json).
//
// Why this exists (Digital Renaissance re-audit, 21 Aug 2026, L3): index.html's
// og:image/twitter:image point straight at lexis-tutor-hero.jpg, a 1200x1607
// portrait. Facebook/LinkedIn/X/iMessage all want ~1.91:1 landscape
// (1200x630) for a "summary_large_image"-style card; fed a portrait, they
// auto-crop from the centre, which lands mid-chest on this specific photo,
// cutting the face off the card entirely.
//
// This generates a real 1200x630 landscape crop, gravity biased toward the
// top of the frame so the face stays in shot instead of sharp's default
// centre crop. Output is a single JPEG (og:image doesn't need a srcset the
// way an in-page <img> does, it's fetched once by a crawler, not by the
// visitor's browser).
//
// Run with: node scripts/images/generate_og_card.mjs, invoked from inside
// frontend/.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', '..', 'public', 'marketing', 'lexis-tutor-hero.jpg');
const OUT_PATH = path.join(__dirname, '..', '..', 'public', 'marketing', 'lexis-tutor-hero-og.jpg');

const TARGET_WIDTH = 1200;
const TARGET_HEIGHT = 630;

async function main() {
  await sharp(SRC)
    .resize({
      width: TARGET_WIDTH,
      height: TARGET_HEIGHT,
      fit: 'cover',
      // Source is 1200x1607, a face-and-shoulders portrait. 'north' keeps
      // the crop window pinned to the top of the frame so the face survives
      // the crop to 630px tall, instead of sharp's default 'centre' gravity
      // (which lands mid-chest on this photo, exactly the "band across the
      // chest" problem this script exists to fix).
      position: 'north'
    })
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(OUT_PATH);
  console.log(`wrote ${path.basename(OUT_PATH)} (${TARGET_WIDTH}x${TARGET_HEIGHT})`);
}

main().catch((err) => {
  console.error('generate_og_card failed:', err);
  process.exit(1);
});
