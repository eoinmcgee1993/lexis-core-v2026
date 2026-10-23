// LEXIS LINE Official Account kit: the two rich-menu images, and a check
// that LINE-OA-SETUP.md still agrees with them, with the site's routes and
// with facts.js. Run from anywhere: node brand-kit/line/build_line_assets.mjs
// Same pattern as brand-kit/carousel/build_community_carousel.mjs, including
// borrowing playwright-core from frontend/node_modules via createRequire.
//
// Writes rich-menu-large.png (2500x1686, six boxes) and
// rich-menu-compact.png (2500x843, three boxes), and writes NOTHING unless
// every check below passes. The guide tells the owner to rebuild and upload,
// so a run that saved a clipped menu over the good one and only then exited
// 1 would leave a broken image in the folder, ready to go out.
//
// THE GRID IS LINE'S, NOT OURS. LINE OA Manager has no free-form tap areas:
// you pick a template and its boxes are fixed (the six-box large template is
// three columns of 833/834/833 by two rows of 843, the same bounds LINE's own
// Messaging API examples use). An image drawn to any other grid still uploads
// fine and then sends a tap on "Prices" to whatever box sits under it, with
// nothing anywhere to warn anyone. COLS below is that template; the guide's
// tap-area tables are checked against it.
//
// No icons and no logo. Nothing an icon could add here says more than the
// word beside it, and a stock glyph standing in for a word is the thing the
// design rules rule out. The chat header already shows the account's avatar,
// so the menu doesn't repeat the mark; if a later version wants it, build it
// from frontend/src/brand/lexisMark.js (markSvg) the way
// frontend/scripts/images/generate_brand_kit_social.mjs does, never by hand.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { TRIAL, PRICING, BILLING, SPONSOR_ADDON_THB } from '../../frontend/src/content/facts.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const { chromium } = createRequire(path.join(root, 'frontend/package.json'))('playwright-core');
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'frontend/public/fonts', f)).toString('base64');

// Every message in LINE-OA-SETUP.md says the trial needs no card and that a
// pass is paid once and never renews. If either fact flips, that copy is
// false, not merely stale, so stop rather than print a menu beside it.
if (BILLING.autoRenews || TRIAL.cardRequired) {
  throw new Error('facts.js no longer says "one-off, no card": rewrite LINE-OA-SETUP.md before rebuilding');
}

// openExternalBrowser=1 is LINE's documented switch for opening a link in
// the phone's own browser instead of LINE's built-in one. LEXIS needs the
// microphone, and a learner who signs up should still be signed in the next
// time they open the site; both belong to Safari/Chrome, not to a webview
// that LINE throws away when the chat closes.
const SITE = 'https://learnwithlexis.com';
const link = (p, campaign, content) =>
  `${SITE}${p}?utm_source=line&utm_medium=social&utm_campaign=${campaign}&utm_content=${content}&openExternalBrowser=1`;

// Three boxes are Text actions, not links. The site has no practice-topics
// index, no contact page, and no How-it-works page or anchor: a link for C
// landed on the top of /th, the same place as A, which is not what the
// button promises. A LINE link action also can't open an email address. A
// Text action sends the word as if the user typed it, and the matching
// auto-reply in the guide answers in the chat (the three steps, the five
// topic links, the contact address).
const W = PRICING.weekly;
const M = PRICING.monthly;
const TILES = {
  'try-free': { th: 'ลองใช้ฟรี', en: 'Try it free', lines: [`ฟรี ${TRIAL.minutes} นาที`, 'ไม่ต้องผูกบัตร'], tone: 'action', link: '/th' },
  prices: { th: 'ราคา', en: 'Prices', lines: [`฿${W.thb} ใช้ได้ ${W.days} วัน`, `฿${M.thb} ใช้ได้ ${M.days} วัน`, 'จ่ายครั้งเดียว'], link: '/th/pricing' },
  'how-it-works': { th: 'วิธีใช้งาน', en: 'How it works', lines: ['แตะปุ่มเดียว เริ่มพูดได้เลย', 'ไม่ต้องพิมพ์'], text: 'วิธีใช้งาน' },
  'practice-topics': { th: 'หัวข้อฝึกพูด', en: 'Practice topics', lines: ['สัมภาษณ์งาน · เดินทาง', 'ทำงาน · งานโรงแรม'], text: 'หัวข้อฝึกพูด' },
  community: { th: 'ส่งต่อโอกาส', en: 'LEXIS Community', lines: [`เพิ่ม ฿${SPONSOR_ADDON_THB} ตอนซื้อแพ็กเกจ`, 'ไม่บังคับ'], tone: 'teal', link: '/th/community' },
  contact: { th: 'ติดต่อเรา', en: 'Contact', lines: ['สอบถามทางอีเมล'], text: 'ติดต่อ' },
};
for (const [id, t] of Object.entries(TILES)) if (t.link) t.url = link(t.link, 'rich-menu', id);

