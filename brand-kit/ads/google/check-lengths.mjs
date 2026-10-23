#!/usr/bin/env node
// brand-kit/ads/google/check-lengths.mjs
//
// Validates the Google Search kit in this folder before anyone pastes it
// into Google Ads Editor. Exits 1 on any problem, printing file, row and
// field. Written to gate CI like the backend suites; until it is wired into
// .github/workflows/test.yml (outside this folder), a facts.js price change
// is only caught when someone runs it.
//
//   node brand-kit/ads/google/check-lengths.mjs          # checks this folder
//   node brand-kit/ads/google/check-lengths.mjs <dir>    # checks a copy
//
// Why a script and not "Editor will tell you": Editor does flag an
// over-long headline, but only after import, one ad at a time, and it says
// nothing about the things that cost money silently — a final URL pointing
// at a route that 404s into the English landing page, a utm_content that
// no longer matches its ad group (PR #140 started storing it, so reports
// now group by it), a price that drifted from facts.js, or a negative
// keyword that blocks one of our own keywords.
//
// HOW CHARACTERS ARE COUNTED, and what is and isn't confirmed. Google's
// help (support.google.com/google-ads/answer/1704389 and the ads policy
// page answer/14848297, both read 19 Oct 2026) says double-width languages
// count two per character and names Chinese, Japanese and Korean, in a list
// it calls non-exhaustive. Thai is not named. Unicode gives Thai East
// Asian Width "N" (neutral), not "W" (wide), the property "double-width"
// describes, so Thai counts single here. What Google does NOT document is
// whether Thai's combining vowels and tone marks (ั ิ ี ่ ้ ...) count on
// their own. This script counts every code point, marks included, which is
// the stricter of the two possible readings: a headline that passes here
// cannot be too long under either one. CJK and full-width forms count two.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const DIR = resolve(process.argv[2] || HERE);

// facts.js is the one source for prices, pass lengths and the trial; the
// copy here quotes those numbers, so the check reads them rather than
// repeating them (CLAUDE.md: "Facts live in exactly one place").
const { PRICING, TRIAL, FAIR_USE, BILLING } = await import(
  new URL('../../../frontend/src/content/facts.js', import.meta.url)
);

// Google's published limits: RSA headlines 30, descriptions 90, display
// paths 15; sitelink text 25 and each sitelink description line 35;
// keywords 80 characters and 10 words; final URLs 2048.
const LIMITS = {
  headline: 30,
  description: 90,
  path: 15,
  linkText: 25,
  linkDescription: 35,
  keyword: 80,
  keywordWords: 10,
  url: 2048
};

const SITE = 'https://learnwithlexis.com';
// The shared paid-media tagging contract (ADVERTISING.md "Link tagging", as
// updated by PR #139): every paid channel uses medium=paid and
// campaign=evergreen, so reports group Google beside Meta and TikTok. The
// TH/EN split rides in utm_content's prefix instead.
const UTM_FIXED = { utm_source: 'google', utm_medium: 'paid', utm_campaign: 'evergreen' };
// PR #140 stores utm_content as `cnt`; lowercase and URL-safe so the value
// stored is the value typed, with nothing for a browser to re-encode.
const UTM_CONTENT_RE = /^[a-z0-9._-]+$/;

const problems = [];
const fail = (where, msg) => problems.push(`${where}: ${msg}`);

// ---- character width --------------------------------------------------------
const WIDE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}　-〿！-｠￠-￦]/u;
export const googleLength = (s) => Array.from(s).reduce((n, ch) => n + (WIDE.test(ch) ? 2 : 1), 0);

