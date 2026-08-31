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
 * Target date for a checklist at `now`.
 * Before unlockHour the form is still yesterday's book (closing unlockHour is 10).
 */
export function computeChecklistTargetDate(
  now: Date,
  template: { type?: string; name: string; unlockHour?: number },
  formatDate: (d: Date) => string = toLocalYYYYMMDD,
): string {
  const localHour = now.getHours();
  const todayStr = formatDate(now);

  if (localHour < (template.unlockHour ?? 0)) {
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
