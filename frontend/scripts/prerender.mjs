// frontend/scripts/prerender.mjs
//
// Post-build pre-render step for the public marketing/legal routes ('/',
// '/pricing', '/terms', '/privacy', '/refund'). Run after `vite build`
// (see package.json's "build"
// script) — serves the freshly-built dist/ on a local port, drives a
// real headless Chromium to each route, waits for React to mount and
// each page's useSeo() call to finish writing <head> tags (see
// frontend/src/lib/useSeo.js), then writes the *fully rendered* HTML
// document back to disk as a static file.
//
// Why this exists: the app is a client-only Vite SPA (no react-router,
// no SSR) — the shipped HTML body was an empty <div id="root">. Any
// crawler that doesn't execute JavaScript, which includes most of the
// retrieval crawlers behind AI answer engines, saw accurate <head> tags
// on a completely empty page: no product description, no price, no FAQ.
// A router-aware static-site-generator would be a poor fit for a
// hand-rolled switch statement (App.jsx) — this is deliberately the
// smaller, more surgical fix: snapshot the pages worth indexing, leave
// /app and /auth exactly as they were (pure client-rendered, and
// robots-noindexed via useSeo — see AuthPage.jsx/LexisApp.jsx).
//
// Directory-style output matters: writing dist/pricing/index.html (not
// dist/pricing.html) means Vercel's filesystem check serves it directly
// for a request to /pricing, before vercel.json's SPA catch-all rewrite
// is ever consulted — no vercel.json change needed for this to work, but
// it's exactly the kind of platform behavior that needs verifying on a
// real deployment rather than trusted from documentation alone (see the
// PR this shipped in for that verification).
import { chromium as playwrightChromium } from 'playwright-core';
import puppeteer from 'puppeteer-core';
import sparticuzChromium from '@sparticuz/chromium';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PORT = 4321;

const ROUTES = [
  { path: '/', outFile: 'index.html' },
  { path: '/pricing', outFile: 'pricing/index.html' },
  { path: '/terms', outFile: 'terms/index.html' },
  { path: '/privacy', outFile: 'privacy/index.html' },
  { path: '/refund', outFile: 'refund/index.html' },
  { path: '/community', outFile: 'community/index.html' },
  { path: '/practice/interview-english', outFile: 'practice/interview-english/index.html' },
  // Real Thai routes (Stage 4) — same directory-style output rule as
  // every other route here: dist/th/index.html and dist/th/pricing/
  // index.html get served directly by Vercel's filesystem check for
  // requests to /th and /th/pricing, ahead of vercel.json's SPA rewrite.
  { path: '/th', outFile: 'th/index.html' },
  { path: '/th/pricing', outFile: 'th/pricing/index.html' }
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.xml': 'application/xml',
  '.txt': 'text/plain'
};

// Minimal static file server for dist/ — deliberately not a new runtime
// dependency (sirv-cli etc.) for something this small. Mirrors
// vercel.json's `/(.*)  ->  /index.html` SPA rewrite for any path that
// isn't a real file, so /app and /auth resolve the same way they do in
// production (even though this script never navigates to them).
function serveDist() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(req.url.split('?')[0]);
    let filePath = path.join(DIST_DIR, urlPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(PORT, () => resolve(server));
  });
}

// Vercel's build environment gets a Lambda-compatible headless Chromium
// via @sparticuz/chromium (plain `puppeteer`'s bundled desktop Chromium
// is a common cause of builds failing on Vercel/serverless Linux — a
// re-audit's brief specifically called out that this step is the one
// that changes deploy behavior and must be verified on a preview
// deployment, not assumed). Outside Vercel — this repo's dev sandbox,
// anyone's laptop — that binary won't run, so fall back to whatever real
// Chromium is already on the machine. This dev sandbox has Playwright's
// pre-installed Chromium at a known path; genuinely-local development
// elsewhere should set PUPPETEER_EXECUTABLE_PATH to a real Chrome/
// Chromium binary.
async function resolveExecutablePath() {
  if (process.env.VERCEL) {
    return sparticuzChromium.executablePath();
  }
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  // playwright-core ships path resolution but not a browser binary of its
  // own; this dev sandbox has one pre-installed (see CLAUDE.md/session
  // notes) — reuse it via playwright-core's own launch instead of
  // guessing a path, then hand puppeteer nothing further to resolve.
  return null;
}