// ---- CSV ---------------------------------------------------------------------
// RFC 4180 with quoted fields, enough for what Editor and Sheets export.
// A hand parser rather than a dependency: brand-kit has no package.json,
// and nothing here should need an install to run.
function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Returns [{ __row, ...fields }]. Unknown headers fail rather than being
// ignored: "Headline16" or "Descripton 2" would import as an unmapped
// column and the copy in it would silently never run.
function loadCsv(name, allowed, required) {
  const path = join(DIR, name);
  if (!existsSync(path)) { fail(name, 'file missing'); return []; }
  const raw = readFileSync(path, 'utf8');
  if (raw.charCodeAt(0) === 0xfeff) fail(name, 'starts with a byte-order mark; save as plain UTF-8');
  // Number rows before dropping blank ones, so a reported row is the row
  // a spreadsheet shows, even after a stray blank line from an export.
  const rows = parseCsv(raw).map((cells, i) => ({ cells, line: i + 1 }))
    .filter((r) => r.cells.some((f) => f !== ''));
  const [first, ...body] = rows;
  if (!first) { fail(name, 'empty'); return []; }
  const header = first.cells;
  header.forEach((h) => { if (!allowed.includes(h)) fail(`${name} header`, `unknown column "${h}"`); });
  required.forEach((h) => { if (!header.includes(h)) fail(`${name} header`, `missing column "${h}"`); });
  return body.map(({ cells, line }) => {
    if (cells.length !== header.length) {
      fail(`${name} row ${line}`, `${cells.length} fields, header has ${header.length}`);
    }
    const o = { __row: line };
    header.forEach((h, j) => (o[h] = (cells[j] ?? '')));
    return o;
  });
}

