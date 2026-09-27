"""Short-form social videos for TikTok, Instagram Reels, YouTube Shorts and
Facebook feed: recuts of the existing marketing footage, one reel per practice
topic (EN + TH), and a Thailand travel series (top-10 lists, fun facts,
phrases) that ends on LEXIS's Thai practice.

Run from the repo root:  python3 brand-kit/reels/social/build_social.py
Needs: pip install imageio-ffmpeg fonttools brotli pillow requests
(same reason as ../build_reels.py: the Playwright ffmpeg has no libx264/libass).

Where the words come from, so the videos cannot drift from the site:
- trial minutes and the Community add-on price are read from facts.js;
- each topic reel's heading and practice lines are read from its page's h1
  and PRACTICE_PROMPTS, the same lines the page itself shows;
- the Community heading is read from LandingPage.jsx.
Only the travel-series copy lives here, and every line of it is a checkable
fact or a plain recommendation, not a product claim. The travel reels are
English-only on purpose: they target visitors and expats, and their pitch is
LEXIS's Thai practice.

Layout rules are the same as ../build_reels.py: TikTok's buttons and caption
cover roughly the bottom 400px and a strip down the right edge, so readable
text keeps a 440px bottom margin and a wider right margin than left.

Photos are Unsplash (free for commercial use), listed with credits in
photos.json and re-downloaded into LEXIS_PHOTO_CACHE (default
/tmp/lexis-social-cache) when missing. CREDITS.md is rewritten on each build.

The travel reels ship silent (a mute AAC track, so every platform accepts the
upload). Add a trending sound inside the app when posting: licensed in-app
audio beats any music we could embed.
"""
import glob, json, os, re, subprocess, tempfile
import imageio_ffmpeg, requests
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
HERE = os.path.join(ROOT, 'brand-kit', 'reels', 'social')
CACHE = os.environ.get('LEXIS_PHOTO_CACHE', '/tmp/lexis-social-cache')
MK = os.path.join(ROOT, 'frontend', 'public', 'marketing')
F = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS = 1080, 1920, 30
TMP = tempfile.mkdtemp(prefix='lexis-social-')
os.makedirs(CACHE, exist_ok=True)

FONTS = os.path.join(TMP, 'fonts'); os.makedirs(FONTS)
for f in glob.glob(os.path.join(ROOT, 'frontend', 'public', 'fonts', '*.woff2')):
    t = TTFont(f); t.flavor = None; t.save(os.path.join(FONTS, os.path.basename(f).replace('.woff2', '.ttf')))
PLEX = os.path.join(FONTS, 'ibm-plex-sans-thai-600.ttf')


def src(path):
    return open(os.path.join(ROOT, path), encoding='utf8').read()


FACTS = src('frontend/src/content/facts.js')
TRIAL_MIN = int(re.search(r'TRIAL\s*=\s*\{\s*minutes:\s*(\d+)', FACTS).group(1))
ADDON_THB = int(re.search(r'SPONSOR_ADDON_THB\s*=\s*(\d+)', FACTS).group(1))
LANDING = src('frontend/src/pages/LandingPage.jsx')
COMMUNITY_HEAD = [m[1] for m in re.findall(r'communityHeading:\s*(["\'])(.*?)\1', LANDING)]  # [en, th]


def topic_copy(page):
    s = src(f'frontend/src/pages/{page}.jsx')
    block = re.search(r'const PRACTICE_PROMPTS = \[(.*?)\];', s, re.S).group(1)
    lines = [l.replace("\\'", "'").strip('"') for l in re.findall(r"'((?:[^'\\]|\\.)*)'", block)]
    h1 = [m.replace("\\'", "'") for m in re.findall(r"h1:\s*'((?:[^'\\]|\\.)*)'", s)]
    return h1[0], h1[1], lines


PHOTOS = json.load(open(os.path.join(HERE, 'photos.json'), encoding='utf8'))
PHOTOS.pop('_note')


def photo(key):
    p = os.path.join(CACHE, f'{key}.jpg')
    if not os.path.exists(p):
        r = requests.get(f"https://images.unsplash.com/{PHOTOS[key]['file']}?fm=jpg&q=85&w=1440", timeout=60)
        r.raise_for_status(); open(p, 'wb').write(r.content)
    return p


