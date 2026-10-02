"""Vertical 9:16 voiceover reels: a narrator over a slow push-in on the LEXIS
story portrait, EN and TH, for TikTok / Reels / Shorts.

Run from the repo root:  python3 brand-kit/voiceovers/build_vo_reels.py
Needs: pip install imageio-ffmpeg fonttools brotli (same as reels/build_reels.py).

Why a narrator and a still, not the hero video: the hero clip has LEXIS
speaking on camera, and laying a second voice over moving lips reads as a
dub. The narrator talks ABOUT LEXIS in the third person ("With LEXIS, you
just talk"), which also keeps the ads from implying LEXIS is a person.

Audio is ElevenLabs eleven_v4 (29 Sep 2026): Sarah for EN, Aom for TH. The
exact scripts are in README.md next to this file. Caption cue times were
taken from ffmpeg silencedetect on the take used, so each cue breaks at a
real pause; regenerate the audio and those times must be re-measured.

The layout follows reels/build_reels.py: nothing readable in the bottom
~400px or the right edge (TikTok UI), headline and URL in the top band.
The trial length is in the text below; if TRIAL.minutes in facts.js
changes, change it here and re-record the voiceover.
"""
import os, glob, tempfile, subprocess
from fontTools.ttLib import TTFont
import imageio_ffmpeg

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HERE = os.path.join(ROOT, 'brand-kit', 'voiceovers')
F = imageio_ffmpeg.get_ffmpeg_exe()
FONTS = tempfile.mkdtemp()
for f in glob.glob(os.path.join(ROOT, 'frontend', 'public', 'fonts', '*.woff2')):
    t = TTFont(f); t.flavor = None
    t.save(os.path.join(FONTS, os.path.basename(f).replace('.woff2', '.ttf')))
PHOTOS = os.path.join(ROOT, 'brand-kit', 'photography')
STORY = dict(photo='lexis-09-story-black-lower.jpg', mode='fill', fy=0.46)