// ---- routes ------------------------------------------------------------------
// Read the live switch in App.jsx rather than a list kept here, so a page
// that is renamed or removed fails this check instead of quietly sending
// paid clicks to the default branch.
const appSrc = readFileSync(join(REPO, 'frontend/src/App.jsx'), 'utf8');
const ROUTES = new Set([...appSrc.matchAll(/case\s+'([^']+)'\s*:/g)].map((m) => m[1]));
// '/' has no case of its own; it is the switch's default branch. Only
// counted as real while that default still renders the landing page.
if (/default:\s*return\s+<LandingPage\b/.test(appSrc)) ROUTES.add('/');

// ---- text checks -------------------------------------------------------------
const prices = new Map(Object.values(PRICING).map((p) => [p.thb, p.days]));
const passDays = new Set(Object.values(PRICING).map((p) => p.days));
const factMinutes = new Set([TRIAL.minutes, ...Object.values(FAIR_USE).map((f) => f.minutes)]);

function checkText(where, field, value, limit, { headline = false } = {}) {
  const at = `${where} ${field}`;
  const len = googleLength(value);
  if (len > limit) fail(at, `${len}/${limit} chars "${value}"`);
  if (value !== value.trim()) fail(at, 'leading or trailing space');
  if (/\s{2,}/.test(value)) fail(at, 'double space');
  // Google editorial policy: no emoji, no "!" in a headline, at most one
  // in a description, no repeated punctuation.
  if (/\p{Extended_Pictographic}/u.test(value)) fail(at, 'emoji are disapproved in Search ads');
  if (headline && value.includes('!')) fail(at, '"!" is not allowed in a headline');
  if ((value.match(/!/g) || []).length > 1) fail(at, 'more than one "!"');
  if (/([!?.,])\1/.test(value)) fail(at, 'repeated punctuation');

  // Every number that is a commercial claim must be one facts.js holds.
  for (const m of value.matchAll(/฿\s?(\d[\d,]*)/g)) {
    const thb = Number(m[1].replace(/,/g, ''));
    if (!prices.has(thb)) fail(at, `฿${thb} is not a price in facts.js PRICING`);
  }
  // A price must buy the days facts.js says, written either way round:
  // "฿199 ใช้ได้ 7 วัน" / "฿199 for 7 days", or "7 วัน ฿199" (the sitelink
  // form). Both numbers existing somewhere in facts.js is not enough —
  // "7 วัน ฿599" would pass that and be false.
  const num = (x) => Number(x.replace(/,/g, ''));
  const pairs = [
    ...[...value.matchAll(/฿\s?(\d[\d,]*)\s*(?:ใช้ได้|for)\s*(\d+)/gi)].map((m) => [num(m[1]), num(m[2])]),
    ...[...value.matchAll(/(\d+)\s*-?\s*(?:days?|วัน)\s*(?:for\s*)?฿\s?(\d[\d,]*)/gi)].map((m) => [num(m[2]), num(m[1])])
  ];
  for (const [thb, days] of pairs) {
    if (prices.has(thb) && prices.get(thb) !== days) {
      fail(at, `฿${thb} buys ${prices.get(thb)} days in facts.js, copy says ${days}`);
    }
  }
  // Minutes are either the trial or a fair-use allowance, and which one is
  // decided by context: in a line about the free trial, only TRIAL.minutes
  // is true. Accepting any minute figure facts.js holds would let "free
  // 150-minute trial" through because 150 is a real (fair-use) number.
  const trialContext = /free|trial|ฟรี|ทดลอง/i.test(value);
  for (const m of value.matchAll(/(\d+)\s*-?\s*(?:minutes?|mins?|นาที)/gi)) {
    const n = Number(m[1]);
    if (trialContext ? n !== TRIAL.minutes : !factMinutes.has(n)) {
      fail(at, trialContext
        ? `${n} minutes in a trial line; facts.js TRIAL.minutes is ${TRIAL.minutes}`
        : `${n} minutes matches nothing in facts.js`);
    }
  }
  // The trial is measured in minutes, so any trial stated in days is false
  // however plausible the number (a 7 or 30 would pass the pass-length test).
  if (/\d+\s*-?\s*days?\s+(?:free\s+)?trial|free\s+\d+\s*-?\s*days?|(?:ทดลอง(?:ใช้)?(?:ฟรี)?|ฟรี)\s*\d+\s*วัน/i.test(value)) {
    fail(at, `trial stated in days; facts.js TRIAL is ${TRIAL.minutes} minutes`);
  }
  for (const m of value.matchAll(/(\d+)\s*-?\s*(?:days?|วัน)/gi)) {
    if (!passDays.has(Number(m[1]))) fail(at, `${m[1]} days is not a pass length in facts.js`);
  }
  if (/no card|ไม่ต้องผูกบัตร/i.test(value) && TRIAL.cardRequired) {
    fail(at, 'says no card is needed but facts.js TRIAL.cardRequired is true');
  }
  if (/nothing (auto-)?renews|no auto-renew|ไม่ต่ออายุ/i.test(value) && BILLING.autoRenews) {
    fail(at, 'says nothing renews but facts.js BILLING.autoRenews is true');
  }
}

function checkUrl(where, value, { lang, content }) {
  const at = `${where} Final URL`;
  if (googleLength(value) > LIMITS.url) fail(at, `longer than ${LIMITS.url}`);
  let u;
  try { u = new URL(value); } catch { fail(at, `not a URL "${value}"`); return ''; }
  if (u.origin !== SITE) fail(at, `must be on ${SITE}, got ${u.origin}`);
  if (!ROUTES.has(u.pathname)) fail(at, `path ${u.pathname} is not a route in frontend/src/App.jsx`);
  // A Thai-language ad landing on an English page (or the reverse) is the
  // ad-to-page mismatch ADVERTISING.md ground rule 5 exists to prevent.
  const thaiPage = u.pathname === '/th' || u.pathname.startsWith('/th/');
  if (lang === 'th' && !thaiPage) fail(at, `Thai campaign must land on a /th page, got ${u.pathname}`);
  if (lang === 'en' && thaiPage) fail(at, `English campaign must not land on ${u.pathname}`);
  if (u.hash) fail(at, 'fragment in final URL');

  const keys = [...u.searchParams.keys()];
  const expected = [...Object.keys(UTM_FIXED), 'utm_content'];
  if (keys.length !== expected.length || !expected.every((k) => keys.includes(k))) {
    fail(at, `query must be exactly ${expected.join(', ')}; got ${keys.join(', ') || 'none'}`);
  }
  for (const [k, v] of Object.entries(UTM_FIXED)) {
    if (u.searchParams.get(k) !== v) fail(at, `${k} must be "${v}", got "${u.searchParams.get(k)}"`);
  }
  const cnt = u.searchParams.get('utm_content') || '';
  if (!UTM_CONTENT_RE.test(cnt)) fail(at, `utm_content "${cnt}" must be lowercase [a-z0-9._-]`);
  if (content instanceof RegExp ? !content.test(cnt) : cnt !== content) {
    fail(at, `utm_content "${cnt}" should be ${content}`);
  }
  return u.pathname;
}

// ---- campaigns.csv -----------------------------------------------------------
const H = Array.from({ length: 15 }, (_, i) => `Headline ${i + 1}`);
const D = Array.from({ length: 4 }, (_, i) => `Description ${i + 1}`);
const CAMP_COLS = ['Campaign', 'Campaign Type', 'Networks', 'Budget', 'Bid Strategy Type', 'Languages',
  'Location', 'Location ID', 'Campaign Status', 'Ad Group', 'Ad Group Status', 'Ad type', ...H, ...D,
  'Path 1', 'Path 2', 'Final URL', 'Status'];
const camp = loadCsv('campaigns.csv', CAMP_COLS, ['Campaign', 'Ad Group', 'Final URL', ...H.slice(0, 3), ...D.slice(0, 2)]);

const campaigns = new Map(); // name -> { lang, code }
const adGroups = new Map(); // `${campaign}\t${group}` -> { ads, keywords }
const key = (c, g) => `${c}\t${g}`;

for (const r of camp) {
  const where = `campaigns.csv row ${r.__row}`;
  const isAd = r['Ad type'] !== '' || r['Final URL'] !== '' || r['Headline 1'] !== '';
  if (r['Campaign Type'] !== '') {
    // Campaign row. Names carry the language code so every URL check and
    // utm_content prefix can be derived from them.
    const m = /^lexis-(th|en)-[a-z0-9-]+$/.exec(r.Campaign);
    if (!m) fail(where, `campaign name "${r.Campaign}" must look like lexis-th-... or lexis-en-...`);
    if (r.Languages !== (m ? m[1] : '')) fail(where, `Languages "${r.Languages}" should be "${m && m[1]}"`);
    if (r['Campaign Type'] !== 'Search') fail(where, 'Campaign Type must be Search');
    // No budget, no bids, and paused: the kit is copy and structure, not a
    // media plan (ADVERTISING.md "What is deliberately not here"). Paused
    // means an import, even an accidental "Post", cannot start spending.
    if (r.Budget !== '') fail(where, 'Budget must stay blank; the owner sets it in Editor');
    if (r['Bid Strategy Type'] !== '') fail(where, 'Bid Strategy Type must stay blank; the owner sets it');
    if (r['Campaign Status'] !== 'Paused') fail(where, 'Campaign Status must be Paused');
    if (campaigns.has(r.Campaign)) fail(where, `duplicate campaign "${r.Campaign}"`);
    campaigns.set(r.Campaign, { lang: r.Languages, code: m ? m[1] : '', locations: 0 });
  } else if (r.Location !== '' || r['Location ID'] !== '') {
    if (!campaigns.has(r.Campaign)) fail(where, `location for unknown campaign "${r.Campaign}"`);
    else campaigns.get(r.Campaign).locations++;
    // Thailand's geo target ID is 2764 (Google's country IDs are 2000 + the
    // ISO 3166 numeric code, 764). Both are given; they must agree.
    if (r.Location !== 'Thailand' || r['Location ID'] !== '2764') {
      fail(where, `expected Thailand / 2764, got "${r.Location}" / "${r['Location ID']}"`);
    }
  } else if (!isAd) {
    const c = campaigns.get(r.Campaign);
    if (!c) fail(where, `ad group for unknown campaign "${r.Campaign}"`);
    // The ad group name is the utm_content value, so it obeys its charset
    // and carries its campaign's language prefix.
    if (!UTM_CONTENT_RE.test(r['Ad Group'])) fail(where, `ad group "${r['Ad Group']}" must be lowercase [a-z0-9._-]`);
    if (c && !r['Ad Group'].startsWith(`${c.code}-`)) fail(where, `ad group "${r['Ad Group']}" should start "${c.code}-"`);
    if (adGroups.has(key(r.Campaign, r['Ad Group']))) fail(where, `duplicate ad group "${r['Ad Group']}"`);
    adGroups.set(key(r.Campaign, r['Ad Group']), { ads: 0, keywords: 0 });
  } else {
    const label = `${where} [${r['Ad Group']}]`;
    const c = campaigns.get(r.Campaign);
    const g = adGroups.get(key(r.Campaign, r['Ad Group']));
    if (!g) fail(label, 'ad for an ad group with no ad group row above it');
    else g.ads++;
    if (r['Ad type'] !== 'Responsive search ad') fail(label, 'Ad type must be "Responsive search ad"');

    const heads = H.map((h) => [h, r[h]]).filter(([, v]) => v !== '');
    const descs = D.map((d) => [d, r[d]]).filter(([, v]) => v !== '');
    // Google needs at least 3 headlines and 2 descriptions for an RSA.
    if (heads.length < 3) fail(label, `${heads.length} headlines, RSA needs at least 3`);
    if (descs.length < 2) fail(label, `${descs.length} descriptions, RSA needs at least 2`);
    heads.forEach(([f, v]) => checkText(label, f, v, LIMITS.headline, { headline: true }));
    descs.forEach(([f, v]) => checkText(label, f, v, LIMITS.description));
    for (const [list, kind] of [[heads, 'headline'], [descs, 'description']]) {
      const seen = new Set();
      for (const [f, v] of list) {
        if (seen.has(v.toLowerCase())) fail(`${label} ${f}`, `duplicate ${kind} "${v}"`);
        seen.add(v.toLowerCase());
      }
    }
    if (r['Path 2'] && !r['Path 1']) fail(label, 'Path 2 set without Path 1');
    for (const p of ['Path 1', 'Path 2']) {
      if (r[p]) checkText(label, p, r[p], LIMITS.path);
      if (/[\s/]/.test(r[p])) fail(`${label} ${p}`, 'no spaces or slashes in a display path');
    }
    checkUrl(label, r['Final URL'], { lang: c?.lang, content: r['Ad Group'] });
  }
}

// ---- keywords.csv ------------------------------------------------------------
const kw = loadCsv('keywords.csv', ['Campaign', 'Ad Group', 'Keyword', 'Criterion Type', 'Status'],
  ['Campaign', 'Ad Group', 'Keyword', 'Criterion Type']);
const positives = [];
const seenKw = new Set();
// Characters Google rejects in keyword text.
const BAD_KW_CHARS = /[!@%^*()={};~`<>?\\|,]/;
for (const r of kw) {
  const where = `keywords.csv row ${r.__row} [${r['Ad Group']}]`;
  const g = adGroups.get(key(r.Campaign, r['Ad Group']));
  if (!g) fail(where, `unknown campaign/ad group "${r.Campaign}" / "${r['Ad Group']}"`);
  else g.keywords++;
  // Broad is allowed by the format but deliberately unused: with no budget
  // history, broad match spends on loose variants before anyone has read a
  // search-terms report. Phrase and exact keep the first weeks legible.
  if (!['Phrase', 'Exact'].includes(r['Criterion Type'])) {
    fail(where, `Criterion Type "${r['Criterion Type']}" — use Phrase or Exact`);
  }
  const text = r.Keyword;
  if (/^["[]|["\]]$/.test(text)) fail(where, 'put the match type in Criterion Type, not quotes or brackets');
  checkKeywordText(where, text);
  const id = `${r.Campaign}\t${text.toLowerCase()}\t${r['Criterion Type']}`;
  // The same keyword twice in one campaign makes two ad groups bid against
  // each other for one query.
  if (seenKw.has(id)) fail(where, `"${text}" (${r['Criterion Type']}) appears twice in ${r.Campaign}`);
  seenKw.add(id);
  positives.push({ where, text: norm(text) });
}

function norm(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }
function checkKeywordText(where, text) {
  if (googleLength(text) > LIMITS.keyword) fail(where, `${googleLength(text)}/${LIMITS.keyword} chars "${text}"`);
  if (text.trim().split(/\s+/).length > LIMITS.keywordWords) fail(where, `more than ${LIMITS.keywordWords} words`);
  if (BAD_KW_CHARS.test(text)) fail(where, `character Google rejects in "${text}"`);
  if (text !== text.trim() || /\s{2,}/.test(text)) fail(where, 'stray whitespace');
}

// A campaign with no location row imports targeting every country, and
// would spend worldwide the moment it is unpaused. Exactly one: Thailand.
for (const [name, c] of campaigns) {
  if (c.locations !== 1) fail(`campaigns.csv [${name}]`, `${c.locations} location rows; needs exactly one (Thailand)`);
}
for (const [k, g] of adGroups) {
  const [c, name] = k.split('\t');
  if (g.ads !== 1) fail(`campaigns.csv [${name}]`, `${g.ads} ads; this kit keeps one RSA per ad group`);
  if (g.keywords === 0) fail(`keywords.csv [${name}]`, `ad group in ${c} has no keywords`);
}

// ---- negatives.txt -----------------------------------------------------------
// One negative per line in Google's paste notation: word = broad,
// "words" = phrase, [words] = exact. No comment lines: anything pasted
// becomes a negative, so a "# why" line would block searches containing
// "why". The reasons live in README.md, in the file's order.
const negPath = join(DIR, 'negatives.txt');
const negatives = [];
if (!existsSync(negPath)) fail('negatives.txt', 'file missing');
else {
  const seenNeg = new Set();
  const negRaw = readFileSync(negPath, 'utf8');
  if (negRaw.charCodeAt(0) === 0xfeff) fail('negatives.txt', 'starts with a byte-order mark; save as plain UTF-8');
  negRaw.replace(/^\uFEFF/, '').split(/\r?\n/).forEach((line, i) => {
    const where = `negatives.txt line ${i + 1}`;
    if (line.trim() === '') return;
    if (line.startsWith('#')) { fail(where, 'comment line would be pasted as a negative keyword'); return; }
    let type = 'broad', text = line;
    if (/^".*"$/.test(line)) { type = 'phrase'; text = line.slice(1, -1); }
    else if (/^\[.*\]$/.test(line)) { type = 'exact'; text = line.slice(1, -1); }
    else if (/["[\]]/.test(line)) fail(where, `unbalanced match-type marks in ${line}`);
    checkKeywordText(where, text);
    const id = `${type}\t${norm(text)}`;
    if (seenNeg.has(id)) fail(where, `duplicate negative ${line}`);
    seenNeg.add(id);
    negatives.push({ where, line, type, text: norm(text) });
  });
}

// A negative that would block one of our own keywords. Approximates
// Google's rules: broad = every word present in any order, phrase = the
// words in sequence, exact = identical. Thai has no spaces between words,
// and Google segments it in ways it does not publish, so a Thai negative
// is treated as matching anywhere inside the keyword: stricter than
// Google, which is the safe side for "did we just switch our own ads off".
const isThai = (s) => /\p{Script=Thai}/u.test(s);
const hasWord = (kwText, w) => (isThai(w) ? kwText.includes(w) : kwText.split(' ').includes(w));
function blocks(neg, kwText) {
  if (neg.type === 'exact') return kwText === neg.text;
  if (neg.type === 'phrase') return isThai(neg.text) ? kwText.includes(neg.text) : ` ${kwText} `.includes(` ${neg.text} `);
  return neg.text.split(' ').every((w) => hasWord(kwText, w));
}
for (const n of negatives) {
  for (const p of positives) {
    if (blocks(n, p.text)) fail(n.where, `${n.line} would block our own keyword "${p.text}" (${p.where})`);
  }
}

// ---- sitelinks.csv -----------------------------------------------------------
const sl = loadCsv('sitelinks.csv', ['Campaign', 'Link Text', 'Description Line 1', 'Description Line 2', 'Final URL'],
  ['Campaign', 'Link Text', 'Final URL']);
const slPerCampaign = new Map();
for (const r of sl) {
  const where = `sitelinks.csv row ${r.__row}`;
  const c = campaigns.get(r.Campaign);
  if (!c) fail(where, `unknown campaign "${r.Campaign}"`);
  checkText(where, 'Link Text', r['Link Text'], LIMITS.linkText);
  for (const f of ['Description Line 1', 'Description Line 2']) {
    if (r[f]) checkText(where, f, r[f], LIMITS.linkDescription);
  }
  // Google wants both description lines or neither.
  if (!r['Description Line 1'] !== !r['Description Line 2']) fail(where, 'set both description lines or neither');
  const path = checkUrl(where, r['Final URL'], {
    lang: c?.lang,
    content: new RegExp(`^${c?.code}-sitelink-[a-z0-9._-]+$`)
  });
  const list = slPerCampaign.get(r.Campaign) || [];
  // Sitelinks in one campaign that share a landing page are disapproved
  // as duplicates, and two with the same text are pointless.
  if (list.some((x) => x.path === path)) fail(where, `another sitelink in ${r.Campaign} already lands on ${path}`);
  if (list.some((x) => x.text === r['Link Text'])) fail(where, `duplicate link text "${r['Link Text']}"`);
  list.push({ path, text: r['Link Text'] });
  slPerCampaign.set(r.Campaign, list);
}
for (const c of campaigns.keys()) {
  // Google shows sitelinks only when at least two are eligible.
  if ((slPerCampaign.get(c) || []).length < 2) fail('sitelinks.csv', `${c} has fewer than 2 sitelinks`);
}

// ---- result ------------------------------------------------------------------
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} problem(s) in ${DIR}`);
  process.exit(1);
}
const ads = [...adGroups.values()].reduce((n, g) => n + g.ads, 0);
console.log(`OK: ${campaigns.size} campaigns, ${adGroups.size} ad groups, ${ads} ads, ` +
  `${positives.length} keywords, ${negatives.length} negatives, ${sl.length} sitelinks`);