def ass_col(rgb, alpha=0):
    r, g, b = int(rgb[0:2], 16), int(rgb[2:4], 16), int(rgb[4:6], 16)
    return f'&H{alpha:02X}{b:02X}{g:02X}{r:02X}'


AMBER, WHITE, INK, NAVY, CANVAS = ass_col('FF9E00'), ass_col('FFFFFF'), ass_col('1E293B'), ass_col('050B14'), ass_col('FAFAF7')
STY = 'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding'


def style(name, font, size, col, align, ml=90, mr=150, mv=440, border=1, outline=0, shadow=3, back=None):
    back = back or ass_col('050B14', 0x60)
    # With BorderStyle 3 (opaque box) libass paints the box in OutlineColour,
    # not BackColour; passing navy there made the canvas bubbles dark-on-dark.
    return (f'Style: {name},{font},{size},{col},{col},{back if border == 3 else NAVY},{back},0,0,0,0,100,100,0,0,'
            f'{border},{outline},{shadow},{align},{ml},{mr},{mv},1')


STYLES = '\n'.join([
    style('Brand', 'IBM Plex Sans Thai SemiBold', 34, ass_col('FFFFFF', 0x40), 8, mv=120, shadow=0),
    style('Kicker', 'IBM Plex Sans Thai SemiBold', 42, AMBER, 8, mv=200, shadow=0),
    style('Num', 'Fraunces', 210, AMBER, 1),
    style('Title', 'Fraunces', 88, WHITE, 1),
    style('Note', 'IBM Plex Sans Thai', 46, ass_col('FFFFFF', 0x10), 1),
    style('Big', 'Fraunces', 104, WHITE, 5),
    style('Mid', 'IBM Plex Sans Thai SemiBold', 58, WHITE, 5, shadow=2),
    style('Thai', 'IBM Plex Sans Thai SemiBold', 104, WHITE, 1),
    style('Roman', 'IBM Plex Sans Thai SemiBold', 50, AMBER, 1, shadow=2),
    style('Bubble', 'IBM Plex Sans Thai SemiBold', 50, INK, 5, ml=120, mr=170, border=3, outline=28, shadow=0, back=CANVAS),
    style('Cta', 'IBM Plex Sans Thai SemiBold', 56, WHITE, 5, shadow=0),
    style('Url', 'IBM Plex Sans Thai SemiBold', 50, AMBER, 5, shadow=0),
    style('Head', 'IBM Plex Sans Thai SemiBold', 58, WHITE, 8, ml=60, mr=60, mv=40, shadow=0),
    style('Cap', 'IBM Plex Sans Thai SemiBold', 52, WHITE, 2, ml=70, mr=70, mv=430, border=3, outline=14, shadow=0, back=ass_col('050B14', 0x50)),
    style('End', 'IBM Plex Sans Thai SemiBold', 78, WHITE, 2, ml=60, mr=60, mv=520, border=3, outline=40, shadow=0, back=ass_col('050B14', 0x20)),
    style('SqCap', 'IBM Plex Sans Thai SemiBold', 44, WHITE, 2, ml=60, mr=60, mv=50, border=3, outline=12, shadow=0, back=ass_col('050B14', 0x50)),
    style('SqEnd', 'IBM Plex Sans Thai SemiBold', 62, WHITE, 2, ml=60, mr=60, mv=90, border=3, outline=34, shadow=0, back=ass_col('050B14', 0x20)),
])


def t(sec):
    return f'{int(sec // 3600)}:{int(sec % 3600 // 60):02d}:{sec % 60:05.2f}'


def write_ass(events, name, res=(W, H)):
    body = (f'[Script Info]\nScriptType: v4.00+\nPlayResX: {res[0]}\nPlayResY: {res[1]}\nWrapStyle: 0\n'
            f'ScaledBorderAndShadow: yes\n\n[V4+ Styles]\n{STY}\n{STYLES}\n\n[Events]\n'
            'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n')
    for st, a, b, text in events:
        body += f'Dialogue: 0,{t(a)},{t(b)},{st},,0,0,0,,{text}\n'
    p = os.path.join(TMP, name + '.ass'); open(p, 'w', encoding='utf8').write(body); return p


