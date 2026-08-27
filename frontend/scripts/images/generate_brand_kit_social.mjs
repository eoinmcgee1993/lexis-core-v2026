// frontend/scripts/images/generate_brand_kit_social.mjs
//
// Builds the composed social pieces in brand-kit/ from the photography in
// brand-kit/photography/. Companion to generate_brand_kit_assets.mjs, which
// builds the logo, wordmark and avatar files from favicon.svg.
//
// Why this is a separate, later pass (27 Aug 2026): the first version of the
// composed creative was one navy template stretched across six aspect ratios,
// with a hole in the middle of every square post and the photo used in three
// pieces out of twelve. Reported, accurately, as terrible. Two things had to
// change before it could be fixed:
//
//   1. Type. The display face was a small-optical-size cut of Fraunces being
//      used at headline sizes. See scripts/fonts/build_fraunces_subset.py.
//   2. Photography. There was exactly ONE image of LEXIS, so every layout
//      had to work around the same square crop. brand-kit/photography/ now
//      holds ten, shot to purpose: speaking, listening, close crop, over the
//      shoulder, plus banner and story frames with the negative space for a
//      headline already built into the composition.
//
// Every layout below is a different layout. That is the point. A brand system
// is a set of related decisions, not one arrangement resized.
import { chromium } from 'playwright-core';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND = path.join(__dirname, '..', '..');
const KIT = path.join(FRONTEND, '..', 'brand-kit');
const PHOTO = path.join(KIT, 'photography');
const PUBLIC = path.join(FRONTEND, 'public');

const TEAL = '#0D9488';
const AMBER = '#FF9E00';
const INK = '#1E293B';
const CANVAS = '#FAFAF7';
const BLACK = '#000000';

const TRIAL = 30, WEEK = 199, MONTH = 599;
const SITE = 'learnwithlexis.com';
const TERMS = `Free ${TRIAL}-minute trial. No card required.`;
const TERMS_TH = `ทดลองฟรี ${TRIAL} นาที ไม่ต้องผูกบัตร`;

// Copy. Every line is about the experience of using the product, which is
// verifiable, rather than a claim about results, which would not be. The
// earlier set read as feature bullets ("Practice speaking English out loud,
// not typing") and was reported as lifeless. These lead with the feeling of
// the problem instead, which is what a quote card is actually for.
const LINES = {
  words:   'You already know the words.<br>Saying them out loud<br>is the hard part.',
  reading: 'Reading English<br>is not speaking English.',
  course:  'You don’t need<br>another course.<br>You need someone<br>to talk to.',
  before:  'Practice the conversation<br>before you have to<br>have it.',
  room:    'Thirty minutes.<br>No class.<br>No audience.',
  th_out:  'คุณรู้คำศัพท์อยู่แล้ว<br>แค่ยังไม่ได้พูดออกมา',
  th_room: 'ไม่มีห้องเรียน<br>ไม่มีคนฟังอยู่ข้างๆ<br>แค่คุณกับ LEXIS'
};

let fontCss = '';
async function loadFonts() {
  const [fr, th4, th6] = await Promise.all([
    fs.readFile(path.join(PUBLIC, 'fonts', 'fraunces-600-var.woff2')),
    fs.readFile(path.join(PUBLIC, 'fonts', 'ibm-plex-sans-thai-400.woff2')),
    fs.readFile(path.join(PUBLIC, 'fonts', 'ibm-plex-sans-thai-600.woff2'))
  ]);
  const f = (fam, w, b) =>
    `@font-face{font-family:'${fam}';font-weight:${w};font-display:block;` +
    `src:url(data:font/woff2;base64,${b.toString('base64')}) format('woff2')}`;
  fontCss = f('Fraunces', 600, fr) + f('PlexThai', 400, th4) + f('PlexThai', 600, th6);
}

const photoCache = new Map();
async function photo(name) {
  if (!photoCache.has(name)) {
    const b = await fs.readFile(path.join(PHOTO, `lexis-${name}.jpg`));
    photoCache.set(name, `data:image/jpeg;base64,${b.toString('base64')}`);
  }
  return photoCache.get(name);
}

