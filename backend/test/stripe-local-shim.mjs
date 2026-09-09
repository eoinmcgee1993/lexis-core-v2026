// Stands in for the `stripe` package while checkout.test.mjs runs.
//
// app.mjs constructs its client as `new Stripe(key)` with no options — which
// is correct for production and leaves no seam for a test to point it
// somewhere else. Rather than reach into app.mjs to add one (a seam that
// exists only for tests is a liability in payment code), the test resolves
// the 'stripe' specifier to this file, which passes the real SDK a local
// host. Everything else about the SDK — parameter serialisation, the API
// version header, error shapes, retries — is the real thing.
import RealStripe from 'stripe';

export default function Stripe(key, opts = {}) {
  return new RealStripe(key, {
    ...opts,
    host: '127.0.0.1',
    port: Number(process.env.LEXIS_TEST_STRIPE_PORT),
    protocol: 'http'
  });
}
