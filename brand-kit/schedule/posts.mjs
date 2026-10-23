// brand-kit/schedule/posts.mjs
//
// The posting schedule, as data. Every caption, YouTube title, LINE broadcast
// and platform-file header the owner posts from is generated from this file
// by build.mjs: brand-kit/phone/DAILY-POSTS.txt, brand-kit/phone/platforms/
// *.txt and metricool-queue.json. Edit here, run
// `node brand-kit/schedule/build.mjs`, and never hand-edit those outputs.
//
// Why this exists: before it, the same caption lived in DAILY-POSTS.txt, five
// platform files, voiceovers/README.md and LEXIS-social-copy.txt, each
// hand-typing "15 นาที". The platform files had already drifted (TikTok and
// Facebook stopped at day 8, none had days 9-13), which is the same failure
// frontend/src/content/facts.js was created to end for the site.
//
// Facts: every minute, price and add-on amount below is read from facts.js,
// never typed. The captions are functions so they read facts at build time.

import { basename } from 'node:path';
import { TRIAL, PRICING, BILLING, SPONSOR_ADDON_THB } from '../../frontend/src/content/facts.js';

// Every caption says "no card", and the headers say nothing renews. Both are
// commercial claims, so if facts.js stops making them true the build stops
// rather than publishing a queue of false captions.
if (TRIAL.cardRequired) {
  throw new Error('facts.js says the trial now needs a card, but every caption here says "no card". Rewrite the captions before rebuilding.');
}
if (BILLING.autoRenews) {
  throw new Error('facts.js says passes now auto-renew, but the platform headers and the Community captions say nothing renews. Rewrite them before rebuilding.');
}

const m = TRIAL.minutes;
const W = PRICING.weekly;
const M = PRICING.monthly;

// The trial line every practice caption ends on. Kept as one phrase so the
// wording can't fork between days.
const trialTh = () => `ทดลองฟรี ${m} นาที ไม่ต้องผูกบัตร`;
const trialEn = () => `${m} minutes free, no card`;

const TH_PRACTICE_TAGS = ['#ฝึกพูดภาษาอังกฤษ', '#เรียนภาษาอังกฤษ', '#ภาษาอังกฤษ', '#speakenglish', '#LEXIS'];
const EN_PRACTICE_TAGS = ['#learnenglish', '#speakenglish', '#englishpractice', '#LEXIS'];

// The four apps a daily slot can go to, in the order the owner posts them by
// hand (DAILY-POSTS.txt has always said TikTok first). LINE is not one of
// them: it is weekly, so it rides on a slot as `line` instead.
const ALL = ['tiktok', 'instagram', 'youtube', 'facebook'];
// English reels go where English-speaking audiences are. The TikTok account
// is set up for Thai learners (its name and bio are Thai), so they skip it.
const EN_AUDIENCE = ['instagram', 'youtube', 'facebook'];

