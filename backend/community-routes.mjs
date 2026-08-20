import { createClient } from '@supabase/supabase-js';

const COMMUNITY_CONTRIBUTION_THB = 50;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((value) => value.trim())
  : [];

const supabase = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;

const jsonHeaders = (origin) => ({
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  ...(origin && ALLOWED_ORIGINS.includes(origin) ? {
    'Access-Control-Allow-Origin': origin,
    'Vary': 'Origin'
  } : {})
});

function sendJson(res, status, payload, origin) {
  res.statusCode = status;
  Object.entries(jsonHeaders(origin)).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(payload));
}

function validatePartnerApplication(body) {
  const organizationName = String(body?.organizationName || '').trim();
  const organizationType = String(body?.organizationType || '').trim();
  const locationRegion = String(body?.locationRegion || '').trim();
  const contactEmail = String(body?.contactEmail || '').trim().toLowerCase();
  const overview = String(body?.overview || '').trim();

  if (organizationName.length < 2 || organizationName.length > 160) return { error: 'Organization name must be between 2 and 160 characters.' };
  if (!['school', 'nonprofit', 'youth_center'].includes(organizationType)) return { error: 'Organization type is invalid.' };
  if (locationRegion.length < 2 || locationRegion.length > 160) return { error: 'Location / region must be between 2 and 160 characters.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) || contactEmail.length > 254) return { error: 'Please provide a valid contact email.' };
  if (overview.length < 20 || overview.length > 4000) return { error: 'Please provide a brief overview between 20 and 4,000 characters.' };

  return { value: { organizationName, organizationType, locationRegion, contactEmail, overview } };
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let raw = '';
  for await (const chunk of req) raw += chunk;
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { throw new Error('Invalid JSON body.'); }
}

export async function handleCommunityRequest(req, res) {
  const origin = req.headers.origin;
  const path = new URL(req.url || '/', 'http://localhost').pathname;

  if (!path.startsWith('/api/v1/community')) return false;

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    Object.entries({
      ...jsonHeaders(origin),
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept'
    }).forEach(([key, value]) => res.setHeader(key, value));
    res.end();
    return true;
  }

  if (!supabase) {
    sendJson(res, 503, { error: 'Community service is not configured.' }, origin);
    return true;
  }

  if (req.method === 'GET' && path === '/api/v1/community/telemetry') {
    try {
      const [partners, contributions, deployments, practice] = await Promise.all([
        supabase.from('community_partners').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('community_contributions').select('amount_thb, status'),
        supabase.from('community_deployments').select('students_supported, funds_deployed_thb, practice_hours'),
        supabase.from('community_deployments').select('practice_hours')
      ]);

      for (const result of [partners, contributions, deployments, practice]) {
        if (result.error) throw result.error;
      }

      const deploymentRows = deployments.data || [];
      const contributionRows = contributions.data || [];
      const deployedStudents = deploymentRows.reduce((sum, row) => sum + Number(row.students_supported || 0), 0);
      const deployedHours = deploymentRows.reduce((sum, row) => sum + Number(row.practice_hours || 0), 0);
      const deployedFunds = deploymentRows.reduce((sum, row) => sum + Number(row.funds_deployed_thb || 0), 0);
      const recordedContributions = contributionRows
        .filter((row) => row.status === 'confirmed')
        .reduce((sum, row) => sum + Number(row.amount_thb || 0), 0);

      sendJson(res, 200, {
        studentsSupported: deployedStudents,
        practiceHours: deployedHours,
        communityPartners: partners.count || 0,
        fundsDeployedThb: deployedFunds,
        communityFundsRecordedThb: recordedContributions,
        contributionUnitThb: COMMUNITY_CONTRIBUTION_THB,
        source: 'supabase'
      }, origin);
      return true;
    } catch (error) {
      console.error('[LEXIS Community Telemetry]', error);
      sendJson(res, 500, { error: 'Unable to load verified community telemetry.' }, origin);
      return true;
    }
  }

  if (req.method === 'POST' && path === '/api/v1/community/partner-apply') {
    try {
      const body = await readBody(req);
      const validation = validatePartnerApplication(body);
      if (validation.error) {
        sendJson(res, 400, { error: validation.error }, origin);
        return true;
      }

      const { data, error } = await supabase
        .from('community_partner_applications')
        .insert(validation.value)
        .select('id, created_at')
        .single();

      if (error) throw error;

      sendJson(res, 201, { ok: true, applicationId: data.id, receivedAt: data.created_at }, origin);
      return true;
    } catch (error) {
      console.error('[LEXIS Community Partner Application]', error);
      sendJson(res, 500, { error: 'Unable to submit the partner application right now.' }, origin);
      return true;
    }
  }

  sendJson(res, 404, { error: 'Community endpoint not found.' }, origin);
  return true;
}
