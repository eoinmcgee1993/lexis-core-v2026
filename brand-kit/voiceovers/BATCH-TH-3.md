# Thai reels, batch 3: everyday moments that suddenly need English

Five ready-to-post 9:16 reels (1080x1920, 16–21 s) for a Thai audience. Each
one opens on a moment a Thai viewer has been in: a tourist asking for help,
a foreign passenger, a coffee order, a request for directions, a colleague's
small talk. It gives one or two natural English lines for that moment, then
LEXIS as the place to practise saying them out loud first, and ends on the
trial line. Rebuild one with
`python3 brand-kit/voiceovers/build_vo_reels.py th-7eleven` (keys below).

The narrator speaks both sides of each exchange and talks *about* LEXIS in
the third person. Nothing here implies LEXIS is a person. "15 นาที, ไม่ต้องผูกบัตร"
is `TRIAL.minutes` / `TRIAL.cardRequired` in `frontend/src/content/facts.js`.
If either changes, re-record the voiceover, not just the captions.

| Key | File | Voice (ElevenLabs v4) | Length |
|---|---|---|---|
| `th-7eleven` | `brand-kit/voiceovers/lexis-vo-reel-th-7eleven.mp4` | Malee | 17.0 s |
| `th-grab` | `brand-kit/voiceovers/lexis-vo-reel-th-grab.mp4` | Aom | 20.4 s |
| `th-coffee` | `brand-kit/voiceovers/lexis-vo-reel-th-coffee.mp4` | Malee | 16.4 s |
| `th-directions` | `brand-kit/voiceovers/lexis-vo-reel-th-directions.mp4` | Aom | 19.2 s |
| `th-colleague` | `brand-kit/voiceovers/lexis-vo-reel-th-colleague.mp4` | Aom | 20.3 s |

All five takes are on the ElevenLabs canvas flow "LEXIS TH reels batch 3".
Each take was checked against its script with a speech-to-text pass before
it was picked. The `th-colleague` take is the only one: the account ran out
of credits while the other three variations were queued.

## Before posting: two things to know

- **Thai tone marks need a one-line render fix.** ffmpeg's `subtitles`
  filter in this build shapes text without HarfBuzz, so a tone mark
  above an upper vowel is drawn on top of the vowel and disappears
  (เที่ยว shows as เทียว, ที่นั่ง as ทีนัง). The five MP4s here were rendered with
  `ass=...:shaping=complex` and are correct. The build script itself still
  says `subtitles=`, because that line belongs to another change. Until it is
  switched, rebuilding these from the script brings the bug back. The TH
  reels already in this folder (e.g. `th-airport`, `th-interview`) were
  rendered the old way and show it too.
- **Two reels name brands as the setting.** `th-7eleven` says "เซเว่น" and
  `th-grab` says "แกร็บ", because that is how the moment is said in Thai.
  That is fine for organic posts. Meta and TikTok ad review can reject paid
  ads that use a third-party trademark, so boost the other three first.
  None of the hashtags below are brand tags.

## UTM links

Every reel uses the same pattern. Swap `<platform>` for `tiktok`, `instagram`,
`facebook` or `youtube`:

`https://learnwithlexis.com/th?utm_source=<platform>&utm_medium=social&utm_campaign=reels-th-3&utm_content=<key>`

A TikTok caption cannot link, so it ends with "ลิงก์ในโปรไฟล์" and the TikTok
link goes in the bio. Instagram captions don't link either: put the Instagram
link in the bio or on a link sticker. Facebook posts and YouTube
descriptions take the link as-is.

---

## 1. `th-7eleven`: ภาษาอังกฤษในเซเว่น

**File:** `brand-kit/voiceovers/lexis-vo-reel-th-7eleven.mp4`

**Script (as sent, Malee):**

> [curious] ยืนอยู่ในเซเว่น… แล้วนักท่องเที่ยวหันมาถามว่า [short pause] "Where's the sunscreen?"
> [short pause] ชี้ได้… แต่พูดไม่ออก? [warmly] ตอบแค่นี้ก็พอ "It's just over there, by the door."
> [short pause] ซ้อมพูดออกเสียงกับเล็กซิส ก่อนเจอของจริง [excited] ทดลองฟรีสิบห้านาที ไม่ต้องผูกบัตร

**TikTok:** อยู่ในเซเว่น แล้วนักท่องเที่ยวหันมาถาม… ชี้ได้แต่พูดไม่ออก ใครเคยบ้าง? 😅 ประโยคเดียวก็พอ: "It's just over there, by the door." ซ้อมพูดออกเสียงกับ LEXIS ก่อนเจอของจริง ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร ลิงก์ในโปรไฟล์

