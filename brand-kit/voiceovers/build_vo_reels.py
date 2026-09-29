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
}

def ts(s):
    return f"0:{int(s // 60):02d}:{s % 60:05.2f}"

for lang, r in REELS.items():
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
            f"\\N{{\\fs{46*k:.0f}\\c&H3AB2FF&}}learnwithlexis.com\n")
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
