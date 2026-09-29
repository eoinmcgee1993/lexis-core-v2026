# Voiceover reels

Two ready-to-post 9:16 reels, about 23 seconds each. The narrator's voice is
over a slow push-in on the LEXIS story portrait. Rebuild them with
`python3 brand-kit/voiceovers/build_vo_reels.py`.

| File | Audience | Voice (ElevenLabs v4) |
|---|---|---|
| `lexis-vo-reel-en.mp4` | Anyone practising spoken English | Sarah – Warm & Conversational |
| `lexis-vo-reel-th.mp4` | Thai hotel, restaurant and tourism staff. Pairs with `/th/practice/hospitality-english` | Aom – Gentle, Confident, Smooth |

The `take2` MP3s are alternate reads of the same script. To swap a take in,
point `audio=` at it in the build script and re-measure the caption cue
times (see the docstring).

## Scripts (as sent to eleven_v4)

**EN**

> [warmly] You've studied English for years… so why does speaking still feel
> so hard? [short pause] Because speaking takes PRACTICE. With LEXIS, you just
> talk — out loud, in real time — and get gentle corrections as you go. Job
> interviews. Travel. Work. Everyday chat. [excited] Try it free for fifteen
> minutes, no card needed. [warmly] Learn with LEXIS dot com.

**TH**

> [warmly] แขกต่างชาติเดินมาที่เคาน์เตอร์… คุณพร้อมตอบเป็นภาษาอังกฤษแล้วหรือยัง?
> [short pause] กับเล็กซิส คุณได้ซ้อมพูดจริง ออกเสียงจริง — เล็กซิสรับบทเป็นแขก
> ส่วนคุณรับบทพนักงาน เช็คอิน รับออร์เดอร์ รับมือคำร้องเรียน [excited]
> ทดลองฟรีสิบห้านาที ไม่ต้องผูกบัตร [warmly] ที่ เลิร์น-วิท-เล็กซิส ดอท คอม

## Rules these follow

- **The narrator is not LEXIS.** They talk *about* LEXIS in the third person
  and never claim to be it, so no ad implies LEXIS is a person.
- **Facts come from `frontend/src/content/facts.js`.** "15 minutes free, no
  card" is `TRIAL.minutes`. If that changes, re-record; don't just re-caption.
- **The Thai script says what the Hospitality topic actually does.** LEXIS
  plays the guest, and the learner plays the staff member.

## Suggested post captions

**EN:** Speaking English is a skill, and skills need reps. Talk out loud with
LEXIS and get gentle corrections as you go. 15 minutes free, no card.
learnwithlexis.com?utm_source=tiktok&utm_medium=social&utm_campaign=vo_en

**TH:** ทำงานโรงแรม ร้านอาหาร หรือท่องเที่ยว? ซ้อมพูดภาษาอังกฤษกับแขกก่อนเจอของจริง
LEXIS รับบทเป็นแขก คุณรับบทพนักงาน ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
learnwithlexis.com/th/practice/hospitality-english?utm_source=tiktok&utm_medium=social&utm_campaign=vo_th_hotel