**Instagram / Facebook / YouTube:** นักท่องเที่ยวหันมาถามว่า "Where's the sunscreen?" ชี้ได้… แต่พูดไม่ออก? ตอบแค่นี้ก็พอ: "It's just over there, by the door." ซ้อมพูดภาษาอังกฤษออกเสียงกับ LEXIS คู่สนทนาเสมือนสำหรับฝึกพูด ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร

**YouTube Shorts title:** นักท่องเที่ยวถามในเซเว่น ตอบเป็นภาษาอังกฤษยังไง?

**Hashtags:** #ภาษาอังกฤษ #ฝึกพูดภาษาอังกฤษ #ภาษาอังกฤษในชีวิตประจำวัน #เรียนภาษาอังกฤษ

**Links:**
- TikTok (bio): https://learnwithlexis.com/th?utm_source=tiktok&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-7eleven
- Instagram (bio / sticker): https://learnwithlexis.com/th?utm_source=instagram&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-7eleven
- Facebook: https://learnwithlexis.com/th?utm_source=facebook&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-7eleven
- YouTube: https://learnwithlexis.com/th?utm_source=youtube&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-7eleven

---

## 2. `th-grab`: ผู้โดยสารต่างชาติขึ้นรถคุณ

**File:** `brand-kit/voiceovers/lexis-vo-reel-th-grab.mp4`

**Script (as sent, Aom):**

> [curious] ขับแกร็บอยู่ แล้วผู้โดยสารคนต่อไปเป็นชาวต่างชาติ… ทักยังไงดี? [warmly] "Hi! Going to Silom, right?"
> [short pause] ถึงที่หมายแล้ว ก็แค่บอกว่า "Here we are. Have a nice day!" [short pause]
> ซ้อมพูดออกเสียงกับเล็กซิส ก่อนรับงานถัดไป [excited] ทดลองฟรีสิบห้านาที ไม่ต้องผูกบัตร

**TikTok:** ผู้โดยสารต่างชาติขึ้นรถ ทักยังไงดี? 🚗 "Hi! Going to Silom, right?" ถึงแล้วก็ "Here we are. Have a nice day!" ซ้อมพูดออกเสียงกับ LEXIS ก่อนรับงานถัดไป ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร ลิงก์ในโปรไฟล์

**Instagram / Facebook / YouTube:** ขับรถรับส่งแล้วเจอผู้โดยสารชาวต่างชาติ? สองประโยคง่าย ๆ ที่ใช้ได้จริง: "Hi! Going to Silom, right?" และ "Here we are. Have a nice day!" ซ้อมพูดออกเสียงกับ LEXIS คู่สนทนาเสมือนสำหรับฝึกพูด ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร

**YouTube Shorts title:** ผู้โดยสารต่างชาติขึ้นรถ ทักเป็นภาษาอังกฤษยังไง?

**Hashtags:** #ภาษาอังกฤษ #ฝึกพูดภาษาอังกฤษ #คนขับรถ #ภาษาอังกฤษในชีวิตประจำวัน

**Links:**
- TikTok (bio): https://learnwithlexis.com/th?utm_source=tiktok&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-grab
- Instagram (bio / sticker): https://learnwithlexis.com/th?utm_source=instagram&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-grab
- Facebook: https://learnwithlexis.com/th?utm_source=facebook&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-grab
- YouTube: https://learnwithlexis.com/th?utm_source=youtube&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-grab

---

## 3. `th-coffee`: รับออร์เดอร์กาแฟเป็นภาษาอังกฤษ

**File:** `brand-kit/voiceovers/lexis-vo-reel-th-coffee.mp4`

**Script (as sent, Malee):**

> [curious] ลูกค้าต่างชาติเดินเข้าร้านกาแฟ แล้วสั่งว่า… "Can I get an iced latte, less sweet?"
> [short pause] ฟังออก… แต่ถามกลับไม่ถูก? [warmly] "Sure! For here or to go?" [short pause]
> ซ้อมพูดออกเสียงกับเล็กซิส ก่อนเปิดร้าน [excited] ทดลองฟรีสิบห้านาที ไม่ต้องผูกบัตร

**TikTok:** ลูกค้าต่างชาติสั่ง "iced latte, less sweet" ☕ ฟังออก แต่ถามกลับไม่ถูก? "Sure! For here or to go?" ซ้อมพูดออกเสียงกับ LEXIS ก่อนเปิดร้าน ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร ลิงก์ในโปรไฟล์

**Instagram / Facebook / YouTube:** ทำร้านกาแฟแล้วเจอลูกค้าต่างชาติ? "Can I get an iced latte, less sweet?" ถามกลับง่าย ๆ ว่า "Sure! For here or to go?" ซ้อมพูดออกเสียงกับ LEXIS คู่สนทนาเสมือนสำหรับฝึกพูด ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร

**YouTube Shorts title:** ลูกค้าต่างชาติสั่งกาแฟ ถามกลับเป็นภาษาอังกฤษยังไง?

