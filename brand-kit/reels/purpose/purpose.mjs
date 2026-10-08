// "Build for one another": a 9:16 values reel for learnwithlexis.com and
// socials (1080x1920, 30fps, ~30s), one per language. Asked for by the owner on
// 8 Oct 2026: giving back in this digital renaissance, build for each other,
// purpose over profit, chances for all, and the gift of communication.
//
// Usage: node purpose.mjs [en|th ...]      (default: both)
//        PREVIEW=2,9,20 node purpose.mjs en   renders stills of those seconds
//
// What it deliberately does NOT say, because copy here is a factual claim:
// - No donation, pledge or "x% goes to" line. LEXIS has no giving programme,
//   so "giving back" is stated as a value, never as something we do with money.
// - Nothing implies a human is speaking. LEXIS appears as herself (the hero
//   clip) and is called a virtual conversation partner.
// - The only offer is the free trial, read from facts.js, so it can't drift
//   from the site. No pass price: a values reel that ends on ฿ undercuts itself.
//
// Brand: navy canvas, Fraunces / IBM Plex Sans Thai from frontend/public/fonts
// (the site's own files, not Google's), teal accent, amber only on the one
// call to action, as brand-kit/README.md §2 reserves it.
//
// Rendering is the same frame-by-frame method as brand-kit/future/hiring/
// video.mjs: render(t) sets every element for time t, the hero <video> is
// seeked to the matching frame, each frame is screenshotted, ffmpeg encodes.
// Only the hero clip's first 8.3s is used: HeroVideo.jsx records a hard cut
// between two renders at 8.30s. Her voice is the only audio; the rest is
// silent so a music track can be added in the app.
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../../..');
const require = createRequire(join(repo, 'frontend/package.json'));
const { chromium } = require('playwright-core');
const { TRIAL } = await import(pathToFileURL(join(repo, 'frontend/src/content/facts.js')).href);

const url = (p) => pathToFileURL(join(repo, p)).href;
const clip = join(repo, 'frontend/public/marketing/lexis-intro-hero.webm');
const CLIP_END = 8.3;
const CLIP_AT = 16.0; // her scene: she introduces herself after the manifesto
const FPS = 30;
const DUR = 30;

const T = {
  en: {
    s1a: 'We are living through',
    s1b: 'a digital renaissance.',
    s1c: 'Everyone is building something.',
    s2a: 'So build for',
    s2b: 'one another.',
    s2c: 'If it doesn’t help someone, why build it?',
    s3: 'Purpose<br>over profit.',
    s4a: 'Chances',
    s4b: 'for all.',
    s4c: 'Wherever you start. Whatever you earn.',
    s5: 'The gift of language',
    caps: [[0, 1.6, "Hi, I'm LEXIS."], [2.65, 4.7, "I'm your voice conversation partner"], [5.65, 8.2, 'for practicing spoken English and Thai.']],
    s5c: 'Being understood opens every door.',
    s6a: 'Giving back<br>is priceless.',
    s6b: 'So is being understood.',
    cta: `Try LEXIS free for ${TRIAL.minutes} minutes`,
    nocard: TRIAL.cardRequired ? '' : 'No card needed',
    site: 'learnwithlexis.com',
    lockup: 'brand-kit/wordmark/lexis-lockup-stacked-dark.png',
  },
  th: {
    s1a: 'เรากำลังอยู่ใน',
    s1b: 'ยุคฟื้นฟูแห่งดิจิทัล',
    s1c: 'ทุกคนกำลังสร้างอะไรบางอย่าง',
    s2a: 'จงสร้าง',
    s2b: 'เพื่อกันและกัน',
    s2c: 'ถ้าไม่ได้ช่วยใครเลย แล้วจะสร้างไปทำไม',
    s3: 'คุณค่า<br>เหนือกำไร',
    s4a: 'โอกาส',
    s4b: 'สำหรับทุกคน',
    s4c: 'ไม่ว่าคุณจะเริ่มจากตรงไหน หรือมีรายได้เท่าไร',
    s5: 'ภาษาคือของขวัญ',
    caps: [[0, 1.6, 'สวัสดีค่ะ ฉันชื่อ LEXIS'], [2.65, 4.7, 'ฉันคือคู่สนทนาด้วยเสียงของคุณ'], [5.65, 8.2, 'สำหรับฝึกพูดภาษาอังกฤษและภาษาไทย']],
    s5c: 'การสื่อสารได้ เปิดทุกประตู',
    s6a: 'การให้คืนสู่สังคม<br>มีค่าเกินประเมิน',
    s6b: 'เช่นเดียวกับ<br>การที่มีคนเข้าใจเรา',
    cta: `ลองคุยกับ LEXIS ฟรี ${TRIAL.minutes} นาที`,
    nocard: TRIAL.cardRequired ? '' : 'ไม่ต้องผูกบัตร',
    site: 'learnwithlexis.com',
    // The Thai lockup is drawn for light backgrounds; on navy only the
    // dark-background lockup reads.
    lockup: 'brand-kit/wordmark/lexis-lockup-stacked-dark.png',
  },
};

