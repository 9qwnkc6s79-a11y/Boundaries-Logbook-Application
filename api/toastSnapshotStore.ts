/**
 * Read/write organizations/{org}/toastSnapshots/{storeId}_{date}.
 * Writes use the Admin SDK (rules deny client writes). Reads use Admin when
 * a service account is configured, otherwise the public Firestore REST API,
 * which only works while enforceAuth is still off.
 */

import { loadServiceAccountFromEnv } from '../utils/firebaseAdminApp';
import { snapshotDocId, type StoreDaySnapshot } from '../utils/toastSnapshot';

const PROJECT = 'boundaries-logbook-app';
const API_KEY = 'AIzaSyDbOuTQGRW2LtQUpRFHmcXj782Zp4tEKvQ';
const ORG = process.env.AUTH_ORG_ID || 'org-boundaries';

function decodeValue(value: any): any {
  if (!value || typeof value !== 'object') return null;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('timestampValue' in value) return value.timestampValue;
  if ('mapValue' in value) {
    const fields = value.mapValue?.fields || {};
    return Object.fromEntries(Object.entries(fields).map(([key, child]) => [key, decodeValue(child)]));
  }
  return null;
}

async function adminDb() {
  const account = loadServiceAccountFromEnv();
  if (!account) return null;
  const admin = await import('firebase-admin');
  const existing = admin.apps.find(app => app?.name === 'toast-snapshots');
  const app = existing || admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || PROJECT,
  }, 'toast-snapshots');
  return admin.firestore(app);
}

export async function writeSnapshot(snapshot: StoreDaySnapshot): Promise<void> {
  const db = await adminDb();
  if (!db) throw new Error('Firebase Admin is not configured. Snapshot was not written.');
  const id = snapshotDocId(snapshot.storeId, snapshot.businessDate);
  const ref = db.doc(`organizations/${ORG}/toastSnapshots/${id}`);
  const prev = await ref.get();
  const { mergeSnapshot } = await import('../utils/toastSnapshot');
  const next = mergeSnapshot(prev.exists ? prev.data() as StoreDaySnapshot : null, snapshot);
  await ref.set(next);
}

export async function readSnapshots(dates: string[]): Promise<StoreDaySnapshot[]> {
  const db = await adminDb();
  const ids = ['store-elm', 'store-prosper'].flatMap(storeId => dates.map(date => snapshotDocId(storeId, date)));
  if (db) {
    const snaps = await Promise.all(ids.map(id => db.doc(`organizations/${ORG}/toastSnapshots/${id}`).get()));
    return snaps.filter(snap => snap.exists).map(snap => snap.data() as StoreDaySnapshot);
  }
  const rows = await Promise.all(ids.map(async (id) => {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/organizations/${ORG}/toastSnapshots/${id}?key=${API_KEY}`;
    const response = await fetch(url);
    if (response.status === 404) return null;
    if (!response.ok) return null;
    const json = await response.json();
    return decodeValue({ mapValue: { fields: json.fields } }) as StoreDaySnapshot | null;
  }));
  return rows.filter((row): row is StoreDaySnapshot => !!row && !!row.storeId && !!row.businessDate);
}
