// Builds the "replace Future's role" social ads: one all-in-one image and a
// 5-slide carousel per language, 1080x1350 (4:5, the tallest feed ratio
// Instagram and Facebook show uncropped). Same render path as the PDFs in
// ../README.md: self-contained HTML -> headless Chromium -> PNG.
//
// Usage: node build.mjs <fonts.css with data: URIs>
// Fonts are Prompt (Thai + Latin) and Fraunces from Google Fonts, inlined so
// the HTML renders the same offline. The subset fonts embedded in the older
// PDFs' HTML were cut to the glyphs those docs used, so they can't be reused.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, '../../../frontend/package.json'));
const { chromium } = require('playwright-core');

const fontsCss = readFileSync(process.argv[2], 'utf8');
const logo = 'data:image/png;base64,' + readFileSync(join(here, '../digital-renaissance-logo.png')).toString('base64');

// Every figure here comes from ../README.md "Her terms". This role is
// Digital Renaissance's only: the owner confirmed on 8 Oct 2026 that the LEXIS
// tutor is a separate project, so the hire does not sell LEXIS, and the $5,000
// figure must never sit next to LEXIS where it could read as a LEXIS price.
// DR's systems are described in deliberately general terms (owner: "sound
// impressive without over-the-top details"); nothing here names a client or
// promises a result. DR's 30% x 3 months is the stated starting
// rate. The pay model is stated plainly but in the owner's framing (8 Oct
// 2026): the hire works for themselves and earns per client, in their own
// time. That is the honest description of commission work; the blunter
// "commission only / no base salary / nothing is guaranteed" lines were
// dropped at his request. The earnings table stays labelled as example
// figures so it never reads as a promise.
const T = {
  en: {
    lang: 'en',
    hiring: "We're hiring",
    title: 'Partner &amp; Closer',
    where: 'Thailand · Remote',
    tags: ['Work for yourself', 'Worldwide lead lists', 'Written work only', 'No calls · No meetings'],
    quote: '“Train people well enough so they can leave. Treat them well enough so they don\'t want to.”',
    by: 'Richard Branson. This is how we work.',
    swipe: 'Swipe →',
    jobH: 'The job, in three parts',
    jobs: [
      ['Reach businesses worldwide', 'Lead lists of up to 500 businesses at a time, names filled in for you. Up to 50 emails a day, one follow-up, then stop.'],
      ['Represent Digital Renaissance', 'Premium online systems that help businesses grow, across many areas of how they run. Packages from $5,000/month.'],
      ['Close by message', 'Every deal is closed by email and chat. No calls, no meetings, and you never handle payments yourself.'],
    ],
    payH: 'What you earn',
    payNote: 'You work for yourself, and earn on every client you bring in, in your own time.',
    pay: [
      ['30%', 'of every month a client pays, for their first 3 months'],
      ['$1,500', 'to you per client, per month, on a $5,000 package'],
    ],
    lifeH: 'Two or three clients<br>can change your life',
    lifeLead: 'Our lead lists cover businesses all over the world, so you are not limited to one city or one country. You don\'t need hundreds of sales. You need a few of the right ones.',
    lifeRows: [['1 client', '$1,500', '≈ ฿54,750', '$4,500'], ['2 clients', '$3,000', '≈ ฿109,500', '$9,000'], ['3 clients', '$4,500', '≈ ฿164,250', '$13,500']],
    lifeCols: ['', 'per month', 'in baht', 'over 3 months'],
    lifeFine: 'Example figures: 30% of a $5,000/month package, for each client\'s first 3 months, at about ฿36.5 per $1.',
    lifeShort: 'Lead lists of businesses worldwide. Just 2–3 clients:',
    example: 'Example: one client at $5,000/month = <b>$1,500/month to you for 3 months ($4,500)</b>.',
    payFine: 'Paid monthly by PromptPay, as your clients pay.',
    youH: 'You',
    you: ['Fluent Thai and strong written English', 'Based in Thailand, with a PromptPay account', 'Organised and reliable: you do what you say', 'Honest: no hype, no fake reviews, no promises'],
    weH: 'We give you',
    we: ['Lead lists of businesses worldwide', 'Approved email templates', 'A step-by-step work manual and training', 'Direct access to the founder'],
    applyH: 'How to apply',
    applyLead: 'Send us a message on this page with:',
    apply: ['3–4 lines about you', 'One short message, in English or Thai, introducing Digital Renaissance to a business owner'],
    applyShort: 'a short message introducing Digital Renaissance to a business owner',
    applyWhy: 'Applications by message only. This job is writing, so your application is the first sample.',
    close: 'We\'ll train you well enough to leave,<br>and treat you well enough to stay.',
  },
  th: {
    lang: 'th',
    hiring: 'เรากำลังรับสมัคร',
    title: 'พาร์ตเนอร์ &amp;<br>นักปิดการขาย',
    where: 'ประเทศไทย · ทำงานจากที่ไหนก็ได้',
    tags: ['เป็นนายตัวเอง', 'รายชื่อลูกค้าเป้าหมายทั่วโลก', 'ทำงานผ่านการเขียนล้วน', 'ไม่ต้องโทร · ไม่ต้องนัดเจอ'],
    quote: '“ฝึกคนให้เก่งพอที่จะไปจากเราได้ ดูแลเขาให้ดีพอที่เขาจะไม่อยากไป”',
    by: 'ริชาร์ด แบรนสัน · นี่คือวิธีที่เราทำงาน',
    swipe: 'ปัดดูต่อ →',
    jobH: 'งานนี้มี 3 ส่วน',
    jobs: [
      ['ติดต่อธุรกิจทั่วโลก', 'เราให้รายชื่อธุรกิจครั้งละไม่เกิน 500 ราย ชื่อและรายละเอียดเติมให้อัตโนมัติ ส่งไม่เกิน 50 ฉบับต่อวัน ติดตามผลครั้งเดียวแล้วหยุด'],
      ['เป็นตัวแทน Digital Renaissance', 'เราสร้างระบบออนไลน์ระดับพรีเมียมที่ช่วยให้ธุรกิจเติบโตในหลายด้าน แพ็กเกจเริ่มต้นที่ $5,000 ต่อเดือน'],
      ['ปิดการขายผ่านข้อความ', 'ทุกดีลปิดผ่านอีเมลและแชต ไม่ต้องโทร ไม่ต้องนัดเจอ และคุณไม่ต้องรับเงินจากลูกค้าเอง'],
    ],
    payH: 'รายได้ของคุณ',
    payNote: 'คุณเป็นนายตัวเอง ได้รายได้จากลูกค้าทุกรายที่คุณหามา ตามเวลาของคุณเอง',
    pay: [
      ['30%', 'ของทุกเดือนที่ลูกค้าจ่าย ใน 3 เดือนแรกของลูกค้า'],
      ['$1,500', 'ต่อเดือนสำหรับคุณ ต่อลูกค้า 1 ราย ที่แพ็กเกจ $5,000 ต่อเดือน'],
    ],
    lifeH: 'ลูกค้าแค่ 2–3 ราย<br>เปลี่ยนชีวิตคุณได้',
    lifeLead: 'รายชื่อของเราครอบคลุมธุรกิจทั่วโลก คุณจึงไม่ถูกจำกัดอยู่แค่เมืองเดียวหรือประเทศเดียว คุณไม่ต้องขายได้เป็นร้อยราย แค่ไม่กี่รายที่ใช่',
    lifeRows: [['ลูกค้า 1 ราย', '$1,500', '≈ ฿54,750', '$4,500'], ['ลูกค้า 2 ราย', '$3,000', '≈ ฿109,500', '$9,000'], ['ลูกค้า 3 ราย', '$4,500', '≈ ฿164,250', '$13,500']],
    lifeCols: ['', 'ต่อเดือน', 'เป็นเงินบาท', 'รวม 3 เดือน'],
    lifeFine: 'ตัวเลขตัวอย่าง: 30% ของแพ็กเกจ $5,000 ต่อเดือน ใน 3 เดือนแรกของลูกค้าแต่ละราย ที่ประมาณ ฿36.5 ต่อ $1',
    lifeShort: 'รายชื่อธุรกิจทั่วโลก ลูกค้าแค่ 2–3 ราย:',
    example: 'ตัวอย่าง: ลูกค้า 1 รายที่ $5,000 ต่อเดือน = <b>คุณได้ $1,500 ต่อเดือน นาน 3 เดือน (รวม $4,500)</b>',
    payFine: 'จ่ายทุกเดือนผ่านพร้อมเพย์ ตามที่ลูกค้าของคุณชำระ',
    youH: 'คุณ',
    you: ['ภาษาไทยคล่อง และเขียนภาษาอังกฤษได้ดี', 'อยู่ในประเทศไทย มีบัญชีพร้อมเพย์', 'เป็นระเบียบ เชื่อถือได้ พูดแล้วทำ', 'ซื่อตรง ไม่โอ้อวด ไม่มีรีวิวปลอม ไม่สัญญาเกินจริง'],
    weH: 'สิ่งที่เราให้',
    we: ['รายชื่อธุรกิจเป้าหมายจากทั่วโลก', 'เทมเพลตอีเมลที่อนุมัติแล้ว', 'คู่มือการทำงานทีละขั้น และการฝึกอบรม', 'คุยตรงกับผู้ก่อตั้งได้เลย'],
    applyH: 'วิธีสมัคร',
    applyLead: 'ส่งข้อความหาเราที่เพจนี้ พร้อม:',
    apply: ['แนะนำตัวสั้น ๆ 3–4 บรรทัด', 'ข้อความสั้น ๆ 1 ข้อความ (ไทยหรืออังกฤษ) แนะนำ Digital Renaissance ให้เจ้าของธุรกิจ'],
    applyShort: 'ข้อความสั้น ๆ แนะนำ Digital Renaissance ให้เจ้าของธุรกิจ',
    applyWhy: 'สมัครผ่านข้อความเท่านั้น งานนี้คือการเขียน ใบสมัครของคุณจึงเป็นผลงานชิ้นแรก',
    close: 'เราจะฝึกคุณให้เก่งพอที่จะไปได้<br>และดูแลคุณให้ดีพอที่คุณจะอยากอยู่',
  },
};

