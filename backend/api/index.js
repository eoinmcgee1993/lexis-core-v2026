// backend/api/index.js — Vercel serverless entrypoint. An Express app
// instance is itself a valid (req, res) => {} handler, so exporting it
// directly (no .listen()) is all Vercel's Node runtime needs — see
// vercel.json for the rewrite that routes every path here.
import app from '../app.mjs';

export default app;
