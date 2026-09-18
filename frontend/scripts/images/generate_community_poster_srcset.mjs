// frontend/scripts/images/generate_community_poster_srcset.mjs
//
// One-off asset-generation script — run manually, not part of `npm run
// build`, and `sharp` is installed with `npm install --no-save sharp`
// inside frontend/ rather than tracked in package.json. Both choices
// match generate_hero_srcset.mjs deliberately; see its header for why.
//
// Why this exists: the Community clip's poster frame shipped (16 Sep
// 2026) as the raw 1529x2048 still pulled straight off the render —
// 409KB — and is used at two sizes that are nowhere near it. On the
// landing page it fills a w-24 h-24 badge (96x96 CSS px, object-cover);
// on /community it is the <video poster> inside a max-w-xs column
// (320px). So every landing-page visit paid 409KB for a 96px square.
// That is the same fault generate_hero_srcset.mjs was written to fix,
// and it matters for the same reason: the audience is mobile-first and
// Thai, often on a phone connection.
//
// Widths are picked against those two rendered sizes, not breakpoints:
//   192 — the 96px badge at 2x DPR, the common phone case
//   384 — the badge at 4x, and the poster at ~1.2x
//   768 — the 320px poster at ~2.4x
// Nothing renders larger than that, so no wider variant is generated.
//
// Run from inside frontend/ (so Node resolves the local sharp install):
//   node scripts/images/generate_community_poster_srcset.mjs
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', '..', 'public', 'marketing', 'lexis-community-intro-poster.jpg');
const OUT_DIR = path.join(__dirname, '..', '..', 'public', 'marketing');

const WIDTHS = [192, 384, 768];
const FORMATS = [
  { ext: 'avif', options: { quality: 55 } },   // AVIF tolerates lower quality settings for equivalent visual fidelity
  { ext: 'webp', options: { quality: 78 } },
  { ext: 'jpg', options: { quality: 82, mozjpeg: true } }
];

async function main() {
  for (const width of WIDTHS) {
    const resized = sharp(SRC).resize({ width });
    for (const { ext, options } of FORMATS) {
      const outPath = path.join(OUT_DIR, `lexis-community-intro-poster-${width}.${ext}`);
      await resized.clone()[ext === 'jpg' ? 'jpeg' : ext](options).toFile(outPath);
      console.log(`wrote ${path.basename(outPath)}`);
    }
  }
  console.log('done.');
}

main().catch((err) => {
  console.error('generate_community_poster_srcset failed:', err);
  process.exit(1);
});
