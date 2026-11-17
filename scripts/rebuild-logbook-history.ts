/**
 * Rebuild immutable logbook docs from local archive / export JSON.
 * Dry-run by default. Does not contact Firestore unless --apply is set,
 * LOGBOOK_REBUILD_APPLY=yes, and a service account is configured.
 * Never fabricates a checklist that is not in the input. Gaps are listed.
 *
 *   npx tsx scripts/rebuild-logbook-history.ts --input history.json --end 2026-11-17
 *
 * history.json:
 *   {
 *     "archives": { "submissionsArchive-2026-10": { "rows": [ ChecklistSubmission ] } },
 *     "live": [ ChecklistSubmission ],
 *     "templates": [ { "id", "type", "storeId" } ],
 *     "exportDays": [ { "storeId", "date", "checklists": [ { "type", "status", "tasksDone", "tasksTotal" } ] } ]
 *   }
 *
 * A month is "covered" only when that month's archive key, a live row, or an
 * export day is present. Other months are no-source, not gaps.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { planHistoryRebuild, type HistoryRebuildInput, type LogbookRecord } from '../utils/logbookRecords.ts';
import { assertMigrationApplyAllowed, loadServiceAccountFromEnv } from '../utils/firebaseAdminApp.ts';

function arg(name: string): string | undefined {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return undefined;
  return process.argv[idx + 1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

async function apply(records: LogbookRecord[]) {
  assertMigrationApplyAllowed('LOGBOOK_REBUILD_APPLY');
  const account = loadServiceAccountFromEnv();
  if (!account) throw new Error('No service account. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.');
  const admin = await import('firebase-admin');
  const app = admin.initializeApp({
    credential: admin.credential.cert(account as any),
    projectId: account.project_id || 'boundaries-logbook-app',
  }, 'logbook-rebuild');
  const db = admin.firestore(app);
  const orgId = process.env.AUTH_ORG_ID || 'org-boundaries';
  let created = 0;
  let skipped = 0;
  for (const record of records) {
    const ref = db.doc(`organizations/${orgId}/logbookSubmissions/${record.id}`);
    const snap = await ref.get();
    if (snap.exists) {
      const existing = snap.data() as LogbookRecord;
      if (existing.sealed || (existing.status && existing.status !== 'DRAFT')) {
        skipped++;
        continue;
      }
      await ref.set(record);
      created++;
      continue;
    }
    await ref.create(record);
    created++;
  }
  return { created, skippedImmutable: skipped };
}

async function main() {
  const inputPath = arg('--input');
  const end = arg('--end');
  if (!inputPath || !end) {
    console.error('Usage: npx tsx scripts/rebuild-logbook-history.ts --input history.json --end YYYY-MM-DD [--out report.json] [--apply]');
    process.exit(1);
  }
  const parsed = JSON.parse(readFileSync(inputPath, 'utf8')) as Omit<HistoryRebuildInput, 'endDate'>;
  const plan = planHistoryRebuild({ ...parsed, endDate: end }, new Date().toISOString());
  const report = {
    summary: plan.summary,
    skipped: plan.skipped,
    gaps: plan.gaps.filter(gap => gap.status === 'gap' || gap.status === 'no-source'),
    records: plan.records.map(record => ({
      id: record.id,
      storeId: record.storeId,
      businessDate: record.businessDate,
      checklistType: record.checklistType || null,
      status: record.status,
      source: record.provenance.source,
      itemsOmitted: !!record.itemsOmitted,
      completionPercent: record.completionPercent,
    })),
  };
  const out = arg('--out');
  if (out) writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(plan.summary, null, 2));
  console.log(`gap cells: ${plan.summary.gaps}; no-source cells: ${plan.summary.noSource}`);
  if (!hasFlag('--apply')) {
    console.log('DRY RUN. No logbook documents were written.');
    return;
  }
  const result = await apply(plan.records);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
