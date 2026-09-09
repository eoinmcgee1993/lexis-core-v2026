// LEXIS — /api/stripe/checkout and /api/stripe/checkout-result
//
// Unlike fair-use.test.mjs next door, this one runs the real handlers. It
// can, because Stripe and Supabase are both replaced by local HTTP servers
// before app.mjs is imported: the app boots on placeholder env exactly as
// the README describes, and every outbound call lands somewhere this file
// controls. Nothing inside app.mjs is stubbed, so what is asserted here is
// the shipped branching and the shipped params object.
//
// What it is actually guarding (4-9 Sep 2026): the LEXIS Community add-on
// was invisible at checkout. Reported as "there is no community add-on at
// check out" after a real purchase. It now appears either as a pre-agreed
// line item or as one of Stripe's `optional_items`, and those two paths must
// stay mutually exclusive — showing both would read as being charged twice,
// and Stripe rejects `optional_items` outright next to a custom amount.
//
// It also pins the thing that would be worst to get wrong: the retry that
// exists so a branding failure cannot take checkout down runs on the SDK's
// own pinned API version, which is older than `optional_items`. Carrying the
// parameter into that retry would make the safety net throw precisely when
// it is needed.
//
// Run: node test/checkout.test.mjs   (plain script, same as the other suite)

import http from 'node:http';
import { register } from 'node:module';
import { fileURLToPath } from 'node:url';

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`PASS  ${name}${detail ? '  ' + detail : ''}`); }
  else { failed++; console.log(`FAIL  ${name}${detail ? '  ' + detail : ''}`); }
}

// The two live price IDs app.mjs defaults to. Asserted by value on purpose:
// the whole point of the add-on change is that it stopped being an inline
// custom amount and became a real Price, and a test that read the constant
// back out of app.mjs could not tell the difference.
const PASS_PRICE = 'price_1UBKYIF1FdEsYK5EmoapMorw';       // Weekly Pass, THB 199
const SPONSOR_PRICE = 'price_1UDiMWF1FdEsYK5EmAraMzIJ';    // Community add-on, THB 50
const USER = {
  id: 'test-user-0000-1111', email: 'learner@example.test',
  aud: 'authenticated', role: 'authenticated', app_metadata: {}, user_metadata: {}
};

// ---------------------------------------------------------------- fake Stripe
const stripeCalls = [];
let rejectBranding = false;

const stripeSrv = http.createServer((req, res) => {
  let body = '';
  req.on('data', (d) => { body += d; });
  req.on('end', () => {
    stripeCalls.push({ method: req.method, url: req.url, body, version: req.headers['stripe-version'] });
    const send = (code, obj) => {
      res.writeHead(code, { 'content-type': 'application/json', 'request-id': 'req_test' });
      res.end(JSON.stringify(obj));
    };

    if (req.method === 'POST' && req.url === '/v1/checkout/sessions') {
      // Stands in for "this API version does not accept that parameter",
      // which is how the branding bug presented in production.
      if (rejectBranding && new URLSearchParams(body).has('branding_settings[display_name]')) {
        return send(400, { error: { type: 'invalid_request_error', message: 'Received unknown parameter: branding_settings' } });
      }
      return send(200, { id: 'cs_test_created', object: 'checkout.session', url: 'https://checkout.stripe.com/c/pay/test' });
    }

    if (req.method === 'GET' && req.url.startsWith('/v1/checkout/sessions/')) {
      const withSponsor = req.url.includes('cs_with_sponsor');
      const otherOwner = req.url.includes('cs_someone_else');
      return send(200, {
        id: 'cs_test_created', object: 'checkout.session', payment_status: 'paid',
        metadata: { user_id: otherOwner ? 'a-completely-different-user' : USER.id, plan_tier: 'weekly' },
        line_items: {
          object: 'list',
          data: [
            { id: 'li_pass', amount_total: 19900, price: { id: PASS_PRICE } },
            ...(withSponsor ? [{ id: 'li_sponsor', amount_total: 5000, price: { id: SPONSOR_PRICE } }] : [])
          ]
        }
      });
    }
    send(404, { error: { message: `unmapped: ${req.method} ${req.url}` } });
  });
});

// -------------------------------------------------------------- fake Supabase
// Only enough of it for `authenticate` to pass: the user behind the bearer
// token, and that user's profile row. Anything else the app writes (error
// logs, analytics) is accepted and dropped.
const supabaseSrv = http.createServer((req, res) => {
  res.writeHead(200, { 'content-type': 'application/json' });
  if (req.url.startsWith('/auth/v1/user')) return res.end(JSON.stringify(USER));
  if (req.url.startsWith('/rest/v1/profiles')) {
    return res.end(JSON.stringify({
      id: USER.id, email: USER.email, subscription_tier: 'free', subscription_status: 'inactive',
      seconds_used: 0, max_allowed_seconds: 900, access_expires_at: null
    }));
  }
  res.end('{}');
});

await new Promise((r) => stripeSrv.listen(0, '127.0.0.1', r));
await new Promise((r) => supabaseSrv.listen(0, '127.0.0.1', r));