REELS = {
    'en': dict(**STORY,
        audio='vo-en-general-take1.mp3', dur=22.9, k=1.0,
        head="Why is speaking\\Nstill so hard?",
        cues=[(0.0, 2.3, "You've studied English for years…"),
              (2.4, 5.2, "so why does speaking still feel so hard?"),
              (5.5, 7.8, "Because speaking takes practice."),
              (7.9, 9.6, "With LEXIS, you just talk —"),
              (9.7, 13.5, "out loud, in real time, with gentle corrections"),
              (13.6, 17.2, "Job interviews. Travel. Work. Everyday chat.")],
        end_at=17.3, end="Try 15 minutes free\\Nno card required"),
    'th': dict(**STORY,
        audio='vo-th-hospitality-take1.mp3', dur=22.7, k=1.3,
        head="ภาษาอังกฤษ\\Nสำหรับงานโรงแรม",
        cues=[(0.0, 2.3, "แขกต่างชาติเดินมาที่เคาน์เตอร์…"),
              (2.4, 5.3, "คุณพร้อมตอบเป็นภาษาอังกฤษหรือยัง?"),
              (5.4, 9.0, "ซ้อมพูดจริง ออกเสียงจริง กับ LEXIS"),
              (9.1, 10.9, "LEXIS รับบทเป็นแขก"),
              (11.0, 16.6, "คุณรับบทพนักงาน: เช็คอิน รับออร์เดอร์\\Nรับมือคำร้องเรียน")],
        end_at=16.7, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    # 29 Sep 2026, second batch: one reel per practice page, so each post can
    # link to the page that matches it. A different portrait for each keeps a
    # feed of them from looking like one clip reposted.
    'th-interview': dict(
        photo='lexis-13-portrait-black-smile-alt.jpg', mode='band', fy=0.46,
        audio='vo-th-interview.mp3', dur=17.2, k=1.3,
        head="ซ้อมสัมภาษณ์งาน\\Nเป็นภาษาอังกฤษ",
        cues=[(0.0, 2.5, "สัมภาษณ์งานเป็นภาษาอังกฤษพรุ่งนี้…"),
              (2.6, 4.4, "ใจเต้นแรงไหม?"),
              (4.5, 7.0, "ซ้อมตอบคำถามสัมภาษณ์กับ LEXIS ก่อน"),
              (7.1, 11.2, "พูดออกเสียงจริง\\Nได้คำแนะนำอย่างอ่อนโยนระหว่างคุย")],
        end_at=11.3, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    'th-travel': dict(
        photo='lexis-11-portrait-teal-overshoulder.jpg', mode='band', fy=0.43,
        audio='vo-th-travel.mp3', dur=16.0, k=1.3,
        head="ภาษาอังกฤษ\\Nสำหรับเที่ยวต่างประเทศ",
        cues=[(0.0, 1.8, "ทริปต่างประเทศครั้งหน้า…"),
              (1.9, 5.5, "สั่งอาหาร ถามทาง เช็คอินโรงแรม\\Nได้ด้วยตัวเองไหม?"),
              (5.8, 9.0, "ซ้อมบทสนทนาภาษาอังกฤษกับ LEXIS\\Nก่อนออกเดินทาง"),
              (9.1, 10.7, "พูดจริง ไม่ต้องพิมพ์")],
        end_at=10.8, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    'th-work': dict(
        photo='lexis-12-portrait-black-speaking-alt.jpg', mode='band', fy=0.46,
        audio='vo-th-work.mp3', dur=19.0, k=1.3,
        head="ภาษาอังกฤษ\\Nสำหรับที่ทำงาน",
        cues=[(0.0, 1.8, "ประชุมกับทีมต่างชาติ…"),
              (1.9, 4.0, "แต่คำพูดติดอยู่ในหัว?"),
              (4.1, 7.3, "ซ้อมพูดภาษาอังกฤษที่ใช้ในที่ทำงานกับ LEXIS"),
              (7.4, 13.0, "ทั้งการประชุม และคุยเล่นกับเพื่อนร่วมงาน\\Nพูดจริง ได้คำแนะนำทันที")],
        end_at=13.1, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    'en-learn-thai': dict(
        photo='lexis-03-portrait-cream-listening.jpg', mode='band', fy=0.43,
        audio='vo-en-learn-thai.mp3', dur=22.1, k=1.0,
        head="Practise speaking\\NThai, out loud",
        cues=[(0.0, 1.7, "Living in Thailand…"),
              (1.8, 4.6, "but your Thai still stops at \"sawasdee\"?"),
              (4.9, 8.2, "With LEXIS, you practise speaking Thai out loud"),
              (8.3, 13.0, "everyday conversations, in real time,\\Nwith gentle corrections"),
              (13.1, 16.0, "No textbook. No typing. Just talk.")],
        end_at=16.1, end="Try 15 minutes free\\Nno card required"),
    # 30 Sep 2026, Community reels. Every claim is the Community page's own:
    # an optional ฿50 at checkout, one payment, nothing recurring, into one
    # shared pool meant to fund free/discounted access through schools and
    # youth groups. The page says plainly the pool hasn't funded a cohort
    # yet, so the scripts say "to help fund", never that students already
    # have been. End cards send people to /community, not the home page.
    'th-community': dict(
        photo='lexis-02-portrait-black-speaking.jpg', mode='band', fy=0.43,
        audio='vo-th-community.mp3', dur=27.6, k=1.3,
        head="LEXIS Community\\Nการฝึกของคุณเปิดประตูได้",
        cues=[(0.0, 1.9, "บทสนทนาที่มั่นใจ…"),
              (2.0, 3.8, "นำไปสู่การสัมภาษณ์"),
              (3.9, 6.1, "การสัมภาษณ์นำไปสู่งาน"),
              (6.2, 8.8, "และงาน… เปลี่ยนชีวิตได้"),
              (9.0, 12.5, "ตอนซื้อแพ็กเกจ LEXIS\\Nเลือกเพิ่ม ฿50 ได้"),
              (12.6, 15.5, "แค่แตะครั้งเดียว จ่ายรวมในครั้งเดียว"),
              (15.6, 17.4, "ทุกบาทเข้ากองทุนเดียวกัน"),
              (17.5, 23.6, "เพื่อช่วยให้นักเรียนที่จ่ายไม่ไหวได้ฝึกพูดฟรี\\Nหรือลดราคา ผ่านโรงเรียนและกลุ่มเยาวชน")],
        end_at=23.7, end="การฝึกของคุณ\\Nเปิดประตูให้คนอื่นได้",
        end_url='learnwithlexis.com/th/community'),
    'en-community': dict(
        photo='lexis-10-closecrop-black.jpg', mode='band', fy=0.43,
        audio='vo-en-community.mp3', dur=26.4, k=1.0,
        head="LEXIS Community",
        cues=[(0.0, 3.0, "A confident conversation can lead to an interview."),
              (3.1, 5.3, "An interview can lead to a job…"),
              (5.4, 8.0, "and a job can change a life."),
              (8.2, 11.9, "When you buy a LEXIS pass,\\Nyou can choose to add ฿50."),
              (12.0, 15.0, "One tap. Same payment. Nothing recurring."),
              (15.1, 17.8, "Every baht goes into one shared pool,"),
              (17.9, 22.4, "to help fund free and discounted practice\\Nfor students who couldn't otherwise afford it.")],
        end_at=22.5, end="Your practice can open\\Nsomeone else's door",
        end_url='learnwithlexis.com/community'),
    'th-community-partners': dict(
        photo='lexis-01-portrait-black-smile.jpg', mode='band', fy=0.43,
        audio='vo-th-community-partners.mp3', dur=22.3, k=1.3,
        head="โรงเรียนและกลุ่มเยาวชน\\Nร่วมเป็นพันธมิตร",
        cues=[(0.0, 4.4, "คุณดูแลโรงเรียน ศูนย์เยาวชน\\Nหรือองค์กรชุมชนอยู่หรือเปล่า?"),
              (4.6, 8.1, "LEXIS Community กำลังมองหาพันธมิตรกลุ่มแรก"),
              (8.2, 11.4, "ให้นักเรียนได้ฝึกพูดภาษาอังกฤษออกเสียงจริง"),
              (11.5, 15.7, "ลดราคาพิเศษหรือฟรีทั้งกลุ่ม\\Nทุนมาจากผู้ใช้ LEXIS เอง")],
        end_at=15.8, end="เราเพิ่งเริ่มต้น\\Nและอยากคุยกับคุณ",
        end_url='learnwithlexis.com/th/community'),
    # 1 Oct 2026, introduction reels: the owner's call that a new account's
    # first post should say what LEXIS is, not open on a niche (hotel staff).
    # "คู่สนทนาเสมือน" / "virtual conversation partner" is deliberate: the
    # same word the landing hero keeps so nothing implies LEXIS is a person.
    'th-intro': dict(
        photo='lexis-05-vertical-black-headroom.jpg', mode='band', fy=0.46,
        audio='vo-th-intro.mp3', dur=25.2, k=1.3,
        head="รู้จัก LEXIS\\Nคู่ฝึกพูดของคุณ",
        cues=[(0.0, 1.3, "สวัสดีค่ะ…"),
              (1.4, 3.9, "ขอแนะนำให้รู้จัก LEXIS"),
              (4.0, 7.9, "คู่สนทนาเสมือนสำหรับฝึกพูด\\Nภาษาอังกฤษและภาษาไทย"),
              (8.0, 10.8, "แค่กดปุ่มเดียว แล้วพูดออกมาจริง ๆ"),
              (10.9, 15.8, "LEXIS ฟัง ตอบกลับทันที\\Nและช่วยแก้ให้อย่างอ่อนโยนระหว่างคุย"),
              (15.9, 19.2, "จบแต่ละครั้ง สรุปให้ว่าควรฝึกอะไรต่อ")],
        end_at=19.3, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    'en-intro': dict(**STORY,
        audio='vo-en-intro.mp3', dur=24.6, k=1.0,
        head="Meet LEXIS",
        cues=[(0.0, 2.3, "Hi… meet LEXIS."),
              (2.4, 6.6, "A virtual conversation partner\\Nfor practising spoken English and Thai."),
              (6.7, 9.6, "Tap one button and just talk,"),
              (9.7, 14.6, "out loud. LEXIS listens, replies in real time,\\Nand gently corrects you as you go."),
              (14.7, 18.5, "After each session: a plain summary\\Nof what to work on next.")],
        end_at=18.6, end="Try 15 minutes free\\Nno card required"),
    'th-3reasons': dict(
        photo='lexis-13-portrait-black-smile-alt.jpg', mode='band', fy=0.46,
        audio='vo-th-3reasons.mp3', dur=20.3, k=1.3,
        head="3 เหตุผล\\Nที่ควรลองฝึกพูดกับ LEXIS",
        cues=[(0.0, 3.0, "สามเหตุผล ที่ควรลองฝึกพูดกับ LEXIS!"),
              (3.3, 6.6, "① พูดผิดได้ ไม่มีใครตัดสิน"),
              (6.7, 10.0, "② ฝึกได้ทุกเวลา ไม่ต้องรอใคร"),
              (10.1, 14.0, "③ ได้คำแนะนำทันทีระหว่างคุย\\Nไม่ต้องรอจนจบ")],
        end_at=14.1, end="ลองเลย ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    # 2 Oct 2026, entertainment batch: funny / travel / culture posts that
    # earn a follow on their own and mention LEXIS only at the end. Funny
    # means laughing WITH learners, never at Thai people: the Thinglish reel
    # says outright that the phrases aren't wrong, just unnatural. The
    # tongue-twister reel is two voices joined (Sarah, then Aom for the
    # Thai, then Sarah), because an English voice reading Thai tones is the
    # one thing that would make a tones reel wrong. Etiquette and nickname
    # facts are the widely documented basics, nothing a Thai viewer would
    # dispute; "Mai pen rai" and the nicknames are said by Sarah on purpose,
    # as a learner would.
    'th-thinglish': dict(
        photo='lexis-01-portrait-black-smile.jpg', mode='band', fy=0.43,
        audio='vo-th-thinglish.mp3', dur=29.6, k=1.3,
        head="ประโยคที่คนไทยพูดบ่อย\\Nแต่ฝรั่งงง!",
        cues=[(0.0, 3.9, "ประโยคภาษาอังกฤษที่คนไทยพูดบ่อย…\\Nแต่ฝรั่งฟังแล้วงง!"),
              (4.6, 10.1, "① \"Open the light\"\\N→ Turn on the light"),
              (10.2, 15.8, "② \"Close the air\"\\N→ Turn off the AC"),
              (15.9, 21.0, "③ \"Check bin\"\\N→ Can I have the bill, please?"),
              (21.1, 24.0, "ไม่ผิดหรอก ฝรั่งก็พอเข้าใจ"),
              (24.1, 26.8, "อยากพูดให้เป็นธรรมชาติ\\Nซ้อมพูดกับ LEXIS")],
        end_at=26.9, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
    'en-mai-mai': dict(
        photo='lexis-12-portrait-black-speaking-alt.jpg', mode='band', fy=0.46,
        audio='vo-en-mai-mai.mp3', dur=30.4, k=1.0,
        head="Can you say this\\NThai sentence?",
        cues=[(0.0, 1.9, "Think Thai tones are easy?"),
              (2.0, 4.2, "Try saying this one…"),
              (4.3, 8.5, "{\\fs84}ไม้ใหม่ ไม่ไหม้ ใช่ไหม{\\fs52}\\Nmái mài mâi mâi châi mǎi"),
              (8.6, 13.6, "Six words… almost all of them\\Nsound like \"mai\""),
              (13.7, 16.9, "\"New wood doesn't burn, does it?\""),
              (17.0, 20.5, "Get one tone wrong…\\Nthe whole sentence falls apart"),
              (20.6, 24.7, "The fix: say it out loud,\\Nagain and again"),
              (24.8, 26.9, "Practise speaking Thai with LEXIS")],
        end_at=27.0, end="Try 15 minutes free\\Nno card required"),
    'en-etiquette': dict(
        photo='lexis-02-portrait-black-speaking.jpg', mode='band', fy=0.43,
        audio='vo-en-etiquette.mp3', dur=33.6, k=1.0,
        head="3 things to know\\Nbefore you visit Thailand",
        cues=[(0.0, 3.1, "Three things to know\\Nbefore you visit Thailand"),
              (3.2, 10.0, "① The wai: palms together, a small bow.\\NIf someone wais you, wai back."),
              (10.1, 16.2, "② The head is special.\\NDon't touch anyone's head."),
              (16.3, 22.5, "③ Feet are the lowest part of the body.\\NDon't point them at people or Buddha images."),
              (22.6, 26.0, "Got it wrong? Mai pen rai:\\Nnever mind."),
              (26.1, 30.2, "Want to say more than sawasdee?\\NPractise speaking Thai with LEXIS")],
        end_at=30.3, end="Try 15 minutes free\\Nno card required"),
    'en-nicknames': dict(
        photo='lexis-10-closecrop-black.jpg', mode='band', fy=0.43,
        audio='vo-en-nicknames.mp3', dur=28.5, k=1.0,
        head="Why is your colleague\\Ncalled Pancake?",
        cues=[(0.0, 3.5, "Your colleague might be called… Pancake."),
              (3.6, 7.7, "Your dentist? Benz.\\NYour landlord? Golf."),
              (7.8, 14.8, "Thai full names can be long,\\Nso almost everyone has a nickname"),
              (14.9, 20.5, "Fruits, cars, sports… even drinks.\\NYes, Pepsi is a name."),
              (20.6, 25.0, "Want to ask someone's nickname in Thai?\\NPractise speaking Thai with LEXIS")],
        end_at=25.1, end="Try 15 minutes free\\Nno card required"),
    'th-airport': dict(
        photo='lexis-11-portrait-teal-overshoulder.jpg', mode='band', fy=0.43,
        audio='vo-th-airport.mp3', dur=26.0, k=1.3,
        head="ภาษาอังกฤษ\\Nที่สนามบิน",
        cues=[(0.0, 3.9, "ไปเที่ยวต่างประเทศ\\Nที่สนามบินต้องพูดอะไรบ้าง?"),
              (4.0, 8.3, "ขอที่นั่งริมหน้าต่าง\\N\"Can I have a window seat, please?\""),
              (8.4, 12.4, "หาประตูขึ้นเครื่อง\\N\"Is this the gate for Tokyo?\""),
              (12.5, 16.1, "กระเป๋าไม่มา\\N\"My bag didn't arrive.\""),
              (16.2, 19.3, "หาแท็กซี่\\N\"Where can I get a taxi?\""),
              (19.4, 22.9, "ซ้อมพูดกับ LEXIS\\Nก่อนออกเดินทาง")],
        end_at=23.0, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร")
}

def ts(s):
    return f"0:{int(s // 60):02d}:{s % 60:05.2f}"

import sys
ONLY = sys.argv[1:]
for lang, r in REELS.items():
    if ONLY and lang not in ONLY:
        continue
    k, dur = r['k'], r['dur']
    ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Head,IBM Plex Sans Thai SemiBold,{70*k:.0f},&H00FFFFFF,&H00FFFFFF,&H00140B05,&H00140B05,0,0,0,0,100,100,0,0,1,0,0,8,60,60,150,1
Style: Url,IBM Plex Sans Thai SemiBold,40,&H003AB2FF,&H003AB2FF,&H00140B05,&H00140B05,0,0,0,0,100,100,1,0,1,0,0,8,60,60,{360 if k == 1.0 else 400},1
Style: Cap,IBM Plex Sans Thai SemiBold,{52*k:.0f},&H00FFFFFF,&H00FFFFFF,&H00140B05,&HB0140B05,0,0,0,0,100,100,0,0,3,14,0,2,70,70,440,1
Style: End,IBM Plex Sans Thai SemiBold,{80*k:.0f},&H00FFFFFF,&H00FFFFFF,&H00140B05,&HE0140B05,0,0,0,0,100,100,0,0,3,40,0,2,60,60,400,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,{ts(0)},{ts(dur)},Head,,0,0,0,,{{\\fad(300,0)}}{r['head']}
Dialogue: 0,{ts(0)},{ts(dur)},Url,,0,0,0,,learnwithlexis.com
"""
    for a, b, t in r['cues']:
        ass += f"Dialogue: 0,{ts(a)},{ts(b)},Cap,,0,0,0,,{t}\n"
    # amber (#FFB23A) URL on the end card, matching the brand tile
    ass += (f"Dialogue: 1,{ts(r['end_at'])},{ts(dur)},End,,0,0,0,,{{\\fad(250,0)}}{r['end']}"
            f"\\N{{\\fs{46*k:.0f}\\c&H3AB2FF&}}{r.get('end_url', 'learnwithlexis.com')}\n")
    ass_path = os.path.join(FONTS, f'{lang}.ass')
    open(ass_path, 'w', encoding='utf8').write(ass)
    frames = int(dur * 30)
    # Work at 2x so zoompan's integer crop steps don't visibly judder, then a
    # slow 1.00 -> 1.06 push-in centred on the face (fy = face height as a
    # fraction of the frame). 'fill' covers the frame with a 9:16 photo that
    # already has headroom for the text; 'band' is for square and 3:4
    # portraits, which put hair right under the URL and, on the cream
    # backdrop, left amber-on-cream unreadable. It starts the photo at
    # y=450 so the headline and URL always sit on plain navy.
    if r['mode'] == 'fill':
        base = "scale=2160:3840:force_original_aspect_ratio=increase,crop=2160:3840"
    else:
        base = "scale=2160:-2,pad=2160:3840:0:900:color=0x050B14"
    vf = (f"{base},"
          f"zoompan=z='1+0.06*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih*{r['fy']}-(ih/zoom/2)':d={frames}:s=1080x1920:fps=30,"
          f"subtitles={ass_path}:fontsdir={FONTS}")
    out = os.path.join(HERE, f'lexis-vo-reel-{lang}.mp4')
    subprocess.run([F, '-y', '-v', 'error', '-loop', '1', '-i', os.path.join(PHOTOS, r['photo']), '-i', os.path.join(HERE, r['audio']),
                    '-vf', vf, '-t', str(dur), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100',
                    '-af', f'apad,afade=t=out:st={dur - 0.4}:d=0.4', '-movflags', '+faststart', out], check=True)
    print('wrote', out)
