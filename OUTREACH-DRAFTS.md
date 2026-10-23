# LEXIS — Outreach & Content Drafts

**Status: NOTHING HERE HAS BEEN SENT OR PUBLISHED.** Every item below is a
draft awaiting your review. Nothing was posted to a social account, emailed
to a real person, or submitted to a directory.

Written 23 Aug 2026. 52 pieces, numbered 1–52. #31 has since been removed
(its entry says why), so 51 remain.

## Compliance pass, 21 Oct 2026

Every draft was re-checked against `CLAUDE.md` and the facts in
`frontend/src/content/facts.js`, and rewritten where it broke a rule. Nothing
in this file has been sent, posted, scheduled or submitted, before or after
this pass.

What changed:

- **Pricing.** Every price now describes a one-off pass: ฿199 for 7 days or
  ฿599 for 30 days, and nothing renews. The old figures read as a recurring
  charge, which stopped being true on 2 Sep 2026, when LEXIS moved to passes
  because Stripe cannot take PromptPay for recurring billing.
- **Trial.** Every trial mention is 15 minutes free, no card. #46 said 30
  minutes and now says 15.
- **Recurring-billing wording.** Lines that described buyers as signed up to
  recurring billing now say "anyone buying a pass".
- **Competitors.** Pitches to, and comparisons with, people and businesses
  that sell lessons or speaking practice themselves were removed, because
  they are competitors. #31 was addressed to them and is deleted. Drafts that
  only made the comparison were rewritten around the learner's own situation.
  #36 now targets creators whose audience needs spoken English (careers,
  study, travel) rather than creators who sell lessons.
- **No human implication.** LEXIS is described as a virtual conversation
  partner (คู่สนทนาเสมือน). Lines that said "someone" answers you, or gave
  LEXIS a teaching job title, were rewritten.
