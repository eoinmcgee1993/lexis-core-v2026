#!/usr/bin/env node
//
// Viseme analysis tests.  Run:  node frontend/scripts/visemes.test.mjs
//
// Same shape as backend/test/fair-use.test.mjs — a plain script, no runner,
// exits non-zero on failure. src/lib/visemes.js is deliberately free of
// AudioContext and React so it can simply be imported here.
//
// The cases build synthetic spectra rather than using recorded audio: the
// point is to prove the BAND LOGIC, and a hand-built spectrum states the
// input exactly ("all the energy is above 4kHz") in a way a wav file never
// can. The headline case is the sibilant one — an /s/ is loud and must NOT
// open the mouth, which is the defect this module exists to fix.
import { analyseFrame, bandEnergy, easeVisemes, emptyVisemes, SILENCE_GATE } from '../src/lib/visemes.js';

const SAMPLE_RATE = 48000;
const FFT = 512;
const BINS = FFT / 2; // an AnalyserNode's frequencyBinCount
const BIN_HZ = SAMPLE_RATE / FFT;

// Build a spectrum by filling named frequency ranges with a byte magnitude.
const spectrum = (ranges) => {
  const data = new Uint8Array(BINS);
  for (const [loHz, hiHz, value] of ranges) {
    const start = Math.max(0, Math.floor(loHz / BIN_HZ));
    const end = Math.min(BINS, Math.ceil(hiHz / BIN_HZ));
    for (let i = start; i < end; i++) data[i] = value;
  }
  return data;
};

let pass = 0, fail = 0;
const ok = (name, cond, detail = '') => {
  cond ? pass++ : fail++;
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond ? '' : `  ${detail}`}`);
};

// ── the defect this module exists to fix ────────────────────────────────
// A sibilant and an open vowel at the SAME loudness must not produce the
// same mouth. Before this module both were "mean spectrum -> jaw open".
const openVowel = spectrum([[0, 500, 200], [500, 1200, 220], [1200, 3000, 90], [3000, 8000, 20]]);
const sibilant  = spectrum([[0, 500, 20], [500, 1200, 25], [1200, 3000, 80], [3000, 8000, 230]]);

const vowel = analyseFrame(openVowel, SAMPLE_RATE, FFT);
const ess = analyseFrame(sibilant, SAMPLE_RATE, FFT);

ok('open vowel opens the mouth', vowel.openness > 0.35, `openness=${vowel.openness.toFixed(3)}`);
ok('sibilant does NOT open the mouth', ess.openness < 0.12, `openness=${ess.openness.toFixed(3)}`);
ok('sibilant is still audibly loud', ess.level > 25, `level=${ess.level}`);
// The whole point, stated as one assertion: comparable loudness, very
// different mouth. A ratio guards the RELATIONSHIP rather than either
// number, so retuning the coefficients can't quietly reintroduce the bug.
ok('vowel opens far wider than an equally loud sibilant',
  vowel.openness > ess.openness * 3,
  `vowel=${vowel.openness.toFixed(3)} sibilant=${ess.openness.toFixed(3)}`);
ok('sibilant selects the SS viseme', ess.visemes.viseme_SS > 0.4, JSON.stringify(ess.visemes));
ok('open vowel selects the aa viseme', vowel.visemes.viseme_aa > ess.visemes.viseme_aa,
  `aa vowel=${vowel.visemes.viseme_aa.toFixed(3)} ess=${ess.visemes.viseme_aa.toFixed(3)}`);

// ── close front vowel /i/ — loud, bright, but jaw nearly shut ───────────
const closeFront = spectrum([[0, 500, 120], [500, 1200, 40], [1200, 3000, 220], [3000, 8000, 40]]);
const eee = analyseFrame(closeFront, SAMPLE_RATE, FFT);
ok('/i/ picks I over aa', eee.visemes.viseme_I > eee.visemes.viseme_aa,
  `I=${eee.visemes.viseme_I.toFixed(3)} aa=${eee.visemes.viseme_aa.toFixed(3)}`);
ok('/i/ stays more closed than /a/', eee.openness < vowel.openness,
  `i=${eee.openness.toFixed(3)} a=${vowel.openness.toFixed(3)}`);

// ── lip closure /m/ — voiced, but energy only down low ──────────────────
const nasal = spectrum([[0, 500, 150], [500, 1200, 30], [1200, 3000, 10], [3000, 8000, 5]]);
const mmm = analyseFrame(nasal, SAMPLE_RATE, FFT);
ok('/m/ picks the closed-lip viseme', mmm.visemes.viseme_PP > mmm.visemes.viseme_aa,
  `PP=${mmm.visemes.viseme_PP.toFixed(3)} aa=${mmm.visemes.viseme_aa.toFixed(3)}`);

// ── silence and the noise gate ──────────────────────────────────────────
const silence = spectrum([[0, 8000, 0]]);
const quiet = spectrum([[0, 8000, SILENCE_GATE - 2]]);
ok('silence closes the mouth', analyseFrame(silence, SAMPLE_RATE, FFT).openness === 0);
ok('below the gate is treated as silence', analyseFrame(quiet, SAMPLE_RATE, FFT).level === 0);
ok('silence zeroes every viseme',
  Object.values(analyseFrame(silence, SAMPLE_RATE, FFT).visemes).every((v) => v === 0));

// ── everything stays inside 0..1, whatever is thrown at it ─────────────
const blast = spectrum([[0, 8000, 255]]);
const loud = analyseFrame(blast, SAMPLE_RATE, FFT);
ok('openness never exceeds 1', loud.openness <= 1 && loud.openness >= 0, `openness=${loud.openness}`);
ok('no viseme exceeds 1', Object.values(loud.visemes).every((v) => v >= 0 && v <= 1),
  JSON.stringify(loud.visemes));
ok('level is capped at 100', loud.level <= 100, `level=${loud.level}`);

// ── sample rate is honoured, not assumed ───────────────────────────────
// A browser may run its graph at 44.1kHz. If the band edges were hardcoded
// against 48kHz they would sit ~9% off, so the same spectrum must not read
// identically at both rates.
const at44 = analyseFrame(sibilant, 44100, FFT);
ok('44.1kHz is analysed with its own bin width', at44.openness !== ess.openness || at44.level !== ess.level,
  `44.1k=${at44.openness.toFixed(4)} 48k=${ess.openness.toFixed(4)}`);
ok('bandEnergy respects the requested range',
  bandEnergy(spectrum([[3000, 8000, 200]]), SAMPLE_RATE, FFT, 0, 500) === 0);

// ── easing ─────────────────────────────────────────────────────────────
const eased = easeVisemes(emptyVisemes(), { ...emptyVisemes(), viseme_aa: 1 }, 1 / 60, 14);
ok('easing moves toward the target', eased.viseme_aa > 0 && eased.viseme_aa < 1,
  `aa=${eased.viseme_aa.toFixed(3)}`);
ok('a huge delta snaps rather than overshooting',
  easeVisemes(emptyVisemes(), { ...emptyVisemes(), viseme_aa: 1 }, 10, 14).viseme_aa === 1);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
