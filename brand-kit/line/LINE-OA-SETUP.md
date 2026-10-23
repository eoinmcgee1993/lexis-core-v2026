# LEXIS on LINE: setup guide

Everything you need to set up and run the LEXIS LINE Official Account: the
menu images, the greeting, the automatic replies, eight weekly broadcasts,
and the steps to put each one in place.

Nothing in this kit has been created, uploaded, scheduled or sent. You do
every step yourself in LINE OA Manager, in the order below.

## What's in this folder

| File | What it is |
|---|---|
| `rich-menu-large.png` | The menu, 2500 × 1686, six boxes. **Use this one.** |
| `rich-menu-compact.png` | A smaller menu, 2500 × 843, three boxes. Only if you want the menu to cover less of the chat. |
| `build_line_assets.mjs` | Makes both images and checks this guide against them. See "Rebuilding the images". |
| `LINE-OA-SETUP.md` | This guide. |

The account name, status message, profile photo and cover are already
written in `brand-kit/phone/platforms/LINE.txt` (the SETUP part). Use those.
Before you pick the profile photo, read section 0 of `brand-kit/README.md`.

## Keep these true when you edit anything

- The numbers come from `frontend/src/content/facts.js`: a free 15-minute
  trial with no card, then a one-off ฿199 for 7 days or ฿599 for 30 days,
  plus an optional ฿50 Community add-on. Nothing renews. If you reword a
  message, keep those numbers and that meaning exactly.
- LEXIS is a virtual conversation partner (คู่สนทนาเสมือน). Every message
  in this kit says it was sent automatically. Keep that line. Real questions
  go to privacy@learnwithlexis.com.
- The rules at the top of `LINE.txt` apply here too.

## About your message allowance

Each plan on LINE comes with a set number of messages you can send for free,
and LINE changes that number from time to time. So this guide does not give
one. **Before your first broadcast, check the current allowance in LINE OA
Manager** (look on the Home page, or in Settings under your plan or usage).

A broadcast uses one message for every friend it reaches. On the same page,
check which kinds of message count. Greeting messages and auto-replies are
replies, which LINE has not counted in the past, but confirm it there.

## How to read the message boxes

Each grey box below is **one message bubble**. LINE limits a bubble to 500
characters, so longer messages are split into Bubble 1, Bubble 2 and so on.
Paste Bubble 1, then click **Add** (or **+**) to add another text bubble and
paste Bubble 2 into it. Keep them in order.

---

## Step 1. Create the account

1. On a computer, go to **https://manager.line.biz** and sign in with your
   LINE account.
2. Click **Create a LINE Official Account** (in Thai:
   สร้างบัญชี LINE Official Account).
3. Fill in the form:
   - Account name: `LEXIS ฝึกพูดอังกฤษ` (from `LINE.txt`)
   - Email: the email you want LINE to contact you on
   - Country or region: Thailand
   - Business type: pick the closest education option
4. Agree to the terms and submit. You now have an unverified account (grey
   badge). That is fine to start with. You can apply for the verified (blue)
   badge later.
5. Open the new account. Add the status message, profile photo and cover
   from `LINE.txt` under **Settings → Account settings**.

LINE moves menu items around now and then. If a name in this guide isn't
exactly where it says, look for the same word in the left-hand menu or in
Settings.

## Step 2. Switch on the automatic messages

1. Open **Settings → Response settings**.
2. Turn **Greeting message** on.
3. Turn **Auto-response** on (it may be called "Auto-reply messages").
4. Leave **Chat** off to start with. Then every message gets an automatic
   reply. If you later turn Chat on so you can answer people yourself, come
   back here and check that auto-responses are still on.

## Step 3. The greeting message

LINE sends this once, automatically, when someone adds LEXIS as a friend.

1. Open **Greeting message** in the left menu.
2. Delete LINE's sample text.
3. Paste the two bubbles below and click **Save**.

It is the greeting from `LINE.txt` with an English part and full link tags
added. Use this version.

**Bubble 1**

