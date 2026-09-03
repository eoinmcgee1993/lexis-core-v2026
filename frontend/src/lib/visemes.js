// frontend/src/lib/visemes.js
//
// Turns a frame of FFT data from LEXIS's voice into mouth shapes.
//
// Why this exists. Every avatar tier used to be driven by one number: the
// mean of the whole frequency spectrum, mapped straight to "how open is the
// mouth". That is loudness, not speech, and it is wrong in a way you can
// see rather than merely measure — an /s/ is one of the loudest sounds in
// English and is made with the mouth almost shut, so the avatar threw its
// jaw open on every "yes", "this", "practice". A tutor for spoken English
// mouthing sibilants like vowels is the exact detail a language learner is
// looking at.
//
// The alternative to this is a phoneme-aligned lip-sync service, which
// means a second real-time stream, a vendor and a per-minute cost. Band
// energy gets most of the perceptual benefit from audio the browser is
// already decoding, so it stays in the "no added cost" column with the
// rest of the pipeline.
//
// Deliberately pure: no AudioContext, no React, no DOM. It takes a
// Uint8Array of byte-frequency data and returns numbers, which is what
// makes it testable without a browser (see scripts/visemes.test.mjs) and
// reusable by all three avatar tiers.

// Band edges in Hz. Chosen around the formant structure of an adult female
// voice, which is what LEXIS is (OpenAI Realtime voice `marin`):
//
//   LOW  ..500    voicing energy and nasals; /m/ /n/ live almost entirely here
//   F1   500-1200 first formant — tracks how OPEN the jaw is
//   F2   1200-3000 second formant — tracks how FRONT/spread the tongue is
//   HI   3000+    sibilance; /s/ /ʃ/ /z/ dominate here and nowhere else
//
// The split that does the real work is HI vs the rest: it is what separates
// "loud because open" from "loud because hissing".
export const BANDS = {
  low: [0, 500],
  f1: [500, 1200],
  f2: [1200, 3000],
  hi: [3000, 8000]
};

// Below this mean byte value a frame is treated as silence rather than as a
// very quiet sound. Matches the noise gate LexisApp already applied to the
// remote analyser, so a room tone or a codec's comfort noise doesn't set the
// mouth twitching between utterances.
export const SILENCE_GATE = 8;

const clamp01 = (n) => (n < 0 ? 0 : n > 1 ? 1 : n);

// Mean magnitude of the bins covering [loHz, hiHz).
//
// binHz is sampleRate / fftSize — each bin spans that many Hz — so bin i
// covers [i*binHz, (i+1)*binHz). Callers pass analyser.context.sampleRate
// and analyser.fftSize rather than assuming 48kHz, because a browser is
// free to run its graph at 44.1kHz and the band edges would then land in
// the wrong place by ~9%.
export function bandEnergy(freqData, sampleRate, fftSize, loHz, hiHz) {
  const binHz = sampleRate / fftSize;
  const start = Math.max(0, Math.floor(loHz / binHz));
  const end = Math.min(freqData.length, Math.ceil(hiHz / binHz));
  if (end <= start) return 0;
  let sum = 0;
  for (let i = start; i < end; i++) sum += freqData[i];
  return sum / (end - start);
}

