/**
 * Guards that stop a long close or a flaky cloud read from wiping logbook work.
 * Pure helpers — keep the midnight/unlockHour rematch and empty-cloud rules
 * out of React so they can be verified without the form.
 */

export function toLocalYYYYMMDD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Hour when this checklist rolls onto today's calendar date.
 * `Date#getHours()` is 0–23, so a stored 24 (Prosper Opening) would make
 * every submission yesterday. Treat that, and any other non-hour, as midnight.
 */
export function effectiveUnlockHour(unlockHour: number | undefined | null): number {
  if (typeof unlockHour !== 'number' || !Number.isFinite(unlockHour)) return 0;
  if (unlockHour <= 0 || unlockHour >= 24) return 0;
  return unlockHour;
}

/**
 * Target date for a checklist at `now` (device local clock; store iPads are Central).
 * Before unlockHour the form is still yesterday's book (closing unlockHour is 10).
 */
export function computeChecklistTargetDate(
  now: Date,
  template: { type?: string; name: string; unlockHour?: number },
  formatDate: (d: Date) => string = toLocalYYYYMMDD,
): string {
  const localHour = now.getHours();
  const todayStr = formatDate(now);

  if (localHour < effectiveUnlockHour(template.unlockHour)) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    return formatDate(yesterday);
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayNameInTemplate = daysOfWeek.find(d => template.name.includes(d));

  if (template.type === 'WEEKLY' && dayNameInTemplate) {
    const targetDayIndex = daysOfWeek.indexOf(dayNameInTemplate);
    const currentDayIndex = now.getDay();
    let diff = currentDayIndex - targetDayIndex;
    if (diff < 0) diff += 7;
    const targetDateObj = new Date(now);
    targetDateObj.setDate(now.getDate() - diff);
    return formatDate(targetDateObj);
  }

  return todayStr;
}

/**
 * An open session (active submission or local responses) keeps the date it
 * started on. Rematch only after they leave and reopen.
 */
export function resolveSessionTargetDate(args: {
  computedDate: string;
  pinnedDate: string | null | undefined;
  sessionOpen: boolean;
}): string {
  if (args.sessionOpen && args.pinnedDate) return args.pinnedDate;
  return args.computedDate;
}

/** Empty cloud arrays are quota flakes, not a real empty logbook. */
export function shouldReplaceLocalSubmissions(cloudSubmissions: unknown): boolean {
  return Array.isArray(cloudSubmissions) && cloudSubmissions.length > 0;
}

/**
 * Missing cloud draft must not wipe work already on the form.
 * Empty local state may reset; anything typed stays.
 */
export function shouldClearLocalResponsesForMissingDraft(args: {
  localResponseCount: number;
  hasMatchingSubmission: boolean;
}): boolean {
  if (args.hasMatchingSubmission) return false;
  return args.localResponseCount === 0;
}

/**
 * Draft id the open form may write to. A form only writes to a submission
 * for its own template. If the id belongs to a different checklist (left over
 * from the form they were in before), drop it so the write cannot land in,
 * or finalize, the other checklist. Unknown ids pass through unchanged
 * (a brand-new draft may not be in the local list yet).
 */
export function submissionIdForTemplate<T extends { id: string; templateId: string }>(
  submissionId: string | null | undefined,
  templateId: string,
  submissions: readonly T[],
): string | undefined {
  if (!submissionId) return undefined;
  const found = submissions.find(s => s.id === submissionId);
  if (found && found.templateId !== templateId) return undefined;
  return submissionId;
}

/**
 * Existing row a checklist save should update. By id first, but only when that
 * row is the same template; otherwise fall back to this template's draft for the
 * target date. Returns `idMismatch` so the caller does not reuse a foreign id
 * for a new row.
 */
export function findExistingSubmissionForSave<
  T extends { id: string; templateId: string; storeId: string; date: string; status: string },
>(
  submissions: readonly T[],
  data: { id?: string; templateId: string; targetDate: string },
  storeId: string,
): { existing: T | undefined; idMismatch: boolean } {
  const byTemplateDraft = () =>
    submissions.find(
      s => s.templateId === data.templateId && s.storeId === storeId && s.date === data.targetDate && s.status === 'DRAFT',
    );
  if (!data.id) return { existing: byTemplateDraft(), idMismatch: false };
  const byId = submissions.find(s => s.id === data.id);
  if (byId && byId.templateId !== data.templateId) {
    return { existing: byTemplateDraft(), idMismatch: true };
  }
  return { existing: byId, idMismatch: false };
}
