// Module-resolution hook installed by checkout.test.mjs. Only 'stripe' is
// touched, and only inside that test process.
import { fileURLToPath } from 'node:url';

const SHIM = fileURLToPath(new URL('./stripe-local-shim.mjs', import.meta.url));

export async function resolve(specifier, context, next) {
  // The shim imports the real 'stripe' itself, so let its own request
  // through rather than resolving it back to the shim forever.
  if (specifier === 'stripe' && !(context.parentURL || '').endsWith('stripe-local-shim.mjs')) {
    return next(SHIM, context);
  }
  return next(specifier, context);
}
