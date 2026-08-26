import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const ROUTES = [
  '/', '/pricing', '/terms', '/privacy', '/refund', '/community',
  '/practice/interview-english', '/practice/everyday-english',
  '/practice/travel-english', '/practice/business-english',
  '/th', '/th/pricing', '/th/community',
  '/th/practice/interview-english', '/th/practice/everyday-english',
  '/th/practice/travel-english', '/th/practice/business-english'
];
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml',
  '.jpg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.avif':'image/avif',
  '.mp3':'audio/mpeg', '.json':'application/json', '.woff2':'font/woff2', '.txt':'text/plain', '.xml':'application/xml', '.glb':'model/gltf-binary' };

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(DIST, p);
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
await new Promise(r => server.listen(4178, r));

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
let fail = 0;
for (const route of ROUTES) {
  const page = await browser.newPage();
  const errs = [];
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(`http://localhost:4178${route}`, { waitUntil: 'networkidle' });
  const info = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    canonical: document.querySelector('link[rel=canonical]')?.href || null,
    hreflang: [...document.querySelectorAll('link[rel=alternate][hreflang]')].map(l => `${l.hreflang}=${l.href}`),
    em: (document.body.innerText.match(/—/g) || []).length,
    text: document.body.innerText.length
  }));
  const bad = errs.length || info.em || info.text < 400;
  if (bad) fail++;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${route.padEnd(36)} lang=${(info.lang||'-').padEnd(3)} em=${info.em} chars=${String(info.text).padStart(5)} errs=${errs.length} hreflang=${info.hreflang.length}`);
  if (errs.length) errs.slice(0,3).forEach(e => console.log('        !', e.slice(0,160)));
  await page.close();
}
await browser.close();
server.close();
console.log(fail ? `\n${fail} ROUTE(S) FAILED` : `\nAll ${ROUTES.length} routes clean.`);
process.exit(fail ? 1 : 0);