// One slot = one reel on one day. Fields:
//   day          campaign day, 1-based. dayOffset in the queue is day - 1.
//   slot         stable id, used as utm_content. Never derived from `day`, so
//                reordering days does not change what analytics already saw.
//   media        repo path of the video that gets posted.
//   phone        name in the owner's phone pack (2-videos/dayNN-<file>).
//                Derived below unless set, because the pack is built by that rule.
//   lang         language of the main caption.
//   platforms    subset of ALL.
//   landing      site path the post links to. Must be a real route (build.mjs
//                checks frontend/src/App.jsx).
//   caption      { th, en }: the caption in each language, without any
//                "link in bio" ending. build.mjs adds the ending each app needs.
//                A second language shows under the first on Instagram and
//                Facebook only, as those pages always did.
//   hashtags     shown on TikTok and Instagram (and in DAILY-POSTS.txt).
//   youtubeTitle required when youtube is in platforms.
//   tiktokTitle  Metricool's tiktokData.title. Derived below from the reel's
//                YouTube title (without #shorts) unless set, so each reel
//                keeps one title rather than a second one written per app.
//   line         optional weekly LINE broadcast built on the same reel.
//
// Days 1-13 are DAILY-POSTS.txt as of 19 Oct 2026, wording unchanged. Days 14
// onward are the eight finished reels that were on no day.
const RAW = [
  {
    day: 1, slot: 'th-intro', media: 'brand-kit/voiceovers/lexis-vo-reel-th-intro.mp4',
    lang: 'th', platforms: ALL, landing: '/th',
    caption: {
      th: () => `รู้จัก LEXIS คู่สนทนาเสมือนสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย แค่กดปุ่มแล้วพูดออกมาจริง ๆ LEXIS ฟัง ตอบกลับทันที และช่วยแก้ให้อย่างอ่อนโยนระหว่างคุย ${trialTh()}`,
      // Instagram and Facebook carried this English line under the Thai on
      // day 1, for followers who don't read Thai yet.
      en: () => `Meet LEXIS, a virtual conversation partner for practising spoken English and Thai. Tap one button, talk out loud, get gentle corrections as you go. ${trialEn()}.`,
    },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: 'รู้จัก LEXIS คู่ฝึกพูดภาษาอังกฤษของคุณ #shorts',
    line: { week: 1, text: () => 'รู้จัก LEXIS แล้วหรือยังคะ? คู่สนทนาเสมือนที่ให้คุณฝึกพูดภาษาอังกฤษออกเสียงจริง ได้คำแนะนำระหว่างคุย' },
  },
  {
    day: 2, slot: 'th-3reasons', media: 'brand-kit/voiceovers/lexis-vo-reel-th-3reasons.mp4',
    lang: 'th', platforms: ALL, landing: '/th',
    caption: { th: () => `3 เหตุผลที่ควรลองฝึกพูดกับ LEXIS ① พูดผิดได้ ไม่มีใครตัดสิน ② ฝึกได้ทุกเวลา ไม่ต้องรอใคร ③ ได้คำแนะนำทันทีระหว่างคุย ${trialTh()}` },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: '3 เหตุผลที่ควรลองฝึกพูดกับ LEXIS #shorts',
  },
  {
    day: 3, slot: 'th-hotel', media: 'brand-kit/voiceovers/lexis-vo-reel-th.mp4',
    lang: 'th', platforms: ALL, landing: '/th/practice/hospitality-english',
    caption: { th: () => `ทำงานโรงแรม ร้านอาหาร หรือท่องเที่ยว? ซ้อมพูดภาษาอังกฤษกับแขกก่อนเจอของจริง LEXIS รับบทเป็นแขก คุณรับบทพนักงาน ${trialTh()}` },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: 'ภาษาอังกฤษสำหรับงานโรงแรม: ซ้อมกับแขกก่อนเจอจริง #shorts',
    line: { week: 3, text: () => 'ทำงานโรงแรมหรือร้านอาหาร? LEXIS รับบทเป็นแขก ให้คุณซ้อมเช็คอิน รับออร์เดอร์ และรับมือคำร้องเรียน' },
  },
  {
    day: 4, slot: 'th-interview', media: 'brand-kit/voiceovers/lexis-vo-reel-th-interview.mp4',
    lang: 'th', platforms: ALL, landing: '/th/practice/interview-english',
    caption: { th: () => `สัมภาษณ์งานเป็นภาษาอังกฤษเร็ว ๆ นี้? ซ้อมตอบคำถามออกเสียงจริงกับ LEXIS ก่อน ได้คำแนะนำระหว่างคุย ${trialTh()}` },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: 'ซ้อมสัมภาษณ์งานเป็นภาษาอังกฤษ #shorts',
    line: { week: 2, text: () => `มีสัมภาษณ์งานเป็นภาษาอังกฤษเร็ว ๆ นี้ไหมคะ? ลองซ้อมตอบคำถามกับ LEXIS ก่อน ฟรี ${m} นาที` },
  },
  {
    day: 5, slot: 'th-work', media: 'brand-kit/voiceovers/lexis-vo-reel-th-work.mp4',
    lang: 'th', platforms: ALL, landing: '/th/practice/business-english',
    caption: { th: () => `ประชุมกับทีมต่างชาติแล้วพูดไม่ออก? ซ้อมภาษาอังกฤษที่ใช้ในที่ทำงานกับ LEXIS ทั้งการประชุมและการคุยเล่นกับเพื่อนร่วมงาน ${trialTh()}` },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: 'ภาษาอังกฤษสำหรับที่ทำงาน #shorts',
  },
  {
    day: 6, slot: 'th-travel', media: 'brand-kit/voiceovers/lexis-vo-reel-th-travel.mp4',
    lang: 'th', platforms: ALL, landing: '/th/practice/travel-english',
    caption: { th: () => `เที่ยวต่างประเทศครั้งหน้า สั่งอาหาร ถามทาง เช็คอินเองได้ ซ้อมพูดภาษาอังกฤษกับ LEXIS ก่อนบิน ${trialTh()}` },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: 'ภาษาอังกฤษสำหรับเที่ยวต่างประเทศ #shorts',
  },
  {
    day: 7, slot: 'reel-th', media: 'brand-kit/reels/lexis-reel-th.mp4',
    lang: 'th', platforms: ALL, landing: '/th',
    caption: { th: () => `ฝึกพูดภาษาอังกฤษออกเสียงจริงกับ LEXIS คุยสด แก้ให้อย่างอ่อนโยนระหว่างพูด ${trialTh()}` },
    hashtags: TH_PRACTICE_TAGS,
    youtubeTitle: 'ฝึกพูดภาษาอังกฤษกับ LEXIS #shorts',
  },
  {
    day: 8, slot: 'th-community', media: 'brand-kit/voiceovers/lexis-vo-reel-th-community.mp4',
    lang: 'th', platforms: ALL, landing: '/th/community',
    // "ไม่เรียกเก็บซ้ำ" is true because the add-on rides on a one-off pass;
    // the BILLING.autoRenews check at the top guards it.
    caption: { th: () => `การฝึกของคุณ เปิดประตูให้คนอื่นได้ ตอนซื้อแพ็กเกจ LEXIS เลือกเพิ่ม ฿${SPONSOR_ADDON_THB} ได้ จ่ายรวมครั้งเดียว ไม่เรียกเก็บซ้ำ ทุกบาทเข้ากองทุนเดียวกัน เพื่อช่วยให้นักเรียนได้ฝึกพูดฟรีหรือลดราคา ผ่านโรงเรียนและกลุ่มเยาวชน` },
    hashtags: ['#LEXISCommunity', '#ฝึกพูดภาษาอังกฤษ', '#LEXIS'],
    youtubeTitle: 'LEXIS Community: การฝึกของคุณเปิดประตูให้คนอื่นได้ #shorts',
    line: { week: 4, text: () => `รู้ไหมคะ ตอนซื้อแพ็กเกจ เลือกเพิ่ม ฿${SPONSOR_ADDON_THB} ได้ เพื่อช่วยให้นักเรียนได้ฝึกพูดฟรีหรือลดราคา` },
  },
  {
    day: 9, slot: 'th-thinglish', media: 'brand-kit/voiceovers/lexis-vo-reel-th-thinglish.mp4',
    lang: 'th', platforms: ALL, landing: '/th/practice/everyday-english',
    caption: { th: () => `ประโยคไหนที่คุณพูดบ่อยที่สุด? 😂 "Open the light" "Close the air" "Check bin" ไม่ผิดนะ ฝรั่งก็พอเข้าใจ แต่ถ้าอยากพูดให้เป็นธรรมชาติ ลองซ้อมพูดกับ LEXIS ${trialTh()}` },
    hashtags: ['#ภาษาอังกฤษ', '#ฝึกพูดภาษาอังกฤษ', '#Thinglish', '#เรียนภาษาอังกฤษ'],
    youtubeTitle: 'Open the light? ประโยคภาษาอังกฤษที่คนไทยพูดบ่อย #shorts',
  },
  {
    day: 10, slot: 'th-airport', media: 'brand-kit/voiceovers/lexis-vo-reel-th-airport.mp4',
    lang: 'th', platforms: ALL, landing: '/th/practice/travel-english',
    caption: { th: () => `เซฟไว้ก่อนบิน ✈️ 4 ประโยคที่ต้องใช้ที่สนามบิน ซ้อมพูดออกเสียงจริงกับ LEXIS ${trialTh()}` },
    hashtags: ['#เที่ยวต่างประเทศ', '#ภาษาอังกฤษเที่ยว', '#สนามบิน', '#ฝึกพูดภาษาอังกฤษ'],
    youtubeTitle: '4 ประโยคภาษาอังกฤษที่ต้องใช้ที่สนามบิน #shorts',
  },
  {
    day: 11, slot: 'en-mai-mai', media: 'brand-kit/voiceovers/lexis-vo-reel-en-mai-mai.mp4',
    lang: 'en', platforms: ALL, landing: '/',
    caption: { en: () => `Six words. Almost all "mai". 😅 ไม้ใหม่ไม่ไหม้ใช่ไหม: "New wood doesn't burn, does it?" Try it out loud and tell us how it went. Practise speaking Thai with LEXIS, ${trialEn()}.` },
    hashtags: ['#LearnThai', '#ThaiLanguage', '#ThaiTones', '#Thailand', '#Expat'],
    youtubeTitle: 'ไม้ใหม่ไม่ไหม้ใช่ไหม: six words, almost all "mai" #shorts',
  },
  {
    day: 12, slot: 'en-etiquette', media: 'brand-kit/voiceovers/lexis-vo-reel-en-etiquette.mp4',
    lang: 'en', platforms: ALL, landing: '/',
    caption: { en: () => `Save this before your trip 🇹🇭 The wai, the head, the feet, and the most useful phrase in Thailand: mai pen rai. Want to say more than sawasdee? Practise speaking Thai with LEXIS, ${trialEn()}.` },
    hashtags: ['#ThailandTravel', '#ThaiCulture', '#LearnThai', '#Bangkok', '#TravelTips'],
    youtubeTitle: 'Thailand etiquette: the wai, the head, the feet #shorts',
  },
  {
    day: 13, slot: 'en-nicknames', media: 'brand-kit/voiceovers/lexis-vo-reel-en-nicknames.mp4',
    lang: 'en', platforms: ALL, landing: '/',
    // "the best" here is about Thai nicknames, not a superlative about LEXIS,
    // so the no-"best" rule doesn't reach it. Carried over as written.
    caption: { en: () => `Pancake, Benz, Golf, Pepsi 😄 Thai nicknames are the best. What's the funniest one you've heard? Practise speaking Thai with LEXIS, ${trialEn()}.` },
    hashtags: ['#ThaiCulture', '#LearnThai', '#ExpatLife', '#Thailand'],
    youtubeTitle: 'Why is your Thai colleague called Pancake? #shorts',
  },

  // ---- Days 14+: finished reels that were on no day (added 20 Oct 2026). ----
  // Order alternates audiences so no stretch of the feed is all one language,
  // and opens the English run on the intro, the same way day 1 opens the Thai.
  {
    day: 14, slot: 'en-intro', media: 'brand-kit/voiceovers/lexis-vo-reel-en-intro.mp4',
    lang: 'en', platforms: EN_AUDIENCE, landing: '/',
    // The YouTube channel's Short 8 caption, word for word.
    caption: { en: () => `Meet LEXIS, a virtual conversation partner for practising spoken English and Thai. Tap one button, talk out loud, and get gentle corrections as you go. ${trialEn()}.` },
    hashtags: ['#SpeakEnglish', '#LearnThai', '#LanguageLearning', '#LEXIS'],
    youtubeTitle: 'Meet LEXIS: practise speaking English out loud #shorts',
  },
  {
    // The purpose reel is a values piece ("build for one another", "chances
    // for all", "the gift of language") that ends on the free trial, so it
    // suits every Thai-facing app, TikTok included. Its own source
    // (reels/purpose/purpose.mjs) rules out any donation or "x% goes to"
    // line, so the caption states values only and claims nothing about money.
    day: 15, slot: 'purpose-th', media: 'brand-kit/reels/purpose/lexis-purpose-th.mp4',
    lang: 'th', platforms: ALL, landing: '/th',
    caption: { th: () => `จงสร้างเพื่อกันและกัน ภาษาคือของขวัญ และโอกาสควรเป็นของทุกคน ไม่ว่าคุณจะเริ่มจากตรงไหน LEXIS คือคู่สนทนาเสมือนสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย ${trialTh()}` },
    hashtags: ['#LEXIS', '#ฝึกพูดภาษาอังกฤษ', '#ภาษาอังกฤษ', '#เรียนภาษาอังกฤษ'],
    youtubeTitle: 'จงสร้างเพื่อกันและกัน #shorts',
    line: { week: 6, text: () => `ภาษาคือของขวัญ และโอกาสควรเป็นของทุกคนค่ะ ลองคุยกับ LEXIS ฟรี ${m} นาที ไม่ต้องผูกบัตร` },
  },
  {
    day: 16, slot: 'en-learn-thai', media: 'brand-kit/voiceovers/lexis-vo-reel-en-learn-thai.mp4',
    lang: 'en', platforms: EN_AUDIENCE, landing: '/',
    // The Facebook expat-groups caption, word for word.
    caption: { en: () => `Your Thai still stops at "sawasdee"? Practise speaking Thai out loud with LEXIS: everyday conversations, gentle corrections as you go. ${trialEn()}.` },
    hashtags: ['#LearnThai', '#ThaiLanguage', '#ExpatLife', '#Thailand', '#LEXIS'],
    youtubeTitle: 'Living in Thailand? Practise speaking Thai out loud #shorts',
  },
  {
    day: 17, slot: 'en-speaking', media: 'brand-kit/voiceovers/lexis-vo-reel-en.mp4',
    lang: 'en', platforms: EN_AUDIENCE, landing: '/',
    // Instagram's day 9 and YouTube's Short 9 caption, word for word.
    caption: { en: () => `Speaking English is a skill, and skills need reps. Talk out loud with LEXIS and get gentle corrections as you go. ${trialEn()}.` },
    hashtags: EN_PRACTICE_TAGS,
    youtubeTitle: 'Speaking is a skill. Skills need reps. #shorts',
  },
  {
    // A pitch to people who run schools, youth centres and community groups,
    // not to learners, so it goes only where those people are reachable:
    // the Facebook Page, and a LINE broadcast asking followers to pass it on.
    // LEXIS-social-copy.txt already placed it on "Facebook Page + LINE".
    // TikTok, Reels and Shorts audiences are learners, and a partner ask
    // there reads as noise.
    day: 18, slot: 'th-community-partners', media: 'brand-kit/voiceovers/lexis-vo-reel-th-community-partners.mp4',
    lang: 'th', platforms: ['facebook'], landing: '/th/community',
    caption: { th: () => 'ดูแลโรงเรียน ศูนย์เยาวชน หรือองค์กรชุมชน? LEXIS Community กำลังมองหาพันธมิตรกลุ่มแรก ให้นักเรียนได้ฝึกพูดภาษาอังกฤษออกเสียงจริง แบบลดราคาพิเศษหรือฟรีทั้งกลุ่ม เราเพิ่งเริ่มต้น และอยากคุยกับคุณ' },
    hashtags: ['#LEXISCommunity', '#LEXIS'],
    line: { week: 5, text: () => 'ดูแลโรงเรียน ศูนย์เยาวชน หรือองค์กรชุมชนอยู่หรือเปล่าคะ? LEXIS Community กำลังมองหาพันธมิตรกลุ่มแรก ให้นักเรียนได้ฝึกพูดภาษาอังกฤษออกเสียงจริง ถ้ารู้จักคนที่ดูแลอยู่ ส่งต่อให้ได้เลยนะคะ' },
  },
  {
    day: 19, slot: 'reel-en', media: 'brand-kit/reels/lexis-reel-en.mp4',
    lang: 'en', platforms: EN_AUDIENCE, landing: '/',
    // Instagram's day 10 caption, word for word.
    caption: { en: () => `Practise speaking English out loud with LEXIS, in real time, with gentle corrections. ${trialEn()}.` },
    hashtags: EN_PRACTICE_TAGS,
    youtubeTitle: 'Practise speaking English out loud with LEXIS #shorts',
  },
  {
    // Same claims as the Thai Community reel and the Community page: optional
    // add-on, one payment, one shared pool, "to help fund" (the pool has not
    // funded a cohort yet, so nothing says students already have been).
    day: 20, slot: 'en-community', media: 'brand-kit/voiceovers/lexis-vo-reel-en-community.mp4',
    lang: 'en', platforms: EN_AUDIENCE, landing: '/community',
    caption: { en: () => `Your practice can open someone else's door. Add ฿${SPONSOR_ADDON_THB} when you buy a LEXIS pass: one tap, same payment, nothing recurring. Every baht goes into one shared pool to help fund free and discounted speaking practice for students.` },
    hashtags: ['#LEXISCommunity', '#LEXIS'],
    youtubeTitle: "LEXIS Community: your practice can open someone else's door #shorts",
  },
  {
    day: 21, slot: 'purpose-en', media: 'brand-kit/reels/purpose/lexis-purpose-en.mp4',
    lang: 'en', platforms: EN_AUDIENCE, landing: '/',
    caption: { en: () => `Build for one another. Language is a gift, and chances should be for all, wherever you start. LEXIS is a virtual conversation partner for practising spoken English and Thai. ${trialEn()}.` },
    hashtags: ['#LEXIS', '#LearnEnglish', '#LearnThai', '#LanguageLearning'],
    youtubeTitle: 'Build for one another #shorts',
  },
];

