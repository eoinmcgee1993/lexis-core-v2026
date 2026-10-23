# Google Search ads kit

An import-ready Google Search setup for LEXIS: two campaigns, nine ad
groups, one Responsive Search Ad per group, keywords, negatives and
sitelinks, all checked against Google's limits by `check-lengths.mjs`.

**Nothing here has been published or spent against.** No Google Ads account
is connected. Both campaigns import **Paused** with **no budget and no bid
strategy**, so even an accidental "Post" in Editor cannot start spending.
Setting the budget and bidding is the owner's call, made in Editor (see
"What you set" below). The checker fails if a budget or bid strategy is
ever committed here, for the same reason `ADVERTISING.md` has no media plan:
the numbers it would need don't exist yet.

| File | What it is |
|---|---|
| `campaigns.csv` | Campaign, location, ad group and RSA rows in one file, in Google Ads Editor's column names |
| `keywords.csv` | Positive keywords, phrase and exact match, per ad group |
| `negatives.txt` | One shared negative list for both campaigns, in Google's paste notation |
| `sitelinks.csv` | Campaign-level sitelinks |
| `check-lengths.mjs` | Validator; run it after every edit |

```bash
node brand-kit/ads/google/check-lengths.mjs   # exits 1 and names file/row/field on any problem
```

## The two campaigns

| Campaign | Who | Language / location | Ads in |
|---|---|---|---|
| `lexis-th-speak-english` | Thai speakers practising spoken English | `th` / Thailand | Thai |
| `lexis-en-speak-thai` | English speakers in Thailand practising Thai | `en` / Thailand | English |

Networks are **Google Search only**: no Search Partners and no Display.
Those can be added once the search-terms report shows what Search alone
does. Starting on Display with no data spends the budget on placements that
nobody chose.

| Ad group | Intent | Final URL path |
|---|---|---|
| `th-general` | English speaking practice, AI practice, speaking apps | `/th` |
| `th-everyday` | Everyday English conversation | `/th/practice/everyday-english` |
| `th-interview` | Job interview English | `/th/practice/interview-english` |
| `th-travel` | Travel English | `/th/practice/travel-english` |
| `th-hospitality` | Hotel and service-work English | `/th/practice/hospitality-english` |
| `th-business` | Workplace and meeting English | `/th/practice/business-english` |
| `en-speak-thai` | Thai speaking practice | `/` |
| `en-learn-thai` | Learn to speak Thai | `/` |
| `en-thai-conversation` | Thai conversation practice with AI | `/` |

The TH campaign targets both Thai keywords and the English terms Thais
type (`english speaking practice`, `job interview english`, `hotel english`).
Its ads are in Thai either way, and they land on the `/th` version of the
matching page.

The EN groups all land on `/` because there is no English-language page
about learning Thai yet. The landing page opens on the English-learning
side, so the EN ads end with "Choose Learn Thai and start", which names the
button on that page.

## Link tagging

Every final URL, ads and sitelinks alike, is:

```
https://learnwithlexis.com<path>?utm_source=google&utm_medium=paid&utm_campaign=evergreen&utm_content=<ad group>
```

