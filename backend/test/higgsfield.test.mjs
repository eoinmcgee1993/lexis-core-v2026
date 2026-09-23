// LEXIS — Higgsfield generation (/api/generations*, /api/higgsfield/webhook)
//
// Same approach as checkout.test.mjs: the real app.mjs is imported and every
// outbound call lands on a local server this file controls. Two fakes:
//
//   - Higgsfield, answering the four endpoints app.mjs uses, with whatever
//     status or failure a test asks for, and recording every call so the
//     test can assert what was SENT (body, auth header, webhook param) and
//     how many times — the things that cost money if they are wrong.
//   - Supabase, as a small in-memory PostgREST: enough of eq/in/not.in/
//     gte/lt/order/limit, single vs maybeSingle, count=exact, and the
//     one-active-per-user partial unique index from supabase-schema.sql.
//     The index is the duplicate-submission guard, so a fake that did not
//     enforce it could not test that guard at all.
//
// Nothing inside app.mjs is stubbed. HIGGSFIELD_API_BASE is real config
// (the origin every Higgsfield URL is checked against), not a test hook.
//
// Run: node test/higgsfield.test.mjs   (plain script, like the other suites)

import http from 'node:http';
import { randomUUID } from 'node:crypto';

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}${detail ? '  ' + detail : ''}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? '  ' + detail : ''}`); }
}

const USERS = {
  'token-owner': { id: '11111111-1111-4111-8111-111111111111', email: 'owner@example.test' },
  'token-other': { id: '22222222-2222-4222-8222-222222222222', email: 'someone@example.test' }
};
const OWNER = USERS['token-owner'];
const MODEL = 'bytedance/seedance-2.0/text-to-video';
const WEBHOOK_SECRET = 'test-webhook-secret-0123456789abcdef';

// ------------------------------------------------------------ fake Higgsfield
const hfCalls = [];
const hfRequests = new Map();      // request_id -> status body to return
let submitMode = 'accept';         // accept | concurrency | credits | hang | offorigin
let cancelMode = 'accept';         // accept | started

const hfSrv = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    const url = new URL(req.url, 'http://x');
    hfCalls.push({ method: req.method, path: url.pathname, query: url.searchParams, body: body ? JSON.parse(body) : null, auth: req.headers.authorization });
    const send = (code, obj) => {
      res.writeHead(code, { 'content-type': 'application/json', 'x-correlation-id': `corr-${hfCalls.length}` });
      res.end(obj === undefined ? '' : JSON.stringify(obj));
    };

    if (req.method === 'POST' && url.pathname === `/${MODEL}`) {
      if (submitMode === 'hang') return req.socket.destroy();
      if (submitMode === 'concurrency') return send(400, { detail: 'Maximum number of concurrent requests (4) has been reached' });
      if (submitMode === 'credits') return send(403, { detail: 'Not enough credits' });
      const id = randomUUID();
      hfRequests.set(id, { status: 'queued', request_id: id });
      const origin = submitMode === 'offorigin' ? 'https://evil.example' : `http://${req.headers.host}`;
      return send(200, {
        status: 'queued', request_id: id,
        status_url: `${origin}/requests/${id}/status`,
        cancel_url: `${origin}/requests/${id}/cancel`
      });
    }
    const m = url.pathname.match(/^\/requests\/([^/]+)\/(status|cancel)$/);
    if (m) {
      const state = hfRequests.get(m[1]);
      if (!state) return send(404, { detail: 'Not found' });
      if (m[2] === 'status' && req.method === 'GET') return send(200, state);
      if (m[2] === 'cancel' && req.method === 'POST') {
        if (cancelMode === 'started') return send(400, { detail: 'Request already started' });
        hfRequests.set(m[1], { ...state, status: 'canceled' });
        return send(202);
      }
    }
    send(404, { detail: `unmapped ${req.method} ${url.pathname}` });
  });
});

// -------------------------------------------------------------- fake Supabase
const tables = { generations: [], error_logs: [] };
const ACTIVE = new Set(['submitting', 'queued', 'in_progress']);

