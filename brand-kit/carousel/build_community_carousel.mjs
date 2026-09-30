// LEXIS Community carousel, 5 slides × EN/TH at 1080×1350 (Instagram/Facebook
// feed, 4:5). Run from anywhere: node brand-kit/carousel/build_community_carousel.mjs
// playwright-core is borrowed from frontend/node_modules (ESM resolves bare
// imports from this file's folder, which has none), hence createRequire.
//
// Every claim is the Community page's own (CommunityPage.jsx): an optional
// ฿50 at checkout, part of one payment, nothing recurring, into one shared
// pool meant to fund free/discounted access through partner schools and
// youth groups. Slide 4 carries the page's own honesty line, that the pool
// hasn't funded a cohort yet. A carousel that implied students had already
// been helped would be the one claim here we couldn't back.
//
// The ฿ amount is read from facts.js, not typed, so the carousel can't drift
// from the checkout the way the old "฿199/week" bios did.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { SPONSOR_ADDON_THB } from '../../frontend/src/content/facts.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const { chromium } = createRequire(path.join(root, 'frontend/package.json'))('playwright-core');
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'frontend/public/fonts', f)).toString('base64');
const logo = fs.readFileSync(path.join(root, 'brand-kit/logo/lexis-mark.svg'), 'utf8');
const B = SPONSOR_ADDON_THB;

// Thai headings carry explicit <br>: Thai has no spaces between words, so
// the browser can only break where a phrase happens to have one, which split
// "เปิด / ประตู" mid-idea on the first render.
const SLIDES = {
  en: [
    { k: 'LEXIS Community', h: 'Your practice can open someone else’s door', s: 'Swipe →' },
    { k: 'How it works', h: `Add ฿${B} when you buy a pass`, s: 'One optional tap. Part of the same single payment. Nothing recurring, ever.' },
    { k: 'Where it goes', h: 'Every baht goes into one shared pool', s: 'To help fund free and discounted speaking practice for students through partner schools and youth groups.' },
    { k: 'Honestly', h: 'We’re just getting started', s: 'The pool hasn’t funded its first cohort yet. We’ll post every update as we get closer.' },
    { k: 'Run a school or youth group?', h: 'Be one of our first partners', s: 'learnwithlexis.com/community' },
  ],
  th: [
    { k: 'LEXIS Community', h: 'การฝึกของคุณ<br>เปิดประตูให้คนอื่นได้', s: 'ปัดดูต่อ →' },
    { k: 'ทำงานอย่างไร', h: `เพิ่ม ฿${B}<br>ตอนซื้อแพ็กเกจ`, s: 'แตะเลือกครั้งเดียว รวมอยู่ในการจ่ายครั้งเดียวกัน ไม่มีการเรียกเก็บซ้ำ' },
    { k: 'เงินไปไหน', h: 'ทุกบาท<br>เข้ากองทุนเดียวกัน', s: 'เพื่อช่วยให้นักเรียนได้ฝึกพูดฟรีหรือลดราคา ผ่านโรงเรียนและกลุ่มเยาวชนพันธมิตร' },
    { k: 'พูดตรง ๆ', h: 'เราเพิ่งเริ่มต้น', s: 'กองทุนยังไม่ถึงเป้าสนับสนุนรุ่นแรก เราจะอัปเดตทุกความคืบหน้า' },
    { k: 'ดูแลโรงเรียนหรือกลุ่มเยาวชน?', h: 'มาเป็นพันธมิตร<br>กลุ่มแรกกับเรา', s: 'learnwithlexis.com/th/community' },
  ],
};

const html = (sl, i, n, lang) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Plex;font-weight:400;src:url(${font('ibm-plex-sans-thai-400.woff2')})}
@font-face{font-family:Plex;font-weight:600;src:url(${font('ibm-plex-sans-thai-600.woff2')})}
@font-face{font-family:Fraunces;font-weight:600;src:url(${font('fraunces-600-var.woff2')})}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:Plex,sans-serif;color:#fff;overflow:hidden;
  background:radial-gradient(900px 700px at 85% 10%,rgba(255,178,58,.28),transparent 60%),
             radial-gradient(800px 700px at 0% 100%,rgba(20,184,166,.25),transparent 60%),#050B14;
  padding:110px 96px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:22px;font-weight:600;font-size:34px;letter-spacing:.02em}
.top svg{width:76px;height:76px}
.k{margin-top:auto;font-weight:600;font-size:34px;color:#FFB23A;letter-spacing:.03em}
h1{margin-top:26px;font-family:${lang === 'en' ? 'Fraunces,' : ''}Plex,serif;font-weight:600;
  font-size:${lang === 'en' ? 96 : 92}px;line-height:${lang === 'en' ? 1.06 : 1.3};text-wrap:balance}
.s{margin-top:40px;font-size:40px;line-height:1.5;color:rgba(255,255,255,.82);max-width:860px}
.s.url{color:#FFB23A;font-weight:600}
.dots{margin-top:auto;display:flex;gap:14px}
.dots i{width:14px;height:14px;border-radius:7px;background:rgba(255,255,255,.28)}
.dots i.on{width:44px;background:linear-gradient(90deg,#FFB23A,#FF6A1A)}
</style></head><body>
<div class="top">${logo}<span>LEXIS</span></div>
<div class="k">${sl.k}</div>
<h1>${sl.h}</h1>
<div class="s${sl.s.startsWith('learnwithlexis') ? ' url' : ''}">${sl.s}</div>
<div class="dots">${Array.from({ length: n }, (_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>
</body></html>`;

const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
for (const [lang, slides] of Object.entries(SLIDES)) {
  const out = path.join(here, 'community', lang);
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < slides.length; i++) {
    await pg.setContent(html(slides[i], i, slides.length, lang), { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    const overflow = await pg.evaluate(() => document.body.scrollHeight > 1350 || document.body.scrollWidth > 1080);
    if (overflow) throw new Error(`${lang} slide ${i + 1} overflows the frame`);
    await pg.screenshot({ path: path.join(out, `0${i + 1}.png`) });
  }
  console.log('wrote', out);
}
await b.close();