- **Unsupported claims.** Removed outcome promises, absolute claims about
  other products ("most…", "nobody…"), "no lag", a latency percentage LEXIS
  never measured (#21), an invented proportion (#23), and "no admin fee"
  (#30), which this pass could not verify.
- **No launch code.** No draft mentions the launch discount. Its code expires
  23 Oct 2026, and a draft sent after that would advertise a dead offer.

> **OWNER ACTION: five drafts in your Gmail still contain the old wording.**
> The Gmail drafts logged in the next section were written on 25 Sep 2026
> from the 25 Sep versions of templates 33 and 34, before this pass. On that
> date template 33 gave LEXIS a teaching job title, and template 34's subject
> line offered "Free English speaking practice", which contradicts the
> sponsored-access framing below. Each Gmail draft also carries one
> personalised line that was never in this file, so this pass has not
> checked it at all. This pass did not open, edit or delete
> anything in Gmail. Those five drafts are yours to delete, or to re-copy
> from the edited #33 and #34 below, before anything is sent.

## Why these are drafts and not sent

Publishing under a real business name is irreversible — a wrong claim, an
off-brand line, or a badly-targeted cold email can't be recalled once it's
out. `GROWTH-DELEGATION-BRIEF.md` already sets this rule for ad spend; the
same logic applies to anything published in LEXIS's name. Skim, approve or
cut, then send.

## The honesty constraint applied throughout

LEXIS has no public user count, no testimonials, no case studies, and no
measured learning outcomes yet. **Not one line below claims any of those.**
No invented student quotes, no "join 10,000 learners", no "proven to
improve fluency 3x". Everything below sells only what the product verifiably
does today. If a piece feels less punchy than typical startup copy, that's
why — and it's the right trade until you have real numbers.

## Facts every piece draws from

Prices and trial terms come only from `frontend/src/content/facts.js`. If a
number there changes, every draft below is stale until it is re-checked.

- A virtual conversation partner (คู่สนทนาเสมือน) for spoken practice: Thai
  speakers practising English, English speakers practising Thai. Both
  directions. No draft may imply a person is on the other end.
- Free 15-minute trial, no card required.
- After that, a one-off pass: ฿199 for 7 days or ฿599 for 30 days. Nothing
  renews. Pay by card or PromptPay.
- Each pass carries a disclosed fair-use allowance: 150 minutes on the 7-day
  pass, 450 on the 30-day pass.
- Spoken conversation, no typing. It replies in real time and corrects you
  mid-conversation.
- Post-session feedback grounded in what you actually said.
- LEXIS Community: optional ฿50 at checkout funds access for students who
  can't afford it.
- Site: learnwithlexis.com — with real Thai-language pages at /th.
- Topic pages: /practice/interview-english, everyday-english,
  travel-english, business-english.

---

## Staged in Gmail, 25 Sep 2026 (drafts, not sent)

Nine drafts were built from templates 31, 33 and 34 as they read that day,
each with one line specific to the recipient. The addresses are the
organisations' own public contact addresses, scraped from their sites that
day. None is a personal inbox found through a data broker. Each link carries
`?ref=<slug>`, so a visit from the email shows up under that slug in
`analytics_events`.

| Recipient | Address | Angle | ref |
|---|---|---|---|
| Teach For Thailand | info@teachforthailand.org | Community partner (template 34) | teachforthailand |
| Mercy Centre (Klong Toey) | info@mercycentre.org | Community partner (template 34) | mercycentre |
| Thai Child Development Foundation | tcdfoffice@gmail.com | Community partner (template 34) | tcdf |
| Education for Development Foundation | info@edfthai.org | Community partner (template 34) | edf |
| Chulalongkorn University Language Institute | culi.iadept@gmail.com | University (template 33) | culi |

**27 Sep 2026: four of the nine were deleted** on the owner's call. They were
the four built from template 31, addressed to businesses that sell speaking
practice themselves, so pitching them asked a competitor to send us its
students. Their rows were taken out of this table on 21 Oct 2026; git history
still has them. Five drafts remain: the four Community charities and
Chulalongkorn's language institute. The partner outreach guide carries the
same rule, and companies (HR / training) were added in their place.

**Those five still hold the 25 Sep wording** (see the owner action at the top
of this file). Nothing in Gmail was changed by the 21 Oct pass.

The Community drafts offer a *conversation* about sponsored access, not free
passes. Every free minute is a real OpenAI cost, so how much to give away
is the owner's decision once a partner says yes. Any draft that offers "a
code for your students" uses the `PARTNER-CODES.md` flow: create the code
only after the recipient replies.

---

# SECTION 1 — X / Twitter (10 posts)

**1.** Typing to a chatbot that reads its answer aloud isn't speaking
practice. LEXIS is a voice conversation: your mic connects straight to the
model, and it answers out loud in real time.
15 min free, no card → learnwithlexis.com

**2.** The hardest part of speaking a second language isn't vocabulary.
It's answering out loud, at speed, with someone waiting.
You can't practice that by typing.

**3.** LEXIS corrects you mid-conversation, gently, then carries on talking.
No quiz screen. No red X. Just the correction, then back to the
conversation.

**4.** Built for Thailand first: Thai speakers practising English, English
speakers practising Thai. Both directions, same virtual conversation partner.
Free 15 minutes to try, no card: learnwithlexis.com

**5.** Interrupt her mid-sentence and she stops. Properly stops — not
"finishes the sentence then notices". Real conversation involves talking
over each other, so that had to work.

**6.** No scheduling. Nothing to book.
Want to practise at 2am? You practise at 2am.

**7.** Every session ends with a plain-language summary of what you did
well and what to work on — based on what you actually said, not a generic
score out of 10.

**8.** Reading builds understanding. Speaking is a different skill: you say
things badly, get corrected, and say them again. LEXIS is built for the
middle part.

**9.** Optional at checkout: add ฿50 to fund practice time for a student who
can't afford it. No lecture, no guilt trip, one tap. The pool comes from
people buying a LEXIS pass. learnwithlexis.com/community

**10.** Free 15-minute trial. No card. Talk out loud in English or Thai,
get corrected as you go, see what to practice next.
learnwithlexis.com

---

# SECTION 2 — Facebook / Instagram (8 posts)

**11. (Thai-market focused)**
พูดภาษาอังกฤษออกเสียงจริง ไม่ใช่พิมพ์
LEXIS คือคู่สนทนาเสมือนที่ฟังคุณพูด ตอบกลับทันที และช่วยแก้ให้อย่างอ่อนโยนระหว่างคุย
ลองใช้ฟรี 15 นาที ไม่ต้องผูกบัตร → learnwithlexis.com/th

**12. (English, same message)**
You can read English. You can probably write it. But when someone asks you
a question out loud and waits — that's different, and it's the part that's
hardest to practise on your own. LEXIS gives you 15 minutes of exactly that,
free, no card.

**13.** Three things LEXIS is not:
· Not a course with lessons to work through
· Not a chatbot you type into
· Not something you have to book
It's a virtual conversation partner. You talk, she talks back, right now.

**14.** Practising for a job interview in English?
"Tell me about yourself." "What are your strengths and weaknesses?"
Say your answers out loud to a virtual conversation partner that answers
back and corrects you, before the real interview.
learnwithlexis.com/practice/interview-english

**15.** Travelling soon? Checking into a hotel, asking directions, ordering
something you can't pronounce — all of it happens fast, out loud, with a
stranger. Practise it before you're standing there.
learnwithlexis.com/practice/travel-english

**16.** A one-off ฿199 pass: 7 days, up to 150 minutes of spoken practice.
Nothing renews.
Or try 15 minutes free first — no card needed.
*(Editor's note, not for posting: this said "talk as much as you want" until
25 Sep 2026. Passes carry a disclosed fair-use allowance, so that line became
false. Reworded as a one-off pass on 21 Oct 2026.)*

**17.** LEXIS listens in both English and Thai and adjusts to your level as
you go. Total beginner or nearly fluent, you start from wherever you
actually are — not from lesson one.

**18. (Community)**
Learning a language costs money. That's the whole problem with "speaking
opens doors" — the door isn't open to everyone.
With LEXIS Community, anyone buying a pass can add ฿50 at checkout to fund
practice for a student who can't afford it.
learnwithlexis.com/community?utm_source=facebook&utm_medium=social&utm_campaign=community&utm_content=draft-18

---

# SECTION 3 — LinkedIn (6 posts)

**19.** Workplace English isn't the big presentation. It's the quick update
in a meeting, the follow-up you'd rather say out loud first, the small talk
before things start. Those are the moments worth rehearsing out loud, and
what LEXIS is built for. learnwithlexis.com/practice/business-english

**20.** A technical note, for anyone building voice AI:
LEXIS doesn't relay your audio through its own server. Your browser connects
directly to the model over WebRTC; the server only mints a short-lived
credential, then gets out of the way. That's one less hop between you
finishing a sentence and the reply starting.

**21.** We moved LEXIS onto OpenAI's newer Realtime model. For a product
whose whole pitch is conversation without awkward pauses, latency isn't a
metric — it's the product.
*(Editor's note, not for posting: this used to quote a latency percentage
from OpenAI's own published figures. LEXIS has never measured it, so it was
cut. See "Before you send anything", point 5.)*

**22.** Hiring managers in Thailand: a candidate who can do the job can still
interview badly in English, and you lose good people to a language gap that
has nothing to do with competence. Worth knowing that candidates can now
rehearse their answers out loud beforehand.

**23.** Bilingual voice AI is harder than it looks. A model can slide back
into one language, or stall when a sentence mixes two. LEXIS conversations
move between English and Thai on purpose, so switching mid-sentence had to
work.

**24.** Building in public: LEXIS is a voice-native English/Thai
conversation partner. Free 15-minute trial, then a one-off ฿199 pass for 7
days or ฿599 for 30 days; nothing renews. Genuinely early, no big user
numbers to quote yet — but the thing works and I'd rather show it than
describe it.
learnwithlexis.com

---

# SECTION 4 — TikTok / Reels / Shorts scripts (6 scripts)

**25. "The typing problem" — 20s**
[Screen recording: someone typing into a chatbot]
VO: "This is typing practice."
[Cut: person speaking into phone, LEXIS replying out loud in real time]
VO: "This is speaking practice. There's a difference, and your mouth knows it."
[End card: learnwithlexis.com · 15 min free, no card]

**26. "Interrupt her" — 15s**
[LEXIS mid-sentence, user talks over her, she stops immediately]
VO: "Real conversations mean talking over each other. So that had to work."
[End card]

**27. "2am" — 12s**
[Clock: 2:04am. Someone practising in bed, lamp on]
VO: "Interview tomorrow? Say your answers out loud tonight. Nothing to book."
[End card]

**28. "Both directions" — 18s**
[Split screen: Thai speaker practising English / English speaker practising Thai]
VO: "Same virtual conversation partner. Both directions. Whichever one you're learning."
[End card]

**29. "The correction" — 20s**
[User says something with a grammar error, LEXIS gently corrects, conversation continues]
VO: "No quiz screen. No red X. Just the fix, then back to talking."
[End card]

**30. "What ฿50 does" — 22s**
[Checkout screen, the sponsor tick box]
VO: "One optional tap at checkout funds practice time for a student who
can't afford it. That's the whole mechanism."
[End card: learnwithlexis.com/community]

---

# SECTION 5 — Cold outreach: schools, universities, community groups, companies (4 emails)

> Personalise the bracketed parts before sending. Do not mass-send
> identically — one genuinely researched line per recipient beats fifty
> copies. Never send any of these to a business that sells lessons or
> speaking practice: those are competitors.

**31.** *Removed 21 Oct 2026.* It was a first-contact email addressed to
businesses that sell speaking practice themselves, which are competitors
under the scope rule in `CLAUDE.md`.

**32. School, sponsored-access angle (mainstream schools only)**
Subject: Sponsored LEXIS practice for [School]'s students

Hi [Name],

LEXIS is a voice-based speaking practice app for English and Thai. Students
talk out loud with a virtual conversation partner that replies in real time
and corrects them gently as they go.

Through LEXIS Community, anyone buying a LEXIS pass can add ฿50 at checkout
to pay for someone else's practice time. I'd like some of that to reach
students at schools in Thailand.

We're genuinely at the start of this. No partner schools yet. I'd rather be
honest about that than pretend there's a waiting list.

If [School] would be interested in being one of the first, I'd like to talk
about what would actually be useful to you.

[Your name]

**33. University language department**

> **On hold, do not send.** A university language department or institute
> teaches languages, and Chulalongkorn's institute also sells courses to the
> public, so this may fall under the scope rule in `CLAUDE.md` (no pitching
> language schools). It was kept on the owner's call on 27 Sep, before that
> rule was written down. It stays on hold until the owner confirms either way.

Subject: Speaking practice tool — worth a look for [Department]?

Hi [Name],

Quick one. LEXIS is a real-time voice practice app for English and Thai.
Students speak, a virtual conversation partner replies out loud, corrects
them gently mid-conversation, and gives a plain-language summary afterward
based on what they actually said.

The obvious use case is students who understand a lot but freeze when asked
to speak.

Free 15 minutes, no card: learnwithlexis.com

Happy to answer anything technical about how it works.

[Your name]

**34. Youth / community organisation**
Subject: Sponsored English speaking practice for your students

Hi [Name],

I'm reaching out about LEXIS Community. LEXIS is a voice-based app where
students practise speaking English out loud with a virtual conversation
partner. Through LEXIS Community, people buying a pass can add ฿50 at
checkout to fund practice for students who couldn't otherwise pay for it.

It's new and small. I'm looking for a first partner organisation to work
out what's genuinely useful rather than guessing.

If that sounds worth a conversation, I'm at [email].

[Your name]

**35. Corporate L&D**
Subject: The English gap that isn't a vocabulary gap

Hi [Name],

The English that holds people back in meetings often isn't vocabulary or
writing. It's speaking under mild pressure in real time, which is hard to
practise and awkward to practise at work.

LEXIS is voice-only practice for exactly that: meetings, updates,
follow-ups, colleague small talk, with a virtual conversation partner that
replies out loud. Free 15-minute trial, no card.

Worth 15 minutes of your own time to judge it: learnwithlexis.com

[Your name]

---

# SECTION 6 — Cold outreach: creators & communities (4 messages)

**36. Thai-market YouTuber/TikToker (careers, study abroad or travel; never a
creator who sells lessons)**
Hi [Name] — I build LEXIS, a voice app for practising spoken English and
Thai with a virtual conversation partner. [One line on why their audience
needs to speak English.] Not pitching a paid partnership blind: try it free
(15 min, no card) and if you don't rate it, tell me why — that feedback is
worth more to me than a post. learnwithlexis.com

**37. Expat-in-Thailand community admin**
Hi [Name] — is a tool post OK in [Group]? LEXIS does Thai speaking practice
for English speakers: you talk, a virtual conversation partner replies out
loud in Thai and corrects you. Free 15-min trial, no card. Happy to skip it
if that's not what the group is for; just checking rather than posting and
annoying people.

**38. Language-learning subreddit / forum (post, not DM)**
Title: I built a voice-only Thai/English speaking practice app because
typing practice wasn't helping me speak

Body: Honest context — this is my product: free 15-min trial, then a one-off
pass (฿199 for 7 days or ฿599 for 30 days; nothing renews).
The problem I kept hitting: I could read and write far better than I could
open my mouth. Typing to a chatbot didn't fix that because it doesn't
pressure you the way a real reply does.

LEXIS connects your mic directly to a voice model — you speak, it speaks
back in real time, corrects you mid-conversation, and summarises afterward.
English and Thai, both directions.

Not going to pretend I have outcome data. It's early. Happy to answer
anything technical.

**39. Podcast pitch (language learning / edtech)**
Subject: Guest pitch — building bilingual voice AI, the parts that broke

Hi [Name],

I built LEXIS, a real-time English/Thai voice practice app. The interesting
episode isn't "AI helps you learn languages" — it's the specific things
that went wrong: a voice that went silent on Thai words, interruption
handling that left LEXIS talking over learners, a model that 404'd on the
exact endpoint the docs said to use.

Happy to be specific and unglamorous about it.

[Your name]

---

# SECTION 7 — Google Search ads (6 — headlines ≤30 chars, descriptions ≤90)

**40.** H: Practice Speaking English | H: Free 15-Minute Trial | H: No Card Required
D: Talk out loud with a real-time AI conversation partner. Gentle corrections as you speak.

**41.** H: English Interview Practice | H: Say It Out Loud First | H: Free To Try
D: Practise real interview questions out loud. Get corrected before it counts.

**42.** H: Learn Thai By Speaking | H: Real Conversation Practice | H: 15 Min Free
D: Speak Thai out loud with a patient AI partner. Corrections as you go.

**43.** H: Speaking Practice, Any Hour | H: No Booking, No Waiting | H: Start Now
D: Nothing to book. Practise English or Thai out loud the moment you want to.

**44.** H: Business English Practice | H: Meetings, Updates, Small Talk | H: Try Free
D: Practise workplace English out loud. Free 15-minute trial, no card.

**45.** H: Travel English Practice | H: Hotels, Directions, Food | H: 15 Min Free
D: Rehearse real travel situations out loud before you're standing there.

---

# SECTION 8 — Meta ads (4 primary-text variants)

**46.** You can read English. You can write it. But when someone asks you a
question out loud and waits — that's the part that's hardest to practise.
LEXIS gives you 15 minutes of exactly that, free, no card.

**47.** Not a course. Not a chatbot. A virtual conversation partner. You
talk, she replies out loud in real time, and corrects you gently as you go.
English or Thai.

**48.** A one-off ฿199 pass: 7 days and up to 150 minutes of speaking
practice. Nothing renews. Or try 15 minutes free first, no card, to see if
it suits you.
*(Editor's note, not for posting: until 25 Sep 2026 this promised no limit
on practice time; see #16.)*

**49.** ฝึกพูดภาษาอังกฤษออกเสียงจริงกับคู่สนทนาเสมือน
คุยด้วยเสียง โต้ตอบทันที และช่วยแก้ให้ระหว่างคุย
ลองใช้ฟรี 15 นาที ไม่ต้องผูกบัตร

---

# SECTION 9 — Directory & launch listings (3)

**50. Product Hunt**
Tagline: Speaking practice for English and Thai — out loud, in real time
Description: LEXIS is a virtual conversation partner for spoken practice,
not a chatbot with a speaker attached. Your browser connects directly to the
voice model, so she replies out loud in real time. She corrects you gently
mid-conversation and summarises what to work on afterward — based on what
you actually said. English and Thai, both directions. 15 minutes free, no
card; after that, a one-off ฿199 pass for 7 days or ฿599 for 30 days, and
nothing renews.

**51. Directory one-liner (for AlternativeTo, SaaS lists, etc.)**
LEXIS — real-time voice practice for English and Thai. Talk out loud, get
corrected as you speak, see what to practise next. Free 15-minute trial, no
card.

**52. Google Business Profile description**
LEXIS is a voice-based speaking practice tool for English and Thai
learners. Practise real spoken conversation with a virtual conversation
partner that replies in real time and corrects you gently as you go. Free
15-minute trial, no card required. After that, a one-off ฿199 pass for 7
days or ฿599 for 30 days; nothing renews.

---

# Before you send anything

1. **Every link should be trackable.** Add UTM parameters so you can tell
   which of these actually worked. Untracked outreach teaches you nothing.
2. **Cold email has legal rules.** Thailand's PDPA and (for any EU/UK
   recipients) GDPR both apply to unsolicited commercial email. Business
   contact addresses are generally lower-risk, but check before bulk-sending.
3. **Do not mass-send sections 5 and 6 unmodified.** They're structures, not
   scripts. One real personalised line per recipient changes the response
   rate more than any copy tweak.
4. **Start narrow.** Pick your two best channels and do them properly rather
   than firing all nine at once — with no data yet, spreading thin means you
   learn nothing from any of them.
5. **Post 21 no longer cites a number.** It used to quote OpenAI's published
   latency figure for the model upgrade. LEXIS never measured it, so it was
   cut on 21 Oct 2026. If you want a number back in, measure it on LEXIS
   first and say that it is your own measurement.
6. **Re-check against `frontend/src/content/facts.js` before sending.** A
   price, pass length or trial term that has changed there makes the matching
   drafts here wrong. Don't add a discount code to any draft: codes expire,
   and a sent message can't be updated.
