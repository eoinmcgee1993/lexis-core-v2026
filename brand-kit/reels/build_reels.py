"""Vertical 9:16 reels of the LEXIS hero video, EN and TH, for TikTok,
Instagram Reels and YouTube Shorts.

Run from the repo root:  python3 brand-kit/reels/build_reels.py
Needs: pip install imageio-ffmpeg fonttools brotli  (the Playwright ffmpeg in
/opt/pw-browsers is a recording-only build with no libx264 or libass).

Why the layout is what it is: TikTok's own caption, buttons and progress bar
cover roughly the bottom 400px and a strip down the right edge of a 1920px
frame, so nothing that has to be read sits there. The headline and URL live
in the top band, the spoken captions end ~430px above the bottom, and the
end card sits on the chest, not the face. Thai glyphs render visibly smaller
than Latin at the same point size in IBM Plex Sans Thai, hence k=1.3.

Captions come from the same .vtt files the site's hero uses, so the reel and
the page cannot say different things. The trial length is in the end card
text below; if TRIAL.minutes in facts.js changes, change it here too.
"""
import os, glob, tempfile
from fontTools.ttLib import TTFont
ROOT=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT=os.path.join(ROOT,'brand-kit','reels')
FONTS=tempfile.mkdtemp()
for f in glob.glob(os.path.join(ROOT,'frontend','public','fonts','*.woff2')):
    t=TTFont(f); t.flavor=None; t.save(os.path.join(FONTS,os.path.basename(f).replace('.woff2','.ttf')))
import re, subprocess
import imageio_ffmpeg
F=imageio_ffmpeg.get_ffmpeg_exe()
M=os.path.join(ROOT,'frontend','public','marketing')+'/'
def vtt(path):
    s=open(path,encoding='utf8').read()
    out=[]
    for a,b,t in re.findall(r'(\d\d:\d\d:\d\d\.\d+) --> (\d\d:\d\d:\d\d\.\d+)\n(.+)',s):
        out.append((a[1:-1],b[1:-1],t.strip()))
    return out
# ASS colours are &HBBGGRR
HEAD=dict(
 en=("Practise speaking English,\\Nout loud","Try 15 minutes free\\Nno card required"),
 th=("ฝึกพูดภาษาอังกฤษ\\Nออกเสียงจริง","ทดลองฟรี 15 นาที\\Nไม่ต้องผูกบัตร"))
for lang in ('en','th'):
    head,end=HEAD[lang]
    k=1.3 if lang=='th' else 1.0
    ass=f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Head,IBM Plex Sans Thai SemiBold,{62*k:.0f},&H00FFFFFF,&H00FFFFFF,&H00140B05,&H00140B05,0,0,0,0,100,100,0,0,1,0,0,8,60,60,34,1
Style: Cap,IBM Plex Sans Thai SemiBold,{54*k:.0f},&H00FFFFFF,&H00FFFFFF,&H00140B05,&HB0140B05,0,0,0,0,100,100,0,0,3,14,0,2,70,70,430,1
Style: Url,IBM Plex Sans Thai SemiBold,38,&H00009EFF,&H00009EFF,&H00140B05,&H00140B05,0,0,0,0,100,100,1,0,1,0,0,8,60,60,{190 if lang=='en' else 205},1
Style: End,IBM Plex Sans Thai SemiBold,{84*k:.0f},&H00FFFFFF,&H00FFFFFF,&H00140B05,&HE0140B05,0,0,0,0,100,100,0,0,3,40,0,2,60,60,520,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,0:00:19.40,Head,,0,0,0,,{{\\fad(300,0)}}{head}
Dialogue: 0,0:00:00.00,0:00:19.40,Url,,0,0,0,,learnwithlexis.com
"""
    for a,b,t in vtt(M+f'lexis-intro-hero.{lang}.vtt'):
        if a>='0:00:15.70': continue   # the end card carries the last line
        ass+=f"Dialogue: 0,{a},{b},Cap,,0,0,0,,{t}\n"
    ass+=f"Dialogue: 1,0:00:15.60,0:00:19.40,End,,0,0,0,,{{\\fad(250,0)}}{end}\\N{{\\fs{46*k:.0f}\\c&H009EFF&}}learnwithlexis.com\n"
    ass_path=os.path.join(FONTS,f'{lang}.ass'); open(ass_path,'w',encoding='utf8').write(ass)
    vf=("scale=1080:-2,pad=1080:1920:0:260:color=0x050B14,"
        f"subtitles={ass_path}:fontsdir={FONTS}")
    subprocess.run([F,'-y','-v','error','-i',M+'lexis-intro-hero.mp4','-vf',vf,'-c:v','libx264','-preset','slow','-crf','22',
        '-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ar','44100','-movflags','+faststart',os.path.join(OUT,f'lexis-reel-{lang}.mp4')],check=True)
print('ok')
