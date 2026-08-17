// frontend/scripts/images/generate_hero_srcset.mjs
//
// One-off asset-generation script — run manually, not part of `npm run
// build` (same spirit as scripts/avatar/generate_avatar.py at the repo
// root: a generation tool kept for reproducibility, not something that
// needs to re-run on every build). Lives under frontend/ specifically so
// Node's ESM resolution finds frontend's local `sharp` install by normal
// package lookup; `sharp` itself was installed with
// `npm install --no-save sharp` inside frontend/ to run this once — it
// is NOT a tracked dependency in package.json.
//
// Why this exists (Stage 5 of the remediation brief, image optimization
// item): the landing page's hero photo shipped as a single 1200x1607
// JPEG (~161KB) with fetchpriority="high" — the largest paint on a
// mobile-first Thai audience, at a resolution far larger than the
// image's actual rendered CSS size ever needs (the hero photo's
// container tops out at md:max-w-sm = 384px wide; frontend/src/pages/
// LandingPage.jsx). Generates AVIF/WebP/JPEG at three widths so the
// browser picks the smallest file that satisfies the actual display
// size and pixel density, via a <picture> element with srcset — see
// LandingPage.jsx's hero <picture> markup for how these are consumed.
//
// Run with: node scripts/images/generate_hero_srcset.mjs, invoked from
// inside frontend/ (so Node's normal resolution finds the local `sharp`
// install rather than reaching into its internals by hand).
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '..', '..', 'public', 'marketing', 'lexis-tutor-hero.jpg');
const OUT_DIR = path.join(__dirname, '..', '..', 'public', 'marketing');

// Widths chosen against the hero photo's actual rendered size, not
// arbitrary breakpoints: the image container is w-64 (256px) on mobile,
// sm:w-80 (320px), and md:max-w-sm (384px) at md+ — see LandingPage.jsx.
// 480/800/1200 covers 1x-2x DPR on mobile up to ~3x DPR at the largest
// rendered size, without generating variants nothing will ever request.
const WIDTHS = [480, 800, 1200];
const FORMATS = [
  { ext: 'avif', options: { quality: 55 } },   // AVIF tolerates lower quality settings for equivalent visual fidelity
  { ext: 'webp', options: { quality: 78 } },
  { ext: 'jpg', options: { quality: 82, mozjpeg: true } }
];

async function main() {
  for (const width of WIDTHS) {
    const resized = sharp(SRC).resize({ width });
    for (const { ext, options } of FORMATS) {
      const outPath = path.join(OUT_DIR, `lexis-tutor-hero-${width}.${ext}`);
      await resized.clone()[ext === 'jpg' ? 'jpeg' : ext](options).toFile(outPath);
      console.log(`wrote ${path.basename(outPath)}`);
    }
  }
  console.log('done.');
}

main().catch((err) => {
  console.error('generate_hero_srcset failed:', err);
  process.exit(1);
});
