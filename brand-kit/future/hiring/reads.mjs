// "LEXIS reads the ad": a 9:16 video (1080x1920, 30fps) where LEXIS presents
// the Digital Renaissance hiring ad, lip-synced, with word-timed captions and
// the key facts on cards that change as she says them.
//
// Usage: node reads.mjs <fonts.css with data: URIs> [lang=en]
//
// Inputs, per language, in reads/:
//   vo-<lang>.mp3          ElevenLabs eleven_v4 read (EN: "Sarah – Warm &
//                          Conversational", the voice of the earlier LEXIS
//                          reels; 8 Oct 2026, flow iFV7JgAjgmtNjBZgo5Zh)
//   vo-<lang>-v2.mp3       the same read with "You'd refer me," cut out
//                          (10.13-11.24s): the owner made the role Digital
//                          Renaissance only, so she no longer asks anyone to
//                          sell her. Cut inside the pauses, 40ms crossfade.
//   vo-<lang>-v3.mp3       v2 with "It's commission only, and nothing is
//                          guaranteed." (28.64-31.68s) replaced by
//                          line-<lang>-v3.mp3, "You work for yourself, and
//                          earn in your own time." (owner, 8 Oct 2026: the
//                          blunt line read as harsh; working for yourself is
//                          the true description of the role). Same voice and
//                          model, cut in the pauses, 30ms crossfades.
//   words-<lang>-v3.json   eleven_scribe_v1 word timings, shifted to match v3
//   lexis-lipsync-<lang>.webm her real landing-page hero footage (the
//                          continuous 8.4-19.2s take, ping-ponged) lip-synced
//                          to vo-<lang>-v3 with MuseTalk v1 on CPU. Paid
//                          lip-sync (ElevenLabs creatify-aurora, Higgsfield
//                          wan2_7) was out of credits on 8 Oct 2026.
//
// She is the presenter, not the product being sold: the tutor is a separate
// project, and the $5,000 is Digital Renaissance's, so no card puts a LEXIS
// price or LEXIS commission next to it. She says "virtual" in her first
// sentence: nothing here may imply a human is speaking (root CLAUDE.md).
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
const lang = process.argv[3] || 'en';
const b64 = (p) => readFileSync(p).toString('base64');
const logo = `data:image/png;base64,${b64(join(here, '../digital-renaissance-logo.png'))}`;
const face = pathToFileURL(join(here, `reads/lexis-lipsync-${lang}.webm`)).href;
const vo = join(here, `reads/vo-${lang}-v3.mp3`);
const words = JSON.parse(readFileSync(join(here, `reads/words-${lang}-v3.json`), 'utf8')).words
  .filter((w) => w.type === 'word' && !/^\[|\]$/.test(w.text));

const FPS = 30;
const LEAD = 0.6; // silence before she starts, so the first frame isn't mid-word
const voDur = +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vo]).toString();
const DUR = Math.ceil(LEAD + voDur + 2.4);

// Captions: break at the punctuation she pauses on.
const caps = [];
let cur = [];
for (const w of words) {
  cur.push(w);
  if (/[.,]$/.test(w.text) && cur.length >= 2 || /\.$/.test(w.text)) {
    caps.push([cur[0].start + LEAD, cur.at(-1).end + LEAD, cur.map((x) => x.text).join(' ')]);
    cur = [];
  }
}
if (cur.length) caps.push([cur[0].start + LEAD, cur.at(-1).end + LEAD, cur.map((x) => x.text).join(' ')]);

// Loudness per video frame, 0..1, from the real audio: drives the waveform.
const pcm = execFileSync('ffmpeg', ['-v', 'error', '-i', vo, '-ac', '1', '-ar', '12000', '-f', 's16le', '-']);
const per = 12000 / FPS;
const level = [];
for (let f = 0; f * per < pcm.length / 2; f++) {
  let s = 0, n = 0;
  for (let i = Math.floor(f * per); i < Math.min(pcm.length / 2, Math.floor((f + 1) * per)); i++) { const v = pcm.readInt16LE(i * 2) / 32768; s += v * v; n++; }
  level.push(n ? Math.min(1, Math.sqrt(s / n) * 5) : 0);
}

