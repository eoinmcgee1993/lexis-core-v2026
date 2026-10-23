// LEXIS — POST /api/analytics/event: what actually lands in metadata
//
// Same approach as checkout.test.mjs and higgsfield.test.mjs: the real
// app.mjs is imported and Supabase is a local server this file controls,
// so what is asserted is the row the shipped handler wrote, after the
// shipped sanitiser, not a copy of either.
//
// What it is guarding (Oct 2026): every ad and post link carries its own id
// in utm_content, stored as `cnt`, and docs/marketing-report.sql groups by
// it. sanitiseMetadata() drops any key missing from SOURCE_KEYS without
// logging it or returning an error, by design (see the comment above
// SOURCE_KEYS). So if the key falls out of that map, nothing breaks
// anywhere: the "top posts" report just comes back empty weeks later, and
// those visits can't be attributed after the fact. A test is the only place
// that failure would show up while it can still be fixed.
//
// Run: node test/analytics.test.mjs   (plain script, like the other suites)

import http from 'node:http';
import { randomUUID } from 'node:crypto';

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}${detail ? '  ' + detail : ''}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? '  ' + detail : ''}`); }
}

// Order-insensitive, so the assertion is about which keys and values were
// stored, not the order the sanitiser happened to walk its schema in.
const canon = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));

// -------------------------------------------------------------- fake Supabase
// Only the one table this route writes, recorded as received. error_logs is
// accepted too, so a handler failure surfaces as a missing row plus a 500
// rather than as the fake erroring on an unmapped path.
const inserted = [];
const supabaseSrv = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    const table = new URL(req.url, 'http://x').pathname.replace('/rest/v1/', '');
    if (req.method === 'POST' && table === 'analytics_events') {
      inserted.push(...[].concat(JSON.parse(body)));
      res.writeHead(201);
      return res.end();
    }
    if (req.method === 'POST' && table === 'error_logs') { res.writeHead(201); return res.end(); }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: `unmapped ${req.method} ${req.url}` }));
  });
});

await new Promise((r) => supabaseSrv.listen(0, '127.0.0.1', r));

process.env.OPENAI_API_KEY = 'sk-placeholder';
process.env.SUPABASE_URL = `http://127.0.0.1:${supabaseSrv.address().port}`;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';

const app = (await import('../app.mjs')).default;
const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;

// No Authorization header: these events are the anonymous, pre-signup kind,
// and this suite is about metadata, not the best-effort user_id lookup.
async function send(event, metadata) {
  const before = inserted.length;
  const res = await fetch(`${BASE}/api/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, path: '/', lang: 'th', sessionId: randomUUID(), metadata })
  });
  return { status: res.status, row: inserted.length > before ? inserted.at(-1) : null };
}

console.log('--- a tagged landing keeps its post id ---');
{
  // Shaped like what analytics.js sends for a visit that arrived on
  // ?utm_source=TikTok&utm_medium=Social&utm_campaign=Launch_Oct&utm_content=Day01_TikTok!!
  // from tiktok.com, plus two keys nothing should be storing: an ad
  // network's click id and an email someone pasted into a link.
  const { status, row } = await send('pageview', {
    src: 'TikTok', med: 'Social', cmp: 'Launch_Oct', cnt: 'Day01_TikTok!!', refHost: 'www.tiktok.com',
    fbclid: 'IwAR0abc123', email: 'someone@example.com'
  });
  check('the event is accepted', status === 204, `(${status})`);
  const m = row?.metadata || {};
  check('cnt is stored, sanitised', m.cnt === 'day01_tiktok', `(${JSON.stringify(m.cnt)})`);
  check('the other source keys are unchanged by it',
    m.src === 'tiktok' && m.med === 'social' && m.cmp === 'launch_oct' && m.refHost === 'www.tiktok.com', JSON.stringify(m));
  check('an unknown key is still dropped', !('fbclid' in m) && !('email' in m));
  check('nothing else is stored', canon(m) === canon({ src: 'tiktok', med: 'social', cmp: 'launch_oct', cnt: 'day01_tiktok', refHost: 'www.tiktok.com' }));
}

console.log('\n--- cnt rides on every event the marketing report counts ---');
{
  for (const event of ['pageview', 'signup_completed', 'google_signin_started', 'checkout_started', 'checkout_completed']) {
    const { status, row } = await send(event, { src: 'meta', cmp: 'launch', cnt: 'ad-07' });
    check(`${event} keeps cnt`, status === 204 && row?.metadata?.cnt === 'ad-07', `(${status} ${JSON.stringify(row?.metadata)})`);
  }
  // The call site's own keys and the visit source share one object; adding
  // a source key must not crowd out the ones checkout already sends.
  const { row } = await send('checkout_started', { planTier: 'weekly', sponsorAdd: true, cnt: 'ad-07' });
  check('checkout keeps its own keys alongside cnt',
    canon(row?.metadata || {}) === canon({ planTier: 'weekly', sponsorAdd: true, cnt: 'ad-07' }), JSON.stringify(row?.metadata));
}

console.log('\n--- same limits as the other source keys ---');
{
  let { row } = await send('pageview', { cnt: 'X'.repeat(200) });
  check('capped at 60 characters', row?.metadata?.cnt === 'x'.repeat(60), `(${row?.metadata?.cnt?.length})`);

  ({ row } = await send('pageview', { src: 'tiktok', cnt: '!!!' }));
  check('a value with nothing left after sanitising is not stored as ""', row && !('cnt' in row.metadata), JSON.stringify(row?.metadata));

  // Thai script is outside the slug alphabet. Pinned so that a post id
  // written in Thai is a known loss (and docs/marketing-report.sql says to
  // keep ids ASCII), not a surprise in the report.
  ({ row } = await send('pageview', { cnt: 'โพสต์01' }));
  check('non-ASCII is stripped to what fits the slug alphabet', row?.metadata?.cnt === '01', `(${JSON.stringify(row?.metadata?.cnt)})`);

  ({ row } = await send('pageview', { src: 'tiktok', cnt: 12 }));
  check('a number is dropped, not coerced', row && !('cnt' in row.metadata), JSON.stringify(row?.metadata));
  ({ row } = await send('pageview', { src: 'tiktok', cnt: { $ne: '' } }));
  check('an object is dropped', row && !('cnt' in row.metadata), JSON.stringify(row?.metadata));
}

server.close();
supabaseSrv.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
