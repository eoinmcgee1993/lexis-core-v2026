#!/usr/bin/env node
//
// LEXIS copy checker: customer-facing marketing copy, checked against
// frontend/src/content/facts.js and the written marketing rules.
//
//   node scripts/check-copy.mjs                  every in-scope file in this checkout
//   node scripts/check-copy.mjs --root=<dir>     the same scope, under another checkout
//   node scripts/check-copy.mjs <file|dir>...    exactly these files; SCOPE and EXCLUDE ignored
//   node scripts/check-copy.mjs --now=<date>     judge the launch offer as if it were <date>
//   node scripts/check-copy.mjs --self-test      run the fixtures in scripts/check-copy.fixtures/
//
// Prints `file:line: message [rule]` for each violation. Exits 1 if there
// are any (or an EXCLUDE entry has gone stale), 0 if there are none, 2 if
// it could not run at all.
//
// WHY THIS EXISTS
//
// facts.js was created because the trial was once described three
// incompatible ways at the same time ("Free 30-minute trial" in the hero,
// "3 Practice Sessions (30 Mins)" on the pricing card, "a free 30-minute
// trial" in the FAQ and JSON-LD) while the backend enforced 15 minutes, and
// once JSON-LD existed the wrong number was being published as
// machine-readable fact. The site fixed that by importing every number from
// one file. Marketing copy cannot: it is plain text pasted by hand into
// TikTok, LINE, Meta and Google, so every price and trial length in
// brand-kit/ is typed again and drifts the same way. OUTREACH-DRAFTS.md is
// the proof. It still said "฿199/week" and "subscriber" weeks after passes
// stopped renewing on 2 Sep 2026.
//
// The rules were written down in four places (CLAUDE.md's scope section,
// ADVERTISING.md's ground rules, the RULES header on every
// brand-kit/phone/platforms file, .claude/skills/feedback) and enforced by
// nobody except whoever happened to re-read the copy. This makes a break
// fail a pull request instead.
//
// Copy here makes commercial claims, so a wrong word is a wrong fact, not a
// style slip. "/week", "subscription" or "cancel anytime" tells a buyer how
// they will be charged, and nothing renews: Stripe cannot take PromptPay in
// subscription mode, so passes are one-off (facts.js BILLING). "Unlimited"
// is contradicted by the disclosed fair-use allowance (facts.js FAIR_USE).
// Calling LEXIS a person or a teacher implies a human is speaking, which
// CLAUDE.md forbids outright. Naming tutors or language schools pitches to
// competitors.
//
// The numbers are imported from facts.js at run time, never copied here.
// Changing a price there turns every caption that still quotes the old one
// red in the same pull request, which is the point.
//
// This is a copy checker, not a linter. It reads only the customer-facing
// files in SCOPE. Engineering docs (CLAUDE.md, UNIT-ECONOMICS.md and the
// rest) are deliberately not in scope, because they have to discuss the
// subscription history to explain it.

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const FIXTURES_DIR = join(SCRIPT_DIR, 'check-copy.fixtures');
const FACTS_REL = 'frontend/src/content/facts.js';

// ---------------------------------------------------------------------------
// Scope
// ---------------------------------------------------------------------------

// Globs rather than a file list, so a caption file someone adds next week is
// checked the day it lands instead of the day someone remembers to list it.
const SCOPE = [
  'brand-kit/phone/**/*.txt',
  'brand-kit/voiceovers/*.md',
  'brand-kit/**/CAPTIONS.md',
  'brand-kit/line/**/*.md',
  'brand-kit/ads/**/*.{md,csv,txt}',
  'brand-kit/schedule/**/*.{json,md}',
  'brand-kit/README.md',
  'ADVERTISING.md',
  'OUTREACH-DRAFTS.md',
];

// Permanently out of scope. These match a SCOPE glob but are not LEXIS copy.
const OUT_OF_SCOPE = [
  // A separate business's recruiting material. It quotes its own prices
  // ("$5,000 ต่อเดือน"), and LEXIS rules do not apply to it.
  'brand-kit/dr-hiring/**',
  // Negative-keyword lists have to name tutor and language-school terms in
  // order to stop the ads matching them. They are never shown to anyone.
  'brand-kit/ads/**/negatives*',
];

// Known compliance debt, not scope. Every entry needs a reason and must be
// removed once the file is fixed. An entry that no longer suppresses
// anything FAILS the run. A warning would scroll past in CI, and a stale
// whole-file entry would then keep hiding that file's next regression
// forever.
//
// There is deliberately no whole-file entry. OUTREACH-DRAFTS.md had one
// while its compliance pass was in review, and a whole-file entry hides the
// file's NEXT regression too, so the cleanup (#143) has to land first
// instead.
//
// `path` alone excludes the whole file. `rule` narrows it to one rule and
// `line` to lines containing that exact text, independently. The rest of
// the file stays checked, which is why the brand-kit/README.md entries are
// phrases and not the file.
const EXCLUDE = [
  {
    path: 'brand-kit/README.md',
    rule: 'competitor',
    line: "she is the tutor's avatar",
    reason:
      '§0 is guidance to the owner, not posted copy, but it calls LEXIS "the tutor". ' +
      'Reword to "conversation partner", then remove this entry.',
  },
  {
    path: 'brand-kit/README.md',
    rule: 'competitor',
    line: "the product's tutor persona",
    reason: 'Same §0 wording as above. Reword, then remove this entry.',
  },
  {
    path: 'brand-kit/README.md',
    rule: 'human',
    line: 'assumes she is a real teacher',
    reason:
      'Describes the misreading the owner should avoid rather than making the claim. ' +
      'A pattern cannot tell those apart, so this is a narrow, deliberate allowance.',
  },
];