const css = `${fontsCss}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0b0c10;font-family:Prompt,sans-serif;color:#f4ecd8}
.s{width:1080px;height:1350px;position:relative;overflow:hidden;padding:84px 80px;display:flex;flex-direction:column;
 background:radial-gradient(760px 560px at 92% -4%,rgba(232,184,74,.26),transparent 70%),radial-gradient(700px 560px at -6% 104%,rgba(56,160,230,.22),transparent 70%),#0b0c10}
.gold{color:#e8b84a}.blue{color:#5fb8f0}
.eyebrow{font-size:30px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#5fb8f0}
.th .eyebrow{letter-spacing:.04em}
h1{font-family:Fraunces,Prompt,serif;font-weight:600;color:#e8b84a;line-height:1.02;letter-spacing:-.01em}
.th h1{font-family:Prompt,sans-serif;font-weight:700;line-height:1.2;letter-spacing:0}
h2{font-family:Fraunces,Prompt,serif;font-weight:600;font-size:76px;color:#e8b84a;line-height:1.05;margin-bottom:44px}
.th h2{font-family:Prompt,sans-serif;font-weight:700;font-size:70px;line-height:1.3}
.logo{width:150px;height:150px;border-radius:50%;object-fit:cover;object-position:50% 34%;mix-blend-mode:screen}
.brand{display:flex;align-items:center;gap:18px;font-size:24px;letter-spacing:.14em;color:#c9b98f;text-transform:uppercase}
.brand img{width:64px;height:64px;border-radius:50%;object-fit:cover;object-position:50% 34%;mix-blend-mode:screen}
.tags{display:flex;flex-wrap:wrap;gap:14px}
.tag{border:2px solid rgba(232,184,74,.55);border-radius:999px;padding:12px 26px;font-size:28px;font-weight:500;color:#f4ecd8;background:rgba(255,255,255,.04)}
.quote{border-left:5px solid #e8b84a;padding:6px 0 6px 34px;font-size:40px;line-height:1.45;color:#fff;font-weight:500}
.th .quote{font-size:38px;line-height:1.6}
.quote small{display:block;font-size:24px;color:#c9b98f;margin-top:18px;font-weight:400}
.lifelead{font-size:32px;line-height:1.55;margin-bottom:36px;color:#e9e1cc}
.th .lifelead{line-height:1.7}
table.life{width:100%;border-collapse:collapse}
.life th{font-size:24px;font-weight:500;color:#5fb8f0;text-align:left;padding:0 10px 14px}
.life td{font-size:32px;padding:24px 10px;border-top:2px solid rgba(232,184,74,.25)}
.life td b{font-family:Fraunces,serif;font-weight:600;font-size:64px;color:#e8b84a}
.life tr.hi td{background:rgba(232,184,74,.07)}
.life td:last-child{font-weight:600;color:#fff}
.foot{position:absolute;left:80px;right:80px;bottom:52px;display:flex;justify-content:space-between;align-items:center;font-size:24px;color:#8c826b}
.foot .sw{color:#e8b84a;font-weight:600;font-size:28px}
.card{background:rgba(255,255,255,.05);border:2px solid rgba(232,184,74,.32);border-radius:28px;padding:34px 40px;margin-bottom:28px;display:flex;gap:30px}
.n{font-family:Fraunces,serif;font-weight:600;font-size:64px;color:#5fb8f0;line-height:1;min-width:52px}
.card h3{font-size:38px;font-weight:600;color:#e8b84a;margin-bottom:10px;line-height:1.25}
.card p{font-size:28px;line-height:1.55;color:#e9e1cc}
.th .card p{line-height:1.65}
.note{font-size:30px;font-weight:600;color:#fff;background:rgba(95,184,240,.14);border:2px solid rgba(95,184,240,.5);border-radius:20px;padding:20px 30px;margin-bottom:34px}
.big{display:flex;align-items:center;gap:34px;margin-bottom:26px}
.big b{font-family:Fraunces,serif;font-weight:600;font-size:130px;color:#e8b84a;line-height:.95;flex:none}
.big span{font-size:34px;line-height:1.45}
.ex{font-size:30px;line-height:1.55;border-top:2px solid rgba(232,184,74,.3);padding-top:28px;margin-top:6px}
.ex b{color:#e8b84a;font-weight:600}
.fine{font-size:25px;line-height:1.6;color:#c9b98f;margin-top:24px}
.cols h3{font-size:44px;font-weight:600;color:#5fb8f0;margin:0 0 18px}
ul{list-style:none}
li{font-size:31px;line-height:1.5;padding:12px 0 12px 50px;position:relative;border-bottom:1px solid rgba(232,184,74,.16)}
li:before{content:"";position:absolute;left:4px;top:27px;width:20px;height:20px;border-radius:50%;background:#e8b84a}
.we li:before{background:#5fb8f0}
ol{list-style:none;counter-reset:a}
ol li{counter-increment:a;padding-left:84px;font-size:34px;border:0;margin-bottom:14px}
ol li:before{content:counter(a);background:#e8b84a;color:#0b0c10;width:56px;height:56px;top:8px;font-family:Fraunces,serif;font-weight:600;font-size:34px;display:flex;align-items:center;justify-content:center}
.lead{font-size:36px;margin-bottom:26px}
.why{font-size:28px;line-height:1.6;color:#c9b98f;margin-top:18px}
.close{font-family:Fraunces,Prompt,serif;font-weight:600;font-size:52px;line-height:1.3;color:#e8b84a;margin-top:auto;margin-bottom:56px}
.th .close{font-family:Prompt,sans-serif;font-weight:600;font-size:46px;line-height:1.5}
/* all-in-one */
.one{padding:42px 60px}
.one .top{display:flex;justify-content:space-between;align-items:flex-start}
.one h1{font-size:84px;margin:6px 0 10px}
.th.one h1{font-size:68px}
.one .tag{font-size:23px;padding:8px 20px}
.one .tags{gap:10px}
.one .sec{font-size:24px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#5fb8f0;margin:18px 0 8px}
.th.one .sec{letter-spacing:.02em;font-size:26px}
.one .row{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
.one .mini{background:rgba(255,255,255,.05);border:2px solid rgba(232,184,74,.3);border-radius:20px;padding:16px 20px}
.one .mini h4{font-size:24px;color:#e8b84a;font-weight:600;line-height:1.3;margin-bottom:6px}
.one .mini p{font-size:18px;line-height:1.4;color:#e9e1cc}
.one .pay{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.one .pay div{display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.05);border-radius:20px;padding:14px 22px}
.one .pay b{font-family:Fraunces,serif;font-size:64px;color:#e8b84a;line-height:1}
.one .pay span{font-size:21px;line-height:1.45}
.one .ex{font-size:20px;padding-top:12px;margin-top:12px;border-top-width:1px}
.one .two{display:grid;grid-template-columns:1fr 1fr;gap:28px}
.one li{font-size:19px;padding:4px 0 4px 28px}
.one li:before{width:11px;height:11px;top:14px}
.one .apply{background:#e8b84a;color:#0b0c10;border-radius:22px;padding:14px 26px;margin-top:16px;font-size:20px;line-height:1.5}
.one .apply b{font-size:25px;display:block;margin-bottom:4px}
.one .q{font-size:19px;line-height:1.5;color:#fff;border-left:4px solid #e8b84a;padding-left:18px}
.one .q small{display:inline;color:#c9b98f;font-size:17px;margin-left:10px}
`;

