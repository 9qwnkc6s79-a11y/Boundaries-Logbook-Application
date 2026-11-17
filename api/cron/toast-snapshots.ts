/**
 * Kept so /api/cron/toast-snapshots does not crash.
 * Vercel does not ship local imports for a function, so this file imports
 * nothing from the repo. The scheduled job is /api/manager-budget, which
 * saves snapshots only when Authorization is Bearer CRON_SECRET.
 * Without that secret this route returns 401 and writes nothing.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export function cronAuthorized(header: string | undefined, secret: string | undefined): boolean {
  if (!secret) return false;
  const token = (header || '').replace(/^Bearer\s+/i, '');
  const a = createHash('sha256').update(token).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const header = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  if (!cronAuthorized(header, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return res.status(200).json({
    ok: true,
    note: 'Snapshots run on GET /api/manager-budget with the same Bearer CRON_SECRET. This path does not call Toast.',
  });
}
