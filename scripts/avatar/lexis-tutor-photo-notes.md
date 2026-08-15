# Photo avatar — provenance and upgrade path

**Update (Aug 2026): the overlay approach described below has been
replaced.** `TutorAvatarPhoto.jsx` now crossfades four real photos of the
same generated identity — see "Real second/third/fourth photos" below for
how they were made and how the component blends them. The overlay
technique (hand-measured `MOUTH_*`/`EYE_*` shadow shapes) is kept described
here for history/context but no longer reflects the shipped code.

`frontend/public/avatar/lexis-tutor-photo.jpg` is a generated portrait, not a
photo of a real person. It's a synthetic/generic character — no real
individual's likeness.

## How it was made

1. Generated with Gamma's `generate_image` tool, `type: "photo"`,
   `sizePreset: "social-square"` — a professional head-and-shoulders portrait
   prompted for a warm, friendly expression, teal blouse (matches the app's
   brand color), dark teal-to-navy blurred background, mouth closed.
2. Downscaled to 1024x1024 and saved as JPEG (quality 90) to keep it small
   (~150KB) — the original 2048x2048 PNG was ~5.5MB and unnecessary at the
   size this renders in the app.

No second "mouth open" (or "eyes closed") photo of the same person exists.
See below for why, and how to add them later.

## How lip-sync and blink work without extra photos

`frontend/src/components/TutorAvatarPhoto.jsx` overlays small, blurred, dark
radial-gradient shapes — one at the mouth, one over each eye — hand-measured
against this specific photo (see the `MOUTH_*`/`EYE_*` constants in that
file). The mouth shape scales open and fades in with `tutorLevel`; the eye
shapes briefly scale/fade in on an independent idle timer (2-5s gap, ~0.18s
sine-pulse duration — same cadence as `TutorAvatar3D.jsx`'s blink morph
target). Both colors are sampled from the photo's own shadow tones at those
spots, so they blend in rather than looking pasted on. Neither is a real
closed mouth/eye — they're plausible shadow accents, a deliberate trade for
keeping the one real photo untouched.

Tuning note: the color/alpha/blur values needed to be pushed noticeably
stronger than felt natural at first — an early pass sampled the photo's
*exact* shadow tone at low opacity and blended in so smoothly it was
genuinely invisible even at "fully open"/"fully closed", verified by
polling the live rendered transform in a real browser (not just eyeballing
screenshots — the blink in particular is only on-screen for ~0.18s every
2-5s, easy to miss by chance in a screenshot pass and mistake for "not
working"). If you retune these, verify by driving the value to its extreme
and actually zooming into the rendered output, not just skimming a full-face
screenshot.

**Why not just generate a second photo with the mouth open?** That needs
identity-preserving image-to-image editing (feed the first photo back in as
a reference, edit only the mouth). At the time this was built:

- Gamma's `generate_image` `referenceImages` parameter (subject-consistent
  generation) returned `403: not available on this workspace plan`.
- Higgsfield (which has both a consistent-character model, `soul_cast`, and
  image-to-image editing via `nano_banana_pro`/`soul_2` with a reference
  `medias` role) was out of credits.

Two independently generated photos of "the same" prompted character are
**not** pixel-consistent enough to crossfade — different lighting/identity
micro-variation reads as a visible "jump" every time the mouth opens, which
looks worse than the overlay approach shipped here.

## Real second/third/fourth photos (done, Aug 2026)

A Higgsfield Basic plan ($5/mo, purchased directly on higgsfield.ai rather
than through the MCP-only 3-day trial — the trial's checkout link kept
returning "This link is incomplete" through the chat client, so the direct
website signup was used instead) unlocked identity-preserving image-to-image
editing. Confirmed the purchased credits work through the Higgsfield MCP
tools used here (`balance` reflected them immediately), not just on
higgsfield.ai — worth checking again if a similar upgrade is done in future,
since Higgsfield's own docs note some *unlimited/free-generation* perks are
web-only, though ordinary credits evidently aren't.

Process:
1. `media_import_url` on the live production photo URL
   (`https://lexis-core-v2026.vercel.app/avatar/lexis-tutor-photo.jpg`) to
   get a Higgsfield `media_id` for the existing photo.