const tagsH = (t) => `<div class=tags>${t.tags.map((x) => `<span class=tag>${x}</span>`).join('')}</div>`;
const brand = `<div class=brand><img src="${logo}">Digital Renaissance</div>`;
const N = 6;
const foot = (i, t) => `<div class=foot><span>${i}/${N}</span><span class=sw>${i < N ? t.swipe : ''}</span></div>`;

function carousel(t) {
  return [
    `<section class="s ${t.lang}">
      <img class=logo src="${logo}">
      <div class=eyebrow style="margin-top:56px">${t.hiring}</div>
      <h1 style="font-size:${t.lang === 'th' ? 112 : 132}px;margin:22px 0 18px">${t.title}</h1>
      <div style="font-size:38px;color:#c9b98f;margin-bottom:44px">${t.where}</div>
      ${tagsH(t)}
      <div class=quote style="margin-top:auto;margin-bottom:70px">${t.quote}<small>${t.by}</small></div>
      ${foot(1, t)}</section>`,
    `<section class="s ${t.lang}">${brand}<h2 style="margin-top:54px">${t.jobH}</h2>
      ${t.jobs.map(([h, p], i) => `<div class=card><div class=n>${i + 1}</div><div><h3>${h}</h3><p>${p}</p></div></div>`).join('')}
      ${foot(2, t)}</section>`,
    `<section class="s ${t.lang}">${brand}<h2 style="margin-top:54px">${t.payH}</h2>
      <div class=note>${t.payNote}</div>
      ${t.pay.map(([b, s]) => `<div class=big><b>${b}</b><span>${s}</span></div>`).join('')}
      <div class=ex>${t.example}</div><div class=fine>${t.payFine}</div>
      ${foot(3, t)}</section>`,
    `<section class="s ${t.lang}">${brand}<h2 style="margin-top:54px">${t.lifeH}</h2>
      <p class=lifelead>${t.lifeLead}</p>
      <table class=life><tr>${t.lifeCols.map((c) => `<th>${c}</th>`).join('')}</tr>
      ${t.lifeRows.map((row, i) => `<tr${i ? ' class=hi' : ''}>${row.map((c, j) => `<td>${j === 1 ? `<b>${c}</b>` : c}</td>`).join('')}</tr>`).join('')}</table>
      <div class=fine>${t.lifeFine}</div>
      ${foot(4, t)}</section>`,
    `<section class="s ${t.lang} cols">${brand}
      <h3 style="margin-top:60px">${t.youH}</h3><ul>${t.you.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h3 style="margin-top:56px">${t.weH}</h3><ul class=we>${t.we.map((x) => `<li>${x}</li>`).join('')}</ul>
      ${foot(5, t)}</section>`,
    `<section class="s ${t.lang}">${brand}<h2 style="margin-top:54px">${t.applyH}</h2>
      <div class=lead>${t.applyLead}</div><ol>${t.apply.map((x) => `<li>${x}</li>`).join('')}</ol>
      <div class=why>${t.applyWhy}</div>
      <div class=close>${t.close}</div>
      ${foot(6, t)}</section>`,
  ];
}

