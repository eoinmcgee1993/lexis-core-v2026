// frontend/src/lib/resultCard.js
//
// The shareable result card (3 Oct 2026): a 1080x1350 PNG of one session's
// confidence score and best strength, drawn on the learner's own device and
// handed to the phone's share sheet (LINE, Instagram, TikTok...). LEXIS had
// ~190 pageviews in its first month, nearly all the owner's; a card a
// learner posts is the one channel that costs nothing and comes with a
// real person vouching for it.
//
// Drawn on a <canvas> rather than rendered server-side so nothing about a
// session leaves the device unless the learner shares it themselves (the
// privacy page says exactly this). That also means no new CSP source: the
// image is never displayed in the page, only turned into a File.
//
// What goes on it, and what deliberately doesn't:
// - the confidence score and the FIRST strength only. Strengths are the
//   model's paraphrase of what went well; corrections quote the learner's
//   own mistakes, which nobody wants on their feed by default.
// - the trial length, from facts.js like every other claim on the site.
// - "virtual conversation partner" wording, never anything implying LEXIS
//   is a person.
import { MARK_COLORS, MARK_GEOMETRY } from '../brand/lexisMark';
import { TRIAL } from '../content/facts';

const W = 1080;
const H = 1350;
const PAD = 96;
const SANS = "'IBM Plex Sans Thai', -apple-system, 'Segoe UI', Roboto, sans-serif";

// direction 'en' = Thai speaker learning English (card in Thai, like the
// feedback screen); 'th' = English speaker learning Thai (card in English).
const COPY = {
  en: {
    kicker: 'วันนี้ฉันฝึกพูดภาษาอังกฤษกับ LEXIS',
    score: 'ความมั่นใจ',
    did: 'สิ่งที่ทำได้ดี',
    cta: `ลองฝึกพูดฟรี ${TRIAL.minutes} นาที ไม่ต้องผูกบัตร`,
    shareText: `วันนี้ฉันฝึกพูดภาษาอังกฤษกับ LEXIS คู่สนทนาเสมือน ลองฟรี ${TRIAL.minutes} นาที`,
    url: 'learnwithlexis.com/th'
  },
  th: {
    kicker: 'I practised speaking Thai with LEXIS today',
    score: 'Confidence',
    did: 'What went well',
    cta: `Try it free for ${TRIAL.minutes} minutes, no card`,
    shareText: `I practised speaking Thai out loud with LEXIS, a virtual conversation partner. ${TRIAL.minutes} minutes free:`,
    url: 'learnwithlexis.com'
  }
};

// Thai has no spaces between words, so splitting on ' ' would leave a whole
// sentence as one unbreakable "word". Intl.Segmenter knows Thai word
// boundaries (Chrome 87+, Safari 14.1+, Firefox 125+); where it's missing,
// falling back to single characters still wraps, just less prettily.
function segments(text, lang) {
  if (typeof Intl !== 'undefined' && Intl.Segmenter) {
    return [...new Intl.Segmenter(lang, { granularity: 'word' }).segment(text)].map((s) => s.segment);
  }
  return /[฀-๿]/.test(text) ? [...text] : text.split(/(\s+)/);
}

function wrap(ctx, text, maxWidth, lang, maxLines) {
  const lines = [];
  let line = '';
  let truncated = false;
  for (const seg of segments(text, lang)) {
    const next = line + seg;
    if (ctx.measureText(next).width <= maxWidth || !line.trim()) {
      line = next;
      continue;
    }
    lines.push(line.trim());
    if (lines.length === maxLines) { truncated = true; break; }
    line = seg.trimStart();
  }
  if (!truncated && line.trim()) lines.push(line.trim());
  if (truncated) {
    let last = lines[maxLines - 1];
    while (last && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1);
    lines[maxLines - 1] = last + '…';
  }
  return lines;
}

