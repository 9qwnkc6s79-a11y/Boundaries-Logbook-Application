# Phase 0B — one document per user

Reads merge `organizations/org-boundaries/users/{userId}` over the legacy array `organizations/org-boundaries/data/users`. Until you mark the array read-only, every `syncUser` write (Team settings, Toast roster sync, login password migration) still updates the array **and** the user doc. Staff keep working if the migration has not been run: an empty user collection falls back to the array.

The array becomes read-only only when `organizations/org-boundaries/data/usersArrayReadOnly` is `{ data: { readOnly: true } }`. This PR does not set that marker.

## Do not do this yet

Do not run `--apply` until the full Firestore backup exists and a dry-run has been reviewed. This agent did not read or write production.

## Dry-run

Export the array field `data` to `users.json` as `{ "users": [ ... ] }`. If any user docs already exist, export them to `docs.json` in the same shape.

```bash
npx tsx scripts/migrate-users-to-docs.ts --input users.json --existing docs.json --out user-doc-plan.json
```

`create` and `update` would be written. `keep-doc` means the doc is newer and will be left alone. `conflict` is not written (duplicate email, bad id, or a doc whose email does not match). `unchanged` is already done.

## Apply

```bash
USERS_MIGRATION_APPLY=yes npx tsx scripts/migrate-users-to-docs.ts \
  --input users.json \
  --backup-file users-backup.json \
  --apply
```

Requires `USERS_MIGRATION_APPLY=yes`, a service account (`FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`), and a backup file under 24 hours old with the same user count. The script re-reads the collection and prints verification counts. It does not delete the array.

Re-run the same command. The second plan should be all `unchanged` or `keep-doc`.

## Mark the array read-only (after the counts match)

```bash
USERS_MIGRATION_APPLY=yes npx tsx scripts/migrate-users-to-docs.ts \
  --input users.json \
  --backup-file users-backup.json \
  --apply \
  --mark-array-read-only
```

This refuses if the plan still has conflicts. After the marker, Team settings and Toast sync write user docs only. The array is still read as a fallback for anyone who has no doc.

A listener on `users/{userId}` keeps the open app up to date without re-reading all 78 docs on every 30-second heartbeat. The first snapshot is one read per user per open session.

## Rollback

1. Firestore → `organizations/org-boundaries/data/usersArrayReadOnly` → delete the document, or set `data.readOnly` to false. Writes to the array resume on the next save.
2. User docs can stay. They are ignored when missing and only win when present. To ignore a bad doc, delete that one `users/{userId}` document; the array row is used again.
3. Do not delete the array until a later change stops reading it.

## Env

Same service account as Phase 0A. `AUTH_ORG_ID` optional, default `org-boundaries`.

## Test

```bash
npx tsx scripts/verify-user-records.ts
```
