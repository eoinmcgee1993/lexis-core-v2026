# Posting schedule

One source for everything LEXIS posts on social media. `posts.mjs` holds the
data and `build.mjs` generates the rest:

| Generated file | What it is |
|---|---|
| `brand-kit/phone/DAILY-POSTS.txt` | Day-by-day list for posting by hand from the phone |
| `brand-kit/phone/platforms/{TikTok,Instagram,YouTube,Facebook,LINE}.txt` | The exact text for each app, every day it posts there |
| `brand-kit/schedule/metricool-queue.json` | One entry per app post, ready for Metricool |

Before this, the same caption was hand-typed in six places, and the
platform files had fallen behind (none had days 9–13). Prices, the trial
length and the Community add-on amount come from
`frontend/src/content/facts.js`. None of them is typed in `posts.mjs`.

## Changing a caption

1. Edit the slot in `posts.mjs`. Captions are functions so they can use
   `TRIAL.minutes`, `SPONSOR_ADDON_THB` and the rest. Never type a number
   that lives in `facts.js`.
2. Run `node brand-kit/schedule/build.mjs` from the repo root.
3. Commit `posts.mjs` together with everything it rewrote.

**Never edit the generated `.txt` files or the queue by hand.** The next
build overwrites them. `node brand-kit/schedule/build.mjs --check` exits 1
if any generated file no longer matches `posts.mjs`. It writes nothing.

To add a reel, add a slot with the next `day`. Give it a new `slot` id: that
id is the `utm_content` value, so never reuse or rename one that has already
been posted. The build stops, without writing anything, if a media file is
missing, if a landing path is not a route in `frontend/src/App.jsx`, if a
YouTube title is missing or over 100 characters, or if a TikTok caption
contains a link.

## What goes where

- **Days 1–13** are the original `DAILY-POSTS.txt` days. Every one goes to
  TikTok, Instagram, YouTube and Facebook.
- **Days 14–21** are the finished reels that were not on any day. The English
  reels go to Instagram, YouTube and Facebook. The TikTok account is set up
  for Thai learners. The Thai purpose reel goes to all four apps. The
  Community partners reel is a pitch to people who run schools and youth
  groups, so it goes to the Facebook Page and a LINE broadcast only.
- **LINE** gets one broadcast a week (`line` on a slot), not a daily post.
- **Extras** (the Community swipe posts, Instagram stories and posts in expat
  Facebook groups) have no day. They are printed at the end of
  `Instagram.txt` and `Facebook.txt` and are not in the queue.

Each app gets the ending it can use. TikTok captions, Instagram captions
and YouTube Shorts descriptions can't make a link clickable (Shorts stopped
in Aug 2023), so they end with "ลิงก์ในโปรไฟล์" or "Link in bio." TikTok
and Instagram get no URL at all, in the text or in the queue's `link`.
YouTube also prints its tracked URL under the caption,
as the old YouTube.txt did. Facebook links do click, so Facebook ends with
the link instead.

Every post link has the form
`https://learnwithlexis.com<landing>?utm_source=<app>&utm_medium=social&utm_campaign=daily-posts&utm_content=<slot>`.
The profile links in each file's SETUP block keep the `utm_campaign` they
were set up with (`bio`, `page`, `channel`, `greeting`). They are not posts,
and changing them would split their analytics history.

**TikTok and Instagram are measured per channel only.** Their posts carry
no link anyone can click, and each bio holds one fixed URL
(`utm_campaign=bio`). Every visit from either app therefore arrives as
"came from the bio", and it can't be traced to the reel that sent it. That
changes only if the owner later sets up a link-in-bio page with one link
per post. Until then, judge reels on these two apps by views and profile
taps in each app's own analytics.

## The queue

`metricool-queue.json` stores day offsets, not dates, so every build gives
the same bytes. Apply a start date only when it is time to schedule:

```bash
node brand-kit/schedule/build.mjs --start=2026-10-20                  # dated copy to stdout
node brand-kit/schedule/build.mjs --start=2026-10-20 --out=queue.json # or to a file
```

This mode only writes the dated copy. Each entry gains `date`
(`2026-10-20T19:00:00+07:00`) and `publicationDate` (`{dateTime, timezone}`).
If any entry is already in the past, it warns on stderr, because Metricool
refuses past dates.

Times are Bangkok local time, inside 19:00–21:00: TikTok 19:00, Instagram
19:30, YouTube 20:00, Facebook 20:30. LINE broadcasts go out at 19:00 on
days 0, 7, 14, and so on.

### Mapping to Metricool's `createScheduledPost`

Send one call per entry in `posts`. Each app's text differs, so each entry
is its own post with a single provider.

