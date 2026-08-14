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

function AvatarModel({ url, tutorLevel }) {
  const { scene } = useGLTF(url);
  const mouthRef = useRef(null);
  const blinkRef = useRef(null);
  const resolvedRef = useRef(false);
  const blinkClockRef = useRef(0);
  const nextBlinkAtRef = useRef(2 + Math.random() * 3);

  useFrame((_, delta) => {
    if (!resolvedRef.current) {
      mouthRef.current = findMorphTarget(scene, MOUTH_MORPH_CANDIDATES);
      blinkRef.current = findMorphTarget(scene, BLINK_MORPH_CANDIDATES);
      resolvedRef.current = true;
      if (!mouthRef.current) {
        console.warn('[LEXIS Avatar] No mouth-open morph target found on the loaded model — check export settings (ARKit/Oculus visemes).');
      }
    }

    if (mouthRef.current) {
      const { mesh, index } = mouthRef.current;
      const target = Math.min(1, tutorLevel / 70);
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

export default function TutorAvatar3D({ url, tutorLevel, isConnected, isConnecting }) {
  const active = isConnected || isConnecting;
  return (
    <div className={`w-full h-full transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70'}`}>
      <Canvas camera={{ position: [0, 1.55, 0.9], fov: 30 }} dpr={[1, 2]}>
        <ambientLight intensity={0.9} />
        <directionalLight position={[1, 2, 2]} intensity={1.1} />
        <Suspense fallback={null}>
          <AvatarModel url={url} tutorLevel={tutorLevel} />
        </Suspense>
      </Canvas>
    </div>
  );
}
