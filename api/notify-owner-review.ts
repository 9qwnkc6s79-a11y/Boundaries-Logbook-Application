/**
 * Vercel function: email Daniel when staff submit a manager (UP) review.
 * Self-contained — do not import ./_lib (Vercel ESM cannot resolve those).
 *
 * Sends only when RESEND_API_KEY and OWNER_NOTIFY_EMAIL are set.
 * Never invents a recipient. Review save must not depend on this succeeding.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asOverall(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const rounded = Math.round(n);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_NOTIFY_EMAIL;
  if (!apiKey || !to) {
    return json(res, 200, { ok: true, emailed: false });
  }

  const body = (req.body && typeof req.body === 'object') ? req.body as Record<string, unknown> : {};
  const storeName = asString(body.storeName);
  const managerName = asString(body.managerName);
  const reviewerName = asString(body.reviewerName);
  const period = asString(body.period);
  const overall = asOverall(body.overall);
  const keepDoing = asString(body.keepDoing);
  const startDoing = asString(body.startDoing);
  const notes = asString(body.notes);

  if (!storeName || !managerName || !reviewerName || !period || overall === null) {
    return json(res, 200, { ok: true, emailed: false });
  }

  const from = process.env.OWNER_NOTIFY_FROM || process.env.RESEND_FROM_EMAIL || 'Boundaries Logbook <onboarding@resend.dev>';
  const lines = [
    `${reviewerName} submitted a review of ${managerName}.`,
    `Store: ${storeName}`,
    `Period: ${period}`,
    `Overall: ${overall}/5`,
  ];
  if (keepDoing) lines.push(`Keep doing: ${keepDoing}`);
  if (startDoing) lines.push(`Start doing: ${startDoing}`);
  if (notes) lines.push(`Notes: ${notes}`);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: `Staff review of ${managerName} · ${storeName} · ${period}`,
        text: lines.join('\n'),
      }),
    });
    if (!response.ok) {
      return json(res, 200, { ok: true, emailed: false });
    }
    return json(res, 200, { ok: true, emailed: true });
  } catch {
    return json(res, 200, { ok: true, emailed: false });
  }
}