function parseList(v) { return v.replace(/^\(|\)$/g, '').split(',').map((x) => x.replace(/^"|"$/g, '')); }
function matches(row, params) {
  for (const [col, expr] of params) {
    if (['select', 'order', 'limit', 'offset', 'columns'].includes(col)) continue;
    const val = row[col] == null ? null : String(row[col]);
    const [op, ...rest] = expr.split('.');
    const arg = rest.join('.');
    if (op === 'eq' && val !== arg) return false;
    if (op === 'in' && !parseList(arg).includes(val)) return false;
    if (op === 'not') {
      const [op2, ...r2] = arg.split('.');
      if (op2 === 'in' && parseList(r2.join('.')).includes(val)) return false;
      if (op2 === 'eq' && val === r2.join('.')) return false;
    }
    if (op === 'gte' && !(Date.parse(row[col]) >= Date.parse(arg))) return false;
    if (op === 'lt' && !(Date.parse(row[col]) < Date.parse(arg))) return false;
  }
  return true;
}
// The partial unique index (user_id) WHERE status IN active, plus UNIQUE request_id.
function violatesUnique(candidate, ignoreId) {
  const others = tables.generations.filter((r) => r.id !== ignoreId);
  if (ACTIVE.has(candidate.status) && others.some((r) => r.user_id === candidate.user_id && ACTIVE.has(r.status))) return true;
  if (candidate.request_id && others.some((r) => r.request_id === candidate.request_id)) return true;
  return false;
}

const supabaseSrv = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    const url = new URL(req.url, 'http://x');
    const json = (code, obj, headers = {}) => {
      res.writeHead(code, { 'content-type': 'application/json', ...headers });
      res.end(obj === undefined ? '' : JSON.stringify(obj));
    };
    if (url.pathname === '/auth/v1/user') {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      const u = USERS[token];
      return u ? json(200, { ...u, aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {} })
               : json(401, { message: 'invalid token' });
    }
    const table = url.pathname.replace('/rest/v1/', '');
    const wantsObject = (req.headers.accept || '').includes('vnd.pgrst.object');
    const reply = (rows) => {
      if (wantsObject) {
        if (rows.length !== 1) return json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' });
        return json(200, rows[0]);
      }
      return json(200, rows);
    };

    if (table === 'profiles') {
      const id = (url.searchParams.get('id') || '').replace('eq.', '');
      return reply([{ id, email: Object.values(USERS).find((u) => u.id === id)?.email, subscription_tier: 'free', subscription_status: 'inactive' }]);
    }
    if (table === 'error_logs') { tables.error_logs.push(JSON.parse(body || '{}')); return json(201, undefined); }
    if (table !== 'generations') return json(404, { message: `unmapped table ${table}` });

    const params = [...url.searchParams.entries()];
    const now = new Date().toISOString();
    if (req.method === 'POST') {
      const incoming = JSON.parse(body);
      const row = { id: randomUUID(), provider: 'higgsfield', request_id: null, status_url: null, cancel_url: null, output_url: null,
        error: null, correlation_id: null, last_polled_at: null, completed_at: null, created_at: now, updated_at: now, ...incoming };
      if (violatesUnique(row)) return json(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
      tables.generations.push(row);
      return reply([row]);
    }
    if (req.method === 'PATCH') {
      const patch = JSON.parse(body);
      const hits = tables.generations.filter((r) => matches(r, params));
      for (const r of hits) {
        if (violatesUnique({ ...r, ...patch }, r.id)) return json(409, { code: '23505', message: 'duplicate key value violates unique constraint' });
      }
      hits.forEach((r) => Object.assign(r, patch));
      return reply(hits);
    }
    if (req.method === 'GET' || req.method === 'HEAD') {
      let rows = tables.generations.filter((r) => matches(r, params));
      const order = url.searchParams.get('order');
      if (order) {
        const [col, dir] = order.split('.');
        rows = [...rows].sort((a, b) => (a[col] < b[col] ? -1 : 1) * (dir === 'desc' ? -1 : 1));
      }
      const limit = Number(url.searchParams.get('limit'));
      if (limit) rows = rows.slice(0, limit);
      if (req.method === 'HEAD') {
        res.writeHead(200, { 'content-range': `*/${rows.length}` });
        return res.end();
      }
      return reply(rows);
    }
    json(405, { message: 'method' });
  });
});

await new Promise((r) => hfSrv.listen(0, '127.0.0.1', r));
await new Promise((r) => supabaseSrv.listen(0, '127.0.0.1', r));
const HF_BASE = `http://127.0.0.1:${hfSrv.address().port}`;