// Fact cards, timed to the words she is saying (seconds into the read).
// Figures are build.mjs's, which cites ../README.md.
const at = (text) => {
  const i = words.findIndex((w) => w.text.replace(/[.,]/g, '').toLowerCase() === text.toLowerCase());
  if (i < 0) throw new Error(`cue word not found: ${text}`);
  return words[i].start + LEAD;
};
const cards = [
  [0, `<div class=lab>Virtual conversation partner</div><div class=h>Hi, I'm LEXIS</div><div class=p>Introducing a role at Digital Renaissance</div>`],
  [at('Digital'), `<div class=lab>Digital Renaissance is hiring</div><div class=h>Partner &amp; Closer</div><div class=p>Thailand · Remote</div>`],
  [at('Email'), `<div class=lab>The job</div><ul><li>Email businesses from <b>worldwide lead lists</b></li><li>Represent Digital Renaissance</li><li>Close premium deals</li></ul>`],
  [at('which'), `<div class=lab>Premium business systems from</div><div class=big>$5,000<small>/month</small></div>`],
  [at('All'), `<div class=lab>How you close</div><div class=h>Email &amp; chat only</div><div class=p>No calls · No meetings</div>`],
  [at('earn'), `<div class=lab>You earn</div><div class=big>30%</div><div class=p>of every month a client pays, for their first 3 months</div>`],
  [at('Just'), `<div class=lab>Two or three clients can change your life</div><div class=rows><div><span>2 clients</span><b>$3,000/mo</b><i>≈ ฿109,500</i></div><div><span>3 clients</span><b>$4,500/mo</b><i>≈ ฿164,250</i></div></div><div class=fine>For each client's first 3 months, at ≈ ฿36.5 per $1</div>`],
  [at('work'), `<div class=lab>How you work</div><div class=h>Your own hours</div><div class=p>You work for yourself, and earn on every client you bring in.</div>`],
  [at('To'), `<div class=lab>How to apply</div><div class=h>Message this page</div><div class=p>3–4 lines about you, and one short message introducing Digital Renaissance to a business owner.</div>`],
  [LEAD + voDur + 0.2, `<div class=quote>“Train people well enough so they can leave. Treat them well enough so they don't want to.”<small>Richard Branson. This is how we work.</small></div>`],
];

const css = `${fontsCss}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:#0b0c10}
body{font-family:Prompt,sans-serif;color:#f4ecd8;position:relative}
#bg{position:absolute;inset:0;background:radial-gradient(900px 700px at 90% 0%,rgba(232,184,74,.26),transparent 70%),radial-gradient(900px 700px at 0% 100%,rgba(56,160,230,.22),transparent 70%),#0b0c10}
#top{position:absolute;left:0;right:0;top:70px;display:flex;justify-content:space-between;align-items:center;padding:0 70px}
#top .live{display:flex;align-items:center;gap:14px;font-size:30px;font-weight:600;color:#fff;background:rgba(255,255,255,.08);border:2px solid rgba(255,255,255,.15);border-radius:999px;padding:10px 26px}
#top .dot{width:16px;height:16px;border-radius:50%;background:#ff5a4f}
#top .time{font-variant-numeric:tabular-nums;color:#c9b98f}
#top img{width:110px;height:110px;mix-blend-mode:screen}
#card{position:absolute;left:150px;top:220px;width:780px;height:960px;border-radius:56px;overflow:hidden;box-shadow:0 40px 120px rgba(0,0,0,.6),0 0 0 3px rgba(232,184,74,.55)}
#card video{width:100%;height:100%;object-fit:cover;object-position:50% 30%;transform-origin:50% 35%}
#card:after{content:"";position:absolute;inset:auto 0 0 0;height:320px;background:linear-gradient(transparent,rgba(0,0,0,.82))}
#name{position:absolute;left:46px;bottom:150px;z-index:2;font-size:44px;font-weight:700;color:#fff}
#name small{display:block;font-size:26px;font-weight:500;color:#e9e1cc;margin-top:2px}
#wave{position:absolute;left:46px;right:46px;bottom:52px;height:80px;z-index:2;display:flex;align-items:center;gap:7px}
#wave i{flex:1;background:#e8b84a;border-radius:6px;min-height:6px}
#cap{position:absolute;left:70px;right:70px;top:1215px;text-align:center;min-height:120px}
#cap span{display:inline-block;background:#fff;color:#0b0c10;font-size:46px;font-weight:600;line-height:1.35;padding:12px 28px;border-radius:18px}
.fact{position:absolute;left:70px;right:70px;top:1395px;opacity:0}
.lab{font-size:30px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#5fb8f0;margin-bottom:10px}
.h{font-family:Fraunces,Prompt,serif;font-weight:600;font-size:86px;color:#e8b84a;line-height:1.05}
.p{font-size:36px;line-height:1.45;color:#e9e1cc;margin-top:12px}
.big{font-family:Fraunces,serif;font-weight:600;font-size:170px;color:#e8b84a;line-height:1}
.big small{font-family:Prompt,sans-serif;font-size:52px;color:#c9b98f;font-weight:500}
ul{list-style:none}li{font-size:40px;line-height:1.4;padding:8px 0 8px 44px;position:relative}li b{color:#e8b84a}
li:before{content:"";position:absolute;left:4px;top:26px;width:20px;height:20px;border-radius:50%;background:#e8b84a}
.rows div{display:flex;align-items:baseline;gap:26px;border-top:2px solid rgba(232,184,74,.3);padding:14px 0}
.rows span{font-size:36px;width:200px}.rows b{font-family:Fraunces,serif;font-size:76px;color:#e8b84a;font-weight:600}.rows i{font-style:normal;font-size:36px;font-weight:600;color:#fff}
.fine{font-size:26px;color:#c9b98f;margin-top:10px}
.quote{border-left:6px solid #e8b84a;padding-left:34px;font-size:44px;line-height:1.45;color:#fff;font-weight:500}
.quote small{display:block;font-size:28px;color:#c9b98f;margin-top:14px}
#prog{position:absolute;left:0;bottom:0;height:10px;background:#e8b84a}
`;

