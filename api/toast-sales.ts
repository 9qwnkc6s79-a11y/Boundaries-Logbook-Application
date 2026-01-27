/**
 * Vercel Serverless Function: Toast Sales API Proxy
 * Fetches NET sales data (excluding tax) for specified location
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
    const start = new Date(`${startDateStr}T00:00:00.000`);
    const end = new Date(`${endDateStr}T23:59:59.999`);

    // Try each GUID until one works
    let restaurantGuid: string | null = null;
    let lastError: any = null;

    for (const guid of restaurantGuids) {
      try {
        // Test this GUID with a small request
        await fetchOrdersChunk(start.toISOString(), new Date(start.getTime() + 1000).toISOString(), token, guid);
        restaurantGuid = guid;
        console.log(`[Toast Sales] Using GUID: ${guid.substring(0, 8)}... for ${locationKey}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.log(`[Toast Sales] GUID ${guid.substring(0, 8)}... failed: ${err.message}`);
      }
    }

    if (!restaurantGuid) {
      throw new Error(`No working GUID found for ${locationKey}: ${lastError?.message}`);
    }

    const allOrders: any[] = [];
    let current = new Date(start);
    let requestCount = 0;

    while (current < end && requestCount < 25) {
      const chunkEnd = new Date(Math.min(current.getTime() + (60 * 60 * 1000), end.getTime()));

      try {
        const orders = await fetchOrdersChunk(current.toISOString(), chunkEnd.toISOString(), token, restaurantGuid);
        allOrders.push(...orders);
      } catch (chunkError: any) {
        if (chunkError.message?.includes('429')) {
          await delay(2000);
          try {
            const orders = await fetchOrdersChunk(current.toISOString(), chunkEnd.toISOString(), token, restaurantGuid);
            allOrders.push(...orders);
          } catch (e) { /* continue */ }
        }
      }

      current = chunkEnd;
      requestCount++;
      if (current < end) await delay(200);
    }

    // Process orders - use 'amount' for NET sales (excludes tax)
    let netSales = 0;
    let totalTax = 0;
    let totalTips = 0;
    const paymentMethods: Record<string, number> = {};
    const hourlySales: Record<number, number> = {};
    const turnTimes: number[] = [];

    allOrders.forEach(order => {
      const checks = order.checks || [];
      checks.forEach((check: any) => {
        // NET sales = check.amount (excludes tax)
        // Total = check.totalAmount (includes tax + tip)
        netSales += check.amount || 0;
        totalTax += check.taxAmount || 0;

        const payments = check.payments || [];
        payments.forEach((payment: any) => {
          totalTips += payment.tipAmount || 0;
          const method = payment.type || payment.cardType || 'Unknown';
          paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amount || 0);
        });
      });

      // Hourly breakdown (using net sales)
      const hour = new Date(order.openedDate || order.createdDate).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + checks.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);

      // Calculate turn time (order open to close) in minutes
      if (order.openedDate && order.closedDate) {
        const opened = new Date(order.openedDate).getTime();
        const closed = new Date(order.closedDate).getTime();
        const turnTimeMinutes = (closed - opened) / 1000 / 60;
        if (turnTimeMinutes > 0 && turnTimeMinutes < 120) { // Filter out outliers (< 2 hours)
          turnTimes.push(turnTimeMinutes);
        }
      }
    });

    // Calculate turn time statistics (keep decimal precision for seconds)
    const avgTurnTime = turnTimes.length > 0
      ? turnTimes.reduce((sum, t) => sum + t, 0) / turnTimes.length
      : 0;

    const salesData = {
      location: locationKey,
      startDate: startDateStr,
      endDate: endDateStr,
      // Keep 'totalSales' for backward compatibility (now shows NET sales)
      totalSales: Math.round(netSales * 100) / 100,
      netSales: Math.round(netSales * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grossSales: Math.round((netSales + totalTax) * 100) / 100,
      totalOrders: allOrders.length,
      averageCheck: allOrders.length > 0 ? Math.round((netSales / allOrders.length) * 100) / 100 : 0,
      totalTips: Math.round(totalTips * 100) / 100,
      averageTurnTime: avgTurnTime, // in minutes
      paymentMethods,
      hourlySales,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Toast Sales] SUCCESS for ${locationKey}: $${salesData.totalSales}, ${salesData.totalOrders} orders`);

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(salesData);

  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch sales data', message: error.message });
  }
}

async function fetchOrdersChunk(startDate: string, endDate: string, token: string, restaurantGuid: string): Promise<any[]> {
  const url = `https://ws-api.toasttab.com/orders/v2/ordersBulk?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 404) return [];
    throw new Error(`Toast API Error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  return Array.isArray(data) ? data : (data.data || []);
}
