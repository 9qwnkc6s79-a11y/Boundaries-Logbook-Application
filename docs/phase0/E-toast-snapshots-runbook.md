# Phase 0E — Toast daily snapshots

`GET /api/cron/toast-snapshots` saves yesterday and today (America/Chicago) for Little Elm and Prosper to `organizations/org-boundaries/toastSnapshots/{storeId}_{YYYY-MM-DD}`.

Sales use the same order summary as the manager tile. Labor uses the same labor call. Both already back off on HTTP 429. If a pull fails, a previously good snapshot for that day is kept. A failure is stored as unavailable, not as $0.

The manager budget handler still tries Toast live. When a store's labor is `unavailable` or `blocked` and every day in the month-to-date window has an `ok` labor snapshot, the tile shows that sum and says it came from the snapshot. If any day is missing, the tile stays unavailable and the message includes how many days the snapshot covers. Those missing days are not filled with zero. The same rule applies to sales when the live sales range is incomplete.

Vercel cron: `30 4 * * *` UTC (about 10:30pm or 11:30pm Chicago, after close). Hobby plans that only allow a daily cron can keep this one.

## Env

| Name | Purpose |
| --- | --- |
| `CRON_SECRET` | Vercel sends `Authorization: Bearer $CRON_SECRET`. The route returns 401 without it. |
| `TOAST_CLIENT_ID` / `VITE_TOAST_CLIENT_ID` | Existing Toast client id. |
| `TOAST_CLIENT_SECRET` or `VITE_TOAST_API_KEY` | Existing Toast secret. The current sales route uses `VITE_TOAST_API_KEY`. |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Required to write snapshots. Rules do not allow the public API key to write this collection. |
| `TOAST_RESTAURANT_LITTLEELM` / `TOAST_RESTAURANT_PROSPER` | Optional GUID overrides. |

Set `CRON_SECRET` in Vercel → Project → Settings → Environment Variables, then redeploy so the cron is registered from `vercel.json`.

## Rollback

Remove the cron from `vercel.json` and redeploy, or delete `CRON_SECRET` so the route returns 401. Existing snapshot docs can stay. The tile ignores them when the live call succeeds. Delete `toastSnapshots` only if a bad snapshot was applied and you need the tile to show Unavailable again.

## Test

```bash
npx tsx scripts/verify-toast-snapshots.ts
```

This does not call Toast or Firestore.