process.env.LEXIS_TEST_STRIPE_PORT = String(stripeSrv.address().port);
process.env.OPENAI_API_KEY = 'sk-placeholder';
process.env.SUPABASE_URL = `http://127.0.0.1:${supabaseSrv.address().port}`;
process.env.SUPABASE_SERVICE_ROLE_KEY = 'placeholder-service-role-key';
process.env.SUPABASE_ANON_KEY = 'placeholder-anon-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_placeholder';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_placeholder';

// register() applies to imports made after it, which is why app.mjs is
// pulled in dynamically below rather than at the top of the file. That also
// keeps this a plain `node test/…` script with no flags, matching the other
// suite.
register(fileURLToPath(new URL('./stripe-local-loader.mjs', import.meta.url)), import.meta.url);
const app = (await import('../app.mjs')).default;

const server = await new Promise((r) => { const s = app.listen(0, '127.0.0.1', () => r(s)); });
const BASE = `http://127.0.0.1:${server.address().port}`;
const AUTH = { 'Authorization': 'Bearer test-token', 'Content-Type': 'application/json' };

const startCheckout = async (payload) => {
  stripeCalls.length = 0;
  const res = await fetch(`${BASE}/api/stripe/checkout`, { method: 'POST', headers: AUTH, body: JSON.stringify(payload) });
  return { res, sent: new URLSearchParams(stripeCalls.at(-1).body), call: stripeCalls.at(-1) };
};

console.log('--- add-on NOT ticked on the pricing page ---');
{
  const { res, sent, call } = await startCheckout({ planTier: 'weekly', sponsorAdd: false, lang: 'th' });
  check('checkout succeeds', res.status === 200 && Boolean((await res.json()).url));
  check('add-on is offered on the Stripe page', sent.get('optional_items[0][price]') === SPONSOR_PRICE);
  check('add-on is not silently charged', sent.get('line_items[1][price]') === null);
  check('the pass is the only line item', sent.get('line_items[0][price]') === PASS_PRICE);
  // optional_items landed in 2025-03-31.basil; the SDK pins 2024-06-20.
  check('sent on an API version that has optional_items', call.version === '2025-09-30.clover', `(${call.version})`);
  check('success_url carries the session id', sent.get('success_url').endsWith('/app?payment=success&session_id={CHECKOUT_SESSION_ID}'));
  check('success_url no longer pre-declares sponsorship', !sent.get('success_url').includes('sponsor=1'));
}

console.log('\n--- add-on ticked on the pricing page ---');
{
  const { res, sent } = await startCheckout({ planTier: 'monthly', sponsorAdd: true, lang: 'en' });
  check('checkout succeeds', res.status === 200);
  check('add-on is a line item at the persistent price', sent.get('line_items[1][price]') === SPONSOR_PRICE);
  check('no inline custom amount', ![...sent.keys()].some((k) => k.includes('price_data')));
  check('add-on is not ALSO offered again on Stripe', sent.get('optional_items[0][price]') === null);
}

console.log('\n--- Stripe rejects the branding block ---');
{
  rejectBranding = true;
  const { res, sent, call } = await startCheckout({ planTier: 'weekly', sponsorAdd: false, lang: 'en' });
  check('the sale still goes through', res.status === 200, `(${stripeCalls.length} Stripe calls)`);
  check('the retry still sells the pass', sent.get('line_items[0][price]') === PASS_PRICE);
  check('the retry drops branding', sent.get('branding_settings[display_name]') === null);
  check('the retry drops optional_items with it', sent.get('optional_items[0][price]') === null);
  check('the retry runs on the SDK default version', call.version === '2024-06-20', `(${call.version})`);
  check('the charge records which branding was shown', sent.get('metadata[checkout_branding]') === 'account-fallback');
  rejectBranding = false;
}

console.log('\n--- reading back what was actually bought ---');
{
  let r = await fetch(`${BASE}/api/stripe/checkout-result?session_id=cs_with_sponsor`, { headers: AUTH });
  let d = await r.json();
  check('a session containing the add-on reports sponsored', r.status === 200 && d.sponsored === true && d.paid === true, JSON.stringify(d));

  r = await fetch(`${BASE}/api/stripe/checkout-result?session_id=cs_plain`, { headers: AUTH });
  d = await r.json();
  check('a session without it does not', r.status === 200 && d.sponsored === false);

  r = await fetch(`${BASE}/api/stripe/checkout-result?session_id=cs_someone_else`, { headers: AUTH });
  check("another user's session is not readable", r.status === 404);

  r = await fetch(`${BASE}/api/stripe/checkout-result?session_id=../../v1/charges`, { headers: AUTH });
  check('a non-session id is refused before reaching Stripe', r.status === 400);

  r = await fetch(`${BASE}/api/stripe/checkout-result?session_id=cs_plain`);
  check('an unauthenticated read is refused', r.status === 401);
}

server.close();
stripeSrv.close();
supabaseSrv.close();

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
