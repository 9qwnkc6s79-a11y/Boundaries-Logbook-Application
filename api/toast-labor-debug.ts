/**
 * Debug endpoint for Toast Labor API - shows raw response
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

    let rawData: any = null;
    let workingGuid: string | null = null;

    for (const guid of restaurantGuids) {
      try {
        const laborUrl = `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}`;

        const response = await fetch(laborUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Toast-Restaurant-External-ID': guid,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          continue;
        }

        rawData = await response.json();
        workingGuid = guid;
        break;
      } catch (err) {
        continue;
      }
    }

    if (!rawData) {
      return res.status(404).json({ error: 'No data found for any GUID' });
    }

    // Fetch employees
    let employeesData: any = null;
    try {
      const empResponse = await fetch('https://ws-api.toasttab.com/labor/v1/employees', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': workingGuid!,
        },
      });
      if (empResponse.ok) {
        employeesData = await empResponse.json();
      }
    } catch (e) {
      // Ignore
    }

    const timeEntries = rawData.timeEntries || [];
    const noOutDate = timeEntries.filter((e: any) => !e.outDate || e.outDate === null || e.outDate === '');

    return res.status(200).json({
      location: locationKey,
      guid: workingGuid,
      businessDate: businessDate,
      todayDate: today,
      totalEntries: timeEntries.length,
      entriesWithoutOutDate: noOutDate.length,
      sampleEntries: timeEntries.slice(0, 5).map((e: any) => ({
        employeeGuid: e.employeeReference?.guid,
        employeeName: e.employeeReference?.entityId,
        firstName: e.employeeReference?.firstName,
        lastName: e.employeeReference?.lastName,
        inDate: e.inDate,
        outDate: e.outDate,
        outDateType: typeof e.outDate,
        deleted: e.deleted
      })),
      clockedInSample: noOutDate.slice(0, 5),
      employeesFound: employeesData ? (Array.isArray(employeesData) ? employeesData.length : (employeesData.employees?.length || 0)) : 0,
      sampleEmployee: employeesData ? (Array.isArray(employeesData) ? employeesData[0] : employeesData.employees?.[0]) : null
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