```
สวัสดีค่ะ ขอบคุณที่เพิ่ม LEXIS เป็นเพื่อนนะคะ
LEXIS คือคู่สนทนาเสมือนสำหรับฝึกพูดภาษาอังกฤษและภาษาไทยออกเสียงจริง คุยสด และแก้ไขให้อย่างอ่อนโยนระหว่างพูด
เริ่มทดลองฟรี 15 นาที ไม่ต้องผูกบัตร
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=greeting&utm_content=greeting-th&openExternalBrowser=1
หลังจากนั้นจ่ายครั้งเดียว ฿199 ใช้ได้ 7 วัน หรือ ฿599 ใช้ได้ 30 วัน ไม่มีการต่ออายุอัตโนมัติ
แตะเมนูด้านล่างเพื่อดูราคาและหัวข้อฝึกพูดได้เลยค่ะ
```

**Bubble 2**

```
Hi, and thanks for adding LEXIS! LEXIS is a virtual conversation partner for speaking practice in English and Thai. Try it free for 15 minutes, no card needed:
https://learnwithlexis.com/?utm_source=line&utm_medium=social&utm_campaign=greeting&utm_content=greeting-en&openExternalBrowser=1
After that, a one-off ฿199 for 7 days or ฿599 for 30 days. Nothing renews.

(ข้อความนี้ส่งอัตโนมัติ · This message was sent automatically)
```

## Step 4. The rich menu

The rich menu is the set of big buttons under the chat. Each button is a
"box". LINE letters the boxes A, B, C along the top row (left to right) and
D, E, F along the bottom row.

1. Open **Rich menus** in the left menu and click **Create**.
2. **Title:** `LEXIS main menu`. Only you see this.
3. **Display period:** start today. LINE asks for an end date too; pick one
   a few years away.
4. **Menu bar label** (it may say "Chat bar text"): choose your own text and
   type `เมนู`.
5. **Default behavior:** Show. The menu then opens when someone opens the
   chat.
6. Under content, click **Select template**. Choose **Large**, then the
   template with **six equal boxes, three across and two down**.
7. Click **Upload image** and pick `rich-menu-large.png`. LINE accepts PNG or
   JPG up to 1 MB; this file is well under that.
8. Set each box's action from the table and links below.
9. Click **Save**. Then test it on your phone (Step 7).

You don't type the pixel numbers below into LINE OA Manager. The template's
boxes are fixed, and the image is drawn on exactly the same grid. The numbers
are there so you can check that a box's picture sits over its tap area, and
for LINE's Messaging API if the menu is ever set up with code.

### Large menu: tap areas

| Box | Button | x (pixels) | y (pixels) | Action | What to enter |
|---|---|---|---|---|---|
| A | ลองใช้ฟรี (Try it free) | 0–833 | 0–843 | Link | Link A below |
| B | ราคา (Prices) | 833–1667 | 0–843 | Link | Link B below |
| C | วิธีใช้งาน (How it works) | 1667–2500 | 0–843 | Text | `วิธีใช้งาน` |
| D | หัวข้อฝึกพูด (Practice topics) | 0–833 | 843–1686 | Text | `หัวข้อฝึกพูด` |
| E | ส่งต่อโอกาส (LEXIS Community) | 833–1667 | 843–1686 | Link | Link E below |
| F | ติดต่อเรา (Contact) | 1667–2500 | 843–1686 | Text | `ติดต่อ` |

Link A (Try it free):

```
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=try-free&openExternalBrowser=1
```

Link B (Prices):

```
https://learnwithlexis.com/th/pricing?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=prices&openExternalBrowser=1
```

Link E (LEXIS Community):

```
https://learnwithlexis.com/th/community?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=community&openExternalBrowser=1
```

If LINE asks for an **action label** on a box, type the button's English
name (for example `Prices`). Phones read it aloud for people who use a
screen reader.

**Why boxes C, D and F send text instead of opening a link.** The site has
no page of its own for "how it works" (a link would land on the top of the
Thai home page, the same place as box A), no single page listing the
practice topics, and no contact page. A LINE link also can't open an email
address. So C, D and F send a word into the chat as if the person typed it,
and the matching auto-reply in Step 5 answers right there: C with the three
steps, D with links to all five topics, F with the contact email. The text in
the table must match a Step 5 keyword exactly, or nothing answers.

**Why every link ends in `openExternalBrowser=1`.** Without it, LINE opens
pages inside its own built-in browser. LEXIS needs the microphone, and
someone who signs up should still be signed in next time. Both work in the
phone's normal browser (Safari or Chrome). This tag tells LINE to open the
page there. Don't remove it.

### Compact menu (optional)