// ---------------------------------------------------------------------------
// Exemptions for text that quotes or names a rule
// ---------------------------------------------------------------------------
//
// Rule text has to name the phrases it bans: 'Never write "per week"'. Two
// narrow exemptions let it, and nothing else does.
//
// 1. Quoted phrases after a rule cue. A cue is a negation plus a verb of
//    writing ("never write", "don't say", "no copy may say", "ห้ามใช้").
//    Quoted text AFTER the cue on that line is ignored by every rule.
//    Unquoted text, and anything before the cue, is still checked. A bare
//    negation is not a cue, because "Don't wait!", "Never miss" and
//    ห้ามพลาด are sales openers, and on those lines the quote that follows
//    is the claim.
const NEGATION_CUE =
  /\b(?:never|don['’]t|do not|must not|should not|shouldn['’]t)\s+(?:write|say|use|promise|claim|imply|call|put)\b|\bavoid(?:ing)?\b(?=\s*["“\\])|\bnothing (?:says|may say)\b|\bno copy (?:may|should|can) (?:say|use)\b|ห้าม(?:เขียน|พูด|ใช้)|อย่า(?:เขียน|พูด|ใช้)/i;
//
// 2. RULES blocks. A plain-text line starting with uppercase "RULES" (the
//    "RULES FOR EVERY POST" header on brand-kit/phone/platforms/*.txt) runs
//    to the next blank line. A Markdown heading that STARTS with "Rules",
//    "Ground rules" or "Copy rules" (ADVERTISING.md, the voiceovers README)
//    covers only the first paragraph or list under it. A heading that merely
//    contains the word ("## Posting rules") is not one, and nothing after
//    the first blank line of the block is exempt, because a caption section
//    under an innocently named heading is still posted copy. Inside one, the PHRASE
//    rules are skipped and quoted text is ignored, but the FACT rules still
//    run. A RULES header is pasted into every new platform file, so a stale
//    price or trial length there is the one most likely to spread.

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------

function buildRules(facts) {
  const { PRICING, FAIR_USE } = facts;
  const passes = Object.values(PRICING)
    .map((p) => `"฿${p.thb} for ${p.days} days"`)
    .join(' or ');
  const fairUse = Object.entries(FAIR_USE)
    .map(([tier, f]) => `${f.minutes} min per ${PRICING[tier].days}-day pass`)
    .join(', ');

  const recurring = (what) =>
    `${what} reads as a recurring charge. Passes are one-off and nothing renews ` +
    `(facts.js BILLING.autoRenews is false). Say ${passes}.`;
  const human =
    'implies a human is speaking. LEXIS is a virtual conversation partner (คู่สนทนาเสมือน).';
  const competitor =
    'names a competitor. LEXIS copy never pitches to or mentions tutors or language ' +
    'schools (CLAUDE.md). Plain "school"/"โรงเรียน" is fine.';

  // `priceTied` rules fire only within PRICE_GAP characters of a ฿/THB
  // amount. "post 1-2 a week" and "once a week at most" are posting cadence,
  // not prices, and both are in the phone kit today.
  //
  // `negatable` rules skip a match directly after "not"/"never"/"ไม่ใช่".
  // "She is not a real person" is exactly the disclosure the rule wants.
  // Competitor rules are deliberately not negatable: "not a tutor" still
  // names tutors.
  return [
    { id: 'recurring', re: /(?<![A-Za-z])\/\s?(?:week|wk|month|mo|mth)\b/gi, msg: (m) => recurring(`"${m}"`) },
    { id: 'recurring', re: /\bper\s+(?:week|wk|month|mo)\b/gi, msg: (m) => recurring(`"${m}"`) },
    // "฿199 for a week" describes the 7-day pass accurately; "฿199 a week" is
    // a rate.
    { id: 'recurring', re: /(?<!\bfor\s+)\b(?:a|each|every)\s+(?:week|month)\b/gi, priceTied: true, msg: (m) => recurring(`"${m}" next to a price`) },
    {
      id: 'recurring',
      re: /\b(?:weekly|monthly)\s+(?:plans?|subscriptions?|billing|memberships?|fees?)\b/gi,
      msg: (m) => recurring(`"${m}"`) + ' The products are the Weekly Pass and Monthly Pass.',
    },
    {
      id: 'recurring',
      re: /\bsubscri(?:be|bes|bed|bing|bers?|ptions?)\b/gi,
      // "Subscribe for more" on a YouTube channel is not a billing claim.
      // Allowed only in that exact sense.
      allow: (line, end) => /^\s+(?:to\s+(?:the\s+|our\s+|my\s+)?channel|for\s+more)\b/i.test(line.slice(end)),
      msg: (m) => recurring(`"${m}"`),
    },
    {
      id: 'recurring',
      re: /\bcancel(?:led|ling)?\s+(?:any\s?time|at\s+any\s+time|whenever)\b|ยกเลิก(?:ได้)?(?:ทุกเมื่อ|ตลอดเวลา|เมื่อไหร่ก็ได้)/gi,
      msg: (m) => `"${m}": there is nothing to cancel, because a pass is one charge that never renews (facts.js BILLING).`,
    },
    {
      id: 'recurring',
      // แพ็กเกจรายเดือน / แพ็กเกจรายสัปดาห์ are the passes' own Thai names on
      // the pricing page (PricingPage.jsx, structuredData.js), the Thai
      // equivalent of "Monthly Pass". The same word after a price ("฿599
      // รายเดือน") is "฿599 monthly", which is the claim this rule exists for.
      re: /ต่อ\s?(?:เดือน|สัปดาห์|อาทิตย์)|\/\s?(?:เดือน|สัปดาห์|อาทิตย์)|(?<!แพ็?[กค]เกจ\s?)ราย(?:เดือน|สัปดาห์)/g,
      priceTied: true,
      msg: (m) => recurring(`"${m}" next to a price`),
    },
    {
      id: 'volume',
      // ไม่จำกัดอายุ ("no age limit") is not a volume claim.
      re: /\bunlimited\b|ไม่จำกัด(?!อายุ|วัย)/gi,
      msg: (m) =>
        `"${m}" is contradicted by the disclosed fair-use allowance (facts.js FAIR_USE: ${fairUse}). ` +
        'Quote the minutes or say nothing about volume.',
    },
    { id: 'human', re: /\b(?:real|actual|live)[\s-]+(?:person|people|humans?|teachers?)\b/gi, negatable: true, msg: (m) => `"${m}" ${human}` },
    { id: 'human', re: /\bhuman[\s-]+(?:teachers?|coach(?:es)?|partners?|beings?)\b/gi, negatable: true, msg: (m) => `"${m}" ${human}` },
    {
      id: 'human',
      re: /\b(?:a|an|your|our|my|his|her|their)\s+(?:(?:own|private|personal|native|patient|friendly|qualified|english|thai)\s+)?teachers?\b/gi,
      negatable: true,
      msg: (m) => `"${m}" ${human}`,
    },
    {
      id: 'human',
      // คนจริงจัง ("serious person") and คนจริงใจ ("sincere person") contain
      // คนจริง, and Thai has no word boundaries to tell them apart. ครูสอนพิเศษ
      // ("private tutor") is left to the competitor rule.
      re: /คุณครู|ครูของ(?:คุณ|ฉัน|ผม|เรา|เขา|เธอ|หนู)|ครูส่วนตัว|ครูเจ้าของภาษา|ครูต่างชาติ|ครูฝรั่ง|ครูสอน(?!พิเศษ)|คนจริง(?!จัง|ใจ)|มนุษย์จริง/g,
      negatable: true,
      msg: (m) => `"${m}" ${human}`,
    },
    {
      id: 'outcome',
      // ADVERTISING.md ground rule 3: nothing claims fluency, a score, a job
      // or a timeframe, because there is no evidence for any of them yet.
      // Narrow on purpose. "Practise for your job interview" is what the
      // interview topic sells; "pass your interview" is the promise.
      re: new RegExp(
        [
          '\\bfluent(?:ly)?\\s+(?:in|within)\\s+(?:\\d+|a|one|two|three|four|six|twelve|thirty|sixty|ninety)\\s+(?:days?|weeks?|months?)\\b',
          '\\b(?:become|get|be)\\s+fluent\\b',
          '\\bguarantee(?:d|s)?\\b',
          '\\b(?:get|land|win|secure)\\s+(?:(?:the|a|your|that)\\s+)?(?:dream\\s+|new\\s+)?job\\b',
          '\\bget\\s+hired\\b',
          '\\bpass\\s+(?:your|the|an?)\\s+(?:[a-z]+\\s+)?(?:interview|exam|test)\\b',
          '\\b(?:raise|boost|improve|increase)\\s+your\\s+(?:[a-z]+\\s+)?(?:score|band)\\b',
          '\\b(?:IELTS|TOEIC|TOEFL)\\s+(?:score|band)\\b',
          'พูดคล่อง(?:ใน|ภายใน)',
          'คล่อง(?:ใน|ภายใน)\\s*\\d+\\s*(?:วัน|สัปดาห์|เดือน)',
          'รับประกัน',
          '(?<!ใช้)ได้งาน',
          'สอบผ่าน',
        ].join('|'),
        'gi'
      ),
      negatable: true,
      msg: (m) => `"${m}" is an outcome promise (fluency, a score, a job or a timeframe). There is no evidence for one yet (ADVERTISING.md ground rule 3).`,
    },
    { id: 'competitor', re: /\btutor(?:s|ing|ed)?\b/gi, msg: (m) => `"${m}" ${competitor}` },
    { id: 'competitor', re: /\blanguage[\s-]+(?:schools?|cent(?:re|er)s?|institutes?|academ(?:y|ies))\b/gi, msg: (m) => `"${m}" ${competitor}` },
    { id: 'competitor', re: /ติวเตอร์|โรงเรียนสอนภาษา|สถาบันสอนภาษา|ศูนย์สอนภาษา|กวดวิชา|ครูสอนพิเศษ/g, msg: (m) => `"${m}" ${competitor}` },
  ];
}

const PRICE_GAP = 12;
// "Free 15-minute trial", "15 minutes free", "ทดลองฟรี 15 นาที": real trial
// phrasings put the number within a few characters of the trial word. The
// loosest one in the repo is OUTREACH-DRAFTS.md's "30 minutes of exactly
// that, free" (18). Much wider and the trial word starts pairing with the
// fair-use minutes in "450 minutes for 30 days, or try it free" (24).
const TRIAL_GAP = 20;

const EN_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40,
  fifty: 50, sixty: 60, ninety: 90,
};
const TH_DIGITS = { หนึ่ง: 1, เอ็ด: 1, ยี่: 2, สอง: 2, สาม: 3, สี่: 4, ห้า: 5, หก: 6, เจ็ด: 7, แปด: 8, เก้า: 9 };
const EN_REST_SRC =
  '(?:twenty|thirty|forty|fifty|sixty|ninety)(?:[-\\s](?:one|two|three|four|five|six|seven|eight|nine))?|' +
  Object.keys(EN_NUMBERS).sort((a, b) => b.length - a.length).join('|');
const EN_NUM_SRC = `(?:a|one)\\s+hundred(?:\\s+(?:and\\s+)?(?:${EN_REST_SRC}))?|${EN_REST_SRC}`;
const TH_UNIT_SRC = 'หนึ่ง|สอง|สาม|สี่|ห้า|หก|เจ็ด|แปด|เก้า';
const TH_REST_SRC = `(?:ยี่|${TH_UNIT_SRC})?สิบ(?:เอ็ด|${TH_UNIT_SRC})?|${TH_UNIT_SRC}|เอ็ด`;
// Hundreds matter even though no trial is that long: without them
// "หนึ่งร้อยสิบห้านาที" (115) reads as สิบห้า (15) and passes.
const TH_NUM_SRC = `(?:${TH_UNIT_SRC})?ร้อย(?:${TH_REST_SRC})?|${TH_REST_SRC}`;

// Spelled-out numbers count because the voiceover scripts spell them for
// the narrator ("Try it free for fifteen minutes", "ทดลองฟรีสิบห้านาที"),
// and those are exactly the lines nobody re-reads when the number changes.
// The optional "free" covers "fifteen free minutes".
const MINUTES_RE = new RegExp(
  `(?<![\\d.,])\\b(\\d+|${EN_NUM_SRC})\\s*-?\\s*(?:free\\s+)?(?:minutes?|mins?)\\b|(\\d+|${TH_NUM_SRC})\\s*นาที`,
  'gi'
);
// "stress-free", "hands-free" and "feel free" are not offers.
const TRIAL_WORD_RE = /(?<![\w-]|feel\s)free\b(?!-)|\btrials?\b|ฟรี|ทดลอง/gi;
const AMOUNT_SRC = '((?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?)';
const PRICE_RE = new RegExp(
  `฿\\s?${AMOUNT_SRC}|\\bTHB\\s?${AMOUNT_SRC}|(?<![\\d.,])${AMOUNT_SRC}\\s?(?:THB\\b|บาท|baht\\b)`,
  'gi'
);
// Sentence and table-cell boundaries. Thai has no sentence punctuation, so a
// Thai line is one segment and the TRIAL_GAP does the work.
const SEGMENT_BREAK_RE = /[.!?](?=\s|$)|[|·•;]/g;

// A minutes figure this close to a pass's name, price, length or period is
// a statement of that pass's fair-use allowance. #143's outreach copy puts
// it 8 characters away ("150 minutes on the 7-day pass").
const FAIR_GAP = 24;
const TH_PERIOD = { week: 'สัปดาห์', month: 'เดือน' };

// SPONSOR_ADDON_THB is the Community add-on, not a pass price, so ฿50 is
// accepted only beside the words the site and kit use for the add-on (on
// its line or the one before or after: #143's "What ฿50 does" heading has
// "the sponsor tick box" directly under it), and never directly beside a
// pass's name or length ("Weekly Pass ฿50", "฿50 for 7 days").
const ADDON_CONTEXT_RE = /community|sponsor|add-?on|optional|pay[- ]it[- ]forward|\bfunds?\b|\badd(?:s|ed|ing)?\b|checkout|ชุมชน|เลือกเพิ่ม|สนับสนุน|กองทุน|นักเรียน/i;
const ADDON_TIER_GAP = 5;

// "No card required" is the trial's own promise, so these are checked
// against TRIAL.cardRequired in whichever direction it points, near a
// trial word. ไม่ต้องผูกบัตร contains ต้องผูกบัตร; the lookbehind keeps it.
const CARD_REQUIRED_RE = /\b(?:credit\s+|debit\s+)?cards?\s+(?:is\s+|are\s+)?(?:required|needed|necessary)\b|\brequires?\s+(?:a\s+)?(?:credit\s+|debit\s+)?card\b|(?<!ไม่)ต้อง(?:ใช้|ผูก)บัตร/gi;
const NO_CARD_RE = /\bno\s+(?:credit\s+|debit\s+)?card\b|\bwithout\s+a\s+card\b|ไม่ต้อง(?:ใช้|ผูก)บัตร/gi;
const CARD_GAP = 40;

// The launch creatives print the offer price and code into the pixels
// (frontend/scripts/images/generate_brand_kit_social.mjs, and the
// brand-kit/phone copies), and an image cannot be read here. So after the
// offer ends, any copy that names one fails, whatever the image says, unless
// the same line or paragraph marks it retired. ADVERTISING.md keeps the
// files "as a record and ... not for use" and that wording is the exemption.
// Lowercase only, so LAUNCH-ACTION-PLAN.md is not a creative.
const LAUNCH_CREATIVE_RE = /\blaunch-(?:\*|\{|en\b|th\b)[\w{},*.\/-]*/g;
const RETIRED_RE = /\bexpire[sd]?\b|\bretired?\b|\bas a record\b|\bnot for use\b|\bdo not (?:use|post|schedule)\b|ห้ามใช้|หมดอายุ/i;

const negatedBefore = (text, start) => {
  const before = text.slice(Math.max(0, start - 24), start);
  return /(?:\bnot|n['’]t|\bnever|\bno|\bwithout)\s+(?:[\w'’]+\s+){0,2}$/i.test(before) || /(?:ไม่ใช่|ไม่ต้องมี|ไม่ต้อง|ไม่มี)\s*$/.test(before);
};

function parseNumber(s) {
  if (/^\d+$/.test(s)) return Number(s);
  const lower = s.toLowerCase().replace(/\s+/g, ' ');
  const enHundred = lower.match(/^(?:a|one) hundred(?: (?:and )?(.+))?$/);
  if (enHundred) return 100 + (enHundred[1] ? parseNumber(enHundred[1]) : 0);
  if (/^[a-z]/.test(lower)) return lower.split(/[-\s]/).reduce((n, w) => n + EN_NUMBERS[w], 0);
  const thHundred = s.match(new RegExp(`^(${TH_UNIT_SRC})?ร้อย(.*)$`));
  if (thHundred) return (thHundred[1] ? TH_DIGITS[thHundred[1]] : 1) * 100 + (thHundred[2] ? parseNumber(thHundred[2]) : 0);
  const m = s.match(new RegExp(`^(?:(ยี่|${TH_UNIT_SRC})?(สิบ))?(เอ็ด|${TH_UNIT_SRC})?$`));
  if (!m) return NaN;
  return (m[2] ? (m[1] ? TH_DIGITS[m[1]] : 1) * 10 : 0) + (m[3] ? TH_DIGITS[m[3]] : 0);
}

// ---------------------------------------------------------------------------
// Masking: blank out text that is a reference, not copy
// ---------------------------------------------------------------------------
//
// Every mask replaces characters with spaces of the same length, so the
// reported line numbers and the gap arithmetic stay true to the source.

const blank = (s) => ' '.repeat(s.length);

// URLs, email addresses, file names and single-token code spans are
// references. `lexis-tutor-photo.jpg` is a real file and "utm_campaign=..."
// is a tag, not a claim. Bare paths are not masked: "฿199/week" has the same
// shape as "schedule/week" and must still be caught. The letter lookbehind
// on the "/week" rule keeps the path from matching instead.
const REFERENCE_RE = new RegExp(
  [
    'https?:\\/\\/\\S+',
    '\\S+@\\S+\\.\\w+',
    '\\b[\\w.-]+\\.(?:com|net|org|io|ai|co|th|app|dev|school|biz)\\b(?:[/?#]\\S*)?',
    '(?:[\\w.~-]+\\/)*[\\w.~{},*-]+\\.(?:png|jpe?g|webp|gif|svg|mp4|mov|mp3|wav|md|txt|json|csv|html?|m?js|jsx|py|pdf)\\b',
    '`[^`\\s]+`',
  ].join('|'),
  'gi'
);

// What counts as a quote depends on the file. In JSON every string value is
// already in quotes, so only escaped quotes (\"...\") are quotation inside
// the copy, and in CSV a quote inside a field is doubled (""...""). Treating
// the outer quotes as quotation would exempt every caption on a JSON line
// that happens to say "never".
function quoteRe(ext) {
  if (ext === '.json') return /\\"(?:(?!\\").)*\\"|“[^”]*”/g;
  if (ext === '.csv') return /""(?:(?!"").)*""|“[^”]*”/g;
  return /"[^"]*"|“[^”]*”/g;
}

