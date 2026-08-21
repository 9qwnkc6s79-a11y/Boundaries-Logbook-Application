/** America/Chicago business-date helpers for Toast food 86 / last-sold. */

export const CHICAGO_TZ = 'America/Chicago';

export function chicagoBusinessDate(at: Date | string = new Date()): string {
  const date = typeof at === 'string' ? new Date(at) : at;
  if (Number.isNaN(date.getTime())) {
    return new Date().toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ });
  }
  return date.toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ });
}

/**
 * UTC bounds for a Chicago calendar day (YYYY-MM-DD), DST-safe.
 * Walks to the first Chicago instant of that date, then +24h.
 */
export function chicagoDayBounds(ymd: string): { startIso: string; endIso: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!match) {
    const today = chicagoBusinessDate();
    return chicagoDayBounds(today);
  }

  let utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 12, 0, 0);
  const ymdAt = (ms: number) => new Date(ms).toLocaleDateString('en-CA', { timeZone: CHICAGO_TZ });

  while (ymdAt(utc) === ymd) {
    utc -= 30 * 60 * 1000;
  }
  utc += 30 * 60 * 1000;
  while (ymdAt(utc - 60 * 1000) === ymd) {
    utc -= 60 * 1000;
  }

  return {
    startIso: new Date(utc).toISOString(),
    endIso: new Date(utc + 24 * 60 * 60 * 1000 - 1).toISOString(),
  };
}
