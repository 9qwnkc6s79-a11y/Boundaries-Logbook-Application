# Phase 0A — Firebase Auth and security rules

This change does **not** turn enforcement on and does **not** create Auth users.
Legacy email + hashed password login keeps working until you opt in.

## What shipped

- `VITE_FIREBASE_AUTH_ENABLED` (default **off**). Off means the login screen uses the existing password check and never calls Firebase Auth.
- On: the app tries Firebase Auth first. Any failure falls back to the existing password check, then asks `/api/auth-provision` to create or repair the Auth user. A missing service account returns 503 and the staff member still gets in.
- Firestore rules stay open until `organizations/org-boundaries/config/security.enforceAuth` is `true`. Deploying the rules file without that field does not lock anyone out.
- Storage rules are the target (signed-in uploads). Do not deploy them until the client flag is verified. Production Storage rules are unchanged by opening this PR.
- Scores/metrics paths (`organizations/{org}/metrics`, `organizations/{org}/scores`, and `data` docs whose ids start with `metrics` or `scores`) are client-write denied even before the flag. Nothing in the app writes those paths today. Existing performance-review docs stay client-writable so managers are not blocked.
- Per-user docs and per-submission docs are store-scoped for when those collections exist. The legacy `data/users` and `data/submissions` blobs mix both stores, so rules can only require a signed-in org member for those.

## Password import

Stored hashes are `$sha256$<32 hex salt chars>$<64 hex hash chars>`.
`hash = SHA-256(salt_bytes || utf8(password))`, one round.
Firebase Auth's `SHA256` importer with `rounds: 1` uses that construction.
Plaintext leftovers are not imported. The first successful legacy login creates the Auth user via `/api/auth-provision` (Admin SDK), which is the tested repair path if an imported hash does not match.

## Do not do this yet

- Do not set `enforceAuth: true` until a real staff account has signed in with the flag on and Firestore reads succeed.
- Do not run `scripts/migrate-firebase-auth.ts --apply` until the separate full Firestore backup exists and you have reviewed a dry-run.
- Do not deploy `storage.rules` before the flag is on.
- This agent did not run a migration and did not deploy.

## Env vars

| Name | Where | Required when |
| --- | --- | --- |
| `VITE_FIREBASE_AUTH_ENABLED` | Vercel (Production), value `true` or unset | Client dual-path. Leave unset until dry-run looks right. Changing it requires a redeploy (Vite inlines it). |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Vercel server + the machine that runs the import | Provision endpoint and `--apply`. The full JSON key, one line. |
| `GOOGLE_APPLICATION_CREDENTIALS` | Local only, alternative to the JSON env | Path to the same key file. |
| `AUTH_MIGRATION_APPLY` | Shell only, value `yes` | Required in addition to `--apply`. |
| `AUTH_ORG_ID` | Optional | Defaults to `org-boundaries`. |
| `AUTH_PROVISION_SECRET` | Optional | Leave **unset**. If set, the staff app cannot send it and provision returns 401. Legacy login still works. The password re-check is the gate. |

## Console steps (owner)

1. Firebase console → project **boundaries-logbook-app** → Build → Authentication → Get started (if Auth is not enabled).
2. Sign-in method → **Email/Password** → Enable. Leave "Email link" off. Save.
3. Authentication → Settings → Authorized domains → add `boundaries-logbook-application.vercel.app` (and `localhost` if it is missing).
4. Project settings → Service accounts → **Generate new private key**. Store it as `FIREBASE_SERVICE_ACCOUNT_JSON` on the Vercel project (Production, and Preview if you test there). Do not commit the file.
5. Firestore → Rules → publish `firestore.rules` only (`firebase deploy --only firestore:rules --project boundaries-logbook-app`). Confirm there is **no** document at `organizations/org-boundaries/config/security`, or that `enforceAuth` is `false`.
6. Leave Storage rules as they are until step 10.

## Dry-run

Export the users array from Firestore (`organizations/org-boundaries/data/users` field `data`) to `users.json` as `{ "users": [ ... ] }`. The 2026-11-17 backup has 78 users. Also export `organizations/org-boundaries/data/userPasswords` to `userPasswords.json`. Do this from a machine that already has console access. Then:

```bash
npx tsx scripts/migrate-firebase-auth.ts --input users.json --passwords userPasswords.json --out auth-plan.json
```

Read the summary. `import-sha256` rows can be imported. `first-login` rows wait for that person to sign in. `skip` rows need a human (bad id or duplicate email). The report does not print hashes.

## Apply (later, not part of this PR)

```bash
AUTH_MIGRATION_APPLY=yes npx tsx scripts/migrate-firebase-auth.ts \
  --input users.json \
  --backup-file users-backup.json \
  --apply
```

`--apply` refuses to run unless `AUTH_MIGRATION_APPLY=yes`, a service account is present, and `--backup-file` is less than 24 hours old and has the same user count as the input.

## Turn the client flag on

1. Vercel → Project **boundaries-logbook-application** → Settings → Environment Variables.
2. `VITE_FIREBASE_AUTH_ENABLED` = `true` for Production.
3. Redeploy. Staff with a saved session are asked for their password once. The saved session is not deleted, so turning the flag off puts them back.
4. Sign in as one Little Elm account and one Prosper account. Confirm the logbook still loads and a manager can still open Team settings.
5. Confirm `/api/auth-provision` is not required for accounts that imported cleanly (Firebase sign-in succeeds before the legacy check).

## Flip enforcement (last)

Only after step 4 is true for both stores:

1. Firestore → `organizations` → `org-boundaries` → `config` → add document id **`security`**.
2. Field `enforceAuth`, type **boolean**, value `true`. Save.
3. Reload the app while signed in. Reads should still work. An incognito window that is not signed in should fail to load data.
4. Deploy Storage rules: `firebase deploy --only storage --project boundaries-logbook-app`. Photo uploads then work for the signed-in store and fail for anonymous clients.

## Rollback

1. Firestore → `organizations/org-boundaries/config/security` → set `enforceAuth` to **false**. Save. This is immediate and does not need a deploy. Anonymous access returns (today's behavior).
2. If Storage rules were deployed and uploads misbehave: Storage → Rules → Rules history → restore the previous version.
3. Vercel → set `VITE_FIREBASE_AUTH_ENABLED` to `false` (or delete it) and redeploy. Login is the old password check only. Saved sessions that were left in place start working again.
4. Optional: Authentication → Users → disable a bad import. Do not delete users until you are sure. Disabling is reversible. Legacy login does not consult Firebase while the flag is off.

## Tests

```bash
npx tsx scripts/verify-auth-migration.ts
npm run test:rules
```

`test:rules` starts the Firestore and Storage emulators on project `demo-boundaries-logbook` and never deploys.
