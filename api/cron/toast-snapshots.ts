/**
 * Daily Toast snapshot. Vercel cron calls GET /api/cron/toast-snapshots.
 * Authorization: Bearer CRON_SECRET.
 *
 * Saves yesterday and today (America/Chicago) per store. A 429 is retried
 * by the manager-budget Toast client. A failed pull does not replace a
 * previously good snapshot and is never stored as $0.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  chicagoToday,
  fetchToastLaborCost,
  getDaySummary,
  toIsoDate,
} from '../manager-budget';

// Self-contained on purpose. A Vercel function that imports ../../utils
// crashes at boot with ERR_MODULE_NOT_FOUND (seen on the first production hit).

export const config = { maxDuration: 60 };

const LITTLE_ELM_GUID = process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7';
const PROSPER_GUID = process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b';

export function cronAuthorized(header: string | undefined, secret: string | undefined): boolean {
  if (!secret) return false;
  const token = (header || '').replace(/^Bearer\s+/i, '');
  const a = createHash('sha256').update(token).digest();
  const b = createHash('sha256').update(secret).digest();
  return timingSafeEqual(a, b);
}

type StoreDaySnapshot = {
  storeId: 'store-elm' | 'store-prosper';
  businessDate: string;
  capturedAt: string;
  salesGross: number | null;
  orders: number | null;
  laborDollars: number | null;
  laborHours: number | null;
  salesStatus: 'ok' | 'unavailable';
  laborStatus: 'ok' | 'unavailable' | 'incomplete';
  error?: string;
};

function yesterday(today: string): string {
  const [year, month, day] = today.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day - 1)).toISOString().slice(0, 10);
}

function mergeSnapshot(previous: StoreDaySnapshot | null, incoming: StoreDaySnapshot): StoreDaySnapshot {
  if (!previous) return incoming;
  const salesOk = incoming.salesStatus === 'ok' && incoming.salesGross != null;
  const laborOk = incoming.laborStatus === 'ok' && incoming.laborDollars != null;
  return {
    ...previous,
    ...incoming,
    salesGross: salesOk ? incoming.salesGross : previous.salesGross,
    orders: salesOk ? incoming.orders : previous.orders,
    salesStatus: salesOk ? 'ok' : previous.salesStatus,
    laborDollars: laborOk ? incoming.laborDollars : previous.laborDollars,
    laborHours: laborOk ? incoming.laborHours : previous.laborHours,
    laborStatus: laborOk ? 'ok' : (previous.laborStatus === 'ok' ? 'ok' : incoming.laborStatus),
    capturedAt: incoming.capturedAt,
    error: incoming.error || previous.error,
  };
}

async function writeSnapshot(snapshot: StoreDaySnapshot): Promise<void> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!raw && !path) throw new Error('Firebase Admin is not configured. Snapshot was not written.');
  const account = raw ? JSON.parse(raw) : JSON.parse(readFileSync(path as string, 'utf8'));
  const admin = await import('firebase-admin');
  const existing = admin.apps.find(app => app?.name === 'toast-snapshots');
  const app = existing || admin.initializeApp({
    credential: admin.credential.cert(account),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'toast-snapshots');
  const db = admin.firestore(app);
  const orgId = process.env.AUTH_ORG_ID || 'org-boundaries';
  const ref = db.doc(`organizations/${orgId}/toastSnapshots/${snapshot.storeId}_${snapshot.businessDate}`);
  const prev = await ref.get();
  await ref.set(mergeSnapshot(prev.exists ? prev.data() as StoreDaySnapshot : null, snapshot));
}

async function token(): Promise<string> {
  const clientId = process.env.VITE_TOAST_CLIENT_ID || process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY || process.env.TOAST_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('Toast credentials not configured');
  const response = await fetch('https://ws-api.toasttab.com/authentication/v1/authentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' }),
  });
  if (!response.ok) throw new Error(`Toast auth failed (${response.status})`);
  const data = await response.json();
  const access = data.token?.accessToken || data.accessToken;
  if (!access) throw new Error('Invalid Toast auth response');
  return access;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const header = Array.isArray(req.headers.authorization) ? req.headers.authorization[0] : req.headers.authorization;
  if (!cronAuthorized(header, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const today = toIsoDate(chicagoToday());
  const dates = [yesterday(today), today];
  try {
    const accessToken = await token();
    const saved: string[] = [];
    for (const businessDate of dates) {
      const toastDate = businessDate.replace(/-/g, '');
      const labor = await fetchToastLaborCost({
        accessToken,
        startBusinessDate: toastDate,
        endBusinessDate: toastDate,
        littleElmGuid: LITTLE_ELM_GUID,
        prosperGuid: PROSPER_GUID,
      }).catch((error: Error) => ({ error: error.message }));

      for (const store of [
        { storeId: 'store-elm' as const, guid: LITTLE_ELM_GUID, labor: 'error' in labor ? null : labor.littleElm },
        { storeId: 'store-prosper' as const, guid: PROSPER_GUID, labor: 'error' in labor ? null : labor.prosper },
      ]) {
        let salesGross: number | null = null;
        let orders: number | null = null;
        let salesStatus: StoreDaySnapshot['salesStatus'] = 'unavailable';
        let errorText = 'error' in labor ? labor.error : undefined;
        try {
          const day = await getDaySummary(accessToken, store.guid, toastDate);
          salesGross = day.grossSales;
          orders = day.orders;
          salesStatus = 'ok';
        } catch (error) {
          errorText = error instanceof Error ? error.message : 'sales failed';
        }
        const laborOk = !!store.labor && store.labor.status === 'ok' && store.labor.mtdLaborDollars != null;
        const snapshot: StoreDaySnapshot = {
          storeId: store.storeId,
          businessDate,
          capturedAt: new Date().toISOString(),
          salesGross,
          orders,
          laborDollars: laborOk ? store.labor!.mtdLaborDollars : null,
          laborHours: null,
          salesStatus,
          laborStatus: laborOk ? 'ok' : (store.labor?.status === 'incomplete' ? 'incomplete' : 'unavailable'),
          error: errorText,
        };
        await writeSnapshot(snapshot);
        saved.push(`${snapshot.storeId}_${businessDate}`);
      }
    }
    return res.status(200).json({ ok: true, saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'snapshot failed';
    console.error('[toast-snapshots]', message);
    const status = message.includes('Admin is not configured') ? 503 : 500;
    return res.status(status).json({ error: message });
  }
}