const css = `
@font-face{font-family:Fraunces;src:url(${url('frontend/public/fonts/fraunces-600-var.woff2')}) format('woff2');font-weight:600}
@font-face{font-family:Plex;src:url(${url('frontend/public/fonts/ibm-plex-sans-thai-400.woff2')}) format('woff2');font-weight:400}
@font-face{font-family:Plex;src:url(${url('frontend/public/fonts/ibm-plex-sans-thai-600.woff2')}) format('woff2');font-weight:600}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:#050B14}
body{font-family:Plex,system-ui,sans-serif;color:#FAFAF7;position:relative}
#bg{position:absolute;inset:-200px;background:radial-gradient(800px 800px at 85% 10%,rgba(13,148,136,.32),transparent 70%),radial-gradient(900px 900px at 10% 95%,rgba(13,148,136,.18),transparent 70%)}
.sc{position:absolute;inset:0;padding:160px 90px;display:flex;flex-direction:column;justify-content:center;opacity:0}
.a{opacity:0}
.k{font-size:58px;line-height:1.35;color:#cbd5e1}
.d{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:132px;line-height:1.04;color:#FAFAF7}
.th .d{font-family:Plex,sans-serif;font-size:112px;line-height:1.3}
.t{color:#2dd4bf}
.p{font-size:48px;line-height:1.5;color:#cbd5e1;margin-top:54px}
.huge{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:190px;line-height:1;color:#FAFAF7}
.th .huge{font-family:Plex,sans-serif;font-size:160px;line-height:1.25}
.rule{width:140px;height:8px;border-radius:4px;background:#0D9488;margin:0 0 60px}
.card{position:relative;width:660px;height:886px;border-radius:64px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 3px rgba(45,212,191,.45);align-self:center;flex:none}
.card video{width:100%;height:100%;object-fit:cover}
.cap{position:absolute;left:5%;right:5%;bottom:6%;text-align:center}
.cap span{display:inline-block;background:rgba(5,11,20,.82);color:#fff;font-size:40px;font-weight:600;line-height:1.35;padding:12px 24px;border-radius:16px}
.cta{display:inline-block;white-space:nowrap;background:#FF9E00;color:#050B14;border-radius:999px;padding:30px 60px;font-size:46px;font-weight:600}
.nocard{font-size:36px;color:#cbd5e1;margin-top:22px}
.site{font-size:46px;color:#2dd4bf;margin-top:34px;font-weight:600;letter-spacing:.02em}
.lock{width:560px;margin-bottom:40px}
#prog{position:absolute;left:0;bottom:0;height:10px;background:#0D9488}
`;