const thaiDigitsToArabic = (s) => s.replace(/[๐-๙]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0x0e50 + 48));

function ruleBlockLines(lines, ext) {
  const inBlock = new Set();
  if (ext === '.json' || ext === '.csv') return inBlock;
  for (let i = 0; i < lines.length; i++) {
    const heading = ext === '.md' && lines[i].match(/^#{1,6}\s+(?:\d+\.\s*)?(?:ground\s+|copy\s+)?rules\b/i);
    if (heading) {
      let j = i;
      inBlock.add(j++);
      while (j < lines.length && lines[j].trim() === '') inBlock.add(j++);
      while (j < lines.length && lines[j].trim() !== '' && !/^#/.test(lines[j])) inBlock.add(j++);
      i = j - 1;
    } else if (/^RULES\b/.test(lines[i])) {
      let j = i;
      while (j < lines.length && lines[j].trim() !== '') inBlock.add(j++);
      i = j - 1;
    }
  }
  return inBlock;
}

// ---------------------------------------------------------------------------
// Checking
// ---------------------------------------------------------------------------

const matchesOf = (re, text) => [...text.matchAll(re)].map((m) => ({ m, start: m.index, end: m.index + m[0].length }));
const gapBetween = (a, b) => Math.max(0, b.start - a.end, a.start - b.end);

// Markdown hard-wraps its paragraphs, so "LEXIS is 30" / "minutes of
// exactly that, free" is one sentence on two lines. A line-by-line check
// misses it, and OUTREACH-DRAFTS.md has that exact case. So in Markdown a
// line is joined to the one before it (with a space, which keeps every
// offset) when it is plainly the same sentence continuing: it starts with a
// lowercase letter, a digit, a backtick, ฿ or a quote, and the line before
// did not end one. Anything looser merges the one-caption-per-line .md
// files in scope and pairs a trial word in one caption with a number in the
// next. Wraps that start with a capital ("LEXIS ...") are missed, a false
// negative chosen over a false red. Other formats are never joined.
const BLOCK_START_RE = /^\s*(?:[-*+]\s|\d+[.)]\s|#|\||>|```)/;
const CONTINUATION_RE = /^\s*[a-z0-9`฿"“(]/;

function units(lines, ext, inRules) {
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;
    const unit = { first: i, last: i };
    while (
      ext === '.md' &&
      unit.last + 1 < lines.length &&
      CONTINUATION_RE.test(lines[unit.last + 1]) &&
      !BLOCK_START_RE.test(lines[unit.last + 1]) &&
      !/^\s*(?:#|\|)/.test(lines[unit.last]) &&
      !/[.!?]\s*$/.test(lines[unit.last]) &&
      inRules.has(unit.last + 1) === inRules.has(i)
    ) unit.last++;
    out.push(unit);
    i = unit.last;
  }
  return out;
}

function checkText(text, relPath, ctx) {
  const { facts, rules, now } = ctx;
  const ext = extname(relPath).toLowerCase();
  const lines = text.replace(/^﻿/, '').split(/\r?\n/);
  const inRules = ruleBlockLines(lines, ext);
  const out = [];
  const seen = new Set();

  const launchActive = facts.launchOfferActive(now);
  const launchPrice = Number(facts.LAUNCH_OFFER_PRICE_THB);
  const known = new Map(Object.entries(facts.PRICING).map(([tier, p]) => [p.thb, `${tier} pass`]));
  known.set(facts.SPONSOR_ADDON_THB, 'Community add-on');
  const knownList = [...known].map(([thb, what]) => `฿${thb} (${what})`).join(', ');
  const codeRe = new RegExp(`\\b${escapeRe(facts.LAUNCH_OFFER.code)}\\b`, 'gi');
  const tierAnchors = Object.entries(facts.PRICING).flatMap(([tier, p]) =>
    [
      ['name', `\\b${tier}\\s+pass\\b`],
      ['price', `฿\\s?${p.thb}(?!\\d|\\.\\d)`],
      ['days', `\\b${p.days}[\\s-]*days?\\b|${p.days}\\s*วัน`],
      ['period', `\\ba\\s+${p.period}\\b`],
      ...(TH_PERIOD[p.period] ? [['name', `แพ็?[กค]เกจราย${TH_PERIOD[p.period]}`]] : []),
    ].map(([kind, src]) => ({ tier, kind, re: new RegExp(src, 'gi') }))
  );

  // Masking is per source line (a cue only exempts quotes on its own
  // line), and happens before lines are joined into units. Two versions:
  // the phrase and trial rules read `masked`, with references blanked. The
  // price and launch-code rules read `factual`, with references left in,
  // because "?promo=LEXIS50" or `LEXIS50` in a link or code span is exactly
  // what stops working when the offer ends. Both are the same length, so
  // one set of offsets serves both.
  const unquote = (t, i) => {
    if (inRules.has(i)) return t.replace(quoteRe(ext), blank);
    const cue = NEGATION_CUE.exec(t);
    if (!cue) return t;
    const end = cue.index + cue[0].length;
    return t.slice(0, end) + t.slice(end).replace(quoteRe(ext), blank);
  };
  const normal = lines.map(thaiDigitsToArabic);
  const masked = normal.map((t, i) => unquote(t.replace(REFERENCE_RE, blank), i));
  const factual = normal.map((t, i) => unquote(t, i));

  for (const { first, last } of units(lines, ext, inRules)) {
    const text = masked.slice(first, last + 1).join(' ');
    const factText = factual.slice(first, last + 1).join(' ');
    const lineStarts = [];
    for (let i = first, at = 0; i <= last; at += masked[i].length + 1, i++) lineStarts.push(at);
    const lineAt = (pos) => first + lineStarts.filter((s) => s <= pos).length - 1;
    const report = (pos, rule, message) => {
      const i = lineAt(pos);
      const key = `${i}:${rule}:${pos}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ file: relPath, line: i + 1, rule, message, text: lines[i] });
    };
    const prices = matchesOf(PRICE_RE, factText);
    const breaks = matchesOf(SEGMENT_BREAK_RE, text).map((b) => b.start);
    const segment = (pos) => breaks.filter((b) => b < pos).length;
    const anchors = tierAnchors.flatMap(({ tier, kind, re }) => matchesOf(re, text).map((a) => ({ ...a, tier, kind })));
    const nearestAnchor = (hit, maxGap, kinds) => {
      let best = null;
      for (const a of anchors) {
        if ((kinds && !kinds.includes(a.kind)) || segment(a.start) !== segment(hit.start)) continue;
        const gap = gapBetween(hit, a);
        if (gap <= maxGap && (!best || gap < best.gap)) best = { a, gap };
      }
      return best?.a;
    };
    const trialWords = matchesOf(TRIAL_WORD_RE, text);

    if (!inRules.has(first)) {
      for (const rule of rules) {
        for (const hit of matchesOf(rule.re, text)) {
          if (rule.allow?.(text, hit.end)) continue;
          if (rule.priceTied && !prices.some((p) => segment(p.start) === segment(hit.start) && gapBetween(hit, p) <= PRICE_GAP)) continue;
          if (rule.negatable && negatedBefore(text, hit.start)) continue;
          report(hit.start, rule.id, rule.msg(hit.m[0]));
        }
      }
    }

    // Prices. Every ฿/THB amount must be one facts.js knows. The launch
    // price is valid only while launchOfferActive(), the same gate the
    // pricing page uses, so a static caption cannot keep advertising a code
    // that stopped working.
    for (const p of prices) {
      const raw = p.m[1] ?? p.m[2] ?? p.m[3];
      const amount = Number(raw.replace(/,/g, ''));
      if (amount === facts.SPONSOR_ADDON_THB && !Object.values(facts.PRICING).some((t) => t.thb === amount)) {
        const around = factual.slice(Math.max(0, first - 1), last + 2).join(' ');
        const tier = nearestAnchor(p, ADDON_TIER_GAP, ['name', 'days']);
        if (tier || !ADDON_CONTEXT_RE.test(around)) {
          report(p.start, 'price',
            `"${p.m[0].trim()}" is the Community add-on (facts.js SPONSOR_ADDON_THB), not a pass price. ` +
            (tier ? `Here it sits beside the ${tier.tier} pass.` : 'Say what it is: Community, sponsor, add-on, เลือกเพิ่ม.'));
        }
        continue;
      }
      if (known.has(amount)) continue;
      if (amount === launchPrice) {
        if (!launchActive) {
          report(p.start, 'launch',
            `"${p.m[0].trim()}" is the ${facts.LAUNCH_OFFER.code} launch price, and the offer ended at ` +
            `${facts.LAUNCH_OFFER.endsAt} (facts.js LAUNCH_OFFER.endsAt). Pull this line.`);
        }
        continue;
      }
      report(p.start, 'price',
        `"${p.m[0].trim()}" is not a LEXIS price. facts.js knows ${knownList}` +
        `${launchActive ? `, and ฿${facts.LAUNCH_OFFER_PRICE_THB} (launch offer, until ${facts.LAUNCH_OFFER.endsAt})` : ''}.`);
    }
    if (!launchActive) {
      for (const c of matchesOf(codeRe, factText)) {
        report(c.start, 'launch',
          `"${c.m[0]}" is the launch code, and the offer ended at ${facts.LAUNCH_OFFER.endsAt} ` +
          '(facts.js LAUNCH_OFFER.endsAt). Pull this line.');
      }
      if (!RETIRED_RE.test(factText)) {
        for (const c of matchesOf(LAUNCH_CREATIVE_RE, factText)) {
          report(c.start, 'launch',
            `"${c.m[0].replace(/[.,]+$/, '')}" is a launch-offer creative. The price and code are printed in the image, and the offer ` +
            `ended at ${facts.LAUNCH_OFFER.endsAt}. Point this at an evergreen creative, or mark the file retired.`);
        }
      }
    }

    // Card. The trial's "no card" is a fact too (facts.js TRIAL.cardRequired).
    const cardRe = facts.TRIAL.cardRequired ? NO_CARD_RE : CARD_REQUIRED_RE;
    for (const c of matchesOf(cardRe, text)) {
      if (!trialWords.some((w) => gapBetween(c, w) <= CARD_GAP)) continue;
      if (!facts.TRIAL.cardRequired && negatedBefore(text, c.start)) continue;
      report(c.start, 'card',
        `"${c.m[0]}" next to the trial, but facts.js TRIAL.cardRequired is ${facts.TRIAL.cardRequired}: ` +
        `the trial ${facts.TRIAL.cardRequired ? 'does' : 'does not'} need a card.`);
    }

    // Trial length. Each trial word is paired with the nearest minutes
    // figure in its own sentence, and only if it is within TRIAL_GAP
    // characters. Anchoring on the word rather than the number is what
    // keeps "15 minutes free, then 150 minutes" from flagging the 150.
    const minutes = matchesOf(MINUTES_RE, text);
    if (minutes.length) {
      for (const word of trialWords) {
        let best = null;
        for (const mn of minutes) {
          if (segment(mn.start) !== segment(word.start)) continue;
          const gap = gapBetween(word, mn);
          if (gap <= TRIAL_GAP && (!best || gap < best.gap)) best = { mn, gap };
        }
        if (!best) continue;
        const value = parseNumber(best.mn.m[1] ?? best.mn.m[2]);
        if (value !== facts.TRIAL.minutes) {
          report(best.mn.start, 'trial',
            `"${best.mn.m[0].replace(/\s+/g, ' ').trim()}" next to a free-trial word, but the trial is ` +
            `${facts.TRIAL.minutes} minutes (facts.js TRIAL.minutes).`);
        }
      }

      // Fair use. A minutes figure that belongs to the trial is the trial
      // rule's business. Any other one beside a pass is that pass's
      // allowance and must equal FAIR_USE for its tier.
      for (const mn of minutes) {
        if (trialWords.some((w) => segment(w.start) === segment(mn.start) && gapBetween(w, mn) <= TRIAL_GAP)) continue;
        const anchor = nearestAnchor(mn, FAIR_GAP);
        if (!anchor) continue;
        const allowance = facts.FAIR_USE[anchor.tier]?.minutes;
        const value = parseNumber(mn.m[1] ?? mn.m[2]);
        if (allowance !== undefined && value !== allowance) {
          report(mn.start, 'fair-use',
            `"${mn.m[0].replace(/\s+/g, ' ').trim()}" next to the ${anchor.tier} pass ("${anchor.m[0]}"), but its ` +
            `fair-use allowance is ${allowance} minutes (facts.js FAIR_USE.${anchor.tier}).`);
        }
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Files
// ---------------------------------------------------------------------------

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Enough glob for SCOPE: `**/` (zero or more directories), `*`, `{a,b}`.
// Written out because Node 22's fs.glob is still experimental and this
// script must run with no npm install.
function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') {
      if (glob[i + 2] === '/') { re += '(?:[^/]+/)*'; i += 2; } else { re += '.*'; i += 1; }
    } else if (c === '*') re += '[^/]*';
    else if (c === '{') {
      const end = glob.indexOf('}', i);
      re += `(?:${glob.slice(i + 1, end).split(',').map(escapeRe).join('|')})`;
      i = end;
    } else re += escapeRe(c);
  }
  return new RegExp(`^${re}$`);
}