These are the shared paid-media values from `ADVERTISING.md`'s "Link tagging"
table, so Google rows group alongside Meta and TikTok. Which campaign a click came
from is carried in `utm_content`. On ads that is the ad group name, which
starts `th-` or `en-`. On sitelinks it is `th-sitelink-<page>` or
`en-sitelink-<page>`. The app stores `utm_content` (PR #140), so each value
is lowercase `[a-z0-9._-]` and the checker enforces it: ad group names *are*
the `utm_content` values, and renaming one in Editor without renaming the
other breaks the report.

Keep Google's **auto-tagging** on as well. It adds `gclid` beside these tags
without replacing them.

## Importing into Google Ads Editor

1. **Paste route (recommended, encoding-proof).** Open a CSV in Google Sheets,
   select all and copy. In Editor go to **Account > Import > Paste text**,
   paste, and check that the column headers map correctly. Pasting skips
   file encoding entirely, which matters for Thai.
2. **File route.** **Account > Import > From file** and choose the CSV. The
   files are UTF-8. Google's documented path for Excel users is saving as
   *Unicode Text* (UTF-16). If the Thai looks garbled after a file import,
   discard it and use the paste route.
3. **Order:** `campaigns.csv`, then `keywords.csv`, then `sitelinks.csv`. The
   later files refer to campaign and ad group names that must already exist.
4. **Negatives:** **Tools > Shared library > Negative keyword lists**, make a list
   called `LEXIS negatives`, paste all of `negatives.txt`, and apply it to
   **both** campaigns. One list covers both campaigns because nothing in either
   campaign's half hurts the other (`learn thai massage` is no more welcome in
   the TH campaign than in the EN one). The checker tests every negative against
   every keyword, matching more broadly than Google does, so none can switch
   off one of our own ads.
5. Review the import summary, then **Post**. The campaigns arrive Paused.

Editor matches column headers ignoring case and spaces. The headers used
here are its own names: `Campaign`, `Campaign Type`, `Networks`, `Budget`,
`Bid Strategy Type`, `Languages` (language codes), `Location` / `Location ID`
(Thailand / 2764, Google's country ID, one location per row), `Campaign Status`, `Ad Group`,
`Ad Group Status`, `Headline 1`…`15`, `Description 1`…`4`, `Path 1`/`2`,
`Final URL`, `Keyword`, `Criterion Type` (`Phrase`/`Exact`), `Link Text`,
`Description Line 1`/`2`. `Ad type` is the one header I couldn't find in
Google's column reference. If the import screen leaves it unmapped, set it
to "Do not import". Expanded text ads can no longer be created, so headline
and description columns can only describe an RSA.

## What you set before enabling

- **Budget** on each campaign (blank here; Editor flags a campaign without one).
- **Bid strategy.** Also blank. Which one, and any CPC cap, depends on
  numbers that don't exist yet (`ADVERTISING.md` keeps no bid advice for
  the same reason).
- **EU political ads declaration**, if Editor asks: these campaigns have none.
- Only then set **Campaign Status** to Enabled.

## How characters are counted

Google's limits: headline 30, description 90, display path 15, sitelink text
25, sitelink description line 35, keyword 80 characters / 10 words.

