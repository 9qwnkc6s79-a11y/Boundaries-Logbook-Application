# Phase 0C — immutable logbook submissions

Each save also writes `organizations/org-boundaries/logbookSubmissions/{submissionId}`:

- store, business date, template, checklist type when known, user
- started time (earliest task timestamp) and submitted time
- task items, completion percent, photo refs

The live `data/submissions` array is unchanged, including its retention prune. The per-submission doc is not pruned. A draft can be updated. Once the status is no longer `DRAFT`, the doc is not replaced. A later upload may only swap an inline `data:` photo ref for an `https` URL. If that write fails, the checklist save still succeeds.

## Rebuild

This does not read production. Put local JSON in `history.json`:

- `archives`: keys like `submissionsArchive-2026-10`, values `{ "rows": [ ...full submissions ] }`
- `live`: optional rows from the current submissions doc
- `templates`: `{ id, type, storeId }` so a row's checklist type can be resolved. If a template is missing, the type stays unknown and the gap report does not count that row as an opening, mid, or close.
- `exportDays`: output days from `GET /api/logbook-export`. Those become partial records (counts and status only). Task rows are left empty and marked `itemsOmitted`. They are not guessed.

```bash
npx tsx scripts/rebuild-logbook-history.ts --input history.json --end 2026-11-17 --out gap-report.json
```

The report starts at 2026-09-01. For each store (Little Elm `store-elm`, Prosper `store-prosper`) and each daily type (`OPENING`, `SHIFT_CHANGE`, `CLOSING`):

- `present` — a full row was in the archive or the live doc
- `partial-export` — only the export summary exists
- `gap` — that month was in the files you passed, and this checklist was not
- `no-source` — that month was not in the files. This is not reported as a missing close.

September is `no-source` unless you actually have a September archive or export. The script does not create those days.

## Apply (after the backup, not run here)

```bash
LOGBOOK_REBUILD_APPLY=yes npx tsx scripts/rebuild-logbook-history.ts \
  --input history.json --end 2026-11-17 --apply
```

Requires the service account. Existing sealed docs are skipped, so a second run does not overwrite them. `--apply` uses create, not a blind replace.

## Rollback

Stop writing new docs by reverting this PR. Docs already written can stay; the app still reads the live array. To remove a bad rebuild, delete `organizations/org-boundaries/logbookSubmissions/{id}` for the ids in the dry-run report. Do not delete `data/submissions`.

## Test

```bash
npx tsx scripts/verify-logbook-records.ts
```
