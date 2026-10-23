// LEXIS phrase carousels: 6 swipe posts x 5 slides at 1080x1350 (Instagram /
// Facebook feed, 4:5), plus phrases/CAPTIONS.md. Run from anywhere:
//   node brand-kit/carousel/build_phrase_carousels.mjs
//
// Three are for Thai speakers practising English (written in Thai, English
// shown): "say this instead" fixes for the direct translations Thai makes
// easy. Three are survival Thai for English speakers, Thai script plus a
// tone-marked romanization. Same frame as build_community_carousel.mjs:
// Playwright's Chromium from /opt/pw-browsers, HTML slides screenshotted to
// PNG, facts read from facts.js. playwright-core is borrowed from
// frontend/node_modules (ESM resolves bare imports from this file's folder,
// which has none), hence createRequire. From a worktree without its own
// node_modules, point NODE_PATH at a checkout that has one.
//
// All copy lives in CAROUSELS / CTA below. CAPTIONS.md is generated from the
// same objects rather than kept by hand, so its slide paths, UTM links and
// trial line cannot drift from the images they describe.
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { TRIAL } from '../../frontend/src/content/facts.js';
import { markSvg } from '../../frontend/src/brand/lexisMark.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const OUT = path.join(here, 'phrases');

// The trial line is built from TRIAL, never typed: the brand kit once printed
// "Free 30-minute trial" on 14 templates after the trial was halved (PR #92).
// cardRequired is honoured too, so the "no card" half disappears by itself if
// that term ever changes, instead of becoming a false claim on every CTA.
const TRIAL_LINE = {
  en: `Free ${TRIAL.minutes}-minute trial${TRIAL.cardRequired ? '' : ', no card needed'}.`,
  th: `ทดลองฟรี ${TRIAL.minutes} นาที${TRIAL.cardRequired ? '' : ' ไม่ต้องผูกบัตร'}`,
};
// /th is the Thai landing page (App.jsx), so the Thai-audience set lands there.
const SITE = { en: 'learnwithlexis.com', th: 'learnwithlexis.com/th' };