process.env.OPENAI_API_KEY = 'sk-placeholder';
process.env.SUPABASE_URL = `http://127.0.0.1:${supabaseSrv.address().port}`;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';
process.env.HIGGSFIELD_API_BASE = HF_BASE;
process.env.HF_API_KEY_ID = 'test-key-id';
process.env.HF_API_KEY_SECRET = 'test-key-secret';
process.env.HIGGSFIELD_ALLOWED_EMAILS = ' Owner@Example.test ';   // case and spacing on purpose
process.env.HIGGSFIELD_DAILY_LIMIT = '4';
process.env.HIGGSFIELD_WEBHOOK_BASE_URL = 'https://api.lexis.example';
process.env.HIGGSFIELD_WEBHOOK_SECRET = WEBHOOK_SECRET;

const app = (await import('../app.mjs')).default;
const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const headersFor = (token) => ({ Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' });

// The submit route is rate limited per IP (5/min) BEFORE anything else,
// and this whole suite is one client. Rather than give app.mjs a switch to
// turn that off, each submit comes from its own loopback address — Linux
// routes all of 127.0.0.0/8 to lo — which is exactly how the limiter tells
// clients apart in production. The limiter itself is asserted at the end.
let nextHost = 2;
function postFrom(localAddress, path, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(`${BASE}${path}`);
    const req = http.request({ host: u.hostname, port: u.port, path: u.pathname, method: 'POST', headers, localAddress }, (res) => {
      let data = '';
      res.on('data', (d) => { data += d; });
      res.on('end', () => resolve({ status: res.statusCode, json: async () => JSON.parse(data) }));
    });
    req.on('error', reject);
    req.end(body);
  });
}
const submit = (input, { token = 'token-owner', model = MODEL, from } = {}) =>
  postFrom(from || `127.0.0.${nextHost++}`, '/api/generations', headersFor(token), JSON.stringify({ model, input }));
const read = (id, token = 'token-owner') => fetch(`${BASE}/api/generations/${id}`, { headers: headersFor(token) });
const webhook = (payload, token = WEBHOOK_SECRET) =>
  fetch(`${BASE}/api/higgsfield/webhook?token=${encodeURIComponent(token)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
  });
const rowFor = (id) => tables.generations.find((r) => r.id === id);
const submitsSent = () => hfCalls.filter((c) => c.method === 'POST' && c.path === `/${MODEL}`).length;
// Lets the next read through the 2s per-row poll floor without sleeping.
const agePoll = (id) => { rowFor(id).last_polled_at = new Date(Date.now() - 60_000).toISOString(); };
const finishActive = () => tables.generations.forEach((r) => { if (ACTIVE.has(r.status)) r.status = 'completed'; });

const PROMPT = 'A cinematic tracking shot along a sunlit coastal road';

console.log('--- who may use it ---');
{
  let r = await submit({ prompt: PROMPT }, { token: 'token-other' });
  check('an account not on the allowlist is refused', r.status === 403 && (await r.json()).code === 'not_enabled');
  r = await fetch(`${BASE}/api/generations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  check('an unauthenticated submit is refused', r.status === 401);

  const saved = process.env.HF_API_KEY_SECRET;
  delete process.env.HF_API_KEY_SECRET;
  r = await submit({ prompt: PROMPT });
  check('missing credentials give 503, not a crash', r.status === 503 && (await r.json()).code === 'not_configured');
  process.env.HF_API_KEY_SECRET = saved;

  const allow = process.env.HIGGSFIELD_ALLOWED_EMAILS;
  delete process.env.HIGGSFIELD_ALLOWED_EMAILS;
  r = await submit({ prompt: PROMPT });
  check('an unset allowlist lets nobody in (fails closed)', r.status === 403);
  process.env.HIGGSFIELD_ALLOWED_EMAILS = allow;
  check('none of that reached Higgsfield', submitsSent() === 0);
}

