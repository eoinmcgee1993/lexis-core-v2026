#!/usr/bin/env node
// REPL driver for LEXIS's frontend (Vite dev server) and backend (Express).
// Headless Chromium via playwright-core, using the container's preinstalled
// browser at /opt/pw-browsers/chromium (see CLAUDE.md's environment note —
// this repo pins playwright-core 1.62.1, which is older than the browser
// build `npx playwright install` would fetch, so launching with an explicit
// executablePath is required; a bare `chromium.launch()` fails to find a
// matching browser and throws).
//
// Designed for agents: wrap in tmux, send-keys commands one at a time,
// capture-pane the output. See SKILL.md in this same directory for the
// full command reference and worked examples.

import * as readline from 'node:readline';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

// This file lives at <repo>/.claude/skills/run-lexis-core/driver.mjs. Node's
// ESM resolver looks for bare-specifier packages (like `playwright-core`)
// starting from THIS file's own directory and walking up — never from
// process.cwd() — so a plain `import { chromium } from 'playwright-core'`
// fails no matter which directory you launch the driver from, since there
// is no node_modules anywhere under .claude/. playwright-core is only
// installed under frontend/node_modules (it's a frontend devDependency,
// used by the prerender step). Import it by explicit path instead.
const REPO_ROOT = path.resolve(import.meta.dirname, '../../..');
const FRONTEND_DIR = path.join(REPO_ROOT, 'frontend');
const { chromium } = await import(
  pathToFileURL(path.join(FRONTEND_DIR, 'node_modules/playwright-core/index.mjs')).href
);

const SHOT_DIR = process.env.SCREENSHOT_DIR || '/tmp/lexis-driver-shots';
fs.mkdirSync(SHOT_DIR, { recursive: true });

const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

let browser = null;
let page = null;
const consoleLog = [];

function resolveLocator(arg) {
  // `text=Foo` -> text locator; `role=button[name="Save"]` -> ARIA role
  // locator; anything else -> raw CSS selector. Mirrors chromium-cli's
  // shorthand closely enough that commands read the same either way.
  if (arg.startsWith('text=')) return page.getByText(arg.slice(5), { exact: false }).first();
  if (arg.startsWith('role=')) {
    const m = /^role=([a-z-]+)(?:\[name="([^"]*)"\])?$/.exec(arg);
    if (m) return page.getByRole(m[1], m[2] ? { name: m[2] } : {}).first();
  }
  return page.locator(arg).first();
}

const COMMANDS = {
  async launch() {
    if (browser) return console.log('already launched');
    browser = await chromium.launch({
      executablePath: CHROMIUM_PATH,
      args: ['--no-sandbox'],
      timeout: 30_000,
    });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    page = await context.newPage();
    page.on('console', (msg) => consoleLog.push({ type: msg.type(), text: msg.text() }));
    page.on('pageerror', (err) => consoleLog.push({ type: 'pageerror', text: String(err) }));
    console.log('launched.');
  },

  async nav(url) {
    if (!page) return console.log('ERROR: launch first');
    if (!url) return console.log('ERROR: usage: nav <url>');
    consoleLog.length = 0;
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      console.log('navigated:', url);
    } catch (e) {
      console.log('NAV ERROR:', e.message);
    }
  },

  async 'wait-for'(arg) {
    if (!page) return console.log('ERROR: launch first');
    if (!arg) return console.log('ERROR: usage: wait-for <selector | text=... | role=...>');
    try {
      await resolveLocator(arg).waitFor({ state: 'visible', timeout: 15_000 });
      console.log('found:', arg);
    } catch {
      console.log('TIMEOUT:', arg);
    }
  },

  async click(arg) {
    if (!page) return console.log('ERROR: launch first');
    try {
      await resolveLocator(arg).click({ timeout: 10_000 });
      console.log('clicked:', arg);
    } catch (e) {
      console.log('CLICK ERROR:', arg, '->', e.message);
    }
  },

  // Controlled React inputs need Playwright's real input pipeline, not a
  // DOM-level `.value =` assignment — see Gotchas in SKILL.md.
  async fill(argLine) {
    if (!page) return console.log('ERROR: launch first');
    const spaceIdx = argLine.indexOf(' ');
    if (spaceIdx === -1) return console.log('ERROR: usage: fill <selector> <text...>');
    const sel = argLine.slice(0, spaceIdx);
    const value = argLine.slice(spaceIdx + 1);
    try {
      await resolveLocator(sel).fill(value, { timeout: 10_000 });
      console.log('filled:', sel);
    } catch (e) {
      console.log('FILL ERROR:', sel, '->', e.message);
    }
  },

  async type(text) { if (page) await page.keyboard.type(text || '', { delay: 20 }); },
  async press(key) { if (page) await page.keyboard.press(key || 'Enter'); },

  async screenshot(name) {
    if (!page) return console.log('ERROR: launch first');
    const f = path.join(SHOT_DIR, (name || `ss-${Date.now()}`) + '.png');
    await page.screenshot({ path: f, fullPage: true });
    console.log('screenshot:', f);
  },

  async 'screenshot-element'(argLine) {
    if (!page) return console.log('ERROR: launch first');
    const [sel, name] = argLine.split(/\s+/);
    const f = path.join(SHOT_DIR, (name || `ss-el-${Date.now()}`) + '.png');
    try {
      await resolveLocator(sel).screenshot({ path: f });
      console.log('screenshot:', f);
    } catch (e) {
      console.log('SCREENSHOT ERROR:', e.message);
    }
  },

  async text(sel) {
    if (!page) return console.log('ERROR: launch first');
    const out = await page.evaluate(
      (s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(null)',
      sel || null,
    );
    console.log(out);
  },

  async eval(expr) {
    if (!page) return console.log('ERROR: launch first');
    try {
      const fn = new Function(expr);
      console.log(JSON.stringify(await page.evaluate(fn)));
    } catch (e) {
      console.log('ERROR:', e.message);
    }
  },

  async console(flag) {
    const rows = flag === '--errors'
      ? consoleLog.filter((m) => m.type === 'error' || m.type === 'pageerror')
      : consoleLog;
    if (!rows.length) return console.log('(none)');
    for (const m of rows) console.log(`[${m.type}] ${m.text}`);
  },

  async url() { console.log(page ? page.url() : '(no page)'); },

  async quit() {
    if (browser) await browser.close().catch(() => {});
    browser = null; page = null;
  },
  help() { console.log('commands:', Object.keys(COMMANDS).join(', ')); },
};

const stdin = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: stdin, output: process.stdout, prompt: 'driver> ' });

rl.on('line', async (line) => {
  const trimmed = line.trim();
  const spaceIdx = trimmed.indexOf(' ');
  const cmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? '' : trimmed.slice(spaceIdx + 1);
  if (!cmd) return rl.prompt();
  const fn = COMMANDS[cmd];
  if (!fn) { console.log('unknown:', cmd, '- try: help'); return rl.prompt(); }
  try { await fn(rest); } catch (e) { console.log('ERROR:', e.message); }
  if (cmd === 'quit') { rl.close(); process.exit(0); }
  rl.prompt();
});
rl.on('close', async () => { await COMMANDS.quit(); process.exit(0); });

console.log('lexis driver - "help" for commands, "launch" to start');
rl.prompt();