const pad = (n) => String(n).padStart(2, '0');
export const SLOTS = RAW.map((s) => ({
  ...s,
  phone: s.phone ?? `2-videos/day${pad(s.day)}-${basename(s.media)}`,
  tiktokTitle: s.tiktokTitle ?? s.youtubeTitle?.replace(/\s*#shorts\s*$/i, ''),
}));

// Posts with no day: the owner fits them in once or twice a week, by hand.
// They are not in the Metricool queue because they have no slot in the
// daily rhythm, and the groups post goes from a personal profile, which
// Metricool cannot post as. build.mjs prints them at the end of the platform
// file they belong to.
export const EXTRAS = {
  instagram: [
    {
      heading: 'CAROUSEL community-th-01.png to 05.png (all 5 in one post, in order)',
      slot: 'community-carousel-th', landing: '/th/community',
      media: [1, 2, 3, 4, 5].map((i) => `brand-kit/phone/community-th-0${i}.png`),
      text: () => `LEXIS Community: การฝึกของคุณเปิดประตูให้คนอื่นได้ ปัดดูว่าเงิน ฿${SPONSOR_ADDON_THB} ที่คุณเลือกเพิ่มไปที่ไหน ลิงก์ในโปรไฟล์`,
      hashtags: ['#LEXISCommunity', '#LEXIS'],
    },
    {
      heading: 'CAROUSEL community-en-01.png to 05.png (all 5 in one post, in order)',
      slot: 'community-carousel-en', landing: '/community',
      media: [1, 2, 3, 4, 5].map((i) => `brand-kit/phone/community-en-0${i}.png`),
      text: () => `LEXIS Community: your practice can open someone else's door. Swipe to see where an optional ฿${SPONSOR_ADDON_THB} goes. Link in bio.`,
      hashtags: ['#LEXISCommunity', '#LEXIS'],
    },
    {
      // A story's link lives on a sticker, not in a caption, so the URL is
      // printed for the owner to paste into the sticker.
      heading: 'STORY launch-th-story.png or launch-en-story.png, with a link sticker to:',
      slot: 'story-launch', landing: '/',
      media: ['brand-kit/phone/launch-th-story.png', 'brand-kit/phone/launch-en-story.png'],
      linkOnly: true,
    },
  ],
  facebook: [
    {
      heading: 'ALBUM community-th-01.png to 05.png (all 5 in one post, in order)',
      slot: 'community-carousel-th', landing: '/th/community',
      media: [1, 2, 3, 4, 5].map((i) => `brand-kit/phone/community-th-0${i}.png`),
      text: () => `LEXIS Community: การฝึกของคุณเปิดประตูให้คนอื่นได้ ปัดดูว่าเงิน ฿${SPONSOR_ADDON_THB} ที่คุณเลือกเพิ่มไปที่ไหน`,
    },
    {
      heading: 'ALBUM community-en-01.png to 05.png (all 5 in one post, in order)',
      slot: 'community-carousel-en', landing: '/community',
      media: [1, 2, 3, 4, 5].map((i) => `brand-kit/phone/community-en-0${i}.png`),
      text: () => `LEXIS Community: your practice can open someone else's door. Swipe to see where an optional ฿${SPONSOR_ADDON_THB} goes.`,
    },
    {
      heading: 'EXPAT GROUPS (post from your personal profile, only in groups that allow it, max 1 group a day)\nlexis-vo-reel-en-learn-thai.mp4',
      slot: 'en-learn-thai-groups', landing: '/',
      media: ['brand-kit/voiceovers/lexis-vo-reel-en-learn-thai.mp4'],
      text: () => `Your Thai still stops at "sawasdee"? Practise speaking Thai out loud with LEXIS: everyday conversations, gentle corrections as you go. ${trialEn()}.`,
    },
  ],
};

// The RULES block every platform file opens with. "fluent in 30 days" is an
// example of a banned promise, not the monthly pass length, so it stays
// literal.
const RULES = () => `RULES FOR EVERY POST
- Never say LEXIS is a person or a teacher. She is a "virtual conversation partner" (คู่สนทนาเสมือน).
- Prices are one-off passes: ฿${W.thb} for ${W.days} days, ฿${M.thb} for ${M.days} days. Never write "per week", "per month" or "subscription".
- Free trial is ${m} minutes, no card. Don't promise anything else (no "fluent in 30 days", no reviews or user numbers).`;

const box = (title) => `========================================================
${title}
========================================================`;

// Each platform file: header (title, RULES, SETUP; the text the owner
// already set the accounts up from, kept as it was), the line that
// introduces the posts, and what to do after the last one. Profile links in
// SETUP keep their own utm_campaign (bio, page, channel, greeting): they are
// not posts, and changing them would split the analytics history.
export const PLATFORM_FILES = [
  {
    file: 'TikTok.txt', network: 'tiktok',
    header: () => `${box('LEXIS · TIKTOK')}
${RULES()}

SETUP
Profile photo: lexis-avatar.png
Username:      learnwithlexis   (if taken: learnwithlexis.th)
Name:          LEXIS ฝึกพูดอังกฤษ
Switch to:     Business account, category Education
Bio (80 max):  ฝึกพูดอังกฤษ-ไทยออกเสียงจริง คุยสด แก้ให้อย่างอ่อนโยน ทดลองฟรี ${m} นาที
Website:       https://learnwithlexis.com/th?utm_source=tiktok&utm_medium=social&utm_campaign=bio
(TikTok captions can't hold clickable links, so every caption below says ลิงก์ในโปรไฟล์ / link in bio.)`,
    intro: 'POSTS: on the day shown, at about 19:00 to 21:00 Thailand time. Pin Day 1 to the top of the profile.',
    footer: (last) => `AFTER DAY ${last}: repeat the order, or tell Claude which video did best and get more like it.`,
  },
  {
    file: 'Instagram.txt', network: 'instagram',
    header: () => `${box('LEXIS · INSTAGRAM')}
${RULES()}

SETUP
Profile photo: lexis-avatar.png
Username:      learnwithlexis   (if taken: learnwithlexis.th)
Name:          LEXIS · ฝึกพูดภาษาอังกฤษ
Account type:  Professional > Business, category Education
Bio (150 max): ฝึกพูดภาษาอังกฤษและภาษาไทยด้วยเสียงจริง คุยสดกับ LEXIS ไม่ใช่แชทบอท แก้ไขให้อย่างอ่อนโยนระหว่างพูด ทดลองฟรี ${m} นาที ไม่ต้องผูกบัตร
Link:          https://learnwithlexis.com/?utm_source=instagram&utm_medium=social&utm_campaign=bio
Link it to the Facebook Page when Instagram offers (Meta ads need both).`,
    intro: 'POSTS: Reels, on the day shown, at about 19:00 to 21:00 Thailand time. Captions: Thai first, English second. Links in a caption can\'t be clicked here, so captions end with ลิงก์ในโปรไฟล์ / Link in bio.',
    footer: (last) => `AFTER DAY ${last}: repeat the order, or tell Claude which video did best and get more like it.`,
  },
  {
    file: 'YouTube.txt', network: 'youtube',
    header: () => `${box('LEXIS · YOUTUBE SHORTS')}
${RULES()}

SETUP
Create:        youtube.com > your avatar > Create a channel > use a custom name
Channel name:  LEXIS
Handle:        @learnwithlexis
Profile photo: lexis-avatar.png
Banner:        youtube-banner.png
Description:
LEXIS is a voice conversation partner for practicing spoken English and Thai. Talk out loud, get gentle real-time corrections, and see what to work on next. Free ${m}-minute trial, no card required.
LEXIS คือคู่สนทนาสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย ทดลองฟรี ${m} นาที ไม่ต้องผูกบัตร
Link:          https://learnwithlexis.com/?utm_source=youtube&utm_medium=social&utm_campaign=channel`,
    intro: 'SHORTS: upload each video as a Short, on the day shown, at about 19:00 to 21:00 Thailand time. Not made for kids. Put the link in the description. Shorts don\'t make it clickable, so the description also says ลิงก์ในโปรไฟล์ / Link in bio: the channel Link above is the one people can tap.',
    footer: (last) => `AFTER DAY ${last}: repeat the order, or tell Claude which video did best and get more like it.`,
  },
  {
    file: 'Facebook.txt', network: 'facebook',
    header: () => `${box('LEXIS · FACEBOOK PAGE')}
${RULES()}

SETUP
Create at:     facebook.com/pages/create
Page name:     LEXIS
Category:      Education website
Profile photo: lexis-avatar.png
Cover:         facebook-cover.png
About (TH):    LEXIS คือคู่สนทนาสำหรับฝึกพูดภาษาอังกฤษและภาษาไทย พูดออกเสียงจริง รับคำแนะนำแบบเรียลไทม์อย่างอ่อนโยน ทดลองฟรี ${m} นาที ไม่ต้องผูกบัตร หลังจากนั้นจ่ายครั้งเดียว ฿${W.thb} ใช้ได้ ${W.days} วัน หรือ ฿${M.thb} ใช้ได้ ${M.days} วัน ไม่ต่ออายุอัตโนมัติ
Website:       https://learnwithlexis.com/?utm_source=facebook&utm_medium=social&utm_campaign=page
Facebook links ARE clickable, so every caption ends with its own link.`,
    intro: 'PAGE POSTS: Reels, on the day shown, at about 19:00 to 21:00 Thailand time.',
    footer: (last) => `AFTER DAY ${last}: repeat the order, or tell Claude which video did best and get more like it.`,
  },
  {
    file: 'LINE.txt', network: 'line',
    header: () => `${box('LEXIS · LINE OFFICIAL ACCOUNT')}
${RULES()}

SETUP (manager.line.biz, sign in with your LINE)
Account name:   LEXIS ฝึกพูดอังกฤษ
Status message: ฝึกพูด ฟรี ${m} นาที
Profile photo:  lexis-avatar.png
Cover:          line-cover.png

GREETING MESSAGE (sent automatically when someone adds you)
สวัสดีค่ะ ขอบคุณที่เพิ่ม LEXIS เป็นเพื่อนนะคะ
LEXIS คือคู่สนทนาเสมือนสำหรับฝึกพูดภาษาอังกฤษและภาษาไทยออกเสียงจริง คุยสด และแก้ไขให้อย่างอ่อนโยนระหว่างพูด
เริ่มทดลองฟรี ${m} นาที ไม่ต้องผูกบัตร
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=greeting
หลังจากนั้นจ่ายครั้งเดียว ฿${W.thb} ใช้ได้ ${W.days} วัน หรือ ฿${M.thb} ใช้ได้ ${M.days} วัน ไม่มีการต่ออายุอัตโนมัติ`,
    intro: 'BROADCASTS: once a week at most (more and people block you). Attach the video named.',
    footer: (last) => `AFTER WEEK ${last}: start again from Week 1, or tell Claude which broadcast got the most taps and get more like it.`,
  },
];
