import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { LANDING_DESCRIPTION_EN } from './src/content/facts.js';

// index.html is static, so it can't import facts.js the way every page
// does. It used to carry a hand-typed copy of the landing description, and
// that copy drifted (a "30-minute trial" long after the trial became 15).
// This fills the placeholder from the one source instead. HTML-escaped
// because it lands inside an attribute.
const escapeAttr = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const factsInHtml = {
  name: 'lexis-facts-in-html',
  transformIndexHtml: (html) =>
    html.replaceAll('%LANDING_DESCRIPTION_EN%', escapeAttr(LANDING_DESCRIPTION_EN))
};

export default defineConfig({
  plugins: [react(), factsInHtml],
  server: {
    port: 5173,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