**Hashtags:** #ภาษาอังกฤษ #ฝึกพูดภาษาอังกฤษ #บาริสต้า #ร้านกาแฟ

**Links:**
- TikTok (bio): https://learnwithlexis.com/th?utm_source=tiktok&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-coffee
- Instagram (bio / sticker): https://learnwithlexis.com/th?utm_source=instagram&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-coffee
- Facebook: https://learnwithlexis.com/th?utm_source=facebook&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-coffee
- YouTube: https://learnwithlexis.com/th?utm_source=youtube&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-coffee

---

## 4. `th-directions`: บอกทางเป็นภาษาอังกฤษ

**File:** `brand-kit/voiceovers/lexis-vo-reel-th-directions.mp4`

**Script (as sent, Aom):**

> [curious] นักท่องเที่ยวหลงทาง เดินมาถามคุณว่า "Excuse me, how do I get to the BTS?" [short pause]
> รู้ทาง… แต่อธิบายไม่ถูก? [warmly] "Go straight, then turn left at the corner." [short pause]
> ซ้อมพูดออกเสียงกับเล็กซิส ก่อนเจอคำถามต่อไป [excited] ทดลองฟรีสิบห้านาที ไม่ต้องผูกบัตร

**TikTok:** นักท่องเที่ยวถามทางไป BTS 🗺️ รู้ทาง แต่อธิบายไม่ถูก? "Go straight, then turn left at the corner." ซ้อมพูดออกเสียงกับ LEXIS ก่อนเจอคำถามต่อไป ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร ลิงก์ในโปรไฟล์

**Instagram / Facebook / YouTube:** เคยโดนถามทางเป็นภาษาอังกฤษไหม? "Excuse me, how do I get to the BTS?" ประโยคเดียวก็ช่วยได้: "Go straight, then turn left at the corner." ซ้อมพูดออกเสียงกับ LEXIS คู่สนทนาเสมือนสำหรับฝึกพูด ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร

**YouTube Shorts title:** นักท่องเที่ยวถามทาง บอกเป็นภาษาอังกฤษยังไง?

**Hashtags:** #ภาษาอังกฤษ #ฝึกพูดภาษาอังกฤษ #บอกทาง #ภาษาอังกฤษในชีวิตประจำวัน

**Links:**
- TikTok (bio): https://learnwithlexis.com/th?utm_source=tiktok&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-directions
- Instagram (bio / sticker): https://learnwithlexis.com/th?utm_source=instagram&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-directions
- Facebook: https://learnwithlexis.com/th?utm_source=facebook&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-directions
- YouTube: https://learnwithlexis.com/th?utm_source=youtube&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-directions

---

## 5. `th-colleague`: คุยเล่นกับเพื่อนร่วมงานต่างชาติ

**File:** `brand-kit/voiceovers/lexis-vo-reel-th-colleague.mp4`

**Script (as sent, Aom):**

> [curious] เจอเพื่อนร่วมงานต่างชาติหน้าลิฟต์ เขาถามว่า "How was your weekend?" [short pause]
> ตอบแค่ "Good"… แล้วก็เงียบ [chuckles] ลองต่ออีกนิด "Good! I went to the beach. How about you?"
> [warmly] ซ้อมคุยเล่นออกเสียงกับเล็กซิส ก่อนเจอกันวันจันทร์ [excited] ทดลองฟรีสิบห้านาที ไม่ต้องผูกบัตร

**TikTok:** เพื่อนร่วมงานต่างชาติถาม "How was your weekend?" แล้วคุณตอบแค่ "Good" 😶 ลองต่ออีกนิด: "Good! I went to the beach. How about you?" ซ้อมคุยเล่นออกเสียงกับ LEXIS ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร ลิงก์ในโปรไฟล์

**Instagram / Facebook / YouTube:** ตอบแค่ "Good" แล้วก็เงียบ… ใครเป็นบ้าง? ลองต่ออีกประโยค: "Good! I went to the beach. How about you?" ซ้อมคุยเล่นภาษาอังกฤษออกเสียงกับ LEXIS คู่สนทนาเสมือนสำหรับฝึกพูด ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร

**YouTube Shorts title:** เพื่อนร่วมงานต่างชาติถาม How was your weekend? ตอบยังไงดี

**Hashtags:** #ภาษาอังกฤษ #ฝึกพูดภาษาอังกฤษ #ภาษาอังกฤษในที่ทำงาน #SmallTalk

**Links:**
- TikTok (bio): https://learnwithlexis.com/th?utm_source=tiktok&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-colleague
- Instagram (bio / sticker): https://learnwithlexis.com/th?utm_source=instagram&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-colleague
- Facebook: https://learnwithlexis.com/th?utm_source=facebook&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-colleague
- YouTube: https://learnwithlexis.com/th?utm_source=youtube&utm_medium=social&utm_campaign=reels-th-3&utm_content=th-colleague