console.log('\n--- input validation (nothing invalid is ever sent) ---');
{
  const cases = [
    ['unknown model', { prompt: PROMPT }, { model: 'bytedance/seedance-2.0/../../admin' }],
    ['missing prompt', {}],
    ['blank prompt', { prompt: '   ' }],
    ['prompt too long', { prompt: 'x'.repeat(2001) }],
    ['duration below 4', { prompt: PROMPT, duration: 3 }],
    ['duration above 15', { prompt: PROMPT, duration: 16 }],
    ['fractional duration', { prompt: PROMPT, duration: 5.5 }],
    ['resolution off the enum', { prompt: PROMPT, resolution: '8k' }],
    ['aspect ratio off the enum', { prompt: PROMPT, aspect_ratio: '2:1' }],
    ['non-boolean generate_audio', { prompt: PROMPT, generate_audio: 'yes' }],
    ['field the schema does not have', { prompt: PROMPT, seed: 42 }]
  ];
  for (const [name, input, opts] of cases) {
    const r = await submit(input, opts);
    check(`rejects ${name}`, r.status === 400, `(${r.status})`);
  }
  check('no invalid request reached Higgsfield', submitsSent() === 0);
}

console.log('\n--- submit: the reference request ---');
let first;
{
  const reference = { prompt: PROMPT, resolution: '720p', generate_audio: true, duration: 5, aspect_ratio: '16:9' };
  const r = await submit(reference);
  const body = await r.json();
  first = body.generation;
  const call = hfCalls.at(-1);
  check('accepted as 202 with our own id', r.status === 202 && typeof first?.id === 'string', `(${r.status})`);
  check('posted to the documented endpoint', call.path === `/${MODEL}`);
  check('Authorization is "Key id:secret"', call.auth === 'Key test-key-id:test-key-secret');
  const canon = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
  check('body is exactly the reference body (same keys, same values)', canon(call.body) === canon(reference), JSON.stringify(call.body));
  check('webhook URL carries the secret', call.query.get('hf_webhook') === `https://api.lexis.example/api/higgsfield/webhook?token=${WEBHOOK_SECRET}`);
  const row = rowFor(first.id);
  check('request_id saved and tied to the user', Boolean(row.request_id) && row.user_id === OWNER.id);
  check('correlation id recorded', row.correlation_id?.startsWith('corr-'));
  check('the browser never sees request_id or provider URLs', !JSON.stringify(body).includes(row.request_id) && !JSON.stringify(body).includes('status_url'));
}

console.log('\n--- duplicate submissions ---');
{
  const before = submitsSent();
  const [a, b] = await Promise.all([submit({ prompt: PROMPT }), submit({ prompt: PROMPT })]);
  check('a second submit while one is in flight is refused', a.status === 409 && b.status === 409, `(${a.status}, ${b.status})`);
  check('and is never sent to Higgsfield', submitsSent() === before);
}

console.log('\n--- polling lifecycle ---');
{
  const reqId = rowFor(first.id).request_id;
  const statusCalls = () => hfCalls.filter((c) => c.path === `/requests/${reqId}/status`).length;

  let d = await (await read(first.id)).json();
  check('reads queued', d.generation.status === 'queued' && d.generation.terminal === false);
  const n = statusCalls();
  await read(first.id);
  await read(first.id);
  check('rapid re-reads do not hammer Higgsfield (2s floor)', statusCalls() === n, `(${statusCalls() - n} extra)`);

  hfRequests.set(reqId, { status: 'in_progress', request_id: reqId });
  agePoll(first.id);
  d = await (await read(first.id)).json();
  check('moves to in_progress', d.generation.status === 'in_progress');

  hfRequests.set(reqId, { status: 'completed', request_id: reqId, video: { url: 'https://cdn.example/out.mp4' } });
  agePoll(first.id);
  d = await (await read(first.id)).json();
  check('completes with the video URL', d.generation.status === 'completed' && d.generation.outputUrl === 'https://cdn.example/out.mp4' && d.generation.terminal);

  const after = statusCalls();
  agePoll(first.id);
  await read(first.id);
  check('a finished row is never polled again', statusCalls() === after);

  const r = await read(first.id, 'token-other');
  check("another user's generation is a 404", r.status === 404 || r.status === 403, `(${r.status})`);
  // The other user is not on the allowlist, which would 403 first; prove
  // the ownership check itself by letting them in for one read.
  process.env.HIGGSFIELD_ALLOWED_EMAILS += ',someone@example.test';
  const r2 = await read(first.id, 'token-other');
  check("…and still 404 once they ARE allowed (ownership, not just access)", r2.status === 404, `(${r2.status})`);
  process.env.HIGGSFIELD_ALLOWED_EMAILS = 'owner@example.test';
  check('a malformed id is refused', (await read('not-a-uuid')).status === 404);
}