const html = `<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head><body><div id=bg></div>
<div id=top><div class=live><span class=dot></span>LEXIS <span class=time id=clock>0:00</span></div><img src="${logo}"></div>
<div id=card><video id=face src="${face}" muted playsinline preload=auto></video><div id=name>LEXIS<small>Virtual conversation partner</small></div><div id=wave>${'<i></i>'.repeat(36)}</div></div>
<div id=cap><span></span></div>
${cards.map(([t, h], i) => `<div class=fact data-t=${t} data-e=${cards[i + 1] ? cards[i + 1][0] : DUR + 1}>${h}</div>`).join('')}
<div id=prog></div>
<script>
const caps = ${JSON.stringify(caps)}, level = ${JSON.stringify(level.map((x) => +x.toFixed(3)))}, LEAD = ${LEAD}, DUR = ${DUR}, FPS = ${FPS};
const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
const bars = [...document.querySelectorAll('#wave i')];
window.render = (t) => {
  document.getElementById('face').style.transform = 'scale(' + (1 + 0.04 * t / DUR) + ')';
  const f = Math.round((t - LEAD) * FPS), lv = f >= 0 && f < level.length ? level[f] : 0;
  bars.forEach((b, i) => {
    // a fixed per-bar shape times the live loudness, so it moves with her voice
    const shape = 0.35 + 0.65 * Math.abs(Math.sin(i * 1.7 + f * 0.35 + Math.sin(i)));
    b.style.height = Math.max(6, 80 * lv * shape) + 'px';
    b.style.opacity = 0.45 + 0.55 * Math.min(1, lv * 1.5);
  });
  const s = Math.floor(t); document.getElementById('clock').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  const c = caps.find(([a, e]) => t >= a - 0.05 && t <= e + 0.25), cap = document.querySelector('#cap span');
  cap.textContent = c ? c[2] : ''; cap.style.display = c ? '' : 'none';
  for (const el of document.querySelectorAll('.fact')) {
    const a = +el.dataset.t, e = +el.dataset.e;
    const o = t < a || t > e ? 0 : Math.min(ease((t - a) / 0.35), ease((e - t) / 0.25));
    el.style.opacity = o; el.style.transform = 'translateY(' + (1 - ease((t - a) / 0.45)) * 40 + 'px)';
  }
  document.getElementById('prog').style.width = (100 * t / DUR) + '%';
};
window.seek = (t) => new Promise((res) => {
  const v = document.getElementById('face');
  const want = Math.min(v.duration - 0.02, Math.max(0, t - LEAD));
  if (Math.abs(v.currentTime - want) < 0.001) return res();
  v.addEventListener('seeked', () => res(), { once: true });
  v.currentTime = want;
});
</script></body></html>`;

const tmp = join(here, '.frames');
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp);
writeFileSync(join(tmp, 'ad.html'), html);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await pg.goto(pathToFileURL(join(tmp, 'ad.html')).href, { waitUntil: 'load' });
await pg.evaluate(() => document.fonts.ready);
await pg.waitForFunction(() => document.getElementById('face').readyState >= 2);
const times = process.env.PREVIEW ? process.env.PREVIEW.split(',').map(Number) : null;
if (times) {
  for (const t of times) { await pg.evaluate(async (t) => { await window.seek(t); window.render(t); }, t); await pg.screenshot({ path: join(here, `.preview-reads-${lang}-${t}.png`) }); }
} else {
  const n = DUR * FPS;
  for (let i = 0; i < n; i++) {
    await pg.evaluate(async (t) => { await window.seek(t); window.render(t); }, i / FPS);
    await pg.screenshot({ path: join(tmp, `f${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 });
    if (i % 300 === 0) console.log(`${i}/${n}`);
  }
  const out = join(here, `hiring-lexis-reads-${lang}.mp4`);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', join(tmp, 'f%05d.jpg'), '-i', vo,
    '-filter_complex', `[1:a]adelay=${LEAD * 1000}|${LEAD * 1000},apad[a]`, '-map', '0:v', '-map', '[a]', '-t', String(DUR),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'medium', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', out]);
  console.log('wrote', out);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