// ---- COPY. Edit here, then re-run.
//
// Accuracy rules this copy was written to (CLAUDE.md, batch brief):
//   - every English "say this instead" is a real error with a real fix, and
//     the note says WHY in one line, because a correction with no reason is
//     just something to memorise. The tone is "there's a more natural way",
//     never "you're wrong": the wrong line is shown muted, not struck out.
//   - Thai tones were worked out from consonant class, live/dead syllable and
//     tone mark for every syllable, not copied from a phrasebook. Spelling
//     follows the Royal Institute where colloquial spelling differs, which is
//     why "how much" is กี่บาท rather than the commonly misspelt เท่าไหร่, and
//     the bill is เช็กบิล (RI: เช็ก = to check, เช็ค = a cheque).
//   - LEXIS is a virtual conversation partner (คู่สนทนาเสมือน). Nothing here
//     calls it, or implies it is, a person; nothing promises a result.
//
// Romanization: k/kh, p/ph, t/th (the h is a puff of air), long vowels
// doubled, "aw" for the vowel อ. Tone marks: a mid, à low, â falling,
// á high, ǎ rising. Every slide that has romanization carries that key.
//
// In Thai headings, <br> is placed by hand: Thai has no spaces between words,
// so the browser's own breaks can split a phrase mid-idea. English inside a
// Thai heading is wrapped in <span class="en"> so it sets in Fraunces rather
// than whatever Latin face the system falls back to.
const CAROUSELS = [
  {
    id: 'th-direct-translation', lang: 'th',
    hook: {
      k: 'ภาษาอังกฤษในชีวิตประจำวัน',
      h: '“เปิดไฟ”<br>ภาษาอังกฤษ<br>พูดว่าอะไร?',
      s: '3 ประโยคที่คนไทยมักแปลตรงตัว ฟังแล้วพอเข้าใจ แต่เจ้าของภาษาไม่พูดแบบนี้',
    },
    fixes: [
      { k: 'เปิดไฟ', from: 'Open the light.', to: 'Turn on the light.',
        note: 'ไฟ ทีวี และแอร์ ใช้ turn on กับ turn off ส่วน open กับ close ใช้กับประตู หน้าต่าง หรือกล่อง' },
      { k: 'ช่วยปิดแอร์หน่อย', from: 'Can you close the air?', to: 'Can you turn off the AC?',
        note: 'air คำเดียวแปลว่าอากาศ ถ้าหมายถึงเครื่องปรับอากาศ ให้พูดว่า AC หรือ air con' },
      { k: 'ชอบมาก', from: 'I very like it.', to: 'I really like it.',
        note: 'very ใช้ขยายคำคุณศัพท์ เช่น very good แต่ไม่ใช้ขยายกริยาอย่าง like ให้ใช้ really หรือพูดว่า I like it a lot' },
    ],
    caption: [
      '“เปิดไฟ” ภาษาอังกฤษพูดว่าอะไร?',
      'ถ้าแปลตรงตัวจะได้ Open the light ซึ่งฟังแล้วพอเข้าใจ แต่เจ้าของภาษาจะพูดว่า Turn on the light',
      'ปัดดู 3 ประโยคที่คนไทยมักแปลตรงตัว พร้อมวิธีพูดที่เป็นธรรมชาติกว่า แล้วลองพูดออกเสียงตามดูนะ',
    ],
    hashtags: ['ภาษาอังกฤษ', 'เรียนภาษาอังกฤษ', 'ฝึกพูดภาษาอังกฤษ', 'ภาษาอังกฤษในชีวิตประจำวัน', 'แปลตรงตัว', 'LEXIS'],
  },
  {
    id: 'th-work-hotel', lang: 'th',
    hook: {
      k: 'ภาษาอังกฤษที่ทำงาน',
      h: 'พูดที่ออฟฟิศ<br>และหน้าเคาน์เตอร์<br>โรงแรม',
      s: '3 ประโยคที่ได้ใช้บ่อย กับวิธีพูดที่เป็นธรรมชาติกว่า',
    },
    fixes: [
      { k: 'มาคุยเรื่องแผนงานกัน', from: 'Let’s discuss about the plan.', to: 'Let’s discuss the plan.',
        note: 'discuss ไม่ต้องมี about ตามหลัง ถ้าอยากใช้ about ให้พูดว่า talk about แทน' },
      { k: 'ขอยืมปากกาหน่อย', from: 'Can you borrow me a pen?', to: 'Can I borrow a pen?',
        note: 'borrow คือเราเป็นคนยืม ส่วน lend คือให้คนอื่นยืม จะพูดว่า Could you lend me a pen? ก็ได้' },
      { k: 'ขอโทษที่ให้รอ', from: 'Sorry for waiting.', to: 'Sorry to keep you waiting.',
        note: 'Sorry for waiting ฟังเหมือนเราขอโทษที่ตัวเองเป็นคนรอ ถ้าแขกเป็นคนรอ ให้พูดว่า Sorry to keep you waiting หรือ Thank you for waiting' },
    ],
    caption: [
      'ภาษาอังกฤษที่ออฟฟิศและหน้าเคาน์เตอร์โรงแรม',
      'discuss ไม่ต้องมี about, borrow กับ lend ไม่เหมือนกัน และถ้าแขกเป็นคนรอ ให้พูดว่า Sorry to keep you waiting',
      'ปัดดูทั้ง 3 ประโยค เซฟเก็บไว้ แล้วลองพูดออกเสียงก่อนใช้จริง',
    ],
    hashtags: ['ภาษาอังกฤษในที่ทำงาน', 'ภาษาอังกฤษสำหรับโรงแรม', 'ภาษาอังกฤษ', 'ฝึกพูดภาษาอังกฤษ', 'เรียนภาษาอังกฤษ', 'LEXIS'],
  },
  {
    id: 'th-small-talk', lang: 'th',
    hook: {
      k: 'ภาษาอังกฤษสำหรับคุยเล่น',
      h: '<span class="en">I’m boring</span><br>กับ <span class="en">I’m bored</span><br>ไม่เหมือนกันนะ',
      //  : ๆ must never start a line, and it sits after a space.
      s: '3 จุดเล็ก ๆ ที่คนไทยมักพลาด เวลาคุยกับเพื่อนต่างชาติ',
    },
    fixes: [
      { k: 'ฉันเบื่อ', from: 'I’m boring.', to: 'I’m bored.',
        note: 'I’m boring แปลว่า ฉันเป็นคนน่าเบื่อ ถ้ารู้สึกเบื่อให้ใช้ bored แบบเดียวกับ I’m excited (ฉันตื่นเต้น) ไม่ใช่ I’m exciting' },
      { k: 'เคยไปญี่ปุ่น', from: 'I have ever been to Japan.', to: 'I’ve been to Japan.',
        note: 'ถ้าบอกว่าเคยทำอะไร ใช้ I’ve been ได้เลย ไม่ต้องใส่ ever ส่วน ever มักใช้ในคำถาม เช่น Have you ever been to Japan?' },
      { k: 'เมื่อวานไปตลาด', from: 'Yesterday I go to the market.', to: 'Yesterday I went to the market.',
        note: 'ภาษาไทยไม่ต้องเปลี่ยนรูปกริยา แต่ภาษาอังกฤษต้องเปลี่ยนเมื่อพูดถึงเรื่องที่ผ่านมาแล้ว go จึงกลายเป็น went' },
    ],
    caption: [
      'I’m boring กับ I’m bored ไม่เหมือนกันนะ',
      'I’m boring แปลว่า ฉันเป็นคนน่าเบื่อ ส่วน I’m bored แปลว่า ฉันรู้สึกเบื่อ',
      'ปัดดู 3 จุดเล็ก ๆ ที่คนไทยมักพลาดเวลาคุยกับเพื่อนต่างชาติ แล้วลองพูดออกเสียงตามดู',
    ],
    hashtags: ['ภาษาอังกฤษ', 'เรียนภาษาอังกฤษ', 'ฝึกพูดภาษาอังกฤษ', 'ไวยากรณ์อังกฤษ', 'ภาษาอังกฤษในชีวิตประจำวัน', 'LEXIS'],
  },
  {
    id: 'en-polite-particles', lang: 'en',
    hook: {
      k: 'Survival Thai',
      h: 'One little word<br>makes your Thai<br>polite',
      s: 'ครับ or ค่ะ. Who says which, and four everyday phrases to use them with.',
    },
    phrases: [
      { k: 'Polite particles', items: [
        { th: 'ครับ', rom: 'khráp', en: 'Men: add it to the end of a sentence' },
        { th: 'ค่ะ · คะ', rom: 'khâ · khá', en: 'Women: ค่ะ, or คะ for a question' },
      ], note: 'They don’t change the meaning. They make it polite, and you’ll hear them everywhere.' },
      { k: 'Hello and thank you', items: [
        { th: 'สวัสดีครับ/ค่ะ', rom: 'sà-wàt-dii khráp/khâ', en: 'Hello, and goodbye too' },
        { th: 'ขอบคุณครับ/ค่ะ', rom: 'khàwp-khun khráp/khâ', en: 'Thank you' },
      ] },
      { k: 'Sorry and no worries', items: [
        { th: 'ขอโทษครับ/ค่ะ', rom: 'khǎw-thôht khráp/khâ', en: 'Sorry, or excuse me' },
        { th: 'ไม่เป็นไรครับ/ค่ะ', rom: 'mâi pen rai khráp/khâ', en: 'No worries, it’s OK' },
      ], note: 'ไม่เป็นไร is also the reply to ขอบคุณ, like “you’re welcome”.' },
    ],
    caption: [
      'Want your Thai to sound polite? Start with one little word.',
      'Men end their sentences with ครับ (khráp). Women use ค่ะ (khâ), and คะ (khá) for questions. Swipe for four everyday phrases to put them on.',
      'Save this, then say each one out loud.',
    ],
    hashtags: ['LearnThai', 'ThaiLanguage', 'SpeakThai', 'ThaiPhrases', 'SurvivalThai', 'LEXIS'],
  },
  {
    id: 'en-food-ordering', lang: 'en',
    hook: {
      k: 'Survival Thai',
      h: 'Order food<br>in Thai',
      s: 'Five short lines for the menu, the spice and the bill.',
    },
    phrases: [
      { k: 'At the menu', items: [
        { th: 'เอาอันนี้ครับ/ค่ะ', rom: 'ao an-níi khráp/khâ', en: 'I’ll have this one' },
      ], note: 'Point at the menu as you say it.' },
      { k: 'The spice question', items: [
        { th: 'ไม่เผ็ด', rom: 'mâi phèt', en: 'Not spicy' },
        { th: 'เผ็ดนิดหน่อย', rom: 'phèt nít-nòi', en: 'A little spicy' },
      ], note: 'ph is a p with a puff of air, not an f.' },
      { k: 'The end of the meal', items: [
        { th: 'อร่อยมาก', rom: 'à-ròi mâak', en: 'Really delicious' },
        { th: 'เช็กบิลด้วยครับ/ค่ะ', rom: 'chék bin dûay khráp/khâ', en: 'The bill, please' },
      ] },
    ],
    caption: [
      'Ordering food in Thai, in five short lines.',
      'Point at the menu, ask for not spicy (or just a little), say it was delicious, and ask for the bill.',
      'Save this for your next meal out, then say each line out loud.',
    ],
    hashtags: ['LearnThai', 'ThaiFood', 'ThaiPhrases', 'SpeakThai', 'SurvivalThai', 'LEXIS'],
  },
  {
    id: 'en-getting-around', lang: 'en',
    hook: {
      k: 'Survival Thai',
      h: 'Get around<br>in Thai',
      s: 'Taxis, directions, and where the bathroom is.',
    },
    phrases: [
      { k: 'In a taxi', items: [
        { th: 'ไปสนามบินครับ/ค่ะ', rom: 'pai sà-nǎam-bin khráp/khâ', en: 'To the airport, please' },
        { th: 'ไปสนามบินกี่บาทครับ/คะ', rom: 'pai sà-nǎam-bin kìi bàat khráp/khá', en: 'How much to the airport?' },
      ], note: 'Swap สนามบิน for wherever you’re going. Women end a question with คะ (khá), not ค่ะ.' },
      { k: 'Finding your way', items: [
        { th: 'ห้องน้ำอยู่ที่ไหนครับ/คะ', rom: 'hâwng-náam yùu thîi-nǎi khráp/khá', en: 'Where’s the bathroom?' },
      ], note: 'Put any place in front of อยู่ที่ไหน (yùu thîi-nǎi) to ask where it is.' },
      { k: 'Directions', items: [
        { th: 'เลี้ยวซ้าย · เลี้ยวขวา', rom: 'líao sáai · líao khwǎa', en: 'Turn left · Turn right' },
        { th: 'จอดตรงนี้ครับ/ค่ะ', rom: 'jàwt trong-níi khráp/khâ', en: 'Stop here, please' },
      ] },
    ],
    caption: [
      'Getting around in Thai: taxis, directions and finding the bathroom.',
      'Every line has the Thai script and a romanization with tone marks.',
      'Save it before your next trip, then practice saying each line out loud.',
    ],
    hashtags: ['LearnThai', 'ThailandTravel', 'ThaiPhrases', 'SpeakThai', 'SurvivalThai', 'LEXIS'],
  },
];

