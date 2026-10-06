/**
 * Smoke: logbook submit must not wipe in-progress work.
 * - Empty cloud must not replace a local submissions list
 * - Missing draft must not clear non-empty local responses
 * - Pinned session date must not jump across midnight / unlockHour
 * Run: npx --yes tsx scripts/verify-logbook-submit-guard.ts
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  computeChecklistTargetDate,
  effectiveUnlockHour,
  resolveSessionTargetDate,
  shouldClearLocalResponsesForMissingDraft,
  shouldReplaceLocalSubmissions,
} from '../utils/logbookSubmitGuard.ts';

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

// 1) Empty cloud must not replace local list (quota flake returns [])
assert(shouldReplaceLocalSubmissions([]) === false, 'empty cloud array must not replace local submissions');
assert(shouldReplaceLocalSubmissions(undefined) === false, 'missing cloud submissions must not replace local');
assert(shouldReplaceLocalSubmissions(null) === false, 'null cloud submissions must not replace local');
assert(
  shouldReplaceLocalSubmissions([{ id: 'sub-1' }]) === true,
  'non-empty cloud list may replace after the protect window',
);

// 2) Missing draft must not clear responses the closer already typed
assert(
  shouldClearLocalResponsesForMissingDraft({ localResponseCount: 3, hasMatchingSubmission: false }) === false,
  'missing draft must not clear non-empty local responses',
);
assert(
  shouldClearLocalResponsesForMissingDraft({ localResponseCount: 0, hasMatchingSubmission: false }) === true,
  'empty form with no draft may reset',
);
assert(
  shouldClearLocalResponsesForMissingDraft({ localResponseCount: 0, hasMatchingSubmission: true }) === false,
  'matching draft/locked sub must not clear',
);

// 3) Pin the date for an open session — 9pm close past midnight / unlockHour 10
const closing = { name: 'Closing Checklist', type: 'CLOSING', unlockHour: 10 };
const ninePm = new Date(2026, 7, 30, 21, 0, 0); // Aug 30 9pm
const afterMidnight = new Date(2026, 7, 31, 0, 30, 0); // Aug 31 12:30am
const afterUnlock = new Date(2026, 7, 31, 10, 1, 0); // Aug 31 10:01am

const openedAtNine = computeChecklistTargetDate(ninePm, closing);
assert(openedAtNine === '2026-08-30', `9pm close should target that calendar day, got ${openedAtNine}`);

const rematchAfterMidnight = computeChecklistTargetDate(afterMidnight, closing);
assert(rematchAfterMidnight === '2026-08-30', `00:30 before unlockHour 10 rematches to yesterday (${rematchAfterMidnight})`);

const rematchAfterUnlock = computeChecklistTargetDate(afterUnlock, closing);
assert(rematchAfterUnlock === '2026-08-31', `after unlockHour rematch jumps to the new day, got ${rematchAfterUnlock}`);

assert(
  resolveSessionTargetDate({
    computedDate: rematchAfterMidnight,
    pinnedDate: openedAtNine,
    sessionOpen: true,
  }) === '2026-08-30',
  'open session must keep the 9pm date across midnight',
);
assert(
  resolveSessionTargetDate({
    computedDate: rematchAfterUnlock,
    pinnedDate: openedAtNine,
    sessionOpen: true,
  }) === '2026-08-30',
  'open session must keep the 9pm date past unlockHour (do not look up a new day\'s missing draft)',
);
assert(
  resolveSessionTargetDate({
    computedDate: rematchAfterUnlock,
    pinnedDate: openedAtNine,
    sessionOpen: false,
  }) === '2026-08-31',
  'leaving and reopening may rematch to the new day',
);

// 4) Prosper Opening unlockHour 24 must not book the morning open onto yesterday.
// getHours() is 0–23, so hour 24 matches every clock time.
assert(effectiveUnlockHour(24) === 0, 'unlockHour 24 is midnight, not "always yesterday"');
assert(effectiveUnlockHour(undefined) === 0, 'missing unlockHour is midnight');
assert(effectiveUnlockHour(11) === 11, 'a real refresh hour is kept');
const prosperOpening = { name: 'Opening Checklist', type: 'OPENING', unlockHour: 24 };
const sixFourteen = new Date(2026, 9, 6, 6, 14, 0);
assert(
  computeChecklistTargetDate(sixFourteen, prosperOpening) === '2026-10-06',
  '6:14 AM opening with unlockHour 24 is that calendar morning',
);
assert(
  computeChecklistTargetDate(sixFourteen, { name: 'Opening Checklist', type: 'OPENING', unlockHour: 0 }) === '2026-10-06',
  'Little Elm opening (unlockHour 0) at 6:14 AM stays on that morning',
);
assert(
  computeChecklistTargetDate(sixFourteen, { name: 'Closing Checklist', type: 'CLOSING', unlockHour: 11 }) === '2026-10-05',
  'closing before its refresh hour is still yesterday',
);

const dbSrc = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../services/db.ts'), 'utf8');
assert(/const CONTENT_DEFAULTS_VERSION = 7;/.test(dbSrc), 'do not bump CONTENT_DEFAULTS_VERSION');

console.log('verify-logbook-submit-guard: ok');
