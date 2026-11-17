/**
 * Server-only Firebase Admin bootstrap.
 * Never import this from client code (App.tsx, services/db.ts, components).
 *
 * Credential, first match wins:
 *   FIREBASE_SERVICE_ACCOUNT_JSON   full JSON string (Vercel env)
 *   GOOGLE_APPLICATION_CREDENTIALS  path to the key file (local)
 */

import { readFileSync } from 'node:fs';

export interface ServiceAccountShape {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

export function loadServiceAccountFromEnv(): ServiceAccountShape | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (raw && raw.trim()) {
    const parsed = JSON.parse(raw) as ServiceAccountShape;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email or private_key');
    }
    return parsed;
  }
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path && path.trim()) {
    const parsed = JSON.parse(readFileSync(path, 'utf8')) as ServiceAccountShape;
    if (!parsed.client_email || !parsed.private_key) {
      throw new Error('Service account file is missing client_email or private_key');
    }
    return parsed;
  }
  return null;
}

export function assertMigrationApplyAllowed(command: string): void {
  if (process.env[command] !== 'yes') {
    throw new Error(`Refusing to write. Set ${command}=yes to apply. Dry-run is the default.`);
  }
}