2. `generate_image` with `model: nano_banana_pro`, that `media_id` as a
   `medias: [{ role: "image" }]` reference, `aspect_ratio: "1:1"`,
   `resolution: "1k"` — prompted for the same identity/framing/lighting/
   clothing/background as the reference, changing only the described
   feature. Three variants generated this way (2 credits each):
   - mouth open, eyes open (as if speaking)
   - mouth closed, eyes closed (as if blinking)
   - mouth open, eyes closed (both at once)
3. Saved as `frontend/public/avatar/lexis-tutor-photo-open.jpg`,
   `-blink.jpg`, and `-open-blink.jpg` (converted from the generated PNGs
   to JPEG quality 90, same ~150KB budget and 1024x1024 dimensions as the
   base photo).
4. The base photo's own circular white-vignette framing (not something
   introduced by editing — it's baked into the *original* photo too) came
   through identically in all three generations, so no cropping/alignment
   work was needed; `object-cover` handles all four the same way it always
   handled the one.

## Why four images, not two

Mouth and eyes move independently and *concurrently* — LEXIS blinks while
talking most of the time, since talking dominates a session. Two
independent crossfade layers (mouth-open, eyes-closed) would conflict
whenever both are partially visible: each single-feature photo bakes in
the *other* feature's neutral state, so blending fights itself. The fix,
implemented in `TutorAvatarPhoto.jsx`: standard bilinear interpolation
across all four corners of the mouth-x-eyes grid — each non-base layer's
opacity is the product of how "on" each of its two features is
(`openAmount * blinkAmount` for the combined layer, etc.), so the four
opacities always sum to 1 and blend correctly to any point in that space,
not just the four exact corners.

## Upscale to 2K, then rolled back to 1K (Aug 2026)

Requested: sharper avatar photos ("resemble like a 4k live video").
Upscaled all four existing photos via Higgsfield's `upscale_image` tool
(bytedance backend, targets an existing image rather than regenerating —
no fresh identity-drift risk) to 4096x4096, then shipped a 2048x2048
JPEG downsample (full 4096px PNGs would have been ~29MB total for four
images, unreasonable for a mobile page).

Live-verified immediately after: mouth motion reported as "even weirder"
and general page jank ("dragging back down to chat box") — reported on a
device visibly at 1% battery in the screenshots, which is exactly when
Android throttles CPU/GPU hardest. Four 2048px images being recomposited
every animation frame (the mouth crossfade runs continuously via
`useSmoothed`, not just on discrete changes) is real, measurably more
compositor work than four 1024px images — 4x the pixels per layer — and
that's a plausible root cause for jank independent of whether the device
was already stressed. Rather than debug further blind, rolled the
shipped images back down to 1024x1024 — the same pixel dimensions
already known to run smoothly — but re-derived from the 4K-upscaled
PNGs rather than the original un-upscaled source, so quality is still
modestly better than before (closer to supersampled/anti-aliased) at
zero extra runtime cost. The 4096px source PNGs aren't kept in the repo
(they lived in the session's scratchpad only); regenerate via the same
`upscale_image` process in "Real second/third/fourth photos" above if a
higher-resolution tier is wanted again later — ideally only after
confirming the target devices can actually composite that smoothly, not
just that they can download it.

## Second character (Thai-presenting) — banked, not wired in

At the same time, a second character portrait was generated on request
("for future reference") — a distinct identity, Thai-presenting, same
brand styling (teal blouse, dark blurred background, warm professional
headshot). Saved at
`scripts/avatar/candidates/thai-tutor-photo-candidate.jpg` — a banked
asset only. It is **not** referenced by any env var or component; the app
still ships the one existing LEXIS identity. To actually use it as an
avatar option, it would need the same treatment as the base photo (open/
blink/open-blink identity-preserving variants generated the same way as
above, then wired into `TutorAvatar` in `LexisApp.jsx` behind a new
`VITE_AVATAR_PHOTO_URL`-style env var or a persona-selection mechanism —
not attempted here since this was explicitly scoped as "for future
reference," not an integration request).
