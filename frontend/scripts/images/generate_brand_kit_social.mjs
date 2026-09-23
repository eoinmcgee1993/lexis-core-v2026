// frontend/scripts/images/generate_brand_kit_social.mjs
//
// Builds the composed social pieces in brand-kit/ from the photography in
// brand-kit/photography/. Companion to generate_brand_kit_assets.mjs, which
// builds the logo, wordmark and avatar files (the mark-derived subset is now
// generate_brand_kit_mark.mjs, from src/brand/lexisMark.js).
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
// Trial length and prices are imported, never re-declared here. They were
// hardcoded as a second copy of numbers that already live in facts.js —
// which is exactly how the kit ended up rendering "Free 30-minute trial"
// onto all 14 templates after the trial was halved to 15 (PR #92).
// facts.js is a plain constants module with no React imports, so a Node
// script can read it directly.
import { TRIAL as TRIAL_FACT, PRICING, FAIR_USE } from '../../src/content/facts.js';
import { markSvg } from '../../src/brand/lexisMark.js';

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

const TRIAL = TRIAL_FACT.minutes, WEEK = PRICING.weekly.thb, MONTH = PRICING.monthly.thb;
const SITE = 'learnwithlexis.com';
const TERMS = `Free ${TRIAL}-minute trial. No card required.`;
const TERMS_TH = `ทดลองฟรี ${TRIAL} นาที ไม่ต้องผูกบัตร`;
// A pass is a one-off purchase, so "฿199/week" would advertise a
// recurring charge that does not exist (facts.js BILLING.autoRenews).
const PRICE_EN = `฿${WEEK} for ${PRICING.weekly.days} days or ฿${MONTH} for ${PRICING.monthly.days}. One-off.`;

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
  room:    'No class.<br>No audience.<br>Just you talking.',
  th_out:  'คุณรู้คำศัพท์อยู่แล้ว<br>แค่ยังไม่ได้พูดออกมา',
  th_room: 'ไม่มีห้องเรียน<br>ไม่มีคนฟังอยู่ข้างๆ<br>แค่คุณกับ LEXIS',
  // Second wave, 27 Aug 2026. Same rule as above: these describe the
  // experience, never a result, and never a volume promise. Deliberately no
  // "unlimited" or "talk as much as you want" line anywhere, because the
  // product has no stated fair-use ceiling and an ad is the wrong place to
  // discover that (see LAUNCH-ACTION-PLAN.md, risk 1).
  textbook: 'The textbook never<br>asks you a question<br>back.',
  swim:    'You can’t learn to swim<br>by reading<br>about water.',
  stranger:'Your first conversation<br>in English shouldn’t<br>be with a stranger.',
  find:    'Find out if you can<br>hold a conversation<br>before it matters.',
  th_ask:  'หนังสือเรียน<br>ไม่เคยถามคำถามคุณกลับ',
  th_first:'บทสนทนาแรกของคุณ<br>ไม่ควรเป็น<br>กับคนแปลกหน้า'
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