| Queue field | `createScheduledPost` field |
|---|---|
| `date` (dated copy) | `date` |
| `publicationDate` (dated copy) | `info.publicationDate` |
| `network` | `info.providers: [{ "network": <network> }]` |
| `text` | `info.text`. TikTok's is a single line, joined with spaces, because TikTok's API drops line breaks. |
| `mediaPath` | `info.media: [<URL of that file>]`. See "How media gets attached" below. |
| `networkData` | merged into `info` as is (`tiktokData`, `instagramData`, `youtubeData`, `facebookData`) |
| `youtubeTitle` | already in `networkData.youtubeData.title` |
| `tiktokTitle` | already in `networkData.tiktokData.title`: the reel's YouTube title without `#shorts`, unless a slot sets its own |
| `link` | already inside `text` where `linkInText` is true (Facebook, YouTube). `null` on TikTok and Instagram, which can't click a caption link. |
| `id`, `day`, `dayOffset`, `utmContent` | not sent. Used to match scheduled posts and analytics back to a slot. |
| (from Metricool) | `blogId`, from `getBrandSettings` once accounts are linked |

Things that will bite:

- **No idempotency key.** `createScheduledPost` creates a new post on every
  call, so a retried call can double-post. Before each run, list what is
  already scheduled with `getScheduledPosts`, skip any entry whose day,
  network and text are already there, and never retry a call that got no
  response without checking first.
- **The `networkData` flags are deliberate.** The AI-content flags are on
  (`isAigc`, `isAiGenerated`, `isAiGeneratedContent`) because every reel has
  an ElevenLabs narrator or LEXIS's own generated video. Nothing LEXIS posts
  may imply a human is speaking. TikTok's `commercialContentOwnBrand` is on
  because every post promotes LEXIS itself. YouTube is `madeForKids: false`.
- **LINE is not a Metricool network.** Its broadcasts are in `manual`, not
  `posts`, and are sent from LINE Official Account Manager, which has its own
  scheduler. They are in the file so a dated copy gives their dates too.

### How media gets attached

The `createScheduledPost` tool has **no `saveExternalMediaFiles` field, and
no other flag for externally hosted media**. Checked against its tool
definition on 23 Oct 2026. Its `info` fields are `autoPublish`,
`descendants`, `draft`, `firstCommentText`, `hasNotReadNotes`, `media`,
`videoThumbnailUrl`, `videoCoverMilliseconds`, `mediaAltText`, `providers`,
`publicationDate`, `shortener`, `smartLinkData`, `text` and the per-network
`…Data` objects. So the queue carries no such field, and none should be
invented in a call. The tool would reject an unknown key or ignore it, and
either way it would look as if the media were safely stored when nothing
says it is.

What the definition does say about `media`: it "accepts public URLs to
image or video files", and "external sources like Google Drive or Dropbox
are uploaded to Metricool automatically". For Google Drive, Drive must be
linked in the Metricool account first. So, per post:

1. Put the file at `mediaPath` in the owner's Dropbox, or in a Google Drive
   linked to Metricool, and take its share link. Metricool copies files from
   those two sources itself, so the post doesn't depend on the link staying
   up.
2. Pass that link as `info.media: ["<link>"]`.
3. Any other public URL is outside what the definition promises to copy.
   Keep such a file reachable until its post has gone out.

`mediaPath` itself is a repo path, and Metricool can't read the repo.

## The phone pack

`DAILY-POSTS.txt` names videos as `2-videos/dayNN-<file>.mp4`. Those names
exist only in the pack the owner unzips on the phone, not in the repo. Build
the pack with:

```bash
node brand-kit/schedule/pack.mjs                 # -> brand-kit/schedule/pack/ (gitignored)
node brand-kit/schedule/pack.mjs --out=<folder>  # or anywhere else
```

It makes the four folders `LAUNCH-GUIDE.html` step 1 describes:
- `1-profile`: the profile photo and cover banners
- `2-videos`: every scheduled video, under its `dayNN-` name
- `3-images`: launch posters and the Community swipe pictures
- `4-captions`: `DAILY-POSTS.txt` and the five app files

Zip that folder and send it.

Before writing, it refuses stale captions (it runs `build.mjs --check`)
and any missing source file. Afterwards, it checks that every `video:` path
in the packed `DAILY-POSTS.txt`, and every video an app file names, is in
the pack. It rebuilds its output folder from nothing on every run, but only
deletes a folder it made itself (one holding its `.lexis-pack` marker). The
renamed videos are about 80 MB, so the pack is never committed.

## Nothing is scheduled yet

Nothing in this folder has been sent to Metricool or to any app. The queue
stays a file until the owner has connected the TikTok, Instagram, YouTube
and Facebook accounts in Metricool and said **"linked"**. Only then does
anyone run `--start` with a real date and make the `createScheduledPost`
calls, after checking `getScheduledPosts` for duplicates.
