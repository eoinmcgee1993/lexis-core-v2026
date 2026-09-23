// frontend/src/components/LexisMark.jsx
//
// LEXIS's brand mark: the navy tile with a white L and two amber sound
// waves ("L, speaking"). Geometry and colours live in src/brand/lexisMark.js,
// which public/favicon.svg, the PWA icons and every brand-kit generator are
// built from too — this component only turns that data into JSX.
//
// HISTORY, kept because each version was a deliberate decision
//
//   18-19 Aug 2026  lucide's Sparkles replaced by a five-bar waveform: a
//                   four-point sparkle is generic-AI iconography and says
//                   nothing about a voice product.
//   4 Sep 2026      waveform redrawn from a mirrored 8/14/20/14/8 to the
//                   7/13/21/16/10 envelope of a spoken syllable, with the
//                   owner's agreement, because the mirror was the stock
//                   equalizer glyph.
//   23 Sep 2026     rebrand to direction B, chosen by the owner from four
//                   rendered directions. Even redrawn, a five-bar waveform is
//                   the default "audio" icon of every voice and podcast app;
//                   it could not be owned. The L is whose voice it is, the
//                   waves are the voice. The waveform's form lives on in
//                   WaveRule.jsx and the live session's audio meter.
//
// WHY THE COMPONENT NOW DRAWS ITS OWN TILE
//
// The old mark was a bare glyph in currentColor, and every one of its nine
// call sites wrapped it in the same hand-copied teal chip
// (p-2 bg-teal-600/10 border ... rounded-xl text-teal-700). B *is* a tile —
// navy, white, amber are part of the mark, not a theme applied to it — so
// the tile is drawn here and the call sites just size it. One copy of the
// badge instead of nine.
//
// variant="glyph" drops the tile, for dark surfaces where a navy tile
// disappears into the background.
//
// ACCESSIBILITY
//
// Decorative by default. Every call site places this immediately beside a
// <span>LEXIS</span>, so labelling it made pages announce "LEXIS LEXIS".
// Pass `label` only where the mark is the only thing naming the product.
import { MARK_COLORS, MARK_GEOMETRY } from '../brand/lexisMark.js';

export default function LexisMark({ className, label, variant = 'tile' }) {
  const decorative = !label;
  const g = MARK_GEOMETRY;
  return (
    <svg
      viewBox={g.viewBox}
      className={className}
      {...(decorative
        ? { 'aria-hidden': 'true', focusable: 'false' }
        : { role: 'img', 'aria-label': label })}
    >
      {variant === 'tile' && (
        <rect width="100" height="100" rx={g.tileRadius} fill={MARK_COLORS.tile} />
      )}
      <path
        d={g.letter.d}
        fill="none"
        stroke={MARK_COLORS.letter}
        strokeWidth={g.letter.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {g.waves.map((w) => (
        <path
          key={w.d}
          d={w.d}
          fill="none"
          stroke={MARK_COLORS.waves}
          strokeWidth={w.strokeWidth}
          strokeLinecap="round"
          opacity={w.opacity < 1 ? w.opacity : undefined}
        />
      ))}
    </svg>
  );
}
