// frontend/src/components/TutorAvatar3D.jsx
//
// The 3D tutor avatar. Loads a .glb model (MetaPerson / Ready Player Me
// export) and drives its mouth-open morph target from `tutorLevel` — the
// same live remote-analyser data LexisApp.jsx already computes for the
// ambient waveform ring, derived straight from the WebRTC audio track
// OpenAI's Realtime API is already streaming. No lip-sync vendor, no second
// real-time stream, no added per-minute cost.
//
// This is only ever imported via React.lazy() from LexisApp.jsx, and only
// when VITE_AVATAR_GLB_URL is set — see the TutorAvatar wrapper there, which
// falls back to the lightweight SVG face when no model is configured, so a
// missing/still-being-made .glb asset never blocks a tutoring session.
import React, { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';

// Ready Player Me / MetaPerson exports use ARKit or Oculus viseme blend
// shape names depending on export settings — try the common ones in order
// and use whichever the loaded model actually has.
const MOUTH_MORPH_CANDIDATES = ['mouthOpen', 'jawOpen', 'viseme_aa', 'mouth_open'];
const BLINK_MORPH_CANDIDATES = ['eyesClosed', 'eyeBlinkLeft', 'eyeBlink_L'];

// Viseme blend shapes, when the loaded model actually has them. Ready
// Player Me and Avaturn export exactly these names; the placeholder head
// currently in public/avatar/lexis-tutor.glb has only `mouthOpen` and
// `eyesClosed`, so on today's asset this resolves to nothing and the
// single-morph path below runs unchanged. That is the intended behaviour:
// drop in a real ARKit export and the mouth starts forming distinct
// shapes with no code change, but nothing breaks before that happens.
const VISEME_MORPH_NAMES = ['viseme_aa', 'viseme_E', 'viseme_I', 'viseme_O', 'viseme_U', 'viseme_SS', 'viseme_PP'];

function findVisemeTargets(scene) {
  const found = [];
  scene.traverse((obj) => {
    if (!obj.morphTargetDictionary) return;
    for (const name of VISEME_MORPH_NAMES) {
      if (name in obj.morphTargetDictionary) {
        found.push({ mesh: obj, index: obj.morphTargetDictionary[name], name });
      }
    }
  });
  return found;
}

function findMorphTarget(scene, candidates) {
  let match = null;
  scene.traverse((obj) => {
    if (match || !obj.morphTargetDictionary) return;
    for (const name of candidates) {
      if (name in obj.morphTargetDictionary) {
        match = { mesh: obj, index: obj.morphTargetDictionary[name] };
        break;
      }
    }
  });
  return match;
}

function AvatarModel({ url, tutorLevel, openness = null, visemes = null }) {
  const { scene } = useGLTF(url);
  const mouthRef = useRef(null);
  const blinkRef = useRef(null);
  const resolvedRef = useRef(false);
  const visemeRef = useRef([]);
  const blinkClockRef = useRef(0);
  const nextBlinkAtRef = useRef(2 + Math.random() * 3);

  useFrame((_, delta) => {
    if (!resolvedRef.current) {
      mouthRef.current = findMorphTarget(scene, MOUTH_MORPH_CANDIDATES);
      blinkRef.current = findMorphTarget(scene, BLINK_MORPH_CANDIDATES);
      visemeRef.current = findVisemeTargets(scene);
      resolvedRef.current = true;
      if (!mouthRef.current) {
        console.warn('[LEXIS Avatar] No mouth-open morph target found on the loaded model — check export settings (ARKit/Oculus visemes).');
      }
    }

    // Real viseme rig: drive each shape independently. Additive on purpose
    // — a real mouth is genuinely part-way between shapes, and normalising
    // these to sum to 1 is what makes an avatar look like it is snapping
    // between discrete poses.
    if (visemeRef.current.length && visemes) {
      for (const { mesh, index, name } of visemeRef.current) {
        const want = visemes[name] || 0;
        const have = mesh.morphTargetInfluences[index] || 0;
        mesh.morphTargetInfluences[index] = have + (want - have) * Math.min(1, delta * 14);
      }
    }

    if (mouthRef.current) {
      const { mesh, index } = mouthRef.current;
      // openness is the phonetic figure from src/lib/visemes.js; tutorLevel
      // is raw loudness and only used when no analysis was supplied.
      const target = openness !== null ? Math.min(1, openness * 1.35) : Math.min(1, tutorLevel / 70);
      const current = mesh.morphTargetInfluences[index] || 0;
      // Ease toward target so the mouth doesn't snap open/closed every frame.
      mesh.morphTargetInfluences[index] = current + (target - current) * Math.min(1, delta * 12);
    }

    if (blinkRef.current) {
      const { mesh, index } = blinkRef.current;
      blinkClockRef.current += delta;
      if (blinkClockRef.current >= nextBlinkAtRef.current) {
        const t = blinkClockRef.current - nextBlinkAtRef.current;
        const blinkDuration = 0.18;
        if (t < blinkDuration) {
          mesh.morphTargetInfluences[index] = Math.sin((t / blinkDuration) * Math.PI);
        } else {
          mesh.morphTargetInfluences[index] = 0;
          blinkClockRef.current = 0;
          nextBlinkAtRef.current = 2 + Math.random() * 3;
        }
      }
    }
  });

  return <primitive object={scene} />;
}

export default function TutorAvatar3D({ url, tutorLevel, openness = null, visemes = null, isConnected, isConnecting }) {
  const active = isConnected || isConnecting;
  return (
    <div className={`w-full h-full transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>
      {/* R3F points the default camera at world origin (0,0,0) whenever
          you pass only `position` (no explicit rotation) — see
          @react-three/fiber's canvas setup. So the model needs its head
          centered near the origin, not at human-scale "head height"; this
          position/fov frames a head+shoulders bust for a model built that
          way (see scripts/avatar/generate_avatar.py). If you swap in a
          full-scale standing avatar export instead, re-tune this. */}
      <Canvas camera={{ position: [0, 0.05, 0.62], fov: 32 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[1, 2, 2]} intensity={1.1} />
        <Suspense fallback={null}>
          <AvatarModel url={url} tutorLevel={tutorLevel} openness={openness} visemes={visemes} />
        </Suspense>
      </Canvas>
    </div>
  );
}
