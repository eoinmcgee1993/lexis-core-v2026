# Photo avatar — provenance and upgrade path

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

## Upgrading to real second/third photos later

Once either of the above is available (Gamma plan upgrade, or Higgsfield
credits — a one-time top-up wasn't available at the time, only $49+/mo
subscriptions):

1. Feed `lexis-tutor-photo.jpg` back in as the reference/subject image.
2. Prompt for the same framing/lighting/identity: one variant mouth open as
   if speaking, one variant eyes closed.
3. Save as `frontend/public/avatar/lexis-tutor-photo-open.jpg` and
   `frontend/public/avatar/lexis-tutor-photo-blink.jpg` (same crop/
   dimensions as the base photo).
4. Update `TutorAvatarPhoto.jsx` to crossfade full images by `tutorLevel`
   (mouth) and by the blink timer (eyes) — same technique as
   `TutorAvatar3D.jsx`'s morph-target lerp, just on `<img>` opacity —
   instead of drawing the overlay shapes. Drop the `MOUTH_*`/`EYE_*` overlay
   constants and geometry once that's in place.