function walk(dir, base, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, base, acc);
    else if (entry.isFile()) acc.push(relative(base, full).split(sep).join('/'));
  }
  return acc;
}

function scopedFiles(root) {
  const outOfScope = OUT_OF_SCOPE.map(globToRegExp);
  const files = new Set();
  for (const glob of SCOPE) {
    const re = globToRegExp(glob);
    // Walk only the static prefix of each glob, not the whole repo.
    const parts = glob.split('/');
    const staticDir = parts.slice(0, parts.findIndex((p) => /[*{]/.test(p))).join('/');
    const candidates = /[*{]/.test(glob) ? walk(join(root, staticDir), root) : existsSync(join(root, glob)) ? [glob] : [];
    for (const f of candidates) if (re.test(f) && !outOfScope.some((o) => o.test(f))) files.add(f);
  }
  return [...files].sort();
}

const COPY_EXTENSIONS = new Set(['.txt', '.md', '.csv', '.json']);

function explicitFiles(args) {
  const files = [];
  for (const arg of args) {
    const full = resolve(arg);
    if (!existsSync(full)) throw new Error(`no such file or directory: ${arg}`);
    if (statSync(full).isDirectory()) {
      for (const f of walk(full, process.cwd())) if (COPY_EXTENSIONS.has(extname(f).toLowerCase())) files.push(f);
    } else files.push(relative(process.cwd(), full).split(sep).join('/'));
  }
  return files;
}

function applyExclusions(violations) {
  const used = new Set();
  const kept = violations.filter((v) => {
    let suppressed = false;
    EXCLUDE.forEach((e, i) => {
      if (e.path !== v.file || (e.rule && e.rule !== v.rule) || (e.line && !v.text.includes(e.line))) return;
      used.add(i);
      suppressed = true;
    });
    return !suppressed;
  });
  return { kept, stale: EXCLUDE.filter((_, i) => !used.has(i)) };
}

async function loadFacts(root) {
  // A checkout under --root is checked against its own facts.js, so a
  // branch that changes a price is judged by the price it ships.
  const own = join(root, FACTS_REL);
  return import(pathToFileURL(existsSync(own) ? own : join(REPO_ROOT, FACTS_REL)).href);
}

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------
//
// A checker whose pattern quietly stops matching passes CI green forever,
// which is the failure this script was written to end. So the fixtures in
// scripts/check-copy.fixtures/ pin both directions: a line ending in
// "⟵ rule[, rule]" (rule ids may contain hyphens) must produce exactly those rules, and every other line
// must produce nothing. Markers are blanked before checking. Fixtures under
// expired/ are judged one millisecond after the launch offer ends and the
// rest one millisecond before, so the result never depends on today's date.
// TRIAL.cardRequired is pinned the same way (see card-required/).
//
// Fixtures never type a price or a trial length. They write {{weekly}},
// {{trial}}, {{wrongTrial}} and so on, filled in from facts.js, for the same
// reason backend/test/fair-use.test.mjs asserts against live constants:
// retuning a price must not turn the self-test red, or worse, quietly turn
// a "must be flagged" line into a correct one.

const EN_WORDS = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven',
  'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS_WORDS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const TH_WORDS = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
const spellEn = (n) => (n < 20 ? EN_WORDS[n] : EN_TENS_WORDS[Math.floor(n / 10)] + (n % 10 ? `-${EN_WORDS[n % 10]}` : ''));
const spellTh = (n) => {
  const tens = Math.floor(n / 10), units = n % 10;
  const t = tens === 0 ? '' : tens === 1 ? 'สิบ' : tens === 2 ? 'ยี่สิบ' : `${TH_WORDS[tens]}สิบ`;
  return t + (units === 1 && tens ? 'เอ็ด' : TH_WORDS[units]);
};
const thaiDigits = (n) => String(n).replace(/\d/g, (d) => String.fromCharCode(0x0e50 + Number(d)));

function fixtureValues(facts) {
  const known = new Set([...Object.values(facts.PRICING).map((p) => p.thb), facts.SPONSOR_ADDON_THB]);
  let wrongPrice = facts.PRICING.weekly.thb + 50;
  while (known.has(wrongPrice) || wrongPrice === Number(facts.LAUNCH_OFFER_PRICE_THB)) wrongPrice++;
  // 30 is the trial length the site once advertised in three places.
  const trial = facts.TRIAL.minutes;
  const wrongTrial = trial === 30 ? 20 : 30;
  return {
    trial, 'trial.en': spellEn(trial), 'trial.th': spellTh(trial),
    wrongTrial, 'wrongTrial.en': spellEn(wrongTrial), 'wrongTrial.th': spellTh(wrongTrial),
    'wrongTrial.thdigits': thaiDigits(wrongTrial),
    weekly: facts.PRICING.weekly.thb, weeklyDays: facts.PRICING.weekly.days,
    monthly: facts.PRICING.monthly.thb, monthlyDays: facts.PRICING.monthly.days,
    addon: facts.SPONSOR_ADDON_THB, launch: facts.LAUNCH_OFFER_PRICE_THB, code: facts.LAUNCH_OFFER.code,
    wrongPrice,
    fairWeekly: facts.FAIR_USE.weekly.minutes, fairMonthly: facts.FAIR_USE.monthly.minutes,
    wrongFair: facts.FAIR_USE.weekly.minutes + facts.FAIR_USE.monthly.minutes,
  };
}

async function selfTest() {
  const facts = await import(pathToFileURL(join(REPO_ROOT, FACTS_REL)).href);
  const rules = buildRules(facts);
  const values = fixtureValues(facts);
  const endsAt = Date.parse(facts.LAUNCH_OFFER.endsAt);
  const failures = [];
  let expectedCount = 0;
  const fixtures = walk(FIXTURES_DIR, FIXTURES_DIR);
  for (const rel of fixtures) {
    const expected = new Set();
    const text = readFileSync(join(FIXTURES_DIR, rel), 'utf8')
      .replace(/\{\{([\w.]+)\}\}/g, (_, key) => {
        if (!(key in values)) throw new Error(`${rel}: unknown fixture placeholder {{${key}}}`);
        return String(values[key]);
      })
      .split('\n')
      .map((line, i) => line.replace(/\s*⟵\s*([\w,\s-]+)$/, (marker, ids) => {
        for (const id of ids.split(',')) expected.add(`${i + 1}:${id.trim()}`);
        return blank(marker);
      }))
      .join('\n');
    expectedCount += expected.size;
    const now = rel.startsWith('expired/') ? endsAt + 1 : endsAt - 1;
    // Pinned like `now`, so flipping TRIAL.cardRequired in facts.js does
    // not invert half the fixtures: card-required/ is judged with it true,
    // everything else with it false.
    const cardRequired = rel.startsWith('card-required/');
    const f = { ...facts, TRIAL: { ...facts.TRIAL, cardRequired } };
    const got = new Set(checkText(text, rel, { facts: f, rules, now }).map((v) => `${v.line}:${v.rule}`));
    for (const e of expected) if (!got.has(e)) failures.push(`${rel}:${e.split(':')[0]}: expected [${e.split(':')[1]}], not reported`);
    for (const g of got) if (!expected.has(g)) failures.push(`${rel}:${g.split(':')[0]}: unexpected [${g.split(':')[1]}]`);
  }
  if (!fixtures.length) failures.push(`no fixtures found in ${relative(process.cwd(), FIXTURES_DIR)}`);
  for (const f of failures) console.log(f);
  console.log(
    failures.length
      ? `check-copy self-test: ${failures.length} failure(s)`
      : `check-copy self-test: ${fixtures.length} fixtures, ${expectedCount} expected violations, all matched, nothing extra`
  );
  return failures.length ? 1 : 0;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(argv) {
  const opts = { root: REPO_ROOT, now: Date.now(), paths: [], selfTest: false };
  for (const arg of argv) {
    if (arg === '--self-test') opts.selfTest = true;
    else if (arg.startsWith('--root=')) opts.root = resolve(arg.slice(7));
    else if (arg.startsWith('--now=')) {
      opts.now = Date.parse(arg.slice(6));
      if (Number.isNaN(opts.now)) throw new Error(`--now: not a date: ${arg.slice(6)}`);
    } else if (arg.startsWith('--')) throw new Error(`unknown option: ${arg}`);
    else opts.paths.push(arg);
  }
  if (opts.selfTest) return selfTest();

  const facts = await loadFacts(opts.root);
  const rules = buildRules(facts);
  const explicit = opts.paths.length > 0;
  const base = explicit ? process.cwd() : opts.root;
  const files = explicit ? explicitFiles(opts.paths) : scopedFiles(opts.root);

  // Fail closed on an empty scan. Zero files means the globs or --root are
  // wrong, and "0 violations" would be a green tick that checked nothing.
  if (!files.length) throw new Error(`no in-scope copy files found under ${opts.root}`);

  let violations = files.flatMap((f) => checkText(readFileSync(join(base, f), 'utf8'), f, { facts, rules, now: opts.now }));
  let stale = [];
  // An explicit path is a request to see everything in it, EXCLUDE
  // included. That is how the OUTREACH-DRAFTS.md fix gets checked before
  // its entry comes out.
  if (!explicit) ({ kept: violations, stale } = applyExclusions(violations));

  for (const v of violations) console.log(`${v.file}:${v.line}: ${v.message} [${v.rule}]`);
  for (const e of stale) {
    console.log(`scripts/check-copy.mjs: EXCLUDE entry for ${e.path}${e.line ? ` ("${e.line}")` : ''} no longer suppresses anything. Remove it. [stale-exclude]`);
  }
  const excluded = explicit ? [] : [...new Set(EXCLUDE.filter((e) => !e.line).map((e) => e.path))];
  const tail = excluded.length ? ` (excluded pending fixes: ${excluded.join(', ')})` : '';
  const flagged = new Set(violations.map((v) => v.file)).size;
  const staleNote = stale.length ? `, and ${stale.length} stale EXCLUDE entr${stale.length === 1 ? 'y' : 'ies'} to remove` : '';
  console.log(
    violations.length
      ? `check-copy: ${violations.length} violation(s) in ${flagged} of ${files.length} file(s)${staleNote}${tail}`
      : `check-copy: ${files.length} file(s) clean${staleNote}${tail}`
  );
  return violations.length || stale.length ? 1 : 0;
}

main(process.argv.slice(2)).then(
  (code) => process.exit(code),
  (err) => {
    console.error(`check-copy: ${err.message}`);
    process.exit(2);
  }
);