// Slide 5 of every carousel. "ลองใช้ฟรี" / "Try It Free" is the site's own
// CTA wording, so the post and the page it opens ask in the same words.
const CTA = {
  th: {
    k: 'ฝึกพูดกับ LEXIS', h: 'อ่านแล้ว<br>ลองพูดออกเสียงดู',
    s: 'LEXIS คือคู่สนทนาเสมือน ฝึกพูดภาษาอังกฤษออกเสียงจริง แล้วรับคำแนะนำอย่างอ่อนโยนระหว่างคุย',
    button: 'ลองใช้ฟรี', igEnd: 'ลิงก์อยู่ในโปรไฟล์',
    close: `ฝึกพูดภาษาอังกฤษออกเสียงกับ LEXIS คู่สนทนาเสมือน ${TRIAL_LINE.th}`,
  },
  en: {
    k: 'Practice with LEXIS', h: 'Now say them<br>out loud',
    s: 'LEXIS is a virtual conversation partner. Practice Thai out loud and get gentle corrections as you go.',
    button: 'Try It Free', igEnd: 'Link in bio.',
    close: `Practice speaking Thai out loud with LEXIS, a virtual conversation partner. ${TRIAL_LINE.en}`,
  },
};
const SWIPE = { th: 'ปัดดูต่อ →', en: 'Swipe →' };
const LABEL = { from: 'แทนที่จะพูดว่า', to: 'ลองพูดว่า' };
const TONE_KEY = 'Tones: a mid · à low · â falling · á high · ǎ rising';

