// Smoke test for the built site: loads index.html on desktop and mobile,
// fails on page errors, horizontal overflow, leftover build tokens or banned wording.
// Usage (from phiraya/site): node tests/smoke.mjs
// Optional: PW_CHROMIUM=/path/to/chromium to use a preinstalled browser.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const file = resolve(process.cwd(), 'index.html');
const html = readFileSync(file, 'utf8');
const failures = [];

if (/__[A-Z]+__/.test(html)) failures.push('unreplaced __TOKEN__ placeholder in index.html');
// Owner rules: never mention AI, never use the retired name.
const text = html.replace(/data:[^"')]+/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
for (const [re, why] of [[/\bAI\b/, 'mentions "AI"'], [/artificial intelligence/i, 'mentions artificial intelligence'], [/Phitara|พิทารา/i, 'uses the retired name Phitara'], [/\bhuman\b/i, 'says "human"']]) {
  if (re.test(text)) failures.push('page copy ' + why);
}

const browser = await chromium.launch(process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {});
for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }],
]) {
  const page = await browser.newPage(opts);
  page.on('pageerror', e => failures.push(`${name}: page error: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') failures.push(`${name}: console error: ${m.text()}`); });
  await page.goto('file://' + file);
  await page.waitForTimeout(2500);
  const sw = await page.evaluate(() => document.documentElement.scrollWidth);
  if (sw > opts.viewport.width) failures.push(`${name}: horizontal overflow (${sw}px > ${opts.viewport.width}px)`);
  await page.close();
}
await browser.close();

if (failures.length) { console.error('Smoke test failed:\n- ' + failures.join('\n- ')); process.exit(1); }
console.log('Smoke test passed (desktop + mobile).');
