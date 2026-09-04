// frontend/src/components/WaveRule.jsx
//
// A section divider drawn as a decaying waveform, so a break between
// sections carries LEXIS's own identity instead of being a generic 1px
// grey line.
//
// Same visual language as LexisMark (five bars, tallest in the middle) and
// as the live session screen's audio ring — this page is selling a voice
// product, and the one shape that says so is a waveform. The bars decay
// outward from the centre and fade into the rule at both ends, which is
// also what stops it reading as a chart.
//
// Deliberately NOT the per-item card the 21 Aug re-audit removed, and not
// an icon standing in for meaning: it is a rule. It replaces a border,
// carries no label, and is aria-hidden — decoration that is honest about
// being decoration.
//
// Left-aligned (mark first, rule trailing off to the right) rather than
// centred: every heading on this page is left-aligned, and a centred motif
// under a left-aligned heading reads as a stray graphic rather than as that
// heading's underline.
//
// The trailing rule uses /10, a step on Tailwind's default opacity scale.
// It was /12 first, which this project's Tailwind does not generate at all:
// the class silently produced no CSS, --tw-gradient-stops was never set, and
// the rule rendered invisible in both places this component is used. Checked
// against the built stylesheet rather than assumed.
//
// Drawn with <rect>s at explicit coordinates rather than generated in a
// loop: the bar heights are hand-tuned to decay convincingly (a
// programmatic ease looked mechanically symmetrical), and there are only
// nine of them.
export default function WaveRule({ className = '' }) {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-hidden="true">
      <svg
        viewBox="0 0 76 20"
        className="w-[76px] h-5 flex-shrink-0 text-teal-600/45"
        fill="currentColor"
      >
        <rect x="0" y="9" width="2.5" height="2" rx="1" opacity="0.35" />
        <rect x="9" y="7.5" width="2.5" height="5" rx="1.25" opacity="0.5" />
        <rect x="18" y="5.5" width="2.5" height="9" rx="1.25" opacity="0.7" />
        <rect x="27" y="2.5" width="2.5" height="15" rx="1.25" opacity="0.9" />
        <rect x="36.75" y="0" width="2.5" height="20" rx="1.25" />
        <rect x="46.5" y="2.5" width="2.5" height="15" rx="1.25" opacity="0.9" />
        <rect x="55.5" y="5.5" width="2.5" height="9" rx="1.25" opacity="0.7" />
        <rect x="64.5" y="7.5" width="2.5" height="5" rx="1.25" opacity="0.5" />
        <rect x="73.5" y="9" width="2.5" height="2" rx="1" opacity="0.35" />
      </svg>
      <div className="h-px flex-1 bg-gradient-to-r from-lexis-ink/10 to-transparent" />
    </div>
  );
}