def thai_fit(text, px_max=840, size=64):
    """libass only wraps at spaces and Thai has none, so Thai lines are broken
    by hand (at phrase boundaries passed in as \\N) and shrunk until the
    widest line fits. PIL's basic layout slightly over-measures Thai marks,
    which errs toward smaller, never toward overflow."""
    lines = text.split('\\N')
    while size > 36:
        f = ImageFont.truetype(PLEX, size)
        # 0.8: PIL's basic layout gives Thai combining marks an advance that
        # libass (HarfBuzz) doesn't, so raw widths ran ~25% long.
        if 0.8 * max(f.getlength(l) for l in lines) <= px_max: break
        size -= 2
    return f'{{\\fs{size}}}' + text


def overlays():
    for name, top, bottom, tint in (('grad', 185, 235, 35), ('dim', 200, 235, 150)):
        col = Image.new('L', (1, H))
        col.putdata([max(tint, int(top * (1 - y / 650)) if y < 650 else 0,
                         int(bottom * (y - 880) / (H - 880)) if y > 880 else 0) for y in range(H)])
        im = Image.new('RGBA', (W, H), (5, 11, 20, 0)); im.putalpha(col.resize((W, H)))
        im.save(os.path.join(TMP, f'{name}.png'))
    card = Image.new('RGB', (W, H), (5, 11, 20)); glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W // 2 - 520, 380, W // 2 + 520, 1400), fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(160))
    card.paste(Image.new('RGB', (W, H), (255, 158, 0)), (0, 0), glow.point(lambda v: v // 3))
    logo = Image.open(os.path.join(ROOT, 'brand-kit', 'logo', 'lexis-mark-512.png')).convert('RGBA').resize((220, 220))
    card.paste(logo, (W // 2 - 110, 430), logo)
    card.save(os.path.join(TMP, 'card.png'))


def render_still(img, dur, events, name, overlay='grad', zoom=True):
    n = int(round(dur * FPS)); ass = write_ass(events, name)
    bg = (f"[0]scale={int(W*1.5)}:{int(H*1.5)}:force_original_aspect_ratio=increase,crop={int(W*1.5)}:{int(H*1.5)},"
          f"zoompan=z='1+0.07*on/{n}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={n}:s={W}x{H}:fps={FPS}" if zoom else
          f"[0]scale={W}:{H},fps={FPS}")
    fc = f"{bg}[bg];[bg][1]overlay=format=auto[v0];[v0]subtitles={ass}:fontsdir={FONTS},format=yuv420p[v]"
    out = os.path.join(TMP, name + '.mp4')
    subprocess.run([F, '-y', '-v', 'error'] + ([] if zoom else ['-loop', '1']) + ['-i', img, '-i', os.path.join(TMP, overlay + '.png'),
                    '-f', 'lavfi', '-t', f'{dur}', '-i', 'anullsrc=r=44100:cl=stereo', '-filter_complex', fc,
                    '-map', '[v]', '-map', '2:a', '-t', f'{dur}', '-r', str(FPS), '-c:v', 'libx264', '-preset', 'medium',
                    '-crf', '24', '-c:a', 'aac', '-b:a', '96k', out], check=True)
    return out


def concat(parts, out_name):
    lst = os.path.join(TMP, out_name + '.txt')
    open(lst, 'w').write(''.join(f"file '{p}'\n" for p in parts))
    subprocess.run([F, '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy',
                    '-movflags', '+faststart', os.path.join(HERE, out_name + '.mp4')], check=True)
    print('built', out_name)


BRAND = ('Brand', 0, 99, 'learnwithlexis.com')


def end_card(name, lines_en, dur=3.8, thai=False):
    top, cta, url = lines_en
    ev = [('Mid', 0, dur, f'{{\\pos(540,820)\\fad(250,0)}}{thai_fit(top, 900, 76) if thai else top}'),
          ('Cta', 0.35, dur, f'{{\\pos(540,1010)\\fad(250,0)}}' + (f'{{\\fs{56*1.3:.0f}}}' if thai else '') + cta),
          ('Url', 0.7, dur, f'{{\\pos(540,1140)\\fad(250,0)}}{url}')]
    return render_still(os.path.join(TMP, 'card.png'), dur, ev, name, overlay='grad', zoom=False)


# ---- travel series ---------------------------------------------------------
CTA_THAI = ('Practise the Thai you\'ll need,\\Nout loud, with LEXIS.', f'Try {TRIAL_MIN} minutes free. No card.', 'learnwithlexis.com')

TOP10 = {
    'bangkok': ('Bangkok', 'wat_arun', ('เท่าไหร่ครับ / คะ', 'tao-rai khrap / kha', 'How much?'), [
        ('grand_palace', 'The Grand Palace', 'Dress code: shoulders and knees covered.'),
        ('wat_arun', 'Wat Arun at sunset', 'Best seen from across the river.'),
        ('wat_pho', "Wat Pho's Reclining Buddha", '46 metres long, covered in gold leaf.'),
        ('chao_phraya', 'Ride a Chao Phraya river boat', 'The cheapest river tour in town.'),
        ('chatuchak', 'Chatuchak Weekend Market', 'Thousands of stalls, Saturday and Sunday.'),
        ('chinatown', 'Chinatown street food at night', 'Yaowarat Road comes alive after dark.'),
        ('jim_thompson', 'Jim Thompson House', 'Teak houses and a silk-trade mystery.'),
        ('lumphini', 'Lumphini Park', 'Watch out for the monitor lizards.'),
        ('rooftop', 'A rooftop bar at sunset', 'The whole skyline at golden hour.'),
        ('floating_market', 'Day trip: a floating market', 'Go early, before the tour buses.')]),
    'chiang-mai': ('Chiang Mai', 'doi_suthep', ('ขอบคุณครับ / ค่ะ', 'khop-khun khrap / kha', 'Thank you'), [
        ('doi_suthep', 'Wat Phra That Doi Suthep', 'The temple on the mountain above the city.'),
        ('chedi_luang', 'Wat Chedi Luang', 'A giant ruined chedi in the Old City.'),
        ('cm_market', 'The night markets', 'Sunday Walking Street fills the Old City.'),
        ('doi_inthanon', 'Doi Inthanon', "Thailand's highest mountain."),
        ('elephant_cm', 'An ethical elephant sanctuary', 'Look for no riding and no shows.'),
        ('khao_soi', 'Eat khao soi', 'Northern curry noodles, crispy on top.'),
        ('cm_cafe', 'Cafe-hop in Nimman', "Chiang Mai's cafe district."),
        ('wat_phan_tao', 'Wat Phan Tao', 'Right next door to Chedi Luang.'),
        ('white_temple', 'Day trip: the White Temple', 'In Chiang Rai, about three hours by road.'),
        ('yi_peng', 'Yi Peng lanterns', 'Usually November, on the full moon.')]),
    'phuket': ('Phuket', 'kamala', ('ไม่เผ็ดครับ / ค่ะ', 'mai phet khrap / kha', 'Not spicy, please'), [
        ('big_buddha', 'The Big Buddha', '45 metres of white marble on a hilltop.'),
        ('old_phuket', 'Old Phuket Town', 'Sino-Portuguese shophouses in every colour.'),
        ('phang_nga', 'Phang Nga Bay', 'Home of James Bond Island.'),
        ('phi_phi', 'The Phi Phi Islands', 'A day trip by boat from Phuket.'),
        ('promthep', 'Promthep Cape', "Phuket's classic sunset spot."),
        ('kamala', 'The west-coast beaches', 'Kamala, Kata, Karon: take your pick.'),
        ('wat_chalong', 'Wat Chalong', "Phuket's largest and most important temple."),
        ('krathing', 'Hike to Krathing Cape', 'A quieter sunset, worth the climb.'),
        ('similan', 'The Similan Islands', 'Snorkel season: mid-October to mid-May.'),
        ('muay_thai', 'Catch a Muay Thai fight', "Thailand's national sport, live.")]),
}

FACTS_REEL = [
    ('bkk_skyline', "Bangkok has the world's longest place name.", '168 letters, says Guinness. Thais just say Krung Thep.'),
    ('thai_flag', 'Thailand was never colonised by a European power.', 'The only country in Southeast Asia that can say so.'),
    ('monks', f'In Thailand, 2026 is the year {2026 + 543}.', 'The Buddhist calendar runs 543 years ahead.'),
    ('songkran', 'Thai New Year is a nationwide water fight.', 'Songkran, 13 to 15 April.'),
    ('elephant', 'Elephants get their own national day.', "Thai Elephant Day is every 13 March."),
]

PHRASES = [
    ('tuk_tuk', 'สวัสดีครับ / ค่ะ', 'sa-wat-dee khrap / kha', 'Hello'),
    ('floating_market', 'ขอบคุณครับ / ค่ะ', 'khop-khun khrap / kha', 'Thank you'),
    ('street_food', 'เท่าไหร่ครับ / คะ', 'tao-rai khrap / kha', 'How much?'),
    ('pad_thai', 'ไม่เผ็ดครับ / ค่ะ', 'mai phet khrap / kha', 'Not spicy, please'),
    ('chinatown', 'ห้องน้ำอยู่ที่ไหนครับ / คะ', 'hong-nam yoo tee-nai khrap / kha', "Where's the toilet?"),
]


def intro(key, kicker, title, name, dur=2.4):
    return render_still(photo(key), dur, [BRAND, ('Kicker', 0, dur, f'{{\\fad(200,0)}}{kicker}'),
                                          ('Big', 0.15, dur, f'{{\\fad(250,0)}}{title}')], name, overlay='dim')


def item(key, num, title, note, name, dur=2.6):
    txt = (f'{{\\fad(180,120)}}{{\\rNum}}{num}\\N{{\\rTitle}}{title}' + (f'\\N{{\\rNote}}{note}' if note else ''))
    return render_still(photo(key), dur, [BRAND, ('Title', 0, dur, txt)], name)


def phrase_card(key, thai, roman, en, name, dur=3.6, label=None):
    txt = (f'{{\\fad(180,120)}}' + (f'{{\\rNote}}{label}\\N' if label else '') +
           f'{{\\rThai}}{thai_fit(thai, 840, 104)}\\N{{\\rRoman}}{roman}\\N{{\\rNote}}{en}')
    return render_still(photo(key), dur, [BRAND, ('Thai', 0, dur, txt)], name)


def build_travel():
    for slug, (city, cover, (thai, roman, en), items) in TOP10.items():
        parts = [intro(cover, 'Save this for your trip', f'10 things to do in\\N{{\\c{AMBER}}}{city}', f'{slug}-intro')]
        for i, (k, title, note) in enumerate(items, 1):
            parts.append(item(k, i, title, note, f'{slug}-{i}'))
        parts.append(phrase_card(cover, thai, roman, en, f'{slug}-phrase', label='One phrase you will use every day:'))
        parts.append(end_card(f'{slug}-end', CTA_THAI))
        concat(parts, f'thailand-top10-{slug}')
    parts = [intro('wat_arun', 'Did you know?', f'5 things you didn\'t know\\Nabout {{\\c{AMBER}}}Thailand', 'facts-intro')]
    for i, (k, title, note) in enumerate(FACTS_REEL, 1):
        parts.append(item(k, i, title, note, f'facts-{i}', dur=4.0))
    parts.append(phrase_card('songkran', 'สนุก', 'sa-nuk', 'Fun. The word you will hear most.', 'facts-phrase', label='One more:'))
    parts.append(end_card('facts-end', CTA_THAI))
    concat(parts, 'thailand-5-facts')
    parts = [intro('tuk_tuk', 'Save this before you land', f'5 Thai phrases\\Nevery visitor {{\\c{AMBER}}}needs', 'phrases-intro')]
    for i, (k, thai, roman, en) in enumerate(PHRASES, 1):
        parts.append(phrase_card(k, thai, roman, en, f'phrases-{i}', label=f'{i} of 5'))
    parts.append(render_still(photo('wat_arun'), 2.6, [BRAND, ('Big', 0, 2.6, '{\\fad(200,0)}Men end with khrap.\\NWomen end with kha.')],
                              'phrases-note', overlay='dim'))
    parts.append(end_card('phrases-end', CTA_THAI))
    concat(parts, 'thailand-5-phrases')


# ---- topic reels (EN + TH) -------------------------------------------------
TOPICS = [('hospitality', 'HospitalityEnglishPage', 'hotel_desk'), ('interview', 'InterviewEnglishPage', 'interview'),
          ('travel', 'TravelEnglishPage', 'airport'), ('business', 'BusinessEnglishPage', 'office'),
          ('everyday', 'EverydayEnglishPage', 'friends')]


def thai_break(s):
    # Break Thai headings after the subject, the only natural phrase boundary
    # all five share ("ฝึกพูดภาษาอังกฤษ | สำหรับ...").
    return s.replace('ภาษาอังกฤษ', 'ภาษาอังกฤษ\\N', 1)


def build_topics():
    for slug, page, key in TOPICS:
        h1_en, h1_th, lines = topic_copy(page)
        for lang in ('en', 'th'):
            head = h1_en if lang == 'en' else thai_fit(thai_break(h1_th), 900, 110)
            kicker = 'Say it out loud' if lang == 'en' else 'ลองพูดออกเสียง'
            dur = 3.4 + 2.8 * len(lines)
            ev = [BRAND, ('Big', 0, 3.4, f'{{\\fad(250,200)}}{head}')]
            for i, l in enumerate(lines):
                a = 3.4 + 2.8 * i
                ev += [('Kicker', a, a + 2.8, kicker), ('Bubble', a, a + 2.8, f'{{\\fad(150,120)}}{l}')]
            main = render_still(photo(key), dur, ev, f'topic-{slug}-{lang}', overlay='dim')
            cta = (('Practise it out loud with LEXIS.', f'Try {TRIAL_MIN} minutes free. No card.', 'learnwithlexis.com') if lang == 'en'
                   else ('ฝึกพูดกับ LEXIS\\Nออกเสียงจริง', f'ทดลองฟรี {TRIAL_MIN} นาที ไม่ต้องผูกบัตร', 'learnwithlexis.com/th'))
            concat([main, end_card(f'topic-{slug}-{lang}-end', cta, thai=(lang == 'th'))], f'topic-{slug}-{lang}')


# ---- recuts of existing footage --------------------------------------------
def vtt(path):
    s = open(path, encoding='utf8').read()
    return [(sec(a), sec(b), txt.strip()) for a, b, txt in
            re.findall(r'(\d\d:\d\d:\d\d\.\d+) --> (\d\d:\d\d:\d\d\.\d+)\n(.+)', s)]


def sec(ts):
    h, m, s = ts.split(':'); return int(h) * 3600 + int(m) * 60 + float(s)


# Thai glyphs render visibly smaller than Latin at the same point size in
# IBM Plex Sans Thai (same k=1.3 as ../build_reels.py), so Thai lines carry
# their own size override.
TH = 1.3
HEAD = {'en': ('Practise speaking English,\\Nout loud', f'Try {TRIAL_MIN} minutes free\\Nno card required'),
        'th': (f'{{\\fs{58*TH:.0f}}}ฝึกพูดภาษาอังกฤษ\\Nออกเสียงจริง', f'{{\\fs{78*TH:.0f}}}ทดลองฟรี {TRIAL_MIN} นาที\\Nไม่ต้องผูกบัตร')}


def cap(lang, size, txt):
    return f'{{\\fs{size*TH:.0f}}}{txt}' if lang == 'th' else txt


def build_recuts():
    hero = os.path.join(MK, 'lexis-intro-hero.mp4')
    # Hook: the greeting, then straight to the offer. 8.3s of the middle is cut.
    A, B0, B1, CUT = 4.9, 13.2, 19.33, 13.2 - 4.9
    for lang in ('en', 'th'):
        head, end = HEAD[lang]; dur = A + (B1 - B0)
        ev = [('Head', 0, dur, f'{{\\fad(300,0)}}{head}'), ('Url', 0, dur, '{\\an8\\pos(540,205)\\fs38}learnwithlexis.com')]
        for a, b, txt in vtt(os.path.join(MK, f'lexis-intro-hero.{lang}.vtt')):
            if b <= A: ev.append(('Cap', a, b, cap(lang, 52, txt)))
            elif a >= B0 and a < 15.6: ev.append(('Cap', a - CUT, b - CUT, cap(lang, 52, txt)))
        ev.append(('End', 15.6 - CUT, dur, f'{{\\fad(250,0)}}{end}\\N{{\\fs46\\c{AMBER}}}learnwithlexis.com'))
        ass = write_ass(ev, f'hook-{lang}')
        fc = (f"[0:v]trim=0:{A},setpts=PTS-STARTPTS[a];[0:a]atrim=0:{A},asetpts=PTS-STARTPTS[aa];"
              f"[0:v]trim={B0}:{B1},setpts=PTS-STARTPTS[b];[0:a]atrim={B0}:{B1},asetpts=PTS-STARTPTS[bb];"
              f"[a][aa][b][bb]concat=n=2:v=1:a=1[v][au];"
              f"[v]scale=1080:-2,pad=1080:1920:0:260:color=0x050B14,subtitles={ass}:fontsdir={FONTS},format=yuv420p[vo]")
        subprocess.run([F, '-y', '-v', 'error', '-i', hero, '-filter_complex', fc, '-map', '[vo]', '-map', '[au]',
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
                        '-movflags', '+faststart', os.path.join(HERE, f'lexis-hook-{lang}.mp4')], check=True)
        print('built', f'lexis-hook-{lang}')
        # Square 1:1 for Facebook / Instagram feed: crop to the face, captions on a box.
        ev = [('SqCap', a, b, cap(lang, 44, x)) for a, b, x in vtt(os.path.join(MK, f'lexis-intro-hero.{lang}.vtt')) if a < 15.6]
        ev.append(('SqEnd', 15.6, 19.33, f'{{\\fad(250,0)}}{end}\\N{{\\fs40\\c{AMBER}}}learnwithlexis.com'))
        ass = write_ass(ev, f'square-{lang}', res=(1080, 1080))
        subprocess.run([F, '-y', '-v', 'error', '-i', hero, '-vf',
                        f"crop=720:720:0:40,scale=1080:1080,subtitles={ass}:fontsdir={FONTS},format=yuv420p",
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
                        '-movflags', '+faststart', os.path.join(HERE, f'lexis-square-{lang}.mp4')], check=True)
        print('built', f'lexis-square-{lang}')
    comm = os.path.join(MK, 'lexis-community-intro.mp4')
    for lang, head in zip(('en', 'th'), COMMUNITY_HEAD):
        head = head if lang == 'en' else thai_fit(head.replace('ของคุณ', 'ของคุณ\\N', 1), 960, 76)
        end = (f'Add ฿{ADDON_THB} to any pass.\\N{{\\fs50}}It goes into one shared fund\\Nfor Thai students\' speaking practice.' if lang == 'en'
               else f'{{\\fs86}}เพิ่ม ฿{ADDON_THB} ตอนชำระเงิน\\N{{\\fs64}}เงินจะเข้ากองทุนเดียวกัน')
        ev = [('Head', 0, 13.03, f'{{\\fad(300,0)}}{head}'),
              ('End', 9.3, 13.03, f'{{\\fad(250,0)}}{{\\fs66}}{end}\\N{{\\fs42\\c{AMBER}}}learnwithlexis.com/community')]
        ass = write_ass(ev, f'community-{lang}')
        subprocess.run([F, '-y', '-v', 'error', '-i', comm, '-vf',
                        f"scale=1080:-2,pad=1080:1920:0:236:color=0x050B14,subtitles={ass}:fontsdir={FONTS},format=yuv420p",
                        '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-c:a', 'aac', '-b:a', '128k', '-ar', '44100',
                        '-movflags', '+faststart', os.path.join(HERE, f'lexis-community-{lang}.mp4')], check=True)
        print('built', f'lexis-community-{lang}')


def credits():
    with open(os.path.join(HERE, 'CREDITS.md'), 'w', encoding='utf8') as f:
        f.write('# Photo credits\n\nBackground photos in the travel and topic reels are from Unsplash '
                '(Unsplash License, free for commercial use). Credit them in the post caption where there is room.\n\n')
        for k, p in PHOTOS.items():
            f.write(f"- `{k}`: {p['by']} (https://unsplash.com/@{p['user']}), https://unsplash.com/photos/{p['id']}\n")


if __name__ == '__main__':
    import sys
    only = set(sys.argv[1:]) or {'recuts', 'topics', 'travel'}
    overlays(); credits()
    if 'recuts' in only: build_recuts()
    if 'topics' in only: build_topics()
    if 'travel' in only: build_travel()
