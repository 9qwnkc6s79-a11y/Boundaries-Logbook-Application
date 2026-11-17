/**
 * Nightly JSON export of the Boundaries org to Cloud Storage.
 * GET /api/cron/firestore-backup
 * Authorization: Bearer CRON_SECRET
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_BACKUP_BUCKET.
 * Deletes this job's objects older than 30 days. Does nothing when the
 * bucket or the service account is missing.
 */

import { createHash, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { loadServiceAccountFromEnv } from '../../utils/firebaseAdminApp';
import {
  BACKUP_COLLECTIONS,
  BACKUP_PREFIX,
  backupObjectExpired,
  buildManifest,
  collectionObjectName,
  manifestObjectName,
  utcDay,
} from '../../utils/firestoreBackup';

export const config = { maxDuration: 300 };

function authorized(header: string | undefined, secret: string | undefined): boolean {
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
  if (!authorized(header, process.env.CRON_SECRET)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const bucketName = process.env.FIREBASE_BACKUP_BUCKET;
  const account = loadServiceAccountFromEnv();
  if (!bucketName || !account) {
    return res.status(503).json({
      error: 'Set FIREBASE_BACKUP_BUCKET and FIREBASE_SERVICE_ACCOUNT_JSON before the backup cron can write.',
    });
  }

  const orgId = process.env.AUTH_ORG_ID || 'org-boundaries';
  const day = utcDay();
  try {
    const admin = await import('firebase-admin');
    const existing = admin.apps.find(app => app?.name === 'firestore-backup');
    const app = existing || admin.initializeApp({
      credential: admin.credential.cert(account as any),
      projectId: account.project_id || 'boundaries-logbook-app',
      storageBucket: bucketName,
    }, 'firestore-backup');
    const db = admin.firestore(app);
    const bucket = admin.storage(app).bucket(bucketName);
    const counts: Record<string, number> = {};

    for (const name of BACKUP_COLLECTIONS) {
      const snap = await db.collection(`organizations/${orgId}/${name}`).get();
      const docs: Record<string, unknown> = {};
      snap.forEach(doc => { docs[doc.id] = doc.data(); });
      counts[name] = snap.size;
      await bucket.file(collectionObjectName(day, name)).save(JSON.stringify({ docs }), {
        contentType: 'application/json',
        resumable: false,
      });
    }

    const manifest = buildManifest({
      takenAt: new Date().toISOString(),
      orgId,
      bucket: bucketName,
      counts,
    });
    await bucket.file(manifestObjectName(day)).save(JSON.stringify(manifest, null, 2), {
      contentType: 'application/json',
      resumable: false,
    });

    const [files] = await bucket.getFiles({ prefix: `${BACKUP_PREFIX}/` });
    let deleted = 0;
    for (const file of files) {
      if (backupObjectExpired(file.name, new Date())) {
        await file.delete();
        deleted++;
      }
    }

    await db.doc(`organizations/${orgId}/data/backupStatus`).set({
      data: {
        at: manifest.takenAt,
        day,
        bucket: bucketName,
        counts,
        deleted,
        ok: true,
      },
    });

    return res.status(200).json({ ok: true, day, counts, deleted });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'backup failed';
    console.error('[firestore-backup]', message);
    return res.status(500).json({ error: message });
  }
}
