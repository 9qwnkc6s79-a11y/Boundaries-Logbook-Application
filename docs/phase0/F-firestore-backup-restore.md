# Phase 0F — nightly Firestore backup and restore

`GET /api/cron/firestore-backup` copies these collections to Cloud Storage as JSON:

- `organizations/org-boundaries/data`
- `organizations/org-boundaries/users`
- `organizations/org-boundaries/logbookSubmissions`
- `organizations/org-boundaries/toastSnapshots`
- `organizations/org-boundaries/config`

Objects:

```
gs://$FIREBASE_BACKUP_BUCKET/firestore-backups/YYYY-MM-DD/<collection>.json
gs://$FIREBASE_BACKUP_BUCKET/firestore-backups/YYYY-MM-DD/manifest.json
```

Each collection file is `{ "docs": { "<id>": <fields> } }`. The cron then deletes objects in `firestore-backups/` whose date folder is older than 30 days. Other objects in the bucket are left alone. A short status is written to `organizations/org-boundaries/data/backupStatus` only after the upload succeeds.

This agent did not run the cron and did not read production.

## What you have to click or grant

1. Google Cloud console → Cloud Storage → Buckets → Create bucket. Name example: `boundaries-logbook-backups`. Region: `us-central1` (same as the Firebase project). Do not make it public.
2. Firebase console → Project settings → Service accounts → Generate new private key, if you do not already have one from Phase 0A. The same JSON is `FIREBASE_SERVICE_ACCOUNT_JSON` on Vercel.
3. Cloud Storage → the bucket → Permissions → Grant access. Principal: the service account email inside that JSON (`client_email`). Role: **Storage Object Admin** on this bucket only.
4. Vercel → Project **boundaries-logbook-application** → Settings → Environment Variables:
   - `FIREBASE_BACKUP_BUCKET` = the bucket name (not a URL)
   - `FIREBASE_SERVICE_ACCOUNT_JSON` = the key JSON, one line
   - `CRON_SECRET` = a long random string (`openssl rand -base64 32`). The same value authorizes the Toast snapshot cron.
5. Redeploy so `vercel.json` registers the cron. Schedule: `0 8 * * *` UTC (about 2:00am or 3:00am Chicago).

Optional native export, in addition to this JSON cron: Google Cloud console → Firestore → Import/Export → Export, destination the same bucket. The service account (or the Firestore service agent) needs **Cloud Datastore Import Export Admin**. That export is the one Google can import with `gcloud firestore import`. The JSON cron is the one this repo runs and the one the restore script reads.

## Restore

1. Download one `firestore-backups/YYYY-MM-DD/` folder from the bucket to your machine.
2. Dry-run:

```bash
npx tsx scripts/restore-firestore-backup.ts --dir ./that-folder
```

3. Stop staff from using the app (or accept that a live save during restore can race). Prefer a quiet window.
4. Apply only the collections you mean to put back. The script writes every JSON file in the folder except `manifest.json`, by document id, under `organizations/org-boundaries/<collection>/<id>`. It replaces those ids. It does not delete docs that are absent from the file.

```bash
FIRESTORE_RESTORE_APPLY=yes npx tsx scripts/restore-firestore-backup.ts \
  --dir ./that-folder --apply
```

5. Order that matters if you are repairing Phase 0 data: `users`, then `logbookSubmissions`, then `data`. Restoring `data/users` brings back the legacy array. Restoring `users` brings back per-user docs. Do not restore a backup from before a migration on top of a finished migration unless that is the rollback you want.
6. If `enforceAuth` was true in the backup's `config/security` and you are not ready for it, set that field back to false before staff open the app. See the Phase 0A runbook.

## Rollback of the cron itself

Remove the backup entry from `vercel.json` and redeploy, or unset `CRON_SECRET`. Already uploaded objects stay until you delete them or they age out. `backupStatus` can be deleted in the Firestore console; the app does not depend on it.

## Test

```bash
npx tsx scripts/verify-firestore-backup.ts
```