Google says each character of a "double-width" language counts as two,
and names Chinese, Japanese and Korean in a list it calls non-exhaustive
([1704389](https://support.google.com/google-ads/answer/1704389),
[ads policy 14848297](https://support.google.com/adspolicy/answer/14848297),
read 19 Oct 2026). **Thai is not named, and Google doesn't say how Thai's
combining vowels and tone marks are counted.** I couldn't confirm either
from Google's documentation, so the checker counts conservatively:

- CJK and full-width forms count 2. Thai counts single: Unicode gives Thai
  East Asian Width "N" (neutral), not "W" (wide), the property that
  "double-width" describes.
- **Every code point counts, Thai vowel and tone marks included.** That is
  the stricter of the two readings (counting what you see would make
  `ที่` one character, counting code points makes it three), so a line
  that passes here fits under either one.

Editor runs its own length check at import, so if Google counts Thai some
third way, it shows up as an Editor error before anything goes live.

## Copy rules this kit keeps

Taken from `ADVERTISING.md`'s ground rules and the repo's `CLAUDE.md`:

- **Facts come from `frontend/src/content/facts.js`:** the trial length, the
  no-card trial, both pass prices and their lengths, and that nothing renews.
  The copy quotes those numbers literally, because a CSV cannot import them,
  so the checker imports facts.js and fails on any
  ฿ amount, minute count or day count it doesn't hold, on a price paired
  with the wrong number of days, and on "no card" or "nothing renews" if
  those flags ever flip. If a price changes in facts.js, this check fails and
  lists every ad line that still quotes the old one.
- No recurring-billing words. No volume, fluency, score, result or timeframe
  promise. No superlatives and no social proof.
- LEXIS is AI, a virtual conversation partner (คู่สนทนาเสมือน). Every
  "partner" line says *AI* or *virtual* in the same headline, because Google
  shows headlines in any combination and each one has to stand alone.
- CTA wording matches the site: "ลองใช้ฟรี" / "Try It Free".
- **Left out on purpose:** the RSA headline "A Real Conversation Partner"
  and the description "Not a course…" from `ADVERTISING.md`. Both are on
  hold in PR #139 because one reads as a person and the other sets LEXIS
  against courses. The launch-offer code lines are also out, because
  that offer ends 23 Oct 2026.
- **Display paths in Thai** (`ฝึกพูด/สัมภาษณ์งาน`) read naturally to the
  searcher. If Editor rejects non-Latin paths, swap in `practice/interview`
  and re-run the checker.

## Why each negative is there

`negatives.txt` has no comments, because anything pasted becomes a negative
(a `# why` line would block every search containing "why"). Its blank-line
groups, in order:

1. **Searches for someone, or somewhere, to be taught.** The first block,
   in English and Thai: private lessons, classes and institutes, "near me",
   native speakers and exchange partners, and the bare Thai verb for "teach".
   LEXIS doesn't compete for these searches and never targets them, and its
   copy never names who they are looking for. That is why the terms are
   listed only in `negatives.txt`, which `scripts/check-copy.mjs` keeps out
   of scope for exactly this reason. The verb is in because the searches it
   catches are for being taught, not for practice.
2. **Jobs and hiring.** `jobs` (plural on purpose: a broad negative on `job`
   would block our own `job interview english`), `hiring`, `vacancy`,
   `salary`, TEFL/TESOL/CELTA, หางาน, รับสมัครงาน, งานสอน, รับสอน.
3. **Free downloads and files.** `free download`, `pdf`, `ebook`, `books`,
   `worksheet`, `apk`, ดาวน์โหลด, หนังสือ, ใบงาน. LEXIS is a spoken
   conversation, not a file.
4. **Translation and dictionaries.** `translate`, `translator`, `meaning`,
   แปล, พจนานุกรม.
5. **Exams and certificates.** IELTS, TOEIC, TOEFL, CU-TEP, ข้อสอบ, สอบ. LEXIS
   makes no score claim, so an ad on those searches would imply one.
6. **Children.** `kids`, `children`, เด็ก, อนุบาล. Nothing on the site is
   written for children, and every free trial has a real Realtime cost
   (`UNIT-ECONOMICS.md`).
7. **Other "learn thai ..." searches.** `massage`, `cooking`, `food`, `muay`,
   `boxing`, `yoga`, `visa` (education-visa searches want a school), plus
   reading and writing (`alphabet`, `read`, `script`, `keyboard`). Phrase
   match on `learn thai` would otherwise catch `learn thai massage`.

Thai has no spaces between words and Google doesn't publish how it segments
Thai queries, so read the **search terms report after the first week** and
add whatever slipped through. The checker treats a Thai negative as matching
anywhere inside a keyword, which is stricter than Google, so a conflict it
reports is worth taking seriously.

## Editing the kit

Edit the CSVs directly, or round-trip them through Sheets, keeping plain
UTF-8 with no byte-order mark. Then run the checker, which also confirms:

- every final URL's path is a live route in `frontend/src/App.jsx`;
- Thai campaigns land on `/th` pages and English ones don't;
- each ad group has exactly one RSA, with 3–15 headlines and 2–4 descriptions
  and no duplicates;
- no keyword appears twice in one campaign;
- each campaign has two or more sitelinks, all on different landing pages
  (Google shows none otherwise, and disapproves duplicates);
- there are no emoji, no `!` in headlines and no repeated punctuation.
