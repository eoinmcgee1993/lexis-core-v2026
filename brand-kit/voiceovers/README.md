# Voiceover reels

Six ready-to-post 9:16 reels, 16–23 seconds each. Each is a narrator's voice
over a slow push-in on a LEXIS portrait. Rebuild all of them with
`python3 brand-kit/voiceovers/build_vo_reels.py`.

| File | Audience | Links to | Voice (ElevenLabs v4) |
|---|---|---|---|
| `lexis-vo-reel-en.mp4` | Anyone practising spoken English | `/` | Sarah – Warm & Conversational |
| `lexis-vo-reel-th.mp4` | Thai hotel, restaurant and tourism staff | `/th/practice/hospitality-english` | Aom – Gentle, Confident, Smooth |
| `lexis-vo-reel-th-interview.mp4` | Thai job-seekers | `/th/practice/interview-english` | Aom |
| `lexis-vo-reel-th-travel.mp4` | Thai travellers | `/th/practice/travel-english` | Malee – Cheerful, Bright, Lively |
| `lexis-vo-reel-th-work.mp4` | Thai office workers | `/th/practice/business-english` | Aom |
| `lexis-vo-reel-en-learn-thai.mp4` | English-speaking expats learning Thai | `/` | Sarah |

The exact scripts for the last four are the `prompt` text in each flow on the
ElevenLabs canvas. The caption text in `build_vo_reels.py` follows them line
for line.

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

**TH hotel:** ทำงานโรงแรม ร้านอาหาร หรือท่องเที่ยว? ซ้อมพูดภาษาอังกฤษกับแขกก่อนเจอของจริง
LEXIS รับบทเป็นแขก คุณรับบทพนักงาน ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
learnwithlexis.com/th/practice/hospitality-english?utm_source=tiktok&utm_medium=social&utm_campaign=vo_th_hotel

**TH interview:** สัมภาษณ์งานเป็นภาษาอังกฤษเร็ว ๆ นี้? ซ้อมตอบคำถามออกเสียงจริงกับ LEXIS ก่อน ได้คำแนะนำระหว่างคุย ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
learnwithlexis.com/th/practice/interview-english?utm_source=tiktok&utm_medium=social&utm_campaign=vo_th_interview

**TH travel:** เที่ยวต่างประเทศครั้งหน้า สั่งอาหาร ถามทาง เช็คอินเองได้ ซ้อมพูดกับ LEXIS ก่อนบิน ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
learnwithlexis.com/th/practice/travel-english?utm_source=tiktok&utm_medium=social&utm_campaign=vo_th_travel

**TH work:** ประชุมกับทีมต่างชาติแล้วพูดไม่ออก? ซ้อมภาษาอังกฤษที่ใช้ในที่ทำงานกับ LEXIS ทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
learnwithlexis.com/th/practice/business-english?utm_source=tiktok&utm_medium=social&utm_campaign=vo_th_work

**EN learn Thai (expat groups, Facebook, Reddit r/Thailand):** Your Thai still stops at "sawasdee"? Practise speaking Thai out loud with LEXIS, everyday conversations with gentle corrections. 15 minutes free, no card.
learnwithlexis.com?utm_source=facebook&utm_medium=social&utm_campaign=vo_en_learn_thai