// Thai running text breaks only at its spaces. Thai puts a space between
// phrases, not words, and Chromium's dictionary breaker split compounds at a
// line end on the first render (ออก / เสียง, พูด / ว่า, ต่าง / ชาติ); balanced
// wrapping then made it worse (มัก / พลาด). Every phrase here is short enough
// to fit a line, so each space-separated run is kept whole, and consecutive
// English words count as one run so a quoted phrase ("very good", "Sorry to
// keep you waiting") is never split across lines either.
const phrases = (s) => s.split(' ')
  .reduce((runs, w) => {
    const latin = !/[฀-๿]/.test(w);
    const last = runs[runs.length - 1];
    if (latin && last?.latin) last.text += ` ${w}`;
    else runs.push({ text: w, latin });
    return runs;
  }, [])
  .map((r) => `<span class="nw">${r.text}</span>`).join(' ');

// Build-time guard for the copy rules that have gone wrong in this repo
// before: recurring-billing wording on one-off passes, results promises, and
// anything that calls LEXIS a teacher or points at tutors or schools. Cheap
// to run on every build, and it fails before a PNG is written.
const BANNED = /per week|per month|\/week|\/month|a month|subscri|unlimited|cancel anytime|ต่อเดือน|ต่อสัปดาห์|รายเดือน|tutor|teacher|ครู|ติว|school|โรงเรียน|fluen|\bbest\b|#1|LEXIS50/i;