const BARS = [
  { x: 1.5, y: 8, h: 8 }, { x: 6, y: 5, h: 14 }, { x: 10.5, y: 2, h: 20 },
  { x: 15, y: 5, h: 14 }, { x: 19.5, y: 8, h: 8 }
];
function mark(size, fill, badge) {
  const bars = BARS.map(b => `<rect x="${b.x}" y="${b.y}" width="3" height="${b.h}" rx="1.5" fill="${fill}"/>`).join('');
  const bg = badge ? `<rect width="24" height="24" rx="6" fill="${badge}"/>` : '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" style="display:block">${bg}${bars}</svg>`;
}
function lockup(size, color, badge) {
  return `<div style="display:flex;align-items:center;gap:${Math.round(size * 0.42)}px">
    ${mark(size, badge ? '#fff' : color, badge)}
    <div class="d" style="font-size:${Math.round(size * 1.06)}px;color:${color};line-height:1">LEXIS</div>
  </div>`;
}

let browser;
async function shot(file, w, h, body, bg) {
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
${fontCss}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:${w}px;height:${h}px;overflow:hidden}
body{background:${bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  color:${INK};-webkit-font-smoothing:antialiased}
.d{font-family:'Fraunces',Georgia,serif;font-weight:600;letter-spacing:-0.02em}
.t{font-family:'PlexThai',sans-serif}
.fill{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
</style></head><body>${body}</body></html>`, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  const out = path.join(KIT, file);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await p.screenshot({ path: out });
  await p.close();
  console.log('  ' + file);
}

async function main() {
  await loadFonts();
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  // ---- LAYOUT A: photo-led. Full bleed, scrim, headline sitting low-left.
  console.log('\ntemplates/ — layout A, photo-led');
  const A = async (file, img, line, sub) => shot(file, 1080, 1080, `
    <div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo(img)}"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to top,
        rgba(0,0,0,.92) 0%, rgba(0,0,0,.72) 34%, rgba(0,0,0,.12) 62%, rgba(0,0,0,.35) 100%)"></div>
      <div style="position:absolute;top:56px;left:56px">${lockup(38, '#fff', TEAL)}</div>
      <div style="position:absolute;left:56px;right:56px;bottom:56px">
        <div style="width:58px;height:3px;background:${TEAL};margin-bottom:28px"></div>
        <div class="d" style="font-size:66px;color:#fff;line-height:1.16">${line}</div>
        <div style="margin-top:26px;display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-size:24px;color:#fff;opacity:.62">${sub}</div>
          <div style="font-size:21px;color:${TEAL};letter-spacing:.04em">${SITE}</div>
        </div>
      </div>
    </div>`, BLACK);

  await A('templates/post-a-words.png', '02-portrait-black-speaking', LINES.words, TERMS);
  await A('templates/post-a-course.png', '05-vertical-black-headroom', LINES.course, TERMS);

  // ---- LAYOUT B: split. Photo occupies the top 58%, type sits in solid black.
  console.log('\ntemplates/ — layout B, split');
  const B = async (file, img, line, sub) => shot(file, 1080, 1080, `
    <div style="width:100%;height:100%;background:${BLACK};display:flex;flex-direction:column">
      <div style="position:relative;height:58%;overflow:hidden">
        <img class="fill" src="${await photo(img)}"/>
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,
          rgba(0,0,0,.3) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,.95) 100%)"></div>
        <div style="position:absolute;top:48px;left:56px">${lockup(34, '#fff', TEAL)}</div>
      </div>
      <div style="flex:1;padding:0 56px 52px;display:flex;flex-direction:column;justify-content:space-between">
        <div class="d" style="font-size:60px;color:#fff;line-height:1.15;margin-top:-14px">${line}</div>
        <div style="display:flex;justify-content:space-between;align-items:baseline">
          <div style="font-size:23px;color:#fff;opacity:.6">${sub}</div>
          <div style="font-size:20px;color:${TEAL};letter-spacing:.04em">${SITE}</div>
        </div>
      </div>
    </div>`, BLACK);

  await B('templates/post-b-reading.png', '10-closecrop-black', LINES.reading, TERMS);
  await B('templates/post-b-th.png', '01-portrait-black-smile',
    `<span class="t" style="font-weight:600">${LINES.th_out}</span>`, `<span class="t">${TERMS_TH}</span>`);

  // ---- LAYOUT C: type-led. Black field, small circular photo, quiet.
  console.log('\ntemplates/ — layout C, type-led');
  const circle = async (img, d) => `<div style="width:${d}px;height:${d}px;border-radius:50%;
      overflow:hidden;border:2px solid ${TEAL};flex-shrink:0">
      <img src="${await photo(img)}" style="width:100%;height:100%;object-fit:cover"/></div>`;

  const C = async (file, img, line, sub) => shot(file, 1080, 1080, `
    <div style="width:100%;height:100%;background:${BLACK};padding:76px;
      display:flex;flex-direction:column;justify-content:space-between">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        ${lockup(36, '#fff', TEAL)}
        ${await circle(img, 128)}
      </div>
      <div class="d" style="font-size:78px;color:#fff;line-height:1.14">${line}</div>
      <div style="display:flex;justify-content:space-between;align-items:baseline">
        <div style="font-size:24px;color:#fff;opacity:.6">${sub}</div>
        <div style="font-size:21px;color:${TEAL};letter-spacing:.04em">${SITE}</div>
      </div>
    </div>`, BLACK);

  await C('templates/post-c-before.png', '12-portrait-black-speaking-alt', LINES.before, TERMS);
  await C('templates/post-c-room.png', '13-portrait-black-smile-alt', LINES.room, TERMS);

  // ---- STORIES: full-bleed vertical, headline in the space the shot left.
  console.log('\ntemplates/ — stories');
  const S = async (file, img, line, sub, cta) => shot(file, 1080, 1920, `
    <div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo(img)}"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,
        rgba(0,0,0,.88) 0%, rgba(0,0,0,.55) 26%, rgba(0,0,0,.1) 46%, rgba(0,0,0,.92) 84%)"></div>
      <div style="position:absolute;top:120px;left:80px;right:80px">
        ${lockup(40, '#fff', TEAL)}
        <div class="d" style="font-size:74px;color:#fff;line-height:1.16;margin-top:44px">${line}</div>
      </div>
      <div style="position:absolute;left:80px;right:80px;bottom:150px;text-align:center">
        <div style="font-size:28px;color:#fff;opacity:.66;margin-bottom:38px">${sub}</div>
        <div style="display:inline-block;background:${AMBER};color:#fff;font-size:34px;
          font-weight:700;padding:26px 56px;border-radius:18px">${cta}</div>
        <div style="margin-top:34px;font-size:24px;color:#fff;opacity:.45;letter-spacing:.05em">${SITE}</div>
      </div>
    </div>`, BLACK);

  await S('templates/story-en.png', '09-story-black-lower', LINES.words, TERMS, 'Try It Free');
  await S('templates/story-th.png', '11-portrait-teal-overshoulder',
    `<span class="t" style="font-weight:600">${LINES.th_room}</span>`,
    `<span class="t">${TERMS_TH}</span>`, 'ลองใช้ฟรี');

  // ---- COVERS: each sized and composed for its own platform.
  console.log('\ncovers/ — composed per platform');

  // X: her on the right of the source frame, type in the black it left.
  await shot('covers/x-header-1500x500.png', 1500, 500, `
    <div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('07-banner-black-right')}" style="object-position:70% 40%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to right,
        rgba(0,0,0,.97) 0%, rgba(0,0,0,.9) 42%, rgba(0,0,0,.25) 78%, rgba(0,0,0,.5) 100%)"></div>
      <div style="position:absolute;left:88px;top:50%;transform:translateY(-50%);max-width:720px">
        ${lockup(40, '#fff', TEAL)}
        <div class="d" style="font-size:44px;color:#fff;line-height:1.2;margin-top:24px">
          Speaking practice,<br>out loud, any time.</div>
        <div style="margin-top:18px;font-size:20px;color:#fff;opacity:.55">${TERMS}</div>
      </div>
    </div>`, BLACK);

  // YouTube: everything inside the 1546x423 safe centre.
  await shot('covers/youtube-channel-2560x1440.png', 2560, 1440, `
    <div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('07-banner-black-right')}" style="object-position:68% 38%;opacity:.85"/>
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse at 72% 45%,
        rgba(0,0,0,.15) 0%, rgba(0,0,0,.86) 55%, rgba(0,0,0,.97) 100%)"></div>
      <div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
        width:1546px;height:423px;display:flex;flex-direction:column;justify-content:center;
        align-items:flex-start;padding-left:40px">
        ${lockup(58, '#fff', TEAL)}
        <div class="d" style="font-size:64px;color:#fff;line-height:1.18;margin-top:28px">
          Speaking practice, out loud.<br>English and Thai.</div>
        <div style="margin-top:22px;font-size:28px;color:${TEAL};letter-spacing:.05em">${SITE}</div>
      </div>
    </div>`, BLACK);

  await shot('covers/linkedin-page-1128x191.png', 1128, 191, `
    <div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('07-banner-black-right')}" style="object-position:74% 38%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to right,
        rgba(0,0,0,.97) 0%, rgba(0,0,0,.88) 48%, rgba(0,0,0,.35) 82%, rgba(0,0,0,.6) 100%)"></div>
      <div style="position:absolute;left:56px;top:50%;transform:translateY(-50%)">
        ${lockup(26, '#fff', TEAL)}
        <div style="margin-top:12px;font-size:19px;color:#fff;opacity:.66">
          Voice-first speaking practice, English and Thai.</div>
      </div>
    </div>`, BLACK);

  await shot('covers/facebook-cover-820x312.png', 820, 312, `
    <div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('07-banner-black-right')}" style="object-position:72% 38%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to right,
        rgba(0,0,0,.96) 0%, rgba(0,0,0,.86) 46%, rgba(0,0,0,.3) 80%, rgba(0,0,0,.55) 100%)"></div>
      <div style="position:absolute;left:52px;top:50%;transform:translateY(-50%);max-width:430px">
        ${lockup(28, '#fff', TEAL)}
        <div class="d" style="font-size:30px;color:#fff;line-height:1.2;margin-top:16px">
          Speaking practice,<br>out loud.</div>
        <div style="margin-top:12px;font-size:15px;color:#fff;opacity:.55">${TERMS}</div>
      </div>
    </div>`, BLACK);

  // LINE OA: Thai audience, warm cream rather than black, photo-led.
  await shot('covers/line-oa-cover-1080x878.png', 1080, 878, `
    <div style="width:100%;height:100%;background:${CANVAS};display:flex">
      <div style="width:46%;position:relative;overflow:hidden">
        <img class="fill" src="${await photo('03-portrait-cream-listening')}" style="object-position:50% 30%"/>
      </div>
      <div style="flex:1;padding:76px 64px;display:flex;flex-direction:column;justify-content:center;gap:26px">
        ${lockup(34, INK, TEAL)}
        <div class="t d" style="font-family:'PlexThai',sans-serif;font-weight:600;
          font-size:44px;color:${INK};line-height:1.45">ฝึกพูดภาษาอังกฤษ<br>และภาษาไทย<br>ด้วยเสียงจริง</div>
        <div class="t" style="font-size:24px;color:${INK};opacity:.6">${TERMS_TH}</div>
      </div>
    </div>`, CANVAS);

  // Link preview card: cream, warm, her listening.
  await shot('covers/og-share-card-1200x630.png', 1200, 630, `
    <div style="width:100%;height:100%;background:${CANVAS};display:flex">
      <div style="flex:1;padding:84px 72px;display:flex;flex-direction:column;justify-content:center;gap:26px">
        ${lockup(38, INK, TEAL)}
        <div class="d" style="font-size:56px;color:${INK};line-height:1.16">
          You already know<br>the words.</div>
        <div style="font-size:25px;color:${INK};opacity:.6;line-height:1.5">
          Saying them out loud is the hard part.<br>${TERMS}</div>
      </div>
      <div style="width:42%;position:relative;overflow:hidden">
        <img class="fill" src="${await photo('03-portrait-cream-listening')}" style="object-position:50% 28%"/>
      </div>
    </div>`, CANVAS);

  await browser.close();
  console.log('\nComposed social pieces rebuilt from the photo library.');
}

main().catch(e => { console.error(e); process.exit(1); });