// The full analysis for one frame.
//
// Returns:
//   level     0-100 loudness across the speech band. NOT the same scale as
//             the old all-bins mean, which under-read by roughly a third
//             (see speechMean below) — so this is not a drop-in for the
//             waveform ring's own number, and the ring deliberately still
//             computes its own.
//   openness  0-1, how far the mouth should actually be open. This is the
//             number that fixes the sibilant problem, and it is what the
//             photo avatar and any single-morph model should use.
//   visemes   ARKit-ish weights for a model that has real blend shapes.
//             Names match the Oculus/ARKit viseme convention that Ready
//             Player Me and Avaturn export (viseme_aa, viseme_O, ...), so a
//             real head can be dropped in without touching this file.
export function analyseFrame(freqData, sampleRate = 48000, fftSize = 512) {
  const low = bandEnergy(freqData, sampleRate, fftSize, ...BANDS.low);
  const f1 = bandEnergy(freqData, sampleRate, fftSize, ...BANDS.f1);
  const f2 = bandEnergy(freqData, sampleRate, fftSize, ...BANDS.f2);
  const hi = bandEnergy(freqData, sampleRate, fftSize, ...BANDS.hi);

  // Averaged across the SPEECH band only, not every bin up to Nyquist.
  // An AnalyserNode reports bins all the way to sampleRate/2 (24kHz at
  // 48k), while WebRTC's Opus stream carries nothing meaningful above
  // ~8kHz — so roughly two thirds of the array is permanently near zero.
  // Averaging over all of it, which the old single-number path did, drags
  // every reading down by that same factor and made the noise gate fire on
  // genuinely voiced frames. Nasals were the visible casualty: /m/ has all
  // its energy under 500Hz and read as silence.
  const speechMean = bandEnergy(freqData, sampleRate, fftSize, 0, BANDS.hi[1]);
  if (speechMean < SILENCE_GATE) {
    return { level: 0, openness: 0, visemes: emptyVisemes() };
  }

  const bandSum = low + f1 + f2 + hi || 1;
  const sibilance = hi / bandSum;      // 1 = pure hiss
  const openRatio = f1 / bandSum;      // high F1 share = open jaw
  const spread = f2 / bandSum;         // high F2 share = front/spread vowel
  const closure = low / bandSum;       // energy only down low = lips together

  // Loudness for mouth purposes is VOICED energy — everything below the
  // sibilance band. Hiss is loud but contributes nothing to jaw position,
  // so excluding it outright is more honest than loudly subtracting it
  // afterwards, and it is what keeps an /s/ from reading as a shout.
  const loudness = clamp01(
    bandEnergy(freqData, sampleRate, fftSize, 0, BANDS.f2[1]) / 128
  );

  // Jaw opening tracks the FIRST FORMANT, which is the actual phonetic
  // relationship: F1 rises as the jaw drops. So openness is F1's share of
  // the spectrum scaled by how loud the voiced part is, rather than
  // loudness with a sibilance penalty bolted on. An /s/ has a tiny F1
  // share however loud it is, which is precisely the property wanted.
  // 1.6 puts a wide-open vowel near 0.7-0.8 rather than pinning it at 1.
  const openness = clamp01(loudness * openRatio * 1.6);

  // Weights are intentionally not normalised to sum to 1. A blend-shape rig
  // is additive and a real mouth genuinely is part-way between shapes;
  // forcing them to a simplex makes speech look like it is snapping between
  // discrete poses, which is the classic "puppet" tell.
  const visemes = {
    // Open vowels: /a/ as in "father" — dominated by a strong first formant.
    viseme_aa: clamp01(openness * (openRatio * 2.2)),
    // Mid-open front: /e/ as in "bed" — F1 and F2 both present.
    viseme_E: clamp01(openness * (spread * 1.6) * (0.4 + openRatio)),
    // Close front: /i/ as in "see" — F2 dominant, jaw nearly closed.
    viseme_I: clamp01(loudness * spread * 1.8 * (1 - openRatio)),
    // Rounded: /o/ and /u/ — energy low and mid, little F2 spread.
    viseme_O: clamp01(openness * (1 - spread) * 1.4),
    viseme_U: clamp01(loudness * closure * (1 - spread) * 1.6),
    // Sibilants: teeth close together, lips slightly apart. This is the one
    // that was previously rendered as a wide-open mouth.
    viseme_SS: clamp01(sibilance * 1.6),
    // Lip closure: /m/ /b/ /p/. Voiced energy but almost nothing above it.
    viseme_PP: clamp01(closure * (1 - sibilance) * (1 - openRatio) * 1.5)
  };

  return { level: Math.round(clamp01(speechMean / 128) * 100), openness, visemes };
}

export function emptyVisemes() {
  return {
    viseme_aa: 0,
    viseme_E: 0,
    viseme_I: 0,
    viseme_O: 0,
    viseme_U: 0,
    viseme_SS: 0,
    viseme_PP: 0
  };
}

// Frame-to-frame easing, so a rig doesn't jitter at 60fps. Same exponential
// form TutorAvatar3D and TutorAvatarPhoto already use for their single
// values (current + (target - current) * min(1, delta * rate)); kept here so
// every tier eases identically rather than each inventing its own constant.
export function easeVisemes(current, target, delta, rate = 14) {
  const k = Math.min(1, delta * rate);
  const out = {};
  for (const key of Object.keys(target)) {
    const c = current[key] || 0;
    out[key] = c + (target[key] - c) * k;
  }
  return out;
}