const BRAND = { navy: '#050B14', amber: '#FFB23A', action: '#FF9E00', teal: '#14B8A6' };
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(root, 'frontend/public/fonts', f)).toString('base64');
const FONTS = `
@font-face{font-family:Plex;font-weight:400;src:url(${font('ibm-plex-sans-thai-400.woff2')})}
@font-face{font-family:Plex;font-weight:600;src:url(${font('ibm-plex-sans-thai-600.woff2')})}
@font-face{font-family:Fraunces;font-weight:600;src:url(${font('fraunces-600-var.woff2')})}`;
// The self-hosted Plex Thai subset carries no Latin at all, and the Fraunces
// subset has no à â ǎ ò ô ǒ. Romanization set in either would mix glyphs from
// two faces inside one word, so Latin text sits on the visual system's body
// stack (scripts/design/lexis-visual-system.md: body is the system sans).
// Liberation Sans is named because it is what this container has and it
// covers every tone mark; Plex stays first so Thai always gets Plex.
const TEXT = `Plex,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Liberation Sans',Arial,sans-serif`;
const DISPLAY = `Fraunces,Plex,Georgia,serif`;

// The mark comes from lexisMark.js, the module the site, favicon and the
// brand-kit generators all draw it from, so this file has no copy of its own
// to drift. The tile is amber, which already reads on navy, so it needs no
// hairline edge here.
const MARK = markSvg({ variant: 'tile', size: 76 }).replace('<svg ', '<svg style="display:block" ');

