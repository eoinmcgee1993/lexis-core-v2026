/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LEXIS v2026.4 semantic palette — see scripts/design/lexis-visual-system.md.
        // Prefixed 'lexis-' so these never collide with Tailwind's own
        // built-in scales (teal/amber/slate are already used elsewhere in
        // the app on their stock Tailwind values). The "live" teal accent
        // deliberately has NO custom token here — Tailwind's own teal-600
        // (#0d9488) already *is* the spec's teal, so existing teal-*
        // utilities are reused as-is rather than duplicated under a new name.
        'lexis-canvas': '#FAFAF7',   // warm neutral foundation — Welcome/Topics/Feedback
        'lexis-navy': '#050B14',     // deep focus canvas — Live Conversation only
        'lexis-navy-2': '#0B1424',   // one step up from lexis-navy, for cards/surfaces on it
        'lexis-ink': '#1E293B',      // primary text on warm/light surfaces
        'lexis-action': '#FF9E00',   // primary CTA — amber, "do something"
        'lexis-action-dark': '#E08A00',
      },
      fontFamily: {
        // 'Inter' and 'JetBrains Mono' were named here but never actually
        // loaded (no @font-face, no <link>) — every render was silently
        // falling back to the system stack anyway. Naming the real fallback
        // instead of a font that was never present, plus a genuine display
        // face (Fraunces, self-hosted — see index.css) used deliberately on
        // headlines for the new warm/editorial tone.
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
