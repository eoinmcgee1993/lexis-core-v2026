// backend/api/index.js — Vercel serverless entrypoint.
// Community endpoints are handled explicitly before the main Express app so
// their public API contract can evolve independently without disturbing the
// existing commerce routes.
import app from '../app.mjs';
import { handleCommunityRequest } from '../community-routes.mjs';

export default async function handler(req, res) {
  const handled = await handleCommunityRequest(req, res);
  if (handled) return;
  return app(req, res);
}