const page = (lang, i, n, main) => `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${FONTS}
*{margin:0;box-sizing:border-box}
body{width:1080px;height:1350px;font-family:${TEXT};color:#fff;overflow:hidden;-webkit-font-smoothing:antialiased;
  background:radial-gradient(900px 700px at 85% 10%,rgba(255,178,58,.24),transparent 60%),
             radial-gradient(800px 700px at 0% 100%,rgba(20,184,166,.22),transparent 60%),${BRAND.navy};
  padding:100px 96px 96px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:22px;margin-bottom:48px}
.nw{white-space:nowrap}
/* Balanced wrapping: the first render left one-word last lines ("go.", "needed."). */
.s,.note,.mean,.trial{text-wrap:balance}
.wm{font-family:Fraunces;font-weight:600;font-size:42px;letter-spacing:-.02em}
main{margin:auto 0;width:100%}
.en{font-family:${DISPLAY}}
.k{font-weight:600;font-size:36px;color:${BRAND.amber};letter-spacing:.02em}
h1{margin-top:26px;font-weight:600;text-wrap:balance}
h1.en{font-size:100px;line-height:1.06}
h1.th{font-size:90px;line-height:1.32}
.s{margin-top:40px;font-size:40px;line-height:1.5;color:rgba(255,255,255,.82);max-width:860px}
.swipe{margin-top:56px;font-weight:600;font-size:34px;color:${BRAND.teal}}
.lbl{font-size:32px;color:rgba(255,255,255,.6)}
.lbl.go{color:${BRAND.teal};font-weight:600}
.from{margin-top:10px;font-family:${DISPLAY};font-weight:600;font-size:60px;line-height:1.15;color:rgba(255,255,255,.5)}
.rule{height:2px;background:rgba(255,255,255,.12);margin:52px 0}
.to{margin-top:14px;font-family:${DISPLAY};font-weight:600;font-size:100px;line-height:1.06;text-wrap:balance}
.note{margin-top:56px;padding-left:28px;border-left:4px solid ${BRAND.teal};font-size:36px;line-height:1.6;color:rgba(255,255,255,.82)}
.item+.item{margin-top:48px;padding-top:48px;border-top:2px solid rgba(255,255,255,.12)}
.k+.item{margin-top:40px}
.fit{white-space:nowrap}
.thai{font-weight:600;font-size:96px;line-height:1.35}
.rom{margin-top:6px;font-size:46px;color:${BRAND.teal}}
.mean{margin-top:16px;font-family:${DISPLAY};font-weight:600;font-size:50px;line-height:1.2}
.trial{margin-top:56px;padding:40px 44px;border-radius:28px;background:rgba(20,184,166,.14);border:2px solid rgba(20,184,166,.5);
  font-weight:600;font-size:50px;line-height:1.3}
.ask{margin-top:48px;display:flex;align-items:center;gap:36px;flex-wrap:wrap}
.btn{background:${BRAND.action};color:${BRAND.navy};font-weight:700;font-size:40px;padding:26px 52px;border-radius:18px;white-space:nowrap}
.url{font-weight:600;font-size:40px;color:${BRAND.amber}}
footer{margin-top:40px;display:flex;align-items:center;justify-content:space-between;gap:24px}
.dots{display:flex;gap:14px}
.dots i{width:14px;height:14px;border-radius:7px;background:rgba(255,255,255,.28)}
.dots i.on{width:44px;background:linear-gradient(90deg,#FFB23A,#FF6A1A)}
.key{font-size:26px;color:rgba(255,255,255,.55)}
/* Two phrases to a slide ran edge to edge at full size, kicker touching the
   lockup and note touching the footer, so a pair steps down a size. */
.two .thai{font-size:82px}
.two .mean{font-size:44px}
.two .item+.item{margin-top:40px;padding-top:40px}
.two .note{margin-top:44px}
</style></head><body>
<div class="top">${MARK}<span class="wm">LEXIS</span></div>
<main>${main}</main>
<footer><div class="dots">${Array.from({ length: n }, (_, j) => `<i class="${j === i ? 'on' : ''}"></i>`).join('')}</div>${
  lang === 'en' && i > 0 && i < n - 1 ? `<div class="key">${TONE_KEY}</div>` : ''}</footer>
</body></html>`;

// Every carousel speaks to one audience, so Thai-language copy is tagged
// lang="th" for Chromium's Thai line breaking, even on the English set.
const th = (s) => `<span lang="th">${s}</span>`;

const hookSlide = (c) => `<div class="k">${c.hook.k}</div>
  <h1 class="${c.lang}">${c.hook.h}</h1>
  <div class="s">${c.lang === 'th' ? phrases(c.hook.s) : c.hook.s}</div>
  <div class="swipe">${SWIPE[c.lang]}</div>`;

const fixSlide = (f) => `<div class="k" lang="th">${f.k}</div>
  <div class="rule" style="margin:40px 0 44px"></div>
  <div class="lbl" lang="th">${LABEL.from}</div>
  <div class="from" lang="en">${f.from}</div>
  <div class="rule"></div>
  <div class="lbl go" lang="th">${LABEL.to}</div>
  <div class="to" lang="en">${f.to}</div>
  <div class="note" lang="th">${phrases(f.note)}</div>`;

const phraseSlide = (p) => `<div class="${p.items.length > 1 ? 'two' : ''}"><div class="k">${p.k}</div>${p.items.map((it) => `
  <div class="item">
    <div class="thai fit" lang="th">${it.th}</div>
    <div class="rom fit">${it.rom}</div>
    <div class="mean">${it.en.replace(/([฀-๿]+)/g, th('$1'))}</div>
  </div>`).join('')}${p.note ? `<div class="note">${p.note.replace(/([฀-๿]+)/g, th('$1'))}</div>` : ''}</div>`;

const ctaSlide = (lang) => {
  const c = CTA[lang];
  return `<div class="k">${c.k}</div>
  <h1 class="${lang}">${c.h}</h1>
  <div class="s">${lang === 'th' ? phrases(c.s) : c.s}</div>
  <div class="trial${lang === 'en' ? ' en' : ''}">${TRIAL_LINE[lang]}</div>
  <div class="ask"><div class="btn">${c.button}</div><div class="url">${SITE[lang]}</div></div>`;
};