// The single image folds the location into the tag row and keeps only
// "work for yourself" and "worldwide lead lists" beside it: "no calls" and
// "written only" are already said by the closer card, and the room goes to
// the 2-3 clients line and the quote.
function single(t) {
  return `<section class="s one ${t.lang}">
    <div class=top><div><div class=eyebrow>${t.hiring}</div>
      <h1>${t.title.replace('<br>', ' ')}</h1>
      </div>
      <img class=logo src="${logo}" style="width:130px;height:130px"></div>
    ${tagsH({ tags: [t.where, t.tags[0], t.tags[1]] })}
    <div class=sec>${t.jobH}</div>
    <div class=row>${t.jobs.map(([h, p]) => `<div class=mini><h4>${h}</h4><p>${p}</p></div>`).join('')}</div>
    <div class=sec style="color:#e8b84a">${t.lifeH.replace('<br>', ' ')}</div>
    <div class=pay>${t.pay.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>
    <div class=ex><b>${t.payNote}</b> ${t.lifeShort} ${t.lifeRows.slice(1).map((x) => `<b>${x[0]} = ${x[1]}/${t.lang === 'th' ? 'เดือน' : 'month'} (${x[2]})</b>`).join(' · ')}<br><span style="color:#c9b98f">${t.payFine}</span></div>
    <div class=two><div><div class=sec>${t.youH}</div><ul>${t.you.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      <div><div class=sec>${t.weH}</div><ul class=we>${t.we.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>
    <div class=apply><b>${t.applyH}</b>${t.applyLead} ① ${t.apply[0]} ② ${t.applyShort}</div>
    <div class=q style="margin-top:14px">${t.quote}<small>${t.by.split(/[.·]/)[0].trim()}</small></div>
  </section>`;
}