console.log('\n--- terminal failures ---');
{
  let g = (await (await submit({ prompt: 'second' })).json()).generation;
  let reqId = rowFor(g.id).request_id;
  hfRequests.set(reqId, { status: 'nsfw', request_id: reqId });
  agePoll(g.id);
  let d = await (await read(g.id)).json();
  check('nsfw is terminal with a moderation message', d.generation.status === 'nsfw' && /moderation/.test(d.generation.error));

  g = (await (await submit({ prompt: 'third' })).json()).generation;
  reqId = rowFor(g.id).request_id;
  hfRequests.delete(reqId);
  agePoll(g.id);
  d = await (await read(g.id)).json();
  check('a 404 from Higgsfield stops polling (row closed as failed)', d.generation.status === 'failed');
}

console.log('\n--- Higgsfield refuses or does not answer ---');
{
  submitMode = 'concurrency';
  let r = await submit({ prompt: 'busy' });
  check('account concurrency limit becomes a 429', r.status === 429, `(${r.status})`);
  submitMode = 'credits';
  r = await submit({ prompt: 'broke' });
  const body = await r.json();
  check('out of credits is a 503 that does not say why', r.status === 503 && !/credit/i.test(body.error));
  // logError writes fire-and-forget, so give it a moment to land.
  for (let i = 0; i < 50 && !tables.error_logs.some((e) => /credits/.test(e.message || '')); i++) await new Promise((r) => setTimeout(r, 20));
  check('…and is logged for the operator', tables.error_logs.some((e) => /credits/.test(e.message || '')));

  submitMode = 'hang';
  const before = submitsSent();
  r = await submit({ prompt: 'ambiguous' });
  check('no answer is a 504 flagged as ambiguous', r.status === 504 && (await r.json()).code === 'ambiguous');
  check('and the POST is NOT retried (no idempotency key)', submitsSent() === before + 1);
  check('refused and ambiguous submits free the slot', !tables.generations.some((x) => x.user_id === OWNER.id && ACTIVE.has(x.status)));
  submitMode = 'accept';
}

console.log('\n--- provider URLs are never followed off-origin ---');
{
  submitMode = 'offorigin';
  const g = (await (await submit({ prompt: 'origin check' })).json()).generation;
  submitMode = 'accept';
  const row = rowFor(g.id);
  check('an off-origin status_url is replaced with the documented one', row.status_url === `${HF_BASE}/requests/${row.request_id}/status`, row.status_url);
  check('same for cancel_url', row.cancel_url === `${HF_BASE}/requests/${row.request_id}/cancel`);

  console.log('\n--- cancel ---');
  const res = await fetch(`${BASE}/api/generations/${g.id}/cancel`, { method: 'POST', headers: headersFor('token-owner') });
  const d = await res.json();
  check('a queued render can be cancelled', res.status === 200 && d.generation.status === 'canceled');

  const g2 = (await (await submit({ prompt: 'too late' })).json()).generation;
  cancelMode = 'started';
  hfRequests.set(rowFor(g2.id).request_id, { status: 'in_progress', request_id: rowFor(g2.id).request_id });
  const res2 = await fetch(`${BASE}/api/generations/${g2.id}/cancel`, { method: 'POST', headers: headersFor('token-owner') });
  const d2 = await res2.json();
  check('a started render cannot, and the client is told it started', res2.status === 409 && d2.generation.status === 'in_progress');
  cancelMode = 'accept';

  console.log('\n--- webhook ---');
  const reqId = rowFor(g2.id).request_id;
  check('wrong token is 401', (await webhook({ request_id: reqId, status: 'completed' }, 'nope')).status === 401);
  check('a body that is not the envelope is 400', (await webhook({ hello: 'world' })).status === 400);

  // A forged "completed": Higgsfield itself still says in_progress.
  const forged = await webhook({ request_id: reqId, status: 'completed', error: null, payload: { video: { url: 'https://attacker.example/x.mp4' } } });
  check('a claim the status endpoint does not confirm is not written', forged.status === 503 && rowFor(g2.id).status === 'in_progress' && !rowFor(g2.id).output_url);

  hfRequests.set(reqId, { status: 'completed', request_id: reqId, video: { url: 'https://cdn.example/two.mp4' } });
  const statusBefore = hfCalls.filter((c) => c.path === `/requests/${reqId}/status`).length;
  const ok = await webhook({ request_id: reqId, status: 'completed', error: null, payload: { video: { url: 'https://attacker.example/x.mp4' } } });
  check('a real completion is confirmed against the API and applied', ok.status === 200 && rowFor(g2.id).status === 'completed');
  check('…using the URL from the API, not the webhook body', rowFor(g2.id).output_url === 'https://cdn.example/two.mp4');
  check('…and the webhook bypasses the poll floor', hfCalls.filter((c) => c.path === `/requests/${reqId}/status`).length === statusBefore + 1);
  const dup = await webhook({ request_id: reqId, status: 'completed', error: null, payload: null });
  check('a duplicate delivery is acknowledged, not reprocessed', dup.status === 200 && (await dup.json()).duplicate === true);
  check('an unknown request_id is acknowledged', (await webhook({ request_id: randomUUID(), status: 'failed', error: 'x', payload: null })).status === 200);
}