const slidesFor = (c) => [hookSlide(c), ...(c.fixes || c.phrases).map(c.fixes ? fixSlide : phraseSlide), ctaSlide(c.lang)];
const file = (c, i) => `${c.lang === 'th' ? 'th' : 'en'}/${c.id}-0${i + 1}.png`;
const link = (c, source) => `https://${SITE[c.lang]}?utm_source=${source}&utm_medium=social&utm_campaign=carousel-phrases&utm_content=${c.id}`;

// ---- CAPTIONS.md, written from the same objects as the slides.
function captions() {
  const md = [
    '# Phrase carousels: captions and links',
    '',
    'Generated by `brand-kit/carousel/build_phrase_carousels.mjs`. Edit the copy there and re-run;',
    'hand edits here are overwritten. Six carousels, five 1080x1350 slides each, posted in the order listed.',
    'The Thai-audience set links to `/th`. Instagram captions cannot carry a link, so the Instagram link goes',
    'in the bio or a story link sticker; the Facebook caption carries its own.',
    '',
  ];
  for (const c of CAROUSELS) {
    const cta = CTA[c.lang];
    const body = [...c.caption, cta.close].join('\n\n');
    const tags = c.hashtags.map((t) => `#${t}`).join(' ');
    md.push(
      `## ${c.id}`,
      '',
      `Audience: ${c.lang === 'th' ? 'Thai speakers practising English (copy in Thai)' : 'English speakers practising Thai (copy in English)'}`,
      '',
      'Slides, in order:',
      '',
      ...slidesFor(c).map((_, i) => `${i + 1}. \`${file(c, i)}\``),
      '',
      'Instagram caption:',
      '',
      '```text',
      `${body}\n\n${cta.igEnd}\n\n${tags}`,
      '```',
      '',
      'Facebook caption:',
      '',
      '```text',
      `${body}\n\n${link(c, 'facebook')}\n\n${tags}`,
      '```',
      '',
      `Hashtags: ${tags}`,
      '',
      'Links:',
      '',
      `- Instagram (bio or link sticker): ${link(c, 'instagram')}`,
      `- Facebook (in the caption above): ${link(c, 'facebook')}`,
      '',
    );
  }
  return md.join('\n');
}

const md = captions();
const allCopy = JSON.stringify({ CAROUSELS, CTA, SWIPE, LABEL }) + md;
const hit = allCopy.match(BANNED);
if (hit) throw new Error(`copy contains a banned term: "${hit[0]}"`);

const { chromium } = createRequire(path.join(root, 'frontend/package.json'))('playwright-core');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const pg = await b.newPage({ viewport: { width: 1080, height: 1350 } });
for (const c of CAROUSELS) {
  const slides = slidesFor(c);
  for (let i = 0; i < slides.length; i++) {
    await pg.setContent(page(c.lang, i, slides.length, slides[i]), { waitUntil: 'load' });
    await pg.evaluate(() => document.fonts.ready);
    // A Thai phrase must never wrap: a break inside a short line reads as two
    // phrases. .fit lines stay on one line and shrink to the frame instead.
    await pg.evaluate(() => {
      for (const el of document.querySelectorAll('.fit')) {
        let px = parseFloat(getComputedStyle(el).fontSize);
        while (el.scrollWidth > el.clientWidth && px > 30) el.style.fontSize = `${(px -= 2)}px`;
      }
    });
    const problems = await pg.evaluate(() => {
      const out = [];
      if (document.body.scrollHeight > 1350 || document.body.scrollWidth > 1080) out.push('page');
      for (const el of document.querySelectorAll('main *')) {
        if (getComputedStyle(el).display !== 'inline' && el.scrollWidth > el.clientWidth + 1) out.push(el.className || el.tagName);
      }
      return out;
    });
    if (problems.length) throw new Error(`${c.id} slide ${i + 1} overflows: ${problems.join(', ')}`);
    const out = path.join(OUT, file(c, i));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    await pg.screenshot({ path: out });
  }
  console.log('wrote', c.id);
}
await b.close();
fs.writeFileSync(path.join(OUT, 'CAPTIONS.md'), md);
console.log('wrote', path.join(OUT, 'CAPTIONS.md'));
