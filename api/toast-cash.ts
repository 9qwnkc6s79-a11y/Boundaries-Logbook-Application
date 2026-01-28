/**
 * Vercel Serverless Function: Toast Cash Management API Proxy
 * Fetches cash entries (drops, pay-outs, etc.) and deposit data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Restaurant GUIDs - Prosper has multiple, try both
const LOCATIONS: Record<string, string[]> = {
  'littleelm': [process.env.VITE_TOAST_RESTAURANT_GUID || ''],
  'prosper': [
    'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
    'd1e0f278-e871-4635-8d33-74532858ccaf'
  ],
};

async function getAuthToken(): Promise<string> {
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  const authResponse = await fetch('https://ws-api.toasttab.com/authentication/v1/authentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' })
  });

  if (!authResponse.ok) {
    throw new Error(`Toast auth failed (${authResponse.status})`);
  }

  const authData = await authResponse.json();
  if (!authData.token?.accessToken) throw new Error('Invalid auth response');
  return authData.token.accessToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate, location } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
  const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
  const locationKey = (Array.isArray(location) ? location[0] : location)?.toLowerCase() || 'littleelm';

  // Get restaurant GUIDs to try for this location
  const restaurantGuids = LOCATIONS[locationKey] || LOCATIONS['littleelm'];

  if (!restaurantGuids || restaurantGuids.length === 0) {
    return res.status(500).json({ error: 'Toast API not configured for this location' });
  }

  try {
    const token = await getAuthToken();

    // Try each GUID until one works
    let restaurantGuid: string | null = null;
    let lastError: any = null;

    for (const guid of restaurantGuids) {
      try {
        // Test this GUID with a small request
        await fetchCashEntries(startDateStr, endDateStr, token, guid);
        restaurantGuid = guid;
        console.log(`[Toast Cash] Using GUID: ${guid.substring(0, 8)}... for ${locationKey}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.log(`[Toast Cash] GUID ${guid.substring(0, 8)}... failed: ${err.message}`);
      }
    }

    if (!restaurantGuid) {
      throw new Error(`No working GUID found for ${locationKey}: ${lastError?.message}`);
    }

    // Fetch cash entries (drops, pay-outs, etc.)
    const entries = await fetchCashEntries(startDateStr, endDateStr, token, restaurantGuid);

    // Calculate totals
    let cashIn = 0;
    let cashOut = 0;
    let payOuts = 0;
    let tipOuts = 0;

    entries.forEach((entry: any) => {
      const amount = entry.amount || 0;

      switch (entry.type) {
        case 'CASH_IN':
        case 'CASH_COLLECTED':
          cashIn += amount;
          break;
        case 'CASH_OUT':
          cashOut += amount;
          break;
        case 'PAY_OUT':
          payOuts += amount;
          break;
        case 'TIP_OUT':
          tipOuts += amount;
          break;
      }
    });

    const cashData = {
      location: locationKey,
      startDate: startDateStr,
      endDate: endDateStr,
      cashIn: Math.round(cashIn * 100) / 100,
      cashOut: Math.round(cashOut * 100) / 100, // Safe drops
      payOuts: Math.round(payOuts * 100) / 100,
      tipOuts: Math.round(tipOuts * 100) / 100,
      netCashRemoved: Math.round((cashOut + payOuts + tipOuts) * 100) / 100,
      entries: entries.map((e: any) => ({
        type: e.type,
        amount: e.amount,
        createdDate: e.createdDate,
        reason: e.reason,
        employeeName: e.employee?.name || 'Unknown'
      })),
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Toast Cash] SUCCESS for ${locationKey}: Cash Out: $${cashData.cashOut}, Pay Outs: $${cashData.payOuts}`);

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(cashData);

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch cash data', message: error.message });
  }
}

async function fetchCashEntries(startDate: string, endDate: string, token: string, restaurantGuid: string): Promise<any[]> {
  // Convert YYYY-MM-DD to YYYYMMDD format
  const startBusinessDate = startDate.replace(/-/g, '');
  const endBusinessDate = endDate.replace(/-/g, '');

  const url = `https://ws-api.toasttab.com/cashmgmt/v1/entries?startDate=${startBusinessDate}&endDate=${endBusinessDate}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 404) return [];
    throw new Error(`Toast Cash API Error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || data.entries || []);
}