// `heading` is the guide section holding that layout's tap-area table, so
// each table is checked on its own and the compact table can't pass on the
// strength of the large one's identical rows.
const LAYOUTS = [
  { file: 'rich-menu-large.png', height: 1686, heading: '### Large menu: tap areas', tiles: ['try-free', 'prices', 'how-it-works', 'practice-topics', 'community', 'contact'] },
  { file: 'rich-menu-compact.png', height: 843, heading: '### Compact menu', tiles: ['try-free', 'prices', 'practice-topics'] },
];
const COLS = [[0, 833], [833, 834], [1667, 833]];
const ROW_H = 843;
const boxes = (ids) =>
  ids.map((id, i) => ({ id, letter: 'ABCDEF'[i], x: COLS[i % 3][0], w: COLS[i % 3][1], y: Math.floor(i / 3) * ROW_H, h: ROW_H }));

// The visible gap between cards is taken from inside each box, so no card
// ever straddles a boundary: a thumb landing on the dark gap still hits the
// box whose card it is nearest.
const INSET = 18;

// Sizes are for a phone, where the 2500px menu shows at roughly 390pt wide
// (about 1/6.4): 120px Thai is ~19pt, the 58-62px small lines ~9pt, the
// smallest that still reads. Every line is nowrap and set by hand, because
// Thai has no spaces between words and the browser would otherwise break
// mid-word (the community carousel's "เปิด / ประตู"). Lines are NOT
// overflow:hidden: that would also shave tone marks stacked above the line
// box (ผู้, ปั๊ม) where no measurement sees it. Width is measured on an inner
// span instead, which works with overflow left visible.
const page = (layout) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;font-weight:400;src:url(${font('ibm-plex-sans-thai-400.woff2')})}
@font-face{font-family:Plex;font-weight:600;src:url(${font('ibm-plex-sans-thai-600.woff2')})}
*{margin:0;box-sizing:border-box}
body{width:2500px;height:${layout.height}px;background:#050B14;font-family:Plex,sans-serif;color:#fff;position:relative;overflow:hidden}
.card{position:absolute;border-radius:44px;padding:60px 56px 66px;display:flex;flex-direction:column;
  background:#0D1726;border:4px solid rgba(255,255,255,.10)}
.card.action{background:linear-gradient(135deg,#FFB23A,#FF6A1A);border-color:transparent;color:#0B1422}
.card.teal{background:#0A2226;border-color:rgba(20,184,166,.55)}
.th,.en,.ln{white-space:nowrap}
.th{font-weight:600;font-size:120px;line-height:1.25}
.en{margin-top:6px;font-weight:600;font-size:58px;letter-spacing:.03em;color:#FFB23A}
.action .en{color:#0B1422;opacity:.8}
.teal .en{color:#2DD4BF}
.sub{margin-top:auto}
.ln{font-size:62px;line-height:1.5;color:rgba(255,255,255,.84)}
.action .ln{color:#0B1422}
</style></head><body>
${boxes(layout.tiles).map((b) => {
  const t = TILES[b.id];
  return `<div class="card ${t.tone || ''}" data-box="${b.letter}" style="left:${b.x + INSET}px;top:${b.y + INSET}px;width:${b.w - 2 * INSET}px;height:${b.h - 2 * INSET}px">
<div class="th"><span>${t.th}</span></div><div class="en"><span>${t.en}</span></div>
<div class="sub">${t.lines.map((l) => `<div class="ln"><span>${l}</span></div>`).join('')}</div></div>`;
}).join('\n')}
</body></html>`;

// Chromium as frontend/scripts/prerender.mjs finds it: the remote
// container's preinstalled copy (never `playwright install` there), an
// override for anyone running this on their own machine with Chrome
// installed, else Playwright's default.
const chromiumPath = process.env.PLAYWRIGHT_LOCAL_CHROMIUM || '/opt/pw-browsers/chromium';
const problems = [];
const images = [];
const b = await chromium.launch(fs.existsSync(chromiumPath) ? { executablePath: chromiumPath } : {});
for (const layout of LAYOUTS) {
  const pg = await b.newPage({ viewport: { width: 2500, height: layout.height } });
  await pg.setContent(page(layout), { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  const found = await pg.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.th,.en,.ln')) {
      if (el.firstElementChild.getBoundingClientRect().width > el.clientWidth) out.push(`"${el.textContent}" is too wide for its box`);
    }
    for (const c of document.querySelectorAll('.card')) {
      if (c.scrollHeight > c.clientHeight) out.push(`box ${c.dataset.box} is too tall for its box`);
    }
    return out;
  });
  problems.push(...found.map((f) => `${layout.file}: ${f}`));
  const png = await pg.screenshot();
  await pg.close();
  // LINE rejects rich-menu images over 1 MB at upload. Flat fills keep these
  // far under it; this catches a future gradient or photo that doesn't.
  if (png.length > 1_000_000) problems.push(`${layout.file} is ${png.length} bytes, over LINE's 1 MB limit`);
  images.push([layout.file, png]);
}
await b.close();

// ---- LINE-OA-SETUP.md against the images, the routes and facts.js ----
// The guide is typed by hand and the images are generated, so these are the
// checks that fail when the two drift. They check facts, links and LINE's
// limits, not wording: the banned phrasings are a copy checker's job.
const doc = fs.readFileSync(path.join(here, 'LINE-OA-SETUP.md'), 'utf8');
const app = fs.readFileSync(path.join(root, 'frontend/src/App.jsx'), 'utf8');

// Links. Same source-text extraction as backend/test/fair-use.test.mjs:
// App.jsx's switch is the route table, and '/' is its default branch.
const routes = new Set(['/', ...[...app.matchAll(/case '(\/[^']*)'/g)].map((m) => m[1])]);
const TAGS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'openExternalBrowser'];
const CAMPAIGNS = ['greeting', 'rich-menu', 'auto-reply', 'line-broadcast'];
// Any site link that isn't the exact https://learnwithlexis.com form
// (http, www., or a bare domain) would slip past the tag checks below.
for (const m of doc.matchAll(/(?<!@)([\w:/.]*)learnwithlexis\.com(?=[/?])/g)) {
  if (m[1] !== 'https://') problems.push(`"${m[0]}...": site links must start https://learnwithlexis.com`);
}
const urls = (doc.match(/https:\/\/learnwithlexis\.com[^\s)`'"<>]*/g) || []).map((u) => u.replace(/[.,;:!]+$/, ''));
const weeks = [];
for (const raw of urls) {
  let u;
  try { u = new URL(raw); } catch { problems.push(`${raw}: not a valid URL`); continue; }
  const q = Object.fromEntries(u.searchParams);
  if (!routes.has(u.pathname)) problems.push(`${raw}: ${u.pathname} is not a route in App.jsx`);
  if (Object.keys(q).join() !== TAGS.join()) problems.push(`${raw}: tags must be exactly ${TAGS.join(', ')}`);
  if (q.utm_source !== 'line' || q.utm_medium !== 'social' || q.openExternalBrowser !== '1') problems.push(`${raw}: wrong source/medium/browser flag`);
  if (!CAMPAIGNS.includes(q.utm_campaign)) problems.push(`${raw}: unknown campaign ${q.utm_campaign}`);
  if (!/^[a-z0-9._-]+$/.test(q.utm_content || '')) problems.push(`${raw}: utm_content must be lowercase [a-z0-9._-]`);
  if (q.utm_campaign === 'line-broadcast') weeks.push(q.utm_content);
}
const wantWeeks = Array.from({ length: 8 }, (_, i) => `week-${String(i + 1).padStart(2, '0')}`);
if (weeks.sort().join() !== wantWeeks.join()) problems.push(`broadcast links must be ${wantWeeks.join(', ')} once each, found ${weeks.join(', ')}`);

// Message length. LINE OA Manager caps a text bubble at 500 characters and
// every fenced block in the guide is pasted as one bubble. JS length counts
// each Thai letter and mark as one, so it is never below LINE's own count.
const LINE_TEXT_MAX = 500;
for (const m of doc.matchAll(/```\n([\s\S]*?)\n```/g)) {
  if (m[1].length > LINE_TEXT_MAX) problems.push(`a message bubble is ${m[1].length} characters, over LINE's ${LINE_TEXT_MAX}: "${m[1].slice(0, 40)}..."`);
}

// Keywords. A Text box whose word no reply listens for sends a message
// nothing answers, the failure the guide warns about; a keyword in two
// replies makes which one answers LINE's choice, not ours.
const keywordOwner = new Map();
// A list can wrap onto several lines; it ends at the blank line after it.
for (const m of doc.matchAll(/^Keywords:([\s\S]*?)\n\n/gm)) {
  for (const k of m[1].matchAll(/`([^`]+)`/g)) {
    if (keywordOwner.has(k[1])) problems.push(`keyword \`${k[1]}\` is in two replies`);
    keywordOwner.set(k[1], m.index);
  }
}

// Tap-area tables, one per layout, each checked inside its own section.
for (const layout of LAYOUTS) {
  const start = doc.indexOf(layout.heading);
  const end = doc.indexOf('\n#', start + layout.heading.length);
  const section = start < 0 ? '' : doc.slice(start, end < 0 ? undefined : end);
  if (!section) problems.push(`${layout.file}: no "${layout.heading}" section in the guide`);
  for (const x of boxes(layout.tiles)) {
    const t = TILES[x.id];
    const action = t.text ? `Text | \`${t.text}\` |` : 'Link |';
    const row = `| ${x.letter} | ${t.th} (${t.en}) | ${x.x}–${x.x + x.w} | ${x.y}–${x.y + x.h} | ${action}`;
    if (section && !section.includes(row)) problems.push(`${layout.file}: tap-area row missing or wrong: ${row}`);
  }
}
for (const [id, t] of Object.entries(TILES)) {
  if (t.url && !doc.includes(t.url)) problems.push(`box ${id}: its link is not in the guide: ${t.url}`);
  if (t.text && !keywordOwner.has(t.text)) problems.push(`box ${id}: no auto-reply has the keyword \`${t.text}\` its Text action sends`);
}

// Facts. Stricter than pairing numbers with "free": real phrasings put words
// in between ("ลองใช้ฟรีก่อนได้ 15 นาที", "free for 15 minutes") and a pairing
// regex silently misses them. The guide counts no other money, minutes or
// days, so every amount must be a price, every minute count the trial and
// every day count a pass length. A future tip that needs one ("5 minutes a
// day") should fail here and be looked at, not slip through.
const amounts = new Set([...Object.values(PRICING).map((p) => p.thb), SPONSOR_ADDON_THB]);
const passes = new Set(Object.values(PRICING).map((p) => `${p.thb}/${p.days}`));
const passDays = new Set(Object.values(PRICING).map((p) => p.days));
for (const m of doc.matchAll(/฿\s?(\d[\d,]*)|(\d[\d,]*)\s*(?:บาท|baht|THB)/gi)) {
  if (!amounts.has(Number((m[1] || m[2]).replace(/,/g, '')))) problems.push(`"${m[0]}" is not a price in facts.js`);
}
for (const m of doc.matchAll(/฿(\d+)\s*(?:ใช้ได้|for)\s*(\d+)\s*(?:วัน|days)/g)) {
  if (!passes.has(`${m[1]}/${m[2]}`)) problems.push(`"${m[0]}" is not a pass in facts.js`);
}
for (const m of doc.matchAll(/(\d+)\s*-?\s*(?:นาที|min(?:ute)?s?\b)/gi)) {
  if (Number(m[1]) !== TRIAL.minutes) problems.push(`"${m[0]}": the trial is ${TRIAL.minutes} minutes`);
}
for (const m of doc.matchAll(/(\d+)\s*-?\s*(?:วัน|days?\b)/gi)) {
  if (!passDays.has(Number(m[1]))) problems.push(`"${m[0]}": passes are ${[...passDays].join(' or ')} days`);
}

if (problems.length) {
  console.error('Nothing written:\n' + problems.map((p) => '  - ' + p).join('\n'));
  process.exit(1);
}
for (const [file, png] of images) {
  fs.writeFileSync(path.join(here, file), png);
  console.log('wrote', path.relative(root, path.join(here, file)), `${Math.round(png.length / 1024)} KB`);
}
console.log(`LINE-OA-SETUP.md agrees with the images, App.jsx and facts.js (${urls.length} links checked)`);
