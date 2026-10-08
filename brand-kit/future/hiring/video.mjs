// Builds the hiring ad as a 9:16 video (1080x1920, 30fps, ~33s), one per
// language, for Reels / TikTok / Stories. LEXIS presents it: the landing
// page's real hero clip (LEXIS introducing herself) plays inside a phone
// showing the real landing page, with her own audio and burned-in captions.
// She is the presenter only. The role is Digital Renaissance's, and the hire
// does not sell LEXIS: the owner confirmed on 8 Oct 2026 that the tutor is a
// separate project, so no LEXIS price or LEXIS commission appears here and the
// $5,000 never sits on a LEXIS scene.
//
// Usage: node video.mjs <fonts.css with data: URIs>   (same fonts as build.mjs)
//
// Rendering is frame-by-frame, not a screen recording: render(t) sets every
// element's state for time t, the hero <video> is seeked to the matching
// frame, and each frame is screenshotted, then ffmpeg encodes them with the
// clip's audio laid in at the right offset. A recording would drop frames
// under load; this can't.
//
// Only the first 8.3s of the hero clip is used ("Hi, I'm LEXIS ... English
// and Thai."): HeroVideo.jsx records a hard cut between two renders at
// 8.30s, and stopping there keeps that jump out of the ad. Captions are the
// clip's own .vtt cues, so what she says on screen matches what she says.
//
// The page screenshots (lexis-site-*.png) are the landing page at 390x844
// @3x from origin/main, captured 8 Oct 2026. Re-shoot them if the hero
// changes, or the phone will show a page that no longer exists.
import { readFileSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const repo = join(here, '../../..');
const require = createRequire(join(repo, 'frontend/package.json'));
const { chromium } = require('playwright-core');

const fontsCss = readFileSync(process.argv[2], 'utf8');
const b64 = (p) => readFileSync(p).toString('base64');
const logo = `data:image/png;base64,${b64(join(here, '../digital-renaissance-logo.png'))}`;
// webm, not mp4: open-source Chromium has no H.264 decoder.
const clip = join(repo, 'frontend/public/marketing/lexis-intro-hero.webm');
const CLIP_END = 8.3;
const CLIP_AT = 3.0; // when LEXIS starts talking in the ad

const FPS = 30;
const DUR = 33;

// Same figures as build.mjs, which cites their source (../README.md).
const T = {
  en: {
    hiring: "We're hiring",
    title: 'Partner &amp; Closer',
    sub: 'Thailand · Remote · Commission only',
    hook: 'Represent premium business systems to clients worldwide. Get paid well for it.',
    p1: 'Your guide',
    lexisH: 'Meet LEXIS',
    lexisP: 'A virtual conversation partner, here to introduce the role.',
    lexisPrice: '',
    lexisCut: '<b>Digital Renaissance</b> is hiring',
    caps: [[0, 1.6, "Hi, I'm LEXIS."], [2.65, 4.7, "I'm your voice conversation partner"], [5.65, 8.2, 'for practicing spoken English and Thai.']],
    p2: 'The role',
    drH: 'Close Digital Renaissance deals',
    drPrice: '$5,000<small>/month</small>',
    drP: 'Premium online systems that help businesses grow, closed by <b>email and chat only</b>. No calls. No meetings.',
    drCut: 'You earn <b>30%</b> of every month a client pays, for their first 3 months',
    lifeH: 'Two or three clients<br>can change your life',
    rows: [['1 client', 1500, 54750], ['2 clients', 3000, 109500], ['3 clients', 4500, 164250]],
    perMonth: '/month',
    lifeFine: 'Digital Renaissance commission, at ≈ ฿36.5 per $1. Not a guarantee: you earn only when clients sign and pay.',
    giveH: 'We give you',
    give: ['Lead lists of businesses worldwide', 'Approved email templates', 'A step-by-step manual and training', 'Direct access to the founder'],
    honest: 'Commission only. No base salary.',
    applyH: 'How to apply',
    apply: 'Send us a message on this page with 3–4 lines about you, and one short message introducing Digital Renaissance to a business owner.',
    quote: '“Train people well enough so they can leave. Treat them well enough so they don\'t want to.”',
    by: 'Richard Branson. This is how we work.',
  },
  th: {
    hiring: 'เรากำลังรับสมัคร',
    title: 'พาร์ตเนอร์ &amp;<br>นักปิดการขาย',
    sub: 'ประเทศไทย · ทำงานจากที่ไหนก็ได้ · รายได้จากค่าคอมมิชชัน',
    hook: 'เป็นตัวแทนระบบธุรกิจระดับพรีเมียมสู่ลูกค้าทั่วโลก พร้อมรายได้ที่คุ้มค่า',
    p1: 'ผู้แนะนำ',
    lexisH: 'พบกับ LEXIS',
    lexisP: 'คู่สนทนาเสมือน ที่จะพาคุณรู้จักตำแหน่งงานนี้',
    lexisPrice: '',
    lexisCut: '<b>Digital Renaissance</b> กำลังรับสมัคร',
    caps: [[0, 1.6, 'สวัสดีค่ะ ฉันชื่อ LEXIS'], [2.65, 4.7, 'ฉันคือคู่สนทนาด้วยเสียงของคุณ'], [5.65, 8.2, 'สำหรับฝึกพูดภาษาอังกฤษและภาษาไทย']],
    p2: 'ตำแหน่งงาน',
    drH: 'ปิดการขายให้ Digital Renaissance',
    drPrice: '$5,000<small>/เดือน</small>',
    drP: 'ระบบออนไลน์ระดับพรีเมียมที่ช่วยให้ธุรกิจเติบโต ปิดการขายผ่าน<b>อีเมลและแชตเท่านั้น</b> ไม่ต้องโทร ไม่ต้องนัดเจอ',
    drCut: 'คุณได้ <b>30%</b> ของทุกเดือนที่ลูกค้าจ่าย ใน 3 เดือนแรก',
    lifeH: 'ลูกค้าแค่ 2–3 ราย<br>เปลี่ยนชีวิตคุณได้',
    rows: [['ลูกค้า 1 ราย', 1500, 54750], ['ลูกค้า 2 ราย', 3000, 109500], ['ลูกค้า 3 ราย', 4500, 164250]],
    perMonth: '/เดือน',
    lifeFine: 'ค่าคอมมิชชัน Digital Renaissance ที่ประมาณ ฿36.5 ต่อ $1 ไม่ใช่รายได้ที่รับประกัน คุณได้เมื่อลูกค้าเซ็นและจ่ายเงินจริงเท่านั้น',
    giveH: 'สิ่งที่เราให้',
    give: ['รายชื่อธุรกิจเป้าหมายจากทั่วโลก', 'เทมเพลตอีเมลที่อนุมัติแล้ว', 'คู่มือการทำงานและการฝึกอบรม', 'คุยตรงกับผู้ก่อตั้งได้เลย'],
    honest: 'รายได้จากค่าคอมมิชชันล้วน ไม่มีเงินเดือนประจำ',
    applyH: 'วิธีสมัคร',
    apply: 'ส่งข้อความหาเราที่เพจนี้ พร้อมแนะนำตัว 3–4 บรรทัด และข้อความสั้น ๆ 1 ข้อความแนะนำ Digital Renaissance ให้เจ้าของธุรกิจ',
    quote: '“ฝึกคนให้เก่งพอที่จะไปจากเราได้ ดูแลเขาให้ดีพอที่เขาจะไม่อยากไป”',
    by: 'ริชาร์ด แบรนสัน · นี่คือวิธีที่เราทำงาน',
  },
};

const css = `${fontsCss}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:#0b0c10}
body{font-family:Prompt,sans-serif;color:#f4ecd8;position:relative}
#bg{position:absolute;inset:0;background:radial-gradient(900px 700px at 90% 0%,rgba(232,184,74,.28),transparent 70%),radial-gradient(900px 700px at 0% 100%,rgba(56,160,230,.24),transparent 70%),#0b0c10}
.sc{position:absolute;inset:0;padding:150px 84px 120px;display:flex;flex-direction:column;opacity:0}
.a{opacity:0}
.eyebrow{font-size:40px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:#5fb8f0}
.th .eyebrow{letter-spacing:.03em}
h1{font-family:Fraunces,Prompt,serif;font-weight:600;color:#e8b84a;line-height:1.02;font-size:150px}
.th h1{font-family:Prompt,sans-serif;font-weight:700;line-height:1.22;font-size:124px}
h2{font-family:Fraunces,Prompt,serif;font-weight:600;color:#e8b84a;line-height:1.08;font-size:92px}
.th h2{font-family:Prompt,sans-serif;font-weight:700;line-height:1.3;font-size:80px}
.lab{font-size:34px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5fb8f0;margin-bottom:14px}
.th .lab{letter-spacing:.02em}
.big{font-size:44px;line-height:1.5}
.th .big{line-height:1.65}
.chip{display:inline-block;background:#e8b84a;color:#0b0c10;border-radius:22px;padding:18px 30px;font-size:38px;font-weight:600;line-height:1.4}
.chip b{font-weight:700}
.logo{width:190px;height:190px;mix-blend-mode:screen}
/* phone */
.phone{position:relative;width:520px;height:1087px;border-radius:72px;background:#111;padding:16px;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 3px rgba(232,184,74,.5);flex:none}
.screen{position:relative;width:100%;height:100%;border-radius:58px;overflow:hidden;background:#fff}
.screen img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:top}
/* hero card in the 1170x2532 page shot: x 222-947, y 342-1317 */
.screen video{position:absolute;left:18.97%;top:13.51%;width:61.97%;height:38.51%;object-fit:cover;border-radius:7.5% / 5.6%}
.cap{position:absolute;left:4%;right:4%;top:44%;text-align:center;z-index:2}
.cap span{display:inline-block;background:rgba(0,0,0,.8);color:#fff;font-size:27px;font-weight:600;line-height:1.35;padding:8px 16px;border-radius:12px}
.price{font-family:Fraunces,serif;font-weight:600;font-size:200px;color:#e8b84a;line-height:1}
.price small{font-family:Prompt,sans-serif;font-size:60px;color:#c9b98f;font-weight:500}
.row{display:flex;align-items:center;justify-content:space-between;border-top:2px solid rgba(232,184,74,.3);padding:34px 0}
.row .who{font-size:42px;width:250px}
.row .usd{white-space:nowrap;font-family:Fraunces,serif;font-weight:600;font-size:104px;color:#e8b84a;line-height:1}
.row .usd small{font-family:Prompt,sans-serif;font-size:32px;color:#c9b98f}
.row .thb{font-size:40px;color:#fff;font-weight:600;text-align:right;white-space:nowrap}
.fine{font-size:30px;line-height:1.6;color:#c9b98f}
ul{list-style:none}
li{font-size:46px;line-height:1.4;padding:26px 0 26px 66px;position:relative;border-bottom:2px solid rgba(232,184,74,.18)}
li:before{content:"";position:absolute;left:6px;top:48px;width:28px;height:28px;border-radius:50%;background:#e8b84a}
.quote{border-left:6px solid #e8b84a;padding:6px 0 6px 38px;font-size:50px;line-height:1.45;color:#fff;font-weight:500}
.th .quote{font-size:46px;line-height:1.6}
.quote small{display:block;font-size:32px;color:#c9b98f;margin-top:20px;font-weight:400}
.applybox{background:#e8b84a;color:#0b0c10;border-radius:30px;padding:40px 44px;font-size:42px;line-height:1.5;font-weight:500}
.applybox b{display:block;font-size:56px;margin-bottom:10px}
#prog{position:absolute;left:0;bottom:0;height:10px;background:#e8b84a}
`;

// data-s / data-e: scene window in seconds. .a children animate in at data-d
// seconds after the scene starts. .cnt counts up to data-to.
function html(t, lang) {
  const site = `data:image/png;base64,${b64(join(here, `lexis-site-${lang}.png`))}`;
  const fmt = (n) => n.toLocaleString('en-US');
  return `<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head>
<body class=${lang}><div id=bg></div>

<section class=sc data-s=0 data-e=3.2 style="justify-content:center">
  <img class="logo a" data-d=0 src="${logo}">
  <div class="eyebrow a" data-d=.15 style="margin-top:70px">${t.hiring}</div>
  <h1 class=a data-d=.3 style="margin:26px 0 30px">${t.title}</h1>
  <div class="big a" data-d=.5 style="color:#c9b98f">${t.sub}</div>
  <div class="big a" data-d=.8 style="margin-top:60px;color:#fff;font-weight:600">${t.hook}</div>
</section>

<section class=sc data-s=3.0 data-e=${CLIP_AT + CLIP_END + 0.4} style="padding-top:110px;align-items:center;text-align:center">
  <div class="lab a" data-d=0>${t.p1}</div>
  <h2 class=a data-d=.1 style="font-size:${lang === 'th' ? 76 : 88}px">${t.lexisH}</h2>
  <div class="big a" data-d=.25 style="font-size:36px;margin:12px 0 40px;color:#e9e1cc">${t.lexisP}</div>
  <div class="phone a" data-d=.2><div class=screen><img src="${site}"><video id=v src="${pathToFileURL(clip)}" muted playsinline preload=auto></video><div class=cap id=cap><span></span></div></div></div>
  <div class="a" data-d=4.5 style="margin-top:44px"><span class=chip>${t.lexisCut}</span></div>
  <div class="fine a" data-d=4.7 style="margin-top:20px;font-size:32px">${t.lexisPrice}</div>
</section>

<section class=sc data-s=${CLIP_AT + CLIP_END + 0.2} data-e=17.2 style="justify-content:center">
  <div class="lab a" data-d=0>${t.p2}</div>
  <h2 class=a data-d=.1>${t.drH}</h2>
  <div class="price a" data-d=.4 style="margin:60px 0 40px">${t.drPrice}</div>
  <div class="big a" data-d=.7>${t.drP}</div>
  <div class=a data-d=1.3 style="margin-top:60px"><span class=chip>${t.drCut}</span></div>
</section>

<section class=sc data-s=17 data-e=24.2 style="justify-content:center">
  <h2 class=a data-d=0 style="margin-bottom:70px">${t.lifeH}</h2>
  ${t.rows.map(([who, usd, thb], i) => `<div class="row a" data-d=${0.6 + i * 0.5}><span class=who>${who}</span><span class=usd>$<span class=cnt data-to=${usd} data-d=${0.6 + i * 0.5}>0</span><small>${t.perMonth}</small></span><span class=thb>≈ ฿<span class=cnt data-to=${thb} data-d=${0.6 + i * 0.5}>0</span></span></div>`).join('')}
  <div class="fine a" data-d=2.4 style="margin-top:40px">${t.lifeFine}</div>
</section>

<section class=sc data-s=24 data-e=28.2 style="justify-content:center">
  <h2 class=a data-d=0 style="margin-bottom:40px">${t.giveH}</h2>
  <ul>${t.give.map((x, i) => `<li class=a data-d=${0.3 + i * 0.3}>${x}</li>`).join('')}</ul>
  <div class=a data-d=1.8 style="margin-top:60px"><span class=chip style="background:#5fb8f0">${t.honest}</span></div>
</section>

<section class=sc data-s=28 data-e=${DUR + 1} style="justify-content:center">
  <img class="logo a" data-d=0 src="${logo}" style="width:150px;height:150px;margin-bottom:50px">
  <div class="applybox a" data-d=.2><b>${t.applyH}</b>${t.apply}</div>
  <div class="quote a" data-d=1.2 style="margin-top:80px">${t.quote}<small>${t.by}</small></div>
</section>

<div id=prog></div>
<script>
const caps = ${JSON.stringify(t.caps)}, CLIP_AT = ${CLIP_AT}, DUR = ${DUR};
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const fmt = (n) => n.toLocaleString('en-US');
window.render = (t) => {
  for (const s of document.querySelectorAll('.sc')) {
    const a = +s.dataset.s, e = +s.dataset.e, l = t - a;
    const o = Math.min(ease(l / 0.35), ease((e - t) / 0.3));
    s.style.opacity = t < a || t > e ? 0 : o;
    for (const el of s.querySelectorAll('.a')) {
      const p = ease((l - +el.dataset.d) / 0.55);
      el.style.opacity = p;
      el.style.transform = 'translateY(' + ((1 - p) * 50) + 'px)';
    }
    for (const el of s.querySelectorAll('.cnt')) {
      el.textContent = fmt(Math.round(+el.dataset.to * ease((l - +el.dataset.d) / 0.9)));
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

const tmp = join(here, '.frames');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
for (const lang of ['en', 'th']) {
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp);
  const file = join(tmp, 'ad.html');
  writeFileSync(file, html(T[lang], lang));
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pg.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await pg.evaluate(() => document.fonts.ready);
  await pg.waitForFunction(() => document.getElementById('v').readyState >= 2);
  // PREVIEW=1,6.5,... renders just those seconds to stills instead of a video.
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
  const out = join(here, `hiring-video-${lang}.mp4`);
  // Her voice from the hero clip, delayed to CLIP_AT and cut at CLIP_END
  // with a short fade so the cut lands on silence, not mid-breath.
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