async function launchBrowser() {
  if (process.env.VERCEL) {
    return puppeteer.launch({
      args: sparticuzChromium.args,
      executablePath: await resolveExecutablePath(),
      headless: sparticuzChromium.headless
    });
  }
  // Chromium refuses to start as root without --no-sandbox ("Running as
  // root without --no-sandbox is not supported") — hit running this
  // script inside this repo's own dev sandbox (root user), and a
  // plausible risk on other CI/containerized environments too, so these
  // three flags apply to every local-fallback launch path below, not
  // just the one that happened to surface it. @sparticuz/chromium's own
  // `chromium.args` above already bundles the equivalent flags for
  // Vercel's build environment specifically — left as-is there rather
  // than merged with these, so that path stays exactly what the package
  // documents as tested.
  const NO_SANDBOX_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];

  const localPath = await resolveExecutablePath();
  if (localPath) {
    return puppeteer.launch({ executablePath: localPath, headless: true, args: NO_SANDBOX_ARGS });
  }
  // No explicit path available locally — try the sandbox's known
  // Playwright Chromium install directly via playwright-core, whose API
  // is close enough to puppeteer's for this script's narrow needs
  // (goto/content/evaluate/close) that we wrap it in a tiny adapter
  // rather than maintaining two code paths below. playwright-core's
  // default launch() resolves to a "headless shell" binary this sandbox
  // doesn't have installed — point it at the full Chromium that is
  // actually present instead of trusting the default resolution.
  const sandboxChromium = process.env.PLAYWRIGHT_LOCAL_CHROMIUM || '/opt/pw-browsers/chromium';
  const browser = fs.existsSync(sandboxChromium)
    ? await playwrightChromium.launch({ executablePath: sandboxChromium, headless: true, args: NO_SANDBOX_ARGS })
    : await playwrightChromium.launch({ headless: true, args: NO_SANDBOX_ARGS });
  return {
    newPage: async () => {
      const page = await browser.newPage();
      return {
        goto: (url, opts) => page.goto(url, { waitUntil: 'networkidle', timeout: opts?.timeout }),
        evaluate: (fn) => page.evaluate(fn),
        content: () => page.content(),
        close: () => page.close()
      };
    },
    close: () => browser.close()
  };
}

// HTML comments in index.html's <head> (this file has a lot of them —
// they're real engineering documentation, meant for the repo, not for
// every visitor's page source) survive as DOM comment nodes and get
// serialized straight into page.content()'s output. Caught in review:
// a comment mentioning "FAQPage" in prose was enough to fail the
// acceptance check `grep -c "FAQPage" dist/pricing/index.html` (expected
// 0) even though no actual FAQPage script was present — the check isn't
// wrong, shipping the comments was. Safe to strip globally: none of this
// app's own script contents (JSON-LD, Vite's injected tags) contain
// literal `<!-- -->` comment syntax inside them.
function stripHtmlComments(html) {
  return html.replace(/<!--[\s\S]*?-->/g, '');
}

async function main() {
  console.log('[prerender] serving dist/ …');
  const server = await serveDist();
  console.log(`[prerender] listening on http://localhost:${PORT}`);

  const browser = await launchBrowser();
  let failed = false;
  // Render every route into memory first, and only write files to disk
  // once every route has been captured — NOT inside the loop. Writing
  // dist/index.html mid-loop while the static server (see serveDist)
  // still reads live from disk meant the SECOND route's SPA-fallback
  // request picked up the FIRST route's already-rendered, JSON-LD-laden
  // index.html instead of the original bare build output — the
  // /pricing render ended up carrying '/'s FAQPage script alongside its
  // own Offers script, exactly the kind of route/page mismatch this
  // whole pre-render effort exists to eliminate. Caught by the acceptance
  // check below (`grep -c "FAQPage" dist/pricing/index.html` must be 0)
  // before this ever reached a PR.
  const rendered = [];

  try {
    for (const route of ROUTES) {
      const page = await browser.newPage();
      const url = `http://localhost:${PORT}${route.path}`;
      console.log(`[prerender] rendering ${route.path} …`);

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      // A fixed short settle past network-idle for React's final paint +
      // useSeo's effect to run — not tuned to this bundle's size
      // specifically. If this ever proves flaky, replace it with waiting
      // on a real signal (e.g. a data attribute the app sets once
      // useSeo has run) rather than a longer guess.
      await new Promise((resolve) => setTimeout(resolve, 300));

      const rootHtml = await page.evaluate(() => document.getElementById('root')?.innerHTML || '');
      if (!rootHtml.trim()) {
        console.error(`[prerender] ABORT — ${route.path} produced an empty #root. A silently empty pre-render is worse than none.`);
        failed = true;
        await page.close();
        break;
      }

      const html = stripHtmlComments(await page.content());
      rendered.push({ route, html });
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  if (failed) {
    process.exit(1);
  }

  for (const { route, html } of rendered) {
    const outPath = path.join(DIST_DIR, route.outFile);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    console.log(`[prerender] wrote ${route.outFile} (${(html.length / 1024).toFixed(1)} KB)`);
  }
  console.log('[prerender] done.');
}

main().catch((err) => {
  console.error('[prerender] failed:', err);
  process.exit(1);
});