Use this instead of the large menu only if you want a smaller one. Same
steps, but in step 6 choose **Compact**, then the template with **three
equal boxes side by side**, and upload `rich-menu-compact.png`.

| Box | Button | x (pixels) | y (pixels) | Action | What to enter |
|---|---|---|---|---|---|
| A | ลองใช้ฟรี (Try it free) | 0–833 | 0–843 | Link | Link A above |
| B | ราคา (Prices) | 833–1667 | 0–843 | Link | Link B above |
| C | หัวข้อฝึกพูด (Practice topics) | 1667–2500 | 0–843 | Text | `หัวข้อฝึกพูด` |

## Step 5. Auto-replies

These answer common words automatically. LINE only sends a reply when the
whole message matches one of its keywords, so each list includes the
spellings people really type, with and without a capital letter and with the
polite ending (คะ / ครับ). If LINE won't take a whole list, keep the first
ones. Don't put the same keyword in two replies.

For each reply below:

1. Open **Auto-response messages** in the left menu (it may say "Auto-reply
   messages") and click **Create**.
2. **Title:** the name in the heading. Only you see it.
3. **Schedule:** leave it off, so the reply works all the time.
4. **Keywords:** add every keyword in the list, one at a time.
5. **Message:** paste each bubble as its own text message, in order.
6. Click **Save** and make sure the reply is switched on.

### 5.1 Price

Keywords: `ราคา`, `ราคาเท่าไหร่`, `ราคาเท่าไหร่คะ`, `ราคาเท่าไหร่ครับ`,
`ราคาเท่าไร`, `ค่าใช้จ่าย`, `แพ็กเกจ`, `price`, `Price`, `prices`, `Prices`,
`pricing`, `Pricing`

**Bubble 1**

```
ราคา LEXIS จ่ายครั้งเดียว ไม่ต่ออายุอัตโนมัติ
• ฿199 ใช้ได้ 7 วัน
• ฿599 ใช้ได้ 30 วัน
จ่ายด้วยบัตรหรือพร้อมเพย์ได้ และลองใช้ฟรีก่อนได้ 15 นาที ไม่ต้องผูกบัตร
https://learnwithlexis.com/th/pricing?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=price&openExternalBrowser=1
```

**Bubble 2**

```
Prices: a one-off pass, ฿199 for 7 days or ฿599 for 30 days. Nothing renews. Pay by card or PromptPay. Free 15-minute trial first, no card needed.
https://learnwithlexis.com/pricing?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=price-en&openExternalBrowser=1

(ข้อความนี้ตอบกลับอัตโนมัติ · This is an automatic reply)
```

### 5.2 Free trial

Keywords: `ทดลอง`, `ทดลองใช้`, `ทดลองฟรี`, `ลองใช้ฟรี`, `ฟรี`, `free`,
`Free`, `free trial`, `Free trial`, `trial`, `Trial`

**Bubble 1**

```
ทดลองใช้ฟรี 15 นาที ไม่ต้องผูกบัตร
เปิดลิงก์ สร้างบัญชี แล้วแตะปุ่มเดียวเพื่อเริ่มพูดได้เลย ใช้ไมโครโฟนของมือถือหรือคอมพิวเตอร์
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=free-trial&openExternalBrowser=1
ใช้ครบแล้วอยากฝึกต่อ พิมพ์ "ราคา" เพื่อดูแพ็กเกจ
```

**Bubble 2**

```
Free 15-minute trial, no card needed. Open the link, make an account and tap one button to start talking.
https://learnwithlexis.com/?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=free-trial-en&openExternalBrowser=1

(ข้อความนี้ตอบกลับอัตโนมัติ · This is an automatic reply)
```

### 5.3 How it works (menu box C)

This is also the reply box C triggers, so its links are tagged `rich-menu`
like 5.6. People who type one of the keywords are counted there too.

Keywords: `วิธีใช้งาน`, `วิธีใช้`, `ใช้ยังไง`, `ใช้ยังไงคะ`, `ใช้ยังไงครับ`,
`ใช้อย่างไร`, `how it works`, `How it works`, `how to use`, `How to use`

**Bubble 1**

```
วิธีใช้งาน LEXIS
1. เปิดลิงก์ แล้วเลือกว่าจะฝึกภาษาอังกฤษหรือภาษาไทย
2. แตะปุ่มเดียวแล้วเริ่มพูดได้เลย ไม่ต้องพิมพ์
3. LEXIS ฟัง ตอบกลับสด ๆ และช่วยแก้ให้อย่างอ่อนโยนระหว่างคุย พูดแทรกได้ทุกเมื่อ
ไม่ต้องนัดเวลา ฝึกได้ทันทีที่อยากฝึก
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=how-it-works&openExternalBrowser=1
```

**Bubble 2**

```
How it works: open the link, pick English or Thai, tap one button and start talking. LEXIS listens, replies straight away and gently corrects you as you go.
https://learnwithlexis.com/?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=how-it-works-en&openExternalBrowser=1

(ข้อความนี้ตอบกลับอัตโนมัติ · This is an automatic reply)
```

### 5.4 Learn Thai

This one is written for English speakers, so the English comes first.

Keywords: `ภาษาไทย`, `เรียนภาษาไทย`, `ฝึกภาษาไทย`, `learn thai`,
`Learn thai`, `Learn Thai`, `thai`, `Thai`

```
Want to practice speaking Thai? LEXIS works in both directions: you speak Thai out loud, she replies straight away and gently corrects you as you go. Free 15-minute trial, no card needed. Open the link and choose "Learn Thai".
https://learnwithlexis.com/?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=learn-thai&openExternalBrowser=1

มีเพื่อนต่างชาติที่อยากฝึกพูดภาษาไทยไหมคะ ส่งข้อความนี้ต่อให้ได้เลย
(ข้อความนี้ตอบกลับอัตโนมัติ · This is an automatic reply)
```

### 5.5 Community

Keywords: `Community`, `community`, `LEXIS Community`, `คอมมูนิตี้`,
`ส่งต่อโอกาส`

**Bubble 1**

```
LEXIS Community คือกองทุนส่งต่อโอกาสของเรา
ตอนซื้อแพ็กเกจ เลือกเพิ่ม ฿50 ได้ (ไม่บังคับ) รวมอยู่ในการจ่ายครั้งเดียวกัน ไม่มีการเรียกเก็บซ้ำ
ทุกบาทเข้ากองทุนเดียวกัน เพื่อช่วยให้นักเรียนได้ฝึกพูดฟรีหรือลดราคา ผ่านโรงเรียนและกลุ่มเยาวชนพันธมิตร
พูดตรง ๆ กองทุนยังไม่ถึงเป้าสนับสนุนรุ่นแรก เราจะอัปเดตทุกความคืบหน้า
https://learnwithlexis.com/th/community?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=community&openExternalBrowser=1
```

**Bubble 2**

```
LEXIS Community: add an optional ฿50 when you buy a pass, in the same single payment, never charged again. It goes into one shared pool to help fund free and discounted speaking practice for students through partner schools and youth groups. The pool hasn't funded its first group yet.
https://learnwithlexis.com/community?utm_source=line&utm_medium=social&utm_campaign=auto-reply&utm_content=community-en&openExternalBrowser=1

(ข้อความนี้ตอบกลับอัตโนมัติ · This is an automatic reply)
```

### 5.6 Practice topics (menu box D)

This is the reply box D triggers. Its links are tagged `rich-menu`, not
`auto-reply`, because almost everyone who sees it came from the menu.

Keywords: `หัวข้อฝึกพูด`, `topics`, `Topics`

**Bubble 1**

```
เลือกหัวข้อที่อยากฝึกพูดได้เลยค่ะ

สัมภาษณ์งาน
https://learnwithlexis.com/th/practice/interview-english?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=practice-topics&openExternalBrowser=1

ชีวิตประจำวัน
https://learnwithlexis.com/th/practice/everyday-english?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=practice-topics&openExternalBrowser=1
```

**Bubble 2**

```
การเดินทาง
https://learnwithlexis.com/th/practice/travel-english?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=practice-topics&openExternalBrowser=1

การทำงาน
https://learnwithlexis.com/th/practice/business-english?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=practice-topics&openExternalBrowser=1
```

**Bubble 3**

```
งานโรงแรมและบริการ
https://learnwithlexis.com/th/practice/hospitality-english?utm_source=line&utm_medium=social&utm_campaign=rich-menu&utm_content=practice-topics&openExternalBrowser=1

Pick a topic to practice your spoken English.
(ข้อความนี้ตอบกลับอัตโนมัติ · This is an automatic reply)
```

### 5.7 Contact (menu box F)

Keywords: `ติดต่อ`, `ติดต่อเรา`, `สอบถาม`, `แอดมิน`, `contact`, `Contact`,
`help`, `Help`

```
ข้อความนี้เป็นการตอบกลับอัตโนมัติ
ถ้ามีคำถามหรือพบปัญหาในการใช้งาน ส่งอีเมลมาที่ privacy@learnwithlexis.com ได้เลยค่ะ
ดูราคา พิมพ์ "ราคา" · ดูวิธีใช้งาน พิมพ์ "วิธีใช้"

This is an automatic reply. For questions or problems, email privacy@learnwithlexis.com.
```

### 5.8 Anything else (optional)

Leave **Keywords** empty for this one. LINE then sends it to any message
that doesn't match another reply. If LINE won't save a reply without a
keyword, skip this one.

```
ขอบคุณที่ส่งข้อความมานะคะ ข้อความนี้เป็นการตอบกลับอัตโนมัติ
แตะเมนูด้านล่าง หรือพิมพ์ ราคา, ทดลอง, วิธีใช้ หรือ ติดต่อ
มีคำถามอื่น ส่งอีเมลมาที่ privacy@learnwithlexis.com

Thanks for your message. This is an automatic reply. Tap the menu below, or type price, trial, how it works or contact. Other questions: privacy@learnwithlexis.com.
```

## Step 6. Broadcasts

A broadcast goes to every friend at once. Send **at most one broadcast each
week**, or people block the account. Start these eight after the four
starter posts in `LINE.txt` have gone out.

**Before you send the four `LINE.txt` posts,** add
`&openExternalBrowser=1` to the end of each of their links, for the reason
in Step 4. Their links don't have it yet.

Each broadcast below is a short speaking tip with a gentle link at the end.
They are text only, one bubble each.

### How to schedule a broadcast

1. Check your allowance first (see "About your message allowance").
2. Open **Broadcast messages** in the left menu and click **Create new**.
3. **Recipients:** All friends.
4. **Delivery time:** choose **Schedule**, then pick the date and time.
   Pick one day and time and keep to it every week.
5. Choose a **text** message and paste the broadcast below.
6. If you see a test option, send it to yourself first and tap the link.
7. Click **Save** (or **Schedule**). Scheduled broadcasts stay in the list,
   and you can edit or delete them until they go out.

### Broadcast 01: don't go quiet while you think

```
เคยเงียบไปตอนคิดคำตอบเป็นภาษาอังกฤษไหมคะ ลองใช้ประโยคซื้อเวลาแทนความเงียบ
• "Let me think for a second."
• "That's a good question."
คนฟังจะรู้ว่าคุณกำลังคิด ไม่ใช่ว่าไม่เข้าใจ
ลองซ้อมพูดกับ LEXIS ได้เลย ฟรี 15 นาที
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-01&openExternalBrowser=1
```

### Broadcast 02: asking someone to repeat

```
ฟังไม่ทัน ไม่ต้องเดา ถามกลับได้เลย
• "Sorry, could you say that again?"
• "Could you speak a little more slowly?"
ประโยคนี้สุภาพ ใช้ได้ทั้งที่ทำงานและตอนเที่ยว
ลองพูดประโยคนี้กับ LEXIS ดูค่ะ
https://learnwithlexis.com/th/practice/everyday-english?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-02&openExternalBrowser=1
```

### Broadcast 03: say the last sound

```
"five" "fine" "fight" ต่างกันที่เสียงท้ายคำ
ถ้าเสียงท้ายหายไป สามคำนี้จะฟังเหมือนกันหมด
ลองพูดช้า ๆ ให้ได้ยินเสียงท้ายคำชัด ๆ แล้วค่อยพูดเร็วขึ้น
ฝึกพูดออกเสียงจริงกับ LEXIS ได้ที่นี่
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-03&openExternalBrowser=1
```

### Broadcast 04: answer, then ask back

```
ตอบแล้วถามกลับ บทสนทนาจะไม่สะดุด
A: "What do you do on weekends?"
B: "I usually go to the market. How about you?"
แค่เติม "How about you?" หรือ "What about you?" ท้ายคำตอบ
ซ้อมคุยเรื่องทั่วไปกับ LEXIS
https://learnwithlexis.com/th/practice/everyday-english?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-04&openExternalBrowser=1
```

### Broadcast 05: asking politely when you travel

```
ตอนเที่ยวต่างประเทศ ลองเปลี่ยน "I want..." เป็น "Could I have...?"
• "Could I have a window seat, please?"
• "Could I have the bill, please?"
ฟังสุภาพขึ้นเยอะ
ซ้อมสถานการณ์ตอนเดินทางกับ LEXIS
https://learnwithlexis.com/th/practice/travel-english?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-05&openExternalBrowser=1
```

### Broadcast 06: checking in a meeting

```
ในที่ประชุม ถ้าไม่แน่ใจ ทวนกลับดีกว่าเดา
• "Just to check, do you mean...?"
• "So the deadline is Friday, right?"
ซ้อมพูดเรื่องงานกับ LEXIS
https://learnwithlexis.com/th/practice/business-english?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-06&openExternalBrowser=1
```

### Broadcast 07: fixing a mistake and carrying on

```
พูดผิดกลางประโยคไม่เป็นไร แก้แล้วพูดต่อได้เลย
• "Sorry, I mean Tuesday."
• "Let me say that again."
พูดต่อไปได้สำคัญกว่าพูดเป๊ะทุกคำ
ฝึกกับ LEXIS ได้ ไม่มีใครตัดสิน
https://learnwithlexis.com/th?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-07&openExternalBrowser=1
```

### Broadcast 08: turn on, turn off

```
"เปิดไฟ" ภาษาอังกฤษคือ "turn on the light" ไม่ใช่ "open the light"
"ปิดทีวี" คือ "turn off the TV" ไม่ใช่ "close the TV"
open / close ใช้กับประตู หน้าต่าง หรือกล่อง ส่วนไฟและเครื่องใช้ไฟฟ้าใช้ turn on / turn off
ลองพูดประโยคเหล่านี้กับ LEXIS
https://learnwithlexis.com/th/practice/everyday-english?utm_source=line&utm_medium=social&utm_campaign=line-broadcast&utm_content=week-08&openExternalBrowser=1
```

## Step 7. Check it on your phone

1. Add the account as a friend from your own phone. In LINE OA Manager,
   **Gain friends** gives you a QR code to scan.
2. You should get the greeting message straight away.
3. Open the chat. The menu should show, with `เมนู` on the bar.
4. Tap each box. A, B and E should open the right page in Safari or Chrome,
   not inside LINE. C, D and F should send a word, and the matching reply
   should arrive.
5. Type `ราคา`, `ทดลอง`, `วิธีใช้`, `ภาษาไทย`, `Community` and `ติดต่อ`.
   Each one should get its reply.
6. Tap a few links in the replies and check the address bar shows
   learnwithlexis.com.

## Rebuilding the images

Never edit the PNGs by hand. If a price, the trial or the Community add-on
changes in `facts.js`, rebuild them, then upload the new image in **Rich
menus** and update the numbers in this guide's messages.

From the repo, after `npm ci` in `frontend/` (it borrows Playwright from
there):

```
node brand-kit/line/build_line_assets.mjs
```

On your own computer, if it can't find a browser, point it at Chrome by
setting `PLAYWRIGHT_LOCAL_CHROMIUM` to Chrome's path first.

It reads the prices, the trial and the add-on from `facts.js`. It saves
nothing, and stops with a list of problems, if:

- any text is too wide or too tall for its box, or an image is over LINE's
  1 MB limit,
- a message bubble in this guide is over LINE's 500 characters,
- a Text box (C, D, F) sends a word no auto-reply listens for, or a keyword
  is in two replies,
- this guide disagrees with the images, the site or `facts.js`: a link to a
  page the site doesn't have, a link missing a tag, a tap-area row that
  doesn't match the grid, or a ฿ amount, trial length or pass length that
  isn't the real one.

## Link tags

Every link has `utm_source=line` and `utm_medium=social`, the same tags the
rest of the marketing kit uses for LINE, so visits group under one channel.

| Where | `utm_campaign` | `utm_content` |
|---|---|---|
| Greeting | `greeting` | `greeting-th`, `greeting-en` |
| Rich menu (links, and the box C and D replies) | `rich-menu` | `try-free`, `prices`, `community`, `how-it-works`, `how-it-works-en`, `practice-topics` |
| Other auto-replies | `auto-reply` | `price`, `free-trial`, `learn-thai`, `community`, plus `-en` for the English links |
| Broadcasts | `line-broadcast` | `week-01` to `week-08` |
