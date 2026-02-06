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

// In-memory caches (persist across requests on warm Vercel instances)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;
const cachedGuids: Record<string, string> = {};

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

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

  cachedToken = authData.token.accessToken;
  tokenExpiry = now + (23 * 60 * 60 * 1000); // 23 hours
  return cachedToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate, location, maxTimeOfDay } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
  const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
  const locationKey = (Array.isArray(location) ? location[0] : location)?.toLowerCase() || 'littleelm';

  // Optional: filter orders by time of day (for fair week-over-week comparisons)
  // Format: "HH:MM" e.g. "11:45" means only include orders up to 11:45am
  const maxTimeOfDayStr = Array.isArray(maxTimeOfDay) ? maxTimeOfDay[0] : maxTimeOfDay;

  // Get restaurant GUIDs to try for this location
  const restaurantGuids = LOCATIONS[locationKey] || LOCATIONS['littleelm'];

  if (!restaurantGuids || restaurantGuids.length === 0) {
    return res.status(500).json({ error: 'Toast API not configured for this location' });
  }

  try {
    const token = await getAuthToken();

    // Use Central Time (America/Chicago) for business day boundaries
    // This ensures we fetch the correct business day's orders
    const startUTC = new Date(`${startDateStr}T06:00:00.000Z`); // 6 AM UTC = midnight Central
    const endUTC = new Date(`${endDateStr}T05:59:59.999Z`);
    endUTC.setDate(endUTC.getDate() + 1); // Next day 5:59 AM UTC = 11:59 PM Central

    // Use cached GUID if available, otherwise probe to find working one
    let restaurantGuid: string | null = cachedGuids[locationKey] || null;
    let lastError: any = null;

    if (!restaurantGuid) {
      for (const guid of restaurantGuids) {
        try {
          // Test this GUID with a small request
          const testStart = new Date(startUTC);
          const testEnd = new Date(testStart.getTime() + 60000);
          await fetchOrdersChunk(testStart.toISOString(), testEnd.toISOString(), token, guid);
          restaurantGuid = guid;
          cachedGuids[locationKey] = guid;
          console.log(`[Toast Sales] Found working GUID: ${guid.substring(0, 8)}... for ${locationKey}`);
          break;
        } catch (err: any) {
          lastError = err;
          console.log(`[Toast Sales] GUID ${guid.substring(0, 8)}... failed: ${err.message}`);
        }
      }
    } else {
      console.log(`[Toast Sales] Using cached GUID: ${restaurantGuid.substring(0, 8)}... for ${locationKey}`);
    }

    if (!restaurantGuid) {
      throw new Error(`No working GUID found for ${locationKey}: ${lastError?.message}`);
    }

    // Create 4-hour chunks for parallel fetching (6 chunks covers 24 hours)
    const CHUNK_HOURS = 4;
    const chunks: { start: Date; end: Date }[] = [];
    let current = new Date(startUTC);

    while (current < endUTC) {
      const chunkEnd = new Date(Math.min(current.getTime() + (CHUNK_HOURS * 60 * 60 * 1000), endUTC.getTime()));
      chunks.push({ start: new Date(current), end: chunkEnd });
      current = chunkEnd;
    }

    console.log(`[Toast Sales] Fetching ${chunks.length} chunks in parallel for ${locationKey}`);

    // Fetch all chunks in parallel for speed
    const chunkResults = await Promise.all(
      chunks.map(chunk =>
        fetchOrdersChunk(chunk.start.toISOString(), chunk.end.toISOString(), token, restaurantGuid!)
          .catch(err => {
            console.warn(`[Toast Sales] Chunk failed: ${err.message}`);
            return []; // Return empty array on error, don't fail entire request
          })
      )
    );

    const allOrders = chunkResults.flat();

    // Parse max time of day filter if provided
    let maxHour: number | null = null;
    let maxMinute: number | null = null;
    if (maxTimeOfDayStr) {
      const [h, m] = maxTimeOfDayStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        maxHour = h;
        maxMinute = m;
      }
    }

    // Process orders - use 'amount' for NET sales (excludes tax)
    let netSales = 0;
    let totalTax = 0;
    let totalTips = 0;
    const paymentMethods: Record<string, number> = {};
    const hourlySales: Record<number, number> = {};
    const turnTimes: number[] = [];

    let validOrderCount = 0;
    allOrders.forEach(order => {
      // Skip voided orders at the order level
      if (order.voided || order.deleted) return;

      // Filter by time of day if specified (for week-over-week comparisons)
      if (maxHour !== null && maxMinute !== null) {
        const orderDate = new Date(order.openedDate || order.createdDate);
        const orderHour = orderDate.getUTCHours() - 6; // Convert UTC to Central (approximate)
        const orderMinute = orderDate.getUTCMinutes();
        const adjustedHour = orderHour < 0 ? orderHour + 24 : orderHour;

        if (adjustedHour > maxHour || (adjustedHour === maxHour && orderMinute > maxMinute)) {
          return;
        }
      }

      const checks = order.checks || [];
      let orderNetSales = 0;

      checks.forEach((check: any) => {
        // Only skip explicitly voided checks
        if (check.voided === true) return;

        // Add to totals - use amount for net sales
        const checkAmount = check.amount || 0;
        orderNetSales += checkAmount;
        netSales += checkAmount;
        totalTax += check.taxAmount || 0;

        const payments = check.payments || [];
        payments.forEach((payment: any) => {
          totalTips += payment.tipAmount || 0;
          const method = payment.type || payment.cardType || 'Unknown';
          paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amount || 0);
        });
      });

      // Count order if it has any sales
      if (orderNetSales > 0) {
        validOrderCount++;
        const hour = new Date(order.openedDate || order.createdDate).getUTCHours();
        hourlySales[hour] = (hourlySales[hour] || 0) + orderNetSales;
      }

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
      totalOrders: validOrderCount,
      averageCheck: validOrderCount > 0 ? Math.round((netSales / validOrderCount) * 100) / 100 : 0,
      totalTips: Math.round(totalTips * 100) / 100,
      averageTurnTime: avgTurnTime, // in minutes
      paymentMethods,
      hourlySales,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Toast Sales] SUCCESS for ${locationKey}: $${salesData.totalSales} net, ${salesData.totalOrders} orders from ${allOrders.length} raw orders (${chunks.length} parallel chunks)`);

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
