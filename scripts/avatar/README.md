# Avatar generator

Procedurally builds `frontend/public/avatar/lexis-tutor.glb` — a simple, stylized
female tutor bust (low-poly, flat-color, no textures) used as the default 3D
model for LEXIS's live avatar (`frontend/src/components/TutorAvatar3D.jsx`).

This is a placeholder, not a photoreal character. It exists so the app has a
working, checked-in avatar out of the box, and so the morph-target-driven
lip-sync/blink pipeline can be exercised end-to-end without waiting on a real
character asset.

## Regenerating

```bash
pip install -r requirements.txt
python3 generate_avatar.py
```

Writes to `../../frontend/public/avatar/lexis-tutor.glb` by default (`--out`
to change the destination).

## How it's built

Everything is generated directly as glTF buffers/accessors via `pygltflib` —
UV-sphere patches for the head/hair/eyes, boxes for eyebrows/hair strands, a
small ribbon for the mouth. No external mesh tooling involved. Each named
part is its own primitive with a flat `baseColorFactor` material (no vertex
colors, no textures), which keeps the file small (~55KB) and the code simple.

Two parts carry morph targets, named to match what `TutorAvatar3D.jsx` looks
for:

- **Eyes** → `eyesClosed` — flattens both eyeballs toward their own center,
  reading as a thin closed-eye line.
- **Mouth** → `mouthOpen` — drops the lower row down and slightly wider,
  opening the mouth.

Both rest at weight `0` (mouth closed, eyes open) and are driven purely by
JS setting `morphTargetInfluences` at runtime — see `TutorAvatar3D.jsx`.

The whole model is centered near the world origin `(0,0,0)`, not at
human-scale head height — `TutorAvatar3D.jsx`'s camera looks at the origin by
default (`@react-three/fiber`'s implicit `camera.lookAt(0,0,0)`), so this
keeps the two in sync. If you swap in a full-scale standing avatar export
instead, that camera position/fov will need re-tuning to match.

## Swapping in a real character later

Replace `frontend/public/avatar/lexis-tutor.glb` with a MetaPerson Creator or
Ready Player Me export (ARKit or Oculus viseme blend shapes enabled). As long
as it exposes a mouth-open and an eye-blink morph target under one of the
names `TutorAvatar3D.jsx` checks (`mouthOpen`/`jawOpen`/`viseme_aa`/
`mouth_open` and `eyesClosed`/`eyeBlinkLeft`/`eyeBlink_L`), no code changes
are needed — just re-check the camera framing, since a full-body export's
head sits around human head height rather than the origin.