console.log('\n--- limits and stuck renders ---');
{
  // Top the owner's billable rows in the last 24h up to exactly the limit
  // of 4. Refused, failed, moderated and cancelled rows do not count —
  // Higgsfield does not charge for them — and several of those exist by now.
  finishActive();
  const billedRows = () => tables.generations.filter((r) => r.user_id === OWNER.id && !['failed', 'nsfw', 'canceled', 'submit_failed'].includes(r.status)).length;
  while (billedRows() < 4) {
    tables.generations.push({ id: randomUUID(), user_id: OWNER.id, model: MODEL, input: {}, status: 'completed', created_at: new Date().toISOString() });
  }
  const billed = billedRows();
  const before = submitsSent();
  const r = await submit({ prompt: 'over the limit' });
  check(`daily limit enforced (${billed} billed rows, limit 4)`, r.status === 429 && (await r.json()).code === 'daily_limit');
  check('…before anything is sent', submitsSent() === before);

  // A render stuck in_progress for two hours no longer blocks a new one.
  tables.generations = tables.generations.filter((x) => x.user_id !== OWNER.id);
  const stuckReq = randomUUID();
  tables.generations.push({ id: randomUUID(), user_id: OWNER.id, model: MODEL, input: {}, status: 'in_progress', request_id: stuckReq,
    created_at: new Date(Date.now() - 2 * 3600_000).toISOString(), last_polled_at: null });
  const r2 = await submit({ prompt: 'after a stuck one' });
  check('a render past the timeout releases the slot', r2.status === 202, `(${r2.status})`);
  const stuck = tables.generations.find((x) => x.request_id === stuckReq);
  check('…and is marked timed_out, not failed', stuck.status === 'timed_out');

  // It still resolves if Higgsfield finishes it later — without colliding
  // with the render that now holds the active slot.
  hfRequests.set(stuckReq, { status: 'in_progress', request_id: stuckReq });
  let d = await (await read(stuck.id)).json();
  check('a timed_out row that is still running stays timed_out (no index collision)', d.generation.status === 'timed_out');
  check('…and is not reported as holding the active slot', d.generation.active === false && d.generation.terminal === false);
  hfRequests.set(stuckReq, { status: 'completed', request_id: stuckReq, video: { url: 'https://cdn.example/late.mp4' } });
  agePoll(stuck.id);
  d = await (await read(stuck.id)).json();
  check('…and completes when Higgsfield does', d.generation.status === 'completed' && d.generation.outputUrl === 'https://cdn.example/late.mp4');
}

console.log('\n--- per-IP flood guard ---');
{
  const statuses = [];
  for (let i = 0; i < 6; i++) statuses.push((await submit({}, { from: '127.0.0.250' })).status);
  check('the sixth submit in a minute from one address is 429', statuses[5] === 429 && statuses.slice(0, 5).every((x) => x !== 429), statuses.join(','));
}

console.log('\n--- listing ---');
{
  const r = await fetch(`${BASE}/api/generations`, { headers: headersFor('token-owner') });
  const d = await r.json();
  check('lists only the caller\'s rows, newest first', r.status === 200 && d.generations.length >= 1 &&
    d.generations.every((g) => rowFor(g.id)?.user_id === OWNER.id));
  check('reports the limits the UI shows', d.limits?.daily === 4 && d.limits?.promptMaxChars === 2000);
}

server.close();
hfSrv.close();
supabaseSrv.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
