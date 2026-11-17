# Phase 0D — photo uploads and the retry queue

Storage uploads succeed once the signed-in user matches `storage.rules` (Phase 0A). Until that deploy, Storage still rejects anonymous uploads. This change does not open the bucket.

On failure, the photo bytes and the storage path are written to IndexedDB (`boundaries-upload-queue`) and the existing fallback stays (inline image on the checklist, Firestore file doc for Academy). The queue is not cleared by a refresh or by another failed try. The same path is one row; attempts and the last error are kept.

The app retries due items every 30 seconds and when the browser comes back online. A success removes the row and, when that exact data URL is still on a checklist, swaps in the download URL through the normal guarded submission save. Staff see a bar: "N photos waiting to upload. They stay on this device and retry automatically."

There is no server migration. Rollback is reverting the PR. Queued photos already on a device remain in that browser until they upload or the staff member clears site data. They are not in Firestore until the upload or the existing inline fallback succeeds.

## Test

```bash
npx tsx scripts/verify-upload-queue.ts
```

No env vars. Deploy Storage rules only with the Phase 0A cutover.
