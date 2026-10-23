#!/usr/bin/env node
// brand-kit/schedule/pack.mjs
//
// Builds the owner's phone pack: the folder that gets zipped and unzipped on
// the phone, laid out exactly as brand-kit/LAUNCH-GUIDE.html step 1 describes.
//   1-profile/   profile photo and cover banners
//   2-videos/    one video per day, named as DAILY-POSTS.txt names it
//                (dayNN-<repo file name>.mp4)
//   3-images/    launch posters and the Community swipe-post pictures
//   4-captions/  DAILY-POSTS.txt and one caption file per app
//
// Usage (from the repo root):
//   node brand-kit/schedule/pack.mjs              -> brand-kit/schedule/pack/ (gitignored)
//   node brand-kit/schedule/pack.mjs --out=<dir>
//
// Why a script and not committed copies: the 2-videos names exist only in the
// pack, and the first pack was zipped by hand outside the repo. Days 14-21
// then pointed at files nobody had. Committing renamed copies would
// duplicate ~80 MB of video and could drift from the originals. So the pack
// is built from posts.mjs, the same source DAILY-POSTS.txt is built from,
// which keeps the two names identical by construction.

import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { SLOTS, EXTRAS, PLATFORM_FILES } from './posts.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../..');
const phone = 'brand-kit/phone';

const args = process.argv.slice(2);
for (const a of args) {
  if (!a.startsWith('--out=')) {
    console.error(`pack.mjs: unknown argument ${a}`);
    process.exit(2);
  }
}
const out = resolve(args.find((a) => a.startsWith('--out='))?.slice(6) || join(here, 'pack'));

// A pack built from stale captions would put last week's wording on the
// owner's phone, so refuse rather than pack what posts.mjs no longer says.
try {
  execFileSync(process.execPath, [join(here, 'build.mjs'), '--check'], { stdio: ['ignore', 'ignore', 'inherit'] });
} catch {
  console.error('pack.mjs: generated captions are stale. Run node brand-kit/schedule/build.mjs first.');
  process.exit(1);
}

// What goes where. Profile files and posters are named here because no
// slot or extra references them. The Community and story pictures come from
// posts.mjs's EXTRAS, so a new swipe post is packed without editing this file.
const PROFILE = ['lexis-avatar.png', 'facebook-cover.png', 'youtube-banner.png', 'line-cover.png'];
const POSTERS = ['launch-th.png', 'launch-en.png'];
const extraImages = [...new Set(Object.values(EXTRAS).flat().flatMap((e) => e.media).filter((f) => f.endsWith('.png')))];

const plan = [
  ...PROFILE.map((f) => [`${phone}/${f}`, `1-profile/${f}`]),
  ...SLOTS.map((s) => [s.media, s.phone]),
  ...[...POSTERS.map((f) => `${phone}/${f}`), ...extraImages].map((f) => [f, `3-images/${basename(f)}`]),
  [`${phone}/DAILY-POSTS.txt`, '4-captions/DAILY-POSTS.txt'],
  ...PLATFORM_FILES.map((pf) => [`${phone}/platforms/${pf.file}`, `4-captions/${pf.file}`]),
];

// Check the whole plan before touching the disk, so a missing file never
// leaves a half-built pack that looks complete.
const problems = [];
const dests = new Set();
for (const [src, dest] of plan) {
  if (!existsSync(join(repo, src))) problems.push(`missing source: ${src}`);
  if (dests.has(dest)) problems.push(`two files would be packed as ${dest}`);
  if (dest.split('/').includes('..')) problems.push(`pack path escapes the pack: ${dest}`);
  dests.add(dest);
}
for (const s of SLOTS) if (!s.phone.startsWith('2-videos/')) problems.push(`day ${s.day}: phone name ${s.phone} is not in 2-videos/`);
if (problems.length) {
  console.error(`pack.mjs: nothing written:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

// The pack folder is rebuilt from nothing on every run, so a video dropped
// from the schedule can't linger in it. It is only ever deleted if it
// carries this marker, which means pack.mjs made it. Anything else, such as a
// mistyped --out pointing at a real folder, is refused rather than wiped.
const MARK = '.lexis-pack';
if (existsSync(out)) {
  const entries = readdirSync(out);
  if (entries.length && !entries.includes(MARK)) {
    console.error(`pack.mjs: ${out} is not empty and was not made by pack.mjs; refusing to delete it. Pick an empty or new --out.`);
    process.exit(1);
  }
  rmSync(out, { recursive: true, force: true });
}
mkdirSync(out, { recursive: true });
writeFileSync(join(out, MARK), 'Made by brand-kit/schedule/pack.mjs. Deleted and rebuilt on every run.\n');

let bytes = 0;
for (const [src, dest] of plan) {
  mkdirSync(dirname(join(out, dest)), { recursive: true });
  copyFileSync(join(repo, src), join(out, dest));
  bytes += statSync(join(out, dest)).size;
}

// The point of the pack: every video the captions name must be in it.
// DAILY-POSTS.txt names the pack path itself ("video: 2-videos/dayNN-...").
// The app files name the plain repo file, which a packed name ends with.
const daily = readFileSync(join(out, '4-captions/DAILY-POSTS.txt'), 'utf8');
const named = [...daily.matchAll(/video: (\S+)/g)].map((x) => x[1]);
const unresolved = named.filter((p) => !existsSync(join(out, p)));
if (named.length !== SLOTS.length) unresolved.push(`DAILY-POSTS.txt names ${named.length} videos, the schedule has ${SLOTS.length}`);
const packed = readdirSync(join(out, '2-videos'));
for (const pf of PLATFORM_FILES) {
  const text = readFileSync(join(out, '4-captions', pf.file), 'utf8');
  for (const [, name] of text.matchAll(/([\w.-]+\.mp4)/g)) {
    if (!packed.some((f) => f.endsWith(`-${name}`))) unresolved.push(`${pf.file} names ${name}, which is not in 2-videos/`);
  }
}
if (unresolved.length) {
  console.error(`pack.mjs: pack at ${out} is incomplete:\n- ${unresolved.join('\n- ')}`);
  process.exit(1);
}

console.log(`pack.mjs: ${plan.length} files (${(bytes / 1e6).toFixed(1)} MB) in ${out}. All ${named.length} DAILY-POSTS videos resolve. Zip that folder to send it to the phone.`);
