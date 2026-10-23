# 4:5 video cuts for the Meta feed

Four Thai-audience voiceover reels, re-rendered at **1080×1350 (4:5)** for
the Facebook Feed and Instagram Feed. They are the same narration, captions
and length as the 9:16 originals in `brand-kit/voiceovers/`; only the layout
changed.

| File | From reel | Audience | Landing page | Length |
|---|---|---|---|---|
| `lexis-vo-reel-th-intro-4x5.mp4` | `th-intro` | Thai speakers new to LEXIS | `/th` | 25.2 s |
| `lexis-vo-reel-th-interview-4x5.mp4` | `th-interview` | Thai job-seekers with an English interview coming up | `/th/practice/interview-english` | 17.2 s |
| `lexis-vo-reel-th-travel-4x5.mp4` | `th-travel` | Thai travellers | `/th/practice/travel-english` | 16.0 s |
| `lexis-vo-reel-th-thinglish-4x5.mp4` | `th-thinglish` | Thai learners; three "Thinglish" phrases and the natural English | `/th/practice/everyday-english` | 29.6 s |

For ad URLs, use the Meta-ads UTM pattern in `ADVERTISING.md`
(`utm_source=meta&utm_medium=paid`). For the campaign, take the reel key, change its
hyphens to underscores and put `vo_` in front (`th-travel` → `vo_th_travel`), e.g.
`https://learnwithlexis.com/th/practice/travel-english?utm_source=meta&utm_medium=paid&utm_campaign=vo_th_travel`.

## Which placement

- **Facebook Feed and Instagram Feed:** use these. Feed shows video up to
  4:5, so this is the most screen a feed ad can take. A 9:16 reel in a feed
  slot is masked to roughly its middle, which hides the headline at the top
  and the captions at the bottom.
- **Stories and Reels:** use the 9:16 originals in `brand-kit/voiceovers/`
  for those placements (in Ads Manager, customise the asset per placement).
  The 9:16 layout keeps text out of the bottom and right-hand areas that
  Stories and Reels cover with their own buttons and captions. The 4:5 cut
  doesn't, so don't upload it as a Reel.

## Sound off works

Every word of the narration is **burned into the video** as captions, along
with the headline and the free-trial end card. Most feed video autoplays
muted, so the ad still reads with the sound off. Don't switch on Meta's
auto-generated captions too: they would sit on top of these and say the same
thing twice.

The end card's trial wording is typed into `build_vo_reels.py`, and the
narrator says it too, so it matches `TRIAL` in `frontend/src/content/facts.js`
by hand. If `TRIAL` changes, these and the 9:16 reels need re-recording, not
just re-captioning (see `brand-kit/voiceovers/README.md`).

## How the 4:5 layout differs from the 9:16

It reflows instead of cropping:

- The headline, URL and photo keep their spacing and sit 100 px higher. The
  4:5 drops the bottom of the photo (shoulders and chest).
- Captions sit 60 px above the bottom edge. On the 9:16 they sit 440 px up,
  clear of TikTok's overlay. Feed video only has small corner icons.
- The end card replaces the headline and URL in the top band. At the bottom,
  as on the 9:16, it covered the face, because a 1350 px frame has no chest
  below the face for it to sit on.
- Headline and caption sizes are the same as the 9:16. Both are 1080 px wide
  and fill the phone's width, so the text is the same size on screen. The end
  card is drawn at 90% so it fits inside the top band.

## Regenerating

From the repo root:

```bash
pip install imageio-ffmpeg fonttools brotli   # once; there's no system ffmpeg
python3 brand-kit/voiceovers/build_vo_reels.py --size=4x5 th-intro th-interview th-travel th-thinglish
```

Any key in `REELS` in `build_vo_reels.py` can be rendered at 4:5 the same
way, and `--size 4x5` works too. Leave out `--size` to get the 9:16 reels in
`brand-kit/voiceovers/`, unchanged. Every 4:5 run writes to
`brand-kit/ads/video/lexis-vo-reel-<key>-4x5.mp4`.

Thai captions are rendered with `shaping=complex`. Without it, a tone mark
over an upper vowel disappears (เที่ยว comes out as เทียว). Check a frame of
any new Thai cut for that before you post it.
