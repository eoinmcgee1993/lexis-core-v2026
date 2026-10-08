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

// Every figure here comes from ../README.md "Her terms". LEXIS is the standing
// 20%: the 60% was Future's launch window (1-28 Oct) and ends before anyone
// hired from this ad would start. DR's 30% x 3 months is the stated starting
// rate. Commission-only is said up front on every version: hiding it in a
// recruitment ad is the fastest way to attract the wrong people.
const T = {
  en: {
    lang: 'en',
    hiring: "We're hiring",
    title: 'Partner &amp; Closer',
    where: 'Thailand · Remote',
    tags: ['Commission only', 'Written work only', 'No calls · No meetings'],
    quote: '“Train people well enough so they can leave. Treat them well enough so they don\'t want to.”',
    by: 'Richard Branson. This is how we work.',
    swipe: 'Swipe →',
    jobH: 'The job, in three parts',
    jobs: [
      ['Refer LEXIS', 'A virtual conversation partner for practising spoken English and Thai. One-off passes: ฿199 for 7 days, ฿599 for 30 days. Nothing auto-renews.'],
      ['Email businesses', 'We give you lead lists of up to 500 at a time; names fill in automatically. Up to 50 emails a day, one follow-up, then stop.'],
      ['Close Digital Renaissance deals', 'Our business systems start at $5,000/month. You close by email and chat only. No calls, no meetings.'],
    ],
    payH: 'What you earn',
    payNote: 'Commission only. There is no base salary.',
    pay: [
      ['20%', 'of what your LEXIS customers pay'],
      ['30%', 'of each month a Digital Renaissance client pays, for their first 3 months'],
    ],
    example: 'Example: one client at $5,000/month = <b>$1,500/month to you for 3 months ($4,500)</b>.',
    payFine: 'Paid monthly by PromptPay. You earn only when customers actually pay; refunds don\'t count. No income is promised.',
    youH: 'You',
    you: ['Fluent Thai and strong written English', 'Based in Thailand, with a PromptPay account', 'Organised and reliable: you do what you say', 'Honest: no hype, no fake reviews, no promises'],
    weH: 'We give you',
    we: ['Lead lists and approved email templates', 'A step-by-step work manual and training', 'A free 30-day LEXIS pass to try it yourself', 'Direct access to the founder'],
    applyH: 'How to apply',
    applyLead: 'Send us a message on this page with:',
    apply: ['3–4 lines about you', 'One short message, in English or Thai, inviting someone who wants to speak English with more confidence to try LEXIS'],
    applyShort: 'a short message, in English or Thai, inviting someone to try LEXIS',
    applyWhy: 'Applications by message only. This job is writing, so your application is the first sample.',
    close: 'We\'ll train you well enough to leave,<br>and treat you well enough to stay.',
  },
  th: {
    lang: 'th',
    hiring: 'เรากำลังรับสมัคร',
    title: 'พาร์ตเนอร์ &amp;<br>นักปิดการขาย',
    where: 'ประเทศไทย · ทำงานจากที่ไหนก็ได้',
    tags: ['รายได้จากค่าคอมมิชชันเท่านั้น', 'ทำงานผ่านการเขียนล้วน', 'ไม่ต้องโทร · ไม่ต้องนัดเจอ'],
    quote: '“ฝึกคนให้เก่งพอที่จะไปจากเราได้ ดูแลเขาให้ดีพอที่เขาจะไม่อยากไป”',
    by: 'ริชาร์ด แบรนสัน · นี่คือวิธีที่เราทำงาน',
    swipe: 'ปัดดูต่อ →',
    jobH: 'งานนี้มี 3 ส่วน',
    jobs: [
      ['แนะนำ LEXIS', 'คู่สนทนาเสมือนสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย จ่ายครั้งเดียว: ฿199 ใช้ได้ 7 วัน, ฿599 ใช้ได้ 30 วัน ไม่ต่ออายุอัตโนมัติ'],
      ['ส่งอีเมลหาธุรกิจ', 'เราให้รายชื่อครั้งละไม่เกิน 500 ราย ชื่อและรายละเอียดเติมให้อัตโนมัติ ส่งไม่เกิน 50 ฉบับต่อวัน ติดตามผลครั้งเดียวแล้วหยุด'],
      ['ปิดการขายให้ Digital Renaissance', 'ระบบธุรกิจของเราเริ่มต้นที่ $5,000 ต่อเดือน ปิดการขายผ่านอีเมลและแชตเท่านั้น ไม่ต้องโทร ไม่ต้องนัดเจอ'],
    ],
    payH: 'รายได้ของคุณ',
    payNote: 'รายได้จากค่าคอมมิชชันล้วน ไม่มีเงินเดือนประจำ',
    pay: [
      ['20%', 'ของยอดที่ลูกค้า LEXIS ของคุณจ่ายจริง'],
      ['30%', 'ของทุกเดือนที่ลูกค้า Digital Renaissance จ่าย ใน 3 เดือนแรกของลูกค้า'],
    ],
    example: 'ตัวอย่าง: ลูกค้า 1 รายที่ $5,000 ต่อเดือน = <b>คุณได้ $1,500 ต่อเดือน นาน 3 เดือน (รวม $4,500)</b>',
    payFine: 'จ่ายทุกเดือนผ่านพร้อมเพย์ ได้เมื่อลูกค้าจ่ายเงินจริงเท่านั้น ยอดที่คืนเงินไม่นับ ไม่มีการรับประกันรายได้',
    youH: 'คุณ',
    you: ['ภาษาไทยคล่อง และเขียนภาษาอังกฤษได้ดี', 'อยู่ในประเทศไทย มีบัญชีพร้อมเพย์', 'เป็นระเบียบ เชื่อถือได้ พูดแล้วทำ', 'ซื่อตรง ไม่โอ้อวด ไม่มีรีวิวปลอม ไม่สัญญาเกินจริง'],
    weH: 'สิ่งที่เราให้',
    we: ['รายชื่อลูกค้าเป้าหมาย และเทมเพลตอีเมลที่อนุมัติแล้ว', 'คู่มือการทำงานทีละขั้น และการฝึกอบรม', 'LEXIS ฟรี 30 วัน ให้คุณลองใช้เอง', 'คุยตรงกับผู้ก่อตั้งได้เลย'],
    applyH: 'วิธีสมัคร',
    applyLead: 'ส่งข้อความหาเราที่เพจนี้ พร้อม:',
    apply: ['แนะนำตัวสั้น ๆ 3–4 บรรทัด', 'ข้อความสั้น ๆ 1 ข้อความ (ไทยหรืออังกฤษ) ชวนคนที่อยากพูดภาษาอังกฤษให้มั่นใจขึ้นมาลอง LEXIS'],
    applyShort: 'ข้อความสั้น ๆ (ไทยหรืออังกฤษ) ชวนคนมาลอง LEXIS',
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
.foot{position:absolute;left:80px;right:80px;bottom:52px;display:flex;justify-content:space-between;align-items:center;font-size:24px;color:#8c826b}
.foot .sw{color:#e8b84a;font-weight:600;font-size:28px}
.card{background:rgba(255,255,255,.05);border:2px solid rgba(232,184,74,.32);border-radius:28px;padding:34px 40px;margin-bottom:28px;display:flex;gap:30px}
.n{font-family:Fraunces,serif;font-weight:600;font-size:64px;color:#5fb8f0;line-height:1;min-width:52px}
.card h3{font-size:38px;font-weight:600;color:#e8b84a;margin-bottom:10px;line-height:1.25}
.card p{font-size:28px;line-height:1.55;color:#e9e1cc}
.th .card p{line-height:1.65}
.note{font-size:30px;font-weight:600;color:#fff;background:rgba(95,184,240,.14);border:2px solid rgba(95,184,240,.5);border-radius:20px;padding:20px 30px;margin-bottom:34px}
.big{display:flex;align-items:center;gap:34px;margin-bottom:26px}
.big b{font-family:Fraunces,serif;font-weight:600;font-size:150px;color:#e8b84a;line-height:.95;min-width:300px}
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
.one .mini h4{font-size:25px;color:#e8b84a;font-weight:600;line-height:1.3;margin-bottom:6px}
.one .mini p{font-size:19px;line-height:1.45;color:#e9e1cc}
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
const foot = (i, t) => `<div class=foot><span>${i}/5</span><span class=sw>${i < 5 ? t.swipe : ''}</span></div>`;

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
    `<section class="s ${t.lang} cols">${brand}
      <h3 style="margin-top:60px">${t.youH}</h3><ul>${t.you.map((x) => `<li>${x}</li>`).join('')}</ul>
      <h3 style="margin-top:56px">${t.weH}</h3><ul class=we>${t.we.map((x) => `<li>${x}</li>`).join('')}</ul>
      ${foot(4, t)}</section>`,
    `<section class="s ${t.lang}">${brand}<h2 style="margin-top:54px">${t.applyH}</h2>
      <div class=lead>${t.applyLead}</div><ol>${t.apply.map((x) => `<li>${x}</li>`).join('')}</ol>
      <div class=why>${t.applyWhy}</div>
      <div class=close>${t.close}</div>
      ${foot(5, t)}</section>`,
  ];
}

// The single image folds the location into the tag row to make room for the
// quote; "written work only" is dropped there because "no calls · no
// meetings" and the closer card already say it.
function single(t) {
  return `<section class="s one ${t.lang}">
    <div class=top><div><div class=eyebrow>${t.hiring}</div>
      <h1>${t.title.replace('<br>', ' ')}</h1>
      </div>
      <img class=logo src="${logo}" style="width:130px;height:130px"></div>
    ${tagsH({ tags: [t.where, t.tags[0], t.tags[2]] })}
    <div class=sec>${t.jobH}</div>
    <div class=row>${t.jobs.map(([h, p]) => `<div class=mini><h4>${h}</h4><p>${p}</p></div>`).join('')}</div>
    <div class=sec>${t.payH}</div>
    <div class=pay>${t.pay.map(([b, s]) => `<div><b>${b}</b><span>${s}</span></div>`).join('')}</div>
    <div class=ex><b>${t.payNote}</b> ${t.example}<br><span style="color:#c9b98f">${t.payFine}</span></div>
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
