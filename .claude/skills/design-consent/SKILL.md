---
name: design-consent
description: Before changing LEXIS's visual design, surface which recorded design decisions the change would overturn — especially ones already tried and reverted — and get explicit agreement first. Use when asked to redesign, restyle, or "make it look better", and whenever a change would undo something a comment says was deliberate.
---

# Design consent

This interface carries a written history. Several of its current choices are
the *result* of a change being made, disliked, and reverted, and the comments
exist so the same idea is not attempted the same way twice. Redesigning
without reading them re-litigates settled decisions and looks like a
regression to whoever settled them.

So: find what the change would overturn, say so, and get agreement — before
writing the code, not in the commit message afterwards.

## 1. Find the recorded decisions the change touches

```bash
grep -rn "re-audit\|reverted\|deliberately\|Deliberately\|NOT \|instead of" \
  frontend/src/components frontend/src/pages frontend/src/index.css | head -40
```

Read the surrounding comment, not just the matched line. Also read
`scripts/design/lexis-visual-system.md` and `SITE-AUDIT.md`.

Decisions currently on the record, at least:

- **Cards were deliberately deleted** from the landing page (21 Aug re-audit:
  "delete the cards", "icons only where they carry meaning"). Bringing a
  bordered box per item back is a reversal. Structure was restored instead
  with full-bleed bands and asymmetric grids.
- **The tutor is a face, not an abstraction.** "A live avatar was the actual
  point of the product — an abstract pulsing ring never was." Replacing the
  avatar with a waveform or a ring undoes that.
- **The brand mark is a five-bar waveform, not a sparkle.** The sparkle read
  as generic-AI iconography; the waveform is literal — the product is a live
  voice conversation. `LexisMark.jsx`, `public/favicon.svg` and `WaveRule.jsx`
  all speak that one language and must stay in step.
- **Icons only where they carry meaning.** No borrowed trust-badge
  iconography, no icon standing in for a word.
- **One content edge.** `max-w-6xl` everywhere, with the measure constrained
  on the text rather than on the section. Per-section widths moved the left
  edge on every scroll — that was the actual cause of "generic and dull".

## 2. Say what would change, and ask

Present it as: the decision, why it was made, what the proposed change does to
it, and what is gained. Then ask. Keep it to a few lines — this is a checkpoint,
not a document.

If the answer is to proceed, proceed fully and record the new reasoning in a
comment at the same density, including what it replaced. The next person needs
the same protection.

## 3. Changes that need no consent

Not everything is a design decision. Proceed without asking on:

- Fixing something that is broken or invisible (a class generating no CSS, an
  element causing horizontal overflow, contrast below threshold).
- Making an existing treatment consistent across surfaces that already agreed
  in intent — the same button rendered two different ways is a defect.
- Accessibility that is absent rather than declined (a `prefers-reduced-motion`
  guard over animations that genuinely loop).

## 4. Reference material

The Mobbin connector is the intended source for reference UI and returns
`Mobbin MCP requires a paid plan` for every query — account-level, not
transient. Say that plainly rather than implying it was consulted. Judge
against the live product and a named public page instead, and say which one.
