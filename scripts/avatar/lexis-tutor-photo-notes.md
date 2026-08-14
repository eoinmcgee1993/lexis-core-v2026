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

No second "mouth open" photo of the same person exists. See below for why,
and how to add one later.

## How lip-sync works without a second photo

`frontend/src/components/TutorAvatarPhoto.jsx` overlays a small, blurred,
dark radial-gradient shape at the mouth position (hand-measured against this
specific photo — see the `MOUTH_*` constants in that file) that scales open
and fades in with `tutorLevel`. The color is sampled from the photo's own
lip-seam shadow tone, so it blends reasonably at the low-to-moderate
opacity/scale it actually runs at during speech. It is **not** a real open
mouth — it's a plausible shadow/gap accent, a deliberate trade for keeping
the one real photo untouched.

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

## Upgrading to a real second photo later

Once either of the above is available (Gamma plan upgrade, or Higgsfield
credits):

1. Feed `lexis-tutor-photo.jpg` back in as the reference/subject image.
2. Prompt for the same framing/lighting/identity, mouth open as if speaking.
3. Save the result as `frontend/public/avatar/lexis-tutor-photo-open.jpg`
   (same crop/dimensions as the closed one).
4. Update `TutorAvatarPhoto.jsx` to crossfade the two full images by
   `tutorLevel` (same technique as `TutorAvatar3D.jsx`'s morph-target lerp,
   just on `<img>` opacity) instead of drawing the overlay shape — and drop
   the `MOUTH_*` overlay constants and geometry once that's in place.

## Also missing: blink

Only mouth movement is implemented. An idle blink (like `TutorAvatar3D.jsx`
has via its `eyesClosed` morph target) was left out of this pass to keep
scope tight — mouth sync was "the actual point" per the avatar's original
design comment. Same overlay technique would work for it (a thin dark shape
over each eye, hand-measured position, briefly opacity-flashed on a timer)
if it's worth adding later.
