/**
 * Debug endpoint to find live clocked-in employees
 * Tries different Toast API patterns for real-time clock-in data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getAuthToken(): Promise<string> {
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  const authResponse = await fetch('https://ws-api.toasttab.com/authentication/v1/authentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT'
    })
  });

  if (!authResponse.ok) {
    throw new Error(`Toast auth failed (${authResponse.status})`);
  }

  const authData = await authResponse.json();
  return authData.token.accessToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { location } = req.query;
  const locationKey = (Array.isArray(location) ? location[0] : location)?.toLowerCase() || 'littleelm';

  const LOCATIONS: Record<string, string[]> = {
    'littleelm': [process.env.VITE_TOAST_RESTAURANT_GUID || ''],
    'prosper': [
      'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
      'd1e0f278-e871-4635-8d33-74532858ccaf'
    ],
  };

  const restaurantGuids = LOCATIONS[locationKey] || LOCATIONS['littleelm'];

  try {
    const token = await getAuthToken();
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const businessDate = today.replace(/-/g, '');

    let workingGuid: string | null = null;

    // Find working GUID
    for (const guid of restaurantGuids) {
      try {
        const testUrl = `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}`;
        const response = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Toast-Restaurant-External-ID': guid,
          },
        });

        if (response.ok) {
          workingGuid = guid;
          break;
        }
      } catch (err) {
        continue;
      }
    }

    if (!workingGuid) {
      return res.status(404).json({ error: 'No working GUID found' });
    }

    const results: any = {
      location: locationKey,
      guid: workingGuid,
      businessDate: businessDate,
      attempts: []
    };

    // Try different API patterns to find live clock-in data

    // Attempt 1: timeEntries with open=true parameter
    try {
      const url1 = `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}&open=true`;
      const res1 = await fetch(url1, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid,
        },
      });
      results.attempts.push({
        name: 'timeEntries?open=true',
        status: res1.status,
        data: res1.ok ? await res1.json() : null
      });
    } catch (e: any) {
      results.attempts.push({ name: 'timeEntries?open=true', error: e.message });
    }

    // Attempt 2: timeEntries with status=OPEN
    try {
      const url2 = `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}&status=OPEN`;
      const res2 = await fetch(url2, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid,
        },
      });
      results.attempts.push({
        name: 'timeEntries?status=OPEN',
        status: res2.status,
        data: res2.ok ? await res2.json() : null
      });
    } catch (e: any) {
      results.attempts.push({ name: 'timeEntries?status=OPEN', error: e.message });
    }

    // Attempt 3: Try /punches endpoint
    try {
      const url3 = `https://ws-api.toasttab.com/labor/v1/punches?businessDate=${businessDate}`;
      const res3 = await fetch(url3, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid,
        },
      });
      results.attempts.push({
        name: 'punches',
        status: res3.status,
        data: res3.ok ? await res3.json() : await res3.text()
      });
    } catch (e: any) {
      results.attempts.push({ name: 'punches', error: e.message });
    }

    // Attempt 4: Try /activePunches endpoint
    try {
      const url4 = `https://ws-api.toasttab.com/labor/v1/activePunches`;
      const res4 = await fetch(url4, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid,
        },
      });
      results.attempts.push({
        name: 'activePunches',
        status: res4.status,
        data: res4.ok ? await res4.json() : await res4.text()
      });
    } catch (e: any) {
      results.attempts.push({ name: 'activePunches', error: e.message });
    }

    // Attempt 5: Try current shifts endpoint
    try {
      const url5 = `https://ws-api.toasttab.com/labor/v1/shifts?businessDate=${businessDate}&status=OPEN`;
      const res5 = await fetch(url5, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid,
        },
      });
      results.attempts.push({
        name: 'shifts?status=OPEN',
        status: res5.status,
        data: res5.ok ? await res5.json() : await res5.text()
      });
    } catch (e: any) {
      results.attempts.push({ name: 'shifts?status=OPEN', error: e.message });
    }

    // Attempt 6: Get timeEntries for a wider date range (last 7 days) to see pattern
    try {
      const lastWeek = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
      const startDate = lastWeek.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' }).replace(/-/g, '');
      const url6 = `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${startDate}&endDate=${businessDate}`;
      const res6 = await fetch(url6, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid,
        },
      });
      const data6 = res6.ok ? await res6.json() : null;
      results.attempts.push({
        name: 'timeEntries (last 7 days)',
        status: res6.status,
        totalEntries: data6?.timeEntries?.length || 0,
        sampleEntry: data6?.timeEntries?.[0] || null
      });
    } catch (e: any) {
      results.attempts.push({ name: 'timeEntries (last 7 days)', error: e.message });
    }

    return res.status(200).json(results);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