// The mark comes from src/brand/lexisMark.js, the same module the site's
// LexisMark component and favicon are built from. This file used to carry
// its own BARS array — and by the 4 Sep redraw it was already the wrong
// one (the old mirrored 8/14/20/14/8), which is exactly the drift the
// shared module exists to end. The 23 Sep mark is a fixed-colour tile
// (navy, white L, amber waves), so lockup()'s `badge` argument no longer
// recolours it; it is left in the call sites below, unused.
//
// On dark surfaces (a white wordmark) the tile gets a hairline edge. First
// render without it: on the near-black photography the navy tile vanished
// and a 34px lockup read as a 19px glyph floating beside the wordmark.
function mark(size, dark = false) {
  const svg = markSvg({ variant: 'tile', size }).replace('<svg ', '<svg style="display:block" ');
  if (!dark) return svg;
  const r = Math.round(size * 0.23);
  return `<div style="border-radius:${r}px;box-shadow:0 0 0 ${Math.max(1, size / 34)}px rgba(255,255,255,.28)">${svg}</div>`;
}
function lockup(size, color, badge) {
  return `<div style="display:flex;align-items:center;gap:${Math.round(size * 0.42)}px">
    ${mark(size, color === '#fff')}
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

// ---- INSTAGRAM CAROUSELS (22 Sep 2026, launch push).
//
// 1080x1350, Instagram's 4:5 portrait feed format: the tallest a feed post
// can be, so the most screen a carousel slide gets. The rest of this kit is
// 1080 square or 9:16 story, and neither is a carousel — a carousel is read
// as a sequence, so it is built as one: a hook, the problem, what LEXIS is,
// how a session goes, the feeling, the price, the ask.
//
// Every product claim below was checked against the code before it was
// written, because copy here is a factual assertion (CLAUDE.md):
//   - the four topics are TopicStage.jsx's own labels
//   - "English or Thai" is /api/session's `direction`
//   - "corrects you as you go" is LANDING_DESCRIPTION_EN's "gentle
//     real-time corrections"
//   - "feedback on what you actually said" is /api/feedback, which grades
//     the session's real transcript and refuses to score one too short
// Same rule as LINES: the experience, never a result. No fluency promise,
// no "in N weeks", no learner outcomes, no "unlimited".
//
// The price slide states the fair-use ceilings. PRICE_EN above does not,
// and facts.js is explicit that an enforced but undisclosed usage limit is
// the thing it exists to end. A slide that sells a pass should say what the
// pass holds. It reads as more concrete, not less.
const CAROUSEL = {
  en: {
    font: 'd', swipe: 'Swipe →', link: 'Link in bio', cta: 'Try it free',
    hook: 'You understand<br>English. So why<br>does it disappear<br>when you have<br>to speak?',
    problem: LINES.textbook,
    problemSub: 'Speaking is practised by speaking — and that needs someone on the other side.',
    whatHead: 'LEXIS is someone<br>to talk to.',
    whatBody: 'A voice tutor you speak with out loud, in English or in Thai. No typing. No audience.',
    howHead: 'How a session goes',
    how: [
      ['Pick a topic', 'Everyday talk, work & business, travel & culture — or just talk.'],
      ['Talk out loud', 'LEXIS listens, answers, and gently corrects you as you go.'],
      ['See what you said', 'Feedback on your actual conversation: what went well, what to work on.']
    ],
    feel: LINES.room,
    feelSub: 'Practise the conversation before you have to have it.',
    priceHead: 'Start free.',
    trial: `${TRIAL} minutes free`, trialSub: 'No card needed',
    week: `฿${WEEK}`, weekDays: `${PRICING.weekly.days} days`, weekCap: `Up to ${FAIR_USE.weekly.minutes} min of practice`,
    month: `฿${MONTH}`, monthDays: `${PRICING.monthly.days} days`, monthCap: `Up to ${FAIR_USE.monthly.minutes} min of practice`,
    priceFoot: 'One-off payments — nothing renews on its own. Card or PromptPay.',
    close: LINES.stranger
  },
  th: {
    font: 't', swipe: 'ปัดเพื่อดูต่อ →', link: 'ลิงก์อยู่ในโปรไฟล์', cta: 'ลองใช้ฟรี',
    hook: 'คุณเข้าใจ<br>ภาษาอังกฤษ<br>แต่ทำไมพอต้องพูด<br>ถึงนึกไม่ออก?',
    problem: LINES.th_ask,
    problemSub: 'การพูดต้องฝึกด้วยการพูด และต้องมีคนคุยด้วย',
    whatHead: 'LEXIS คือคู่สนทนา<br>ที่คุณคุยด้วยได้จริง',
    whatBody: 'ติวเตอร์เสียงที่คุณพูดคุยด้วยออกเสียงจริง ทั้งภาษาอังกฤษและภาษาไทย ไม่ต้องพิมพ์ ไม่มีใครฟังอยู่',
    howHead: 'ฝึกหนึ่งครั้งเป็นอย่างไร',
    how: [
      ['เลือกหัวข้อ', 'บทสนทนาทั่วไป งานและธุรกิจ ท่องเที่ยวและวัฒนธรรม หรือจะคุยอิสระก็ได้'],
      ['พูดออกเสียง', 'LEXIS ฟัง ตอบ และแนะนำการแก้ไขอย่างอ่อนโยนระหว่างคุย'],
      ['ดูสิ่งที่คุณพูด', 'สรุปผลจากบทสนทนาจริงของคุณ ว่าทำได้ดีตรงไหนและควรฝึกอะไรต่อ']
    ],
    feel: LINES.th_room,
    feelSub: 'ฝึกบทสนทนาก่อนที่คุณจะต้องพูดจริง',
    priceHead: 'เริ่มต้นฟรี',
    trial: `ทดลองฟรี ${TRIAL} นาที`, trialSub: 'ไม่ต้องผูกบัตร',
    week: `฿${WEEK}`, weekDays: `${PRICING.weekly.days} วัน`, weekCap: `ฝึกได้สูงสุด ${FAIR_USE.weekly.minutes} นาที`,
    month: `฿${MONTH}`, monthDays: `${PRICING.monthly.days} วัน`, monthCap: `ฝึกได้สูงสุด ${FAIR_USE.monthly.minutes} นาที`,
    priceFoot: 'จ่ายครั้งเดียว ไม่ต่ออายุอัตโนมัติ จ่ายด้วยบัตรหรือพร้อมเพย์',
    close: LINES.th_first
  }
};

async function carousels() {
  const W = 1080, H = 1350, N = 7;
  for (const [lang, c] of Object.entries(CAROUSEL)) {
    console.log(`\ncarousel/${lang}/ — 4:5, ${N} slides`);
    // Thai headlines set in IBM Plex Sans Thai: Fraunces has no Thai glyphs,
    // and a serif fallback for Thai reads as a rendering fault.
    const hd = (size, color) => c.font === 't'
      ? `class="t" lang="th" style="font-weight:600;font-size:${Math.round(size * 0.86)}px;color:${color};line-height:1.42"`
      : `class="d" style="font-size:${size}px;color:${color};line-height:1.14"`;
    // Thai body copy reads smaller than Latin at the same px size (shorter
    // x-height, stacked tone marks), so it gets a size bump rather than a
    // separate set of numbers per slide.
    const bd = (size, color, op = 1) =>
      `${c.font === 't' ? 'class="t" lang="th"' : ''} style="font-size:${Math.round(size * (c.font === 't' ? 1.1 : 1))}px;color:${color};opacity:${op};line-height:1.5"`;
    const counter = (i, color) =>
      `<div style="font-size:22px;color:${color};opacity:.5;letter-spacing:.08em">${String(i).padStart(2, '0')} / ${String(N).padStart(2, '0')}</div>`;
    const top = (i, dark) => `<div style="position:absolute;top:60px;left:64px;right:64px;
      display:flex;justify-content:space-between;align-items:center">
      ${lockup(34, dark ? '#fff' : INK, TEAL)}${counter(i, dark ? '#fff' : INK)}</div>`;
    const rule = `<div style="width:58px;height:3px;background:${TEAL};margin-bottom:30px"></div>`;
    const K = (n, body, bg) => shot(`carousel/${lang}/${String(n).padStart(2, '0')}.png`, W, H, body, bg);

    // 1 — hook. Photo-led; the swipe cue is the only call to action here.
    await K(1, `<div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('02-portrait-black-speaking')}" style="object-position:50% 22%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to top,
        rgba(0,0,0,.95) 0%, rgba(0,0,0,.78) 38%, rgba(0,0,0,.1) 66%, rgba(0,0,0,.45) 100%)"></div>
      ${top(1, true)}
      <div style="position:absolute;left:64px;right:64px;bottom:72px">
        ${rule}<div ${hd(72, '#fff')}>${c.hook}</div>
        <div style="margin-top:34px;text-align:right;font-size:26px;color:${TEAL};letter-spacing:.04em"
          ${c.font === 't' ? 'class="t"' : ''}>${c.swipe}</div>
      </div></div>`, BLACK);

    // 2 — the problem. Type-led, black, a small portrait so it is still her.
    await K(2, `<div style="position:relative;width:100%;height:100%;background:${BLACK};padding:0 64px">
      ${top(2, true)}
      <div style="position:absolute;left:64px;right:64px;top:50%;transform:translateY(-46%)">
        <div style="width:150px;height:150px;border-radius:50%;overflow:hidden;border:2px solid ${TEAL};margin-bottom:56px">
          <img src="${await photo('10-closecrop-black')}" style="width:100%;height:100%;object-fit:cover"/></div>
        <div ${hd(80, '#fff')}>${c.problem}</div>
        <div style="margin-top:44px;max-width:820px"><div ${bd(30, TEAL)}>${c.problemSub}</div></div>
      </div></div>`, BLACK);

    // 3 — what LEXIS is. Cream: the first light slide, so the swipe changes
    // temperature exactly where the carousel turns from problem to answer.
    await K(3, `<div style="position:relative;width:100%;height:100%;background:${CANVAS}">
      ${top(3, false)}
      <div style="position:absolute;left:0;right:0;top:150px;height:640px;overflow:hidden">
        <img class="fill" src="${await photo('03-portrait-cream-listening')}" style="object-position:50% 26%"/></div>
      <div style="position:absolute;left:64px;right:64px;bottom:76px">
        ${rule}<div ${hd(66, INK)}>${c.whatHead}</div>
        <div style="margin-top:26px"><div ${bd(29, INK, .72)}>${c.whatBody}</div></div>
      </div></div>`, CANVAS);

    // 4 — how a session goes. Three real steps from the four-stage flow.
    const steps = c.how.map(([h, t], i) => `
      <div style="display:flex;gap:34px;align-items:flex-start;padding:46px 0;
        ${i ? 'border-top:1px solid rgba(255,255,255,.12);' : ''}">
        <div class="d" style="font-size:66px;color:${AMBER};line-height:1;min-width:58px">${i + 1}</div>
        <div><div ${hd(52, '#fff')}>${h}</div>
          <div style="margin-top:14px"><div ${bd(31, '#fff', .66)}>${t}</div></div></div>
      </div>`).join('');
    await K(4, `<div style="position:relative;width:100%;height:100%;background:${lexisNavy()}">
      ${top(4, true)}
      <div style="position:absolute;left:64px;right:64px;top:54%;transform:translateY(-50%)">
        ${rule}<div ${hd(68, '#fff')}>${c.howHead}</div>
        <div style="margin-top:36px">${steps}</div>
      </div></div>`, lexisNavy());

    // 5 — the feeling. The one line the rest of the kit already leads with.
    await K(5, `<div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('13-portrait-black-smile-alt')}" style="object-position:50% 20%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to top,
        rgba(0,0,0,.94) 0%, rgba(0,0,0,.7) 36%, rgba(0,0,0,.08) 64%, rgba(0,0,0,.4) 100%)"></div>
      ${top(5, true)}
      <div style="position:absolute;left:64px;right:64px;bottom:80px">
        ${rule}<div ${hd(76, '#fff')}>${c.feel}</div>
        <div style="margin-top:30px"><div ${bd(29, '#fff', .66)}>${c.feelSub}</div></div>
      </div></div>`, BLACK);

    // 6 — price. Cream, every number from facts.js, ceilings stated.
    const pass = (price, days, cap) => `<div style="flex:1;background:#fff;border-radius:26px;
      padding:48px 40px;box-shadow:0 1px 0 rgba(30,41,59,.06),0 18px 40px -24px rgba(30,41,59,.25)">
      <div class="d" style="font-size:92px;color:${INK};line-height:1">${price}</div>
      <div style="margin-top:14px"><div ${bd(34, INK)}>${days}</div></div>
      <div style="margin-top:26px;padding-top:24px;border-top:1px solid rgba(30,41,59,.1)">
        <div ${bd(27, INK, .62)}>${cap}</div></div></div>`;
    await K(6, `<div style="position:relative;width:100%;height:100%;background:${CANVAS}">
      ${top(6, false)}
      <div style="position:absolute;left:64px;right:64px;top:54%;transform:translateY(-50%)">
        ${rule}<div ${hd(84, INK)}>${c.priceHead}</div>
        <div style="margin-top:48px;background:${TEAL};border-radius:28px;padding:52px 48px;color:#fff">
          <div ${hd(64, '#fff')}>${c.trial}</div>
          <div style="margin-top:10px"><div ${bd(31, '#fff', .82)}>${c.trialSub}</div></div></div>
        <div style="margin-top:28px;display:flex;gap:28px">
          ${pass(c.week, c.weekDays, c.weekCap)}${pass(c.month, c.monthDays, c.monthCap)}</div>
        <div style="margin-top:44px"><div ${bd(28, INK, .62)}>${c.priceFoot}</div></div>
      </div></div>`, CANVAS);

    // 7 — the ask. The only amber on the whole carousel is this button.
    await K(7, `<div style="position:relative;width:100%;height:100%;background:${BLACK}">
      <img class="fill" src="${await photo('01-portrait-black-smile')}" style="object-position:50% 18%"/>
      <div style="position:absolute;inset:0;background:linear-gradient(to top,
        rgba(0,0,0,.96) 0%, rgba(0,0,0,.8) 44%, rgba(0,0,0,.12) 70%, rgba(0,0,0,.45) 100%)"></div>
      ${top(7, true)}
      <div style="position:absolute;left:64px;right:64px;bottom:76px">
        ${rule}<div ${hd(68, '#fff')}>${c.close}</div>
        <div style="margin-top:46px;display:flex;align-items:center;gap:30px">
          <div style="background:${AMBER};color:#fff;font-size:34px;font-weight:700;
            padding:26px 50px;border-radius:18px" ${c.font === 't' ? 'class="t"' : ''}>${c.cta}</div>
          <div><div style="font-size:30px;color:#fff;letter-spacing:.03em">${SITE}</div>
            <div style="margin-top:6px"><div ${bd(22, '#fff', .55)}>${c.link}</div></div></div>
        </div>
      </div></div>`, BLACK);
  }
}
// lexis-navy is reserved for "inside the conversation" in the product
// (scripts/design/lexis-visual-system.md). The how-it-works slide IS the
// conversation, described, so it borrows that meaning deliberately — the
// only slide that does.
function lexisNavy() { return '#050B14'; }

async function main() {
  await loadFonts();
  browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

  await carousels();
  // `--only=carousel` regenerates just the carousels. Without it the whole
  // kit is rebuilt as before. The flag exists so adding a carousel slide
  // doesn't rewrite fourteen unrelated template PNGs in the same commit.
  if (process.argv.includes('--only=carousel')) {
    await browser.close();
    console.log('\nCarousels rebuilt (--only=carousel; rest of the kit untouched).');
    return;
  }

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

  // ---- LAYOUT D: light. Warm cream, portrait right, rule under the mark.
  // Six black squares in a row reads as a wall; the grid needs air, and the
  // cream is as much the brand as the navy is.
  console.log('\ntemplates/ — layout D, light');
  const D = async (file, img, line, sub) => shot(file, 1080, 1080, `
    <div style="width:100%;height:100%;background:${CANVAS};display:flex">
      <div style="flex:1;padding:80px 56px 72px 76px;display:flex;flex-direction:column;justify-content:space-between">
        <div>
          ${lockup(34, INK, TEAL)}
          <div style="width:52px;height:3px;background:${TEAL};margin-top:28px"></div>
        </div>
        <div class="d" style="font-size:50px;color:${INK};line-height:1.18">${line}</div>
        <div>
          <div style="font-size:22px;color:${INK};opacity:.6;line-height:1.5">${sub}</div>
          <div style="margin-top:12px;font-size:19px;color:${TEAL};letter-spacing:.04em">${SITE}</div>
        </div>
      </div>
      <div style="width:40%;position:relative;overflow:hidden">
        <img class="fill" src="${await photo(img)}" style="object-position:52% 26%"/>
      </div>
    </div>`, CANVAS);

  await D('templates/post-d-textbook.png', '03-portrait-cream-listening', LINES.textbook, TERMS);
  await D('templates/post-d-stranger.png', '03-portrait-cream-listening', LINES.stranger, TERMS);
  await D('templates/post-d-th.png', '03-portrait-cream-listening',
    `<span class="t" lang="th" style="font-weight:600">${LINES.th_first}</span>`,
    `<span class="t" lang="th">${TERMS_TH}</span>`);

  // ---- second wave across the existing layouts, for grid variety
  console.log('\ntemplates/ — second wave');
  await A('templates/post-a-swim.png', '12-portrait-black-speaking-alt', LINES.swim, TERMS);
  await B('templates/post-b-find.png', '10-closecrop-black', LINES.find, `${TERMS}<br>${PRICE_EN}`);
  await C('templates/post-c-th-ask.png', '01-portrait-black-smile',
    `<span class="t" lang="th" style="font-weight:600">${LINES.th_ask}</span>`,
    `<span class="t" lang="th">${TERMS_TH}</span>`);

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
