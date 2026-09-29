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
PHOTO = os.path.join(ROOT, 'brand-kit', 'photography', 'lexis-09-story-black-lower.jpg')

REELS = {
    'en': dict(
        audio='vo-en-general-take1.mp3', dur=22.9, k=1.0,
        head="Why is speaking\\Nstill so hard?",
        cues=[(0.0, 2.3, "You've studied English for years…"),
              (2.4, 5.2, "so why does speaking still feel so hard?"),
              (5.5, 7.8, "Because speaking takes practice."),
              (7.9, 9.6, "With LEXIS, you just talk —"),
              (9.7, 13.5, "out loud, in real time, with gentle corrections"),
              (13.6, 17.2, "Job interviews. Travel. Work. Everyday chat.")],
        end_at=17.3, end="Try 15 minutes free\\Nno card required"),
    'th': dict(
        audio='vo-th-hospitality-take1.mp3', dur=22.7, k=1.3,
        head="ภาษาอังกฤษ\\Nสำหรับงานโรงแรม",
        cues=[(0.0, 2.3, "แขกต่างชาติเดินมาที่เคาน์เตอร์…"),
              (2.4, 5.3, "คุณพร้อมตอบเป็นภาษาอังกฤษหรือยัง?"),
              (5.4, 9.0, "ซ้อมพูดจริง ออกเสียงจริง กับ LEXIS"),
              (9.1, 10.9, "LEXIS รับบทเป็นแขก"),
              (11.0, 16.6, "คุณรับบทพนักงาน: เช็คอิน รับออร์เดอร์\\Nรับมือคำร้องเรียน")],
        end_at=16.7, end="ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"),
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
Style: Url,IBM Plex Sans Thai SemiBold,40,&H003AB2FF,&H003AB2FF,&H00140B05,&H00140B05,0,0,0,0,100,100,1,0,1,0,0,8,60,60,{360 if lang == 'en' else 400},1
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
    # Scale up first so zoompan's integer crop steps don't visibly judder,
    # then a slow 1.00 -> 1.06 push-in centred on the face.
    vf = (f"scale=2160:-2,crop=2160:3840,"
          f"zoompan=z='1+0.06*on/{frames}':x='iw/2-(iw/zoom/2)':y='ih*0.46-(ih/zoom/2)':d={frames}:s=1080x1920:fps=30,"
          f"subtitles={ass_path}:fontsdir={FONTS}")
    out = os.path.join(HERE, f'lexis-vo-reel-{lang}.mp4')
    subprocess.run([F, '-y', '-v', 'error', '-loop', '1', '-i', PHOTO, '-i', os.path.join(HERE, r['audio']),
                    '-vf', vf, '-t', str(dur), '-c:v', 'libx264', '-preset', 'slow', '-crf', '21',
                    '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-ar', '44100',
                    '-af', f'apad,afade=t=out:st={dur - 0.4}:d=0.4', '-movflags', '+faststart', out], check=True)
    print('wrote', out)