function drawMark(ctx, x, y, size) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 100, size / 100);
  const g = ctx.createLinearGradient(0, 0, 100, 100);
  g.addColorStop(0, MARK_COLORS.tileFrom);
  g.addColorStop(1, MARK_COLORS.tileTo);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(0, 0, 100, 100, MARK_GEOMETRY.tileRadius);
  ctx.fill();
  const letter = new Path2D(MARK_GEOMETRY.letter.d);
  ctx.fillStyle = MARK_COLORS.letter;
  ctx.strokeStyle = MARK_COLORS.letter;
  ctx.lineWidth = MARK_GEOMETRY.letter.round;
  ctx.lineJoin = 'round';
  ctx.fill(letter);
  ctx.stroke(letter);
  ctx.strokeStyle = MARK_COLORS.waves;
  ctx.lineCap = 'round';
  for (const w of MARK_GEOMETRY.waves) {
    ctx.globalAlpha = w.opacity;
    ctx.lineWidth = w.strokeWidth;
    ctx.stroke(new Path2D(w.d));
  }
  ctx.restore();
}

export async function makeResultCard({ confidence, strengths, direction }) {
  const t = COPY[direction] || COPY.en;
  const lang = direction === 'th' ? 'en' : 'th';
  // Web fonts are only fetched once something on the page uses them; a
  // canvas draw doesn't count, so ask for both faces explicitly or the
  // first card comes out in a fallback font.
  try {
    await Promise.all([
      document.fonts.load(`600 64px 'IBM Plex Sans Thai'`, 'ก'),
      document.fonts.load(`400 40px 'IBM Plex Sans Thai'`, 'ก')
    ]);
  } catch { /* draw with whatever loaded */ }

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');

  // Navy background with the same two soft glows as the brand-kit images.
  ctx.fillStyle = '#050B14';
  ctx.fillRect(0, 0, W, H);
  for (const [x, y, r, col] of [[920, 140, 760, 'rgba(255,178,58,0.26)'], [0, 1350, 760, 'rgba(20,184,166,0.22)']]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, col);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  drawMark(ctx, PAD, PAD, 88);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 40px ${SANS}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('LEXIS', PAD + 112, PAD + 46);

  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.font = `600 44px ${SANS}`;
  let y = 330;
  for (const l of wrap(ctx, t.kicker, W - PAD * 2, lang, 2)) { ctx.fillText(l, PAD, y); y += 62; }

  // Confidence ring, the same shape the feedback screen shows.
  const cx = W / 2;
  const cy = y + 200;
  const r = 150;
  ctx.lineWidth = 30;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  const pct = Math.max(0, Math.min(100, Number(confidence) || 0));
  const ring = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  ring.addColorStop(0, '#FFB23A');
  ring.addColorStop(1, '#FF6A1A');
  ctx.strokeStyle = ring;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + (pct / 100) * Math.PI * 2); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  // Sans, not Fraunces: a canvas only gets a web font that has finished
  // loading, and Fraunces' digits fell back to Times in testing.
  ctx.font = `600 110px ${SANS}`;
  ctx.fillText(`${pct}%`, cx, cy + 28);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = `600 34px ${SANS}`;
  ctx.fillText(t.score, cx, cy + 82);
  ctx.textAlign = 'left';

  y = cy + r + 100;
  const best = (strengths || [])[0];
  if (best) {
    ctx.fillStyle = '#FFB23A';
    ctx.font = `600 34px ${SANS}`;
    ctx.fillText(t.did, PAD, y);
    y += 60;
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `400 38px ${SANS}`;
    for (const l of wrap(ctx, best, W - PAD * 2, direction === 'th' ? 'en' : 'th', 3)) { ctx.fillText(l, PAD, y); y += 56; }
  }

  ctx.fillStyle = 'rgba(255,255,255,0.86)';
  ctx.font = `600 36px ${SANS}`;
  ctx.fillText(t.cta, PAD, H - PAD - 60);
  ctx.fillStyle = '#FFB23A';
  ctx.font = `600 40px ${SANS}`;
  ctx.fillText(t.url, PAD, H - PAD);

  const blob = await new Promise((res) => c.toBlob(res, 'image/png'));
  return { blob, text: t.shareText, url: `https://${t.url}?utm_source=share&utm_medium=result_card` };
}

// Phones get the native share sheet with the image attached. Desktop
// browsers (and older phones) can't share files, so they get a download
// instead; the learner posts it themselves. Returns which path ran, for
// the result_card_shared event.
export async function shareResultCard(card) {
  const file = new File([card.blob], 'lexis-result.png', { type: 'image/png' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text: `${card.text} ${card.url}` });
      return 'share';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // anything else: fall through to a download rather than nothing
    }
  }
  const href = URL.createObjectURL(card.blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = 'lexis-result.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
  return 'download';
}