const page = (body) => `<!doctype html><html><head><meta charset=utf-8><style>${css}</style></head><body>${body}</body></html>`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await browser.newPage({ viewport: { width: 1080, height: 1350 } });
for (const t of Object.values(T)) {
  const slides = carousel(t);
  const all = [single(t), ...slides];
  writeFileSync(join(here, `hiring-${t.lang}.html`), page(all.join('\n')));
  const names = [`hiring-${t.lang}-single`, ...slides.map((_, i) => `hiring-${t.lang}-carousel-${i + 1}`)];
  for (let i = 0; i < all.length; i++) {
    await pg.setContent(page(all[i]), { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    // Fail loudly if anything spills past the bottom or the footer: the
    // section has overflow:hidden, so an overflow would be silently clipped.
    const over = await pg.evaluate(() => {
      const s = document.querySelector('section');
      const foot = s.querySelector('.foot');
      const limit = foot ? foot.getBoundingClientRect().top - 8 : s.getBoundingClientRect().bottom - 30;
      return [...s.querySelectorAll('*')].filter((e) => !e.closest('.foot') && e.getBoundingClientRect().bottom > limit && e.getBoundingClientRect().height > 0).map((e) => e.tagName + '.' + e.className).slice(0, 3);
    });
    if (over.length) console.warn(`OVERFLOW ${names[i]}:`, over);
    await pg.locator('section').screenshot({ path: join(here, names[i] + '.png') });
    console.log('wrote', names[i] + '.png');
  }
}
await browser.close();