function html(t, lang) {
  return `<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head>
<body class=${lang}><div id=bg></div>

<section class=sc data-s=0 data-e=4.6>
  <div class=rule></div>
  <div class="k a" data-d=.1>${t.s1a}</div>
  <div class="d a" data-d=.4 style="margin-top:20px">${t.s1b.replace(/(digital|ดิจิทัล)/, '<span class=t>$1</span>')}</div>
  <div class="p a" data-d=1.6>${t.s1c}</div>
</section>

<section class=sc data-s=4.4 data-e=8.8>
  <div class="k a" data-d=0>${t.s2a}</div>
  <div class="d a" data-d=.3 style="margin-top:20px"><span class=t>${t.s2b}</span></div>
  <div class="p a" data-d=1.5 style="color:#FAFAF7">${t.s2c}</div>
</section>

<section class=sc data-s=8.6 data-e=12.4>
  <div class=rule></div>
  <div class="huge a" data-d=.1>${t.s3}</div>
</section>

<section class=sc data-s=12.2 data-e=16.2>
  <div class="huge a" data-d=0>${t.s4a}</div>
  <div class="huge a t" data-d=.35>${t.s4b}</div>
  <div class="p a" data-d=1.2>${t.s4c}</div>
</section>

<section class=sc data-s=${CLIP_AT - 0.3} data-e=${CLIP_AT + CLIP_END + 0.5} style="align-items:center;text-align:center;justify-content:flex-start;padding-top:150px">
  <div class="d a" data-d=0 style="font-size:${lang === 'th' ? 96 : 104}px">${t.s5}</div>
  <div class="card a" data-d=.2 style="margin-top:70px"><video id=v src="${pathToFileURL(clip)}" muted playsinline preload=auto></video><div class=cap id=cap><span></span></div></div>
  <div class="p a" data-d=1.0 style="color:#FAFAF7;margin-top:46px">${t.s5c}</div>
</section>

<section class=sc data-s=${CLIP_AT + CLIP_END + 0.3} data-e=${DUR + 1} style="align-items:center;text-align:center">
  <div class="d a" data-d=0 style="font-size:${lang === 'th' ? 76 : 100}px">${t.s6a}</div>
  <div class="d a t" data-d=.5 style="font-size:${lang === 'th' ? 76 : 100}px;margin-top:24px">${t.s6b}</div>
  <img class="lock a" data-d=1.3 src="${url(t.lockup)}" style="margin-top:80px">
  <div class=a data-d=1.6><span class=cta>${t.cta}</span></div>
  <div class="nocard a" data-d=1.7>${t.nocard}</div>
  <div class="site a" data-d=1.8>${t.site}</div>
</section>

<div id=prog></div>
<script>
const caps = ${JSON.stringify(t.caps)}, CLIP_AT = ${CLIP_AT}, DUR = ${DUR};
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
window.render = (t) => {
  for (const s of document.querySelectorAll('.sc')) {
    const a = +s.dataset.s, e = +s.dataset.e, l = t - a;
    s.style.opacity = t < a || t > e ? 0 : Math.min(ease(l / 0.35), ease((e - t) / 0.3));
    for (const el of s.querySelectorAll('.a')) {
      const p = ease((l - +el.dataset.d) / 0.6);
      el.style.opacity = p;
      el.style.transform = 'translateY(' + ((1 - p) * 46) + 'px)';
    }
  }
  const c = t - CLIP_AT, cue = caps.find(([x, y]) => c >= x && c <= y);
  const cap = document.querySelector('#cap span');
  cap.textContent = cue ? cue[2] : '';
  cap.style.display = cue ? '' : 'none';
  document.getElementById('prog').style.width = (100 * t / DUR) + '%';
};
window.seek = (t) => new Promise((res) => {
  const v = document.getElementById('v');
  const want = Math.min(${CLIP_END}, Math.max(0, t - CLIP_AT));
  if (Math.abs(v.currentTime - want) < 0.001) return res();
  v.addEventListener('seeked', () => res(), { once: true });
  v.currentTime = want;
});
</script></body></html>`;
}

const langs = process.argv.slice(2).length ? process.argv.slice(2) : ['en', 'th'];
const tmp = join(here, '.frames');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
for (const lang of langs) {
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp);
  const file = join(tmp, 'reel.html');
  writeFileSync(file, html(T[lang], lang));
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForFunction(() => document.getElementById('v').readyState >= 2);
  const times = process.env.PREVIEW ? process.env.PREVIEW.split(',').map(Number) : null;
  if (times) {
    for (const t of times) {
      await pg.evaluate(async (t) => { await window.seek(t); window.render(t); }, t);
      await pg.screenshot({ path: join(here, `.preview-${lang}-${t}.png`) });
    }
    await pg.close();
    continue;
  }
  const n = Math.round(DUR * FPS);
  for (let i = 0; i < n; i++) {
    const t = i / FPS;
    await pg.evaluate(async (t) => { await window.seek(t); window.render(t); }, t);
    await pg.screenshot({ path: join(tmp, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
    if (i % 150 === 0) console.log(lang, `${i}/${n}`);
  }
  await pg.close();
  const out = join(here, `lexis-purpose-${lang}.mp4`);
  // Her voice from the hero clip, delayed to CLIP_AT and cut at CLIP_END
  // with a short fade so the cut lands on silence.
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error',
    '-framerate', String(FPS), '-i', join(tmp, 'f%05d.jpg'),
    '-i', join(repo, 'frontend/public/marketing/lexis-intro-hero.mp4'),
    '-filter_complex', `[1:a]atrim=0:${CLIP_END},afade=t=out:st=${CLIP_END - 0.25}:d=0.25,adelay=${CLIP_AT * 1000}|${CLIP_AT * 1000},apad[a]`,
    '-map', '0:v', '-map', '[a]', '-t', String(DUR),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart',
    '-c:a', 'aac', '-b:a', '128k', out]);
  console.log('wrote', out);
}
rmSync(tmp, { recursive: true, force: true });
await browser.close();
