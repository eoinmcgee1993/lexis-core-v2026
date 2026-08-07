// backend/server.mjs — long-running entrypoint for Railway / local dev.
// Vercel deploys backend/api/index.js instead, which imports the same
// app.mjs without calling .listen() — see that file for why.
import app, { allowedOrigins } from './app.mjs';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  LEXIS Commerce Server Active on Port ${PORT}`);
  console.log(`  Allowed Origins: ${allowedOrigins.join(', ')}`);
  console.log(`  Stripe Checkout redirects: resolved per-request from Origin (fallback: ${allowedOrigins.find(o => o.startsWith('https://')) || allowedOrigins[0]})`);
  console.log(`=======================================================`);
});
