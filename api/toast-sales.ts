/**
 * Vercel Serverless Function: Toast Sales API Proxy
 * Fetches NET sales data (excluding tax) for specified location
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOAST_API = 'https://ws-api.toasttab.com';

// Restaurant GUIDs - hardcoded with env var fallbacks for serverless compatibility
const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

// In-memory token cache (persists across requests on warm Vercel instances)
let cachedToken: { token: string; expires: number } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now()) {
    return cachedToken.token;
  }

  const clientId = process.env.VITE_TOAST_CLIENT_ID || process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY || process.env.TOAST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  const response = await fetch(`${TOAST_API}/authentication/v1/authentication/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' })
  });

  if (!response.ok) {
    throw new Error(`Toast auth failed (${response.status})`);
  }

  const data = await response.json();
  const token = data.token?.accessToken || data.accessToken;

  if (!token) throw new Error('Invalid auth response');

  cachedToken = {
    token,
    expires: Date.now() + 23 * 60 * 60 * 1000 // 23 hours
  };

  return token;
}

// Fetch all orders with pagination - matching Dashboard implementation
async function getAllOrders(
  restaurantGuid: string,
  startDate: string,
  endDate: string,
  token: string
): Promise<any[]> {
  const allOrders: any[] = [];
  let page = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const url = `${TOAST_API}/orders/v2/ordersBulk?startDate=${startDate}T00:00:00.000Z&endDate=${endDate}T23:59:59.999Z&pageSize=${pageSize}&page=${page}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      // 404 means no orders found - not an error
      if (response.status === 404) break;
      throw new Error(`Toast API Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const orders = await response.json();

    if (Array.isArray(orders) && orders.length > 0) {
      allOrders.push(...orders);
      if (orders.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }

    // Safety limit to prevent infinite loops
    if (page > 50) {
      console.warn('[Toast Sales] Hit pagination safety limit at 50 pages');
      break;
    }
  }

  console.log(`[Toast Sales] Fetched ${allOrders.length} orders across ${page} page(s)`);
  return allOrders;
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
  const maxTimeOfDayStr = Array.isArray(maxTimeOfDay) ? maxTimeOfDay[0] : maxTimeOfDay;

  // Get restaurant GUID for this location
  const restaurantGuid = RESTAURANTS[locationKey] || RESTAURANTS['littleelm'];

  if (!restaurantGuid) {
    return res.status(500).json({ error: 'Toast API not configured for this location' });
  }

  console.log(`[Toast Sales] Fetching ${locationKey} (${restaurantGuid.substring(0, 8)}...) from ${startDateStr} to ${endDateStr}`);

  try {
    const token = await getAuthToken();
    const allOrders = await getAllOrders(restaurantGuid, startDateStr, endDateStr, token);

    // Parse max time of day filter if provided (for week-over-week comparisons)
    let maxHour: number | null = null;
    let maxMinute: number | null = null;
    if (maxTimeOfDayStr) {
      const [h, m] = maxTimeOfDayStr.split(':').map(Number);
      if (!isNaN(h) && !isNaN(m)) {
        maxHour = h;
        maxMinute = m;
      }
    }

    // Process orders - matching Dashboard logic
    let netSales = 0;
    let totalTax = 0;
    let totalTips = 0;
    let validOrderCount = 0;
    const paymentMethods: Record<string, number> = {};
    const hourlySales: Record<number, number> = {};
    const turnTimes: number[] = [];

    for (const order of allOrders) {
      // Skip voided orders
      if (order.voided) continue;

      // Filter by time of day if specified
      if (maxHour !== null && maxMinute !== null) {
        const orderDate = new Date(order.openedDate || order.createdDate);
        const orderHour = orderDate.getUTCHours();
        const orderMinute = orderDate.getUTCMinutes();

        // Convert UTC to Central Time (approximate: UTC-6)
        let centralHour = orderHour - 6;
        if (centralHour < 0) centralHour += 24;

        if (centralHour > maxHour || (centralHour === maxHour && orderMinute > maxMinute)) {
          continue;
        }
      }

      let orderNetSales = 0;
      let hasValidCheck = false;

      const checks = order.checks || [];
      for (const check of checks) {
        // Skip voided checks
        if (check.voided) continue;

        // Only count CLOSED checks (completed transactions) - matching Dashboard
        if (check.paymentStatus !== 'CLOSED') continue;

        hasValidCheck = true;

        // Use check.amount for net sales (pre-tax)
        let checkAmount = check.amount || 0;

        // Subtract any refunds
        const payments = check.payments || [];
        for (const payment of payments) {
          if (payment.refund && payment.refund.refundAmount) {
            checkAmount -= payment.refund.refundAmount;
          }
          totalTips += payment.tipAmount || 0;
          const method = payment.type || payment.cardType || 'Unknown';
          paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amount || 0);
        }

        orderNetSales += checkAmount;
        totalTax += check.taxAmount || 0;
      }

      if (hasValidCheck && orderNetSales > 0) {
        netSales += orderNetSales;
        validOrderCount++;

        // Hourly breakdown
        const hour = new Date(order.openedDate || order.createdDate).getUTCHours();
        hourlySales[hour] = (hourlySales[hour] || 0) + orderNetSales;

        // Calculate turn time (order open to close) in minutes
        if (order.openedDate && order.closedDate) {
          const opened = new Date(order.openedDate).getTime();
          const closed = new Date(order.closedDate).getTime();
          const turnTimeMinutes = (closed - opened) / 1000 / 60;
          if (turnTimeMinutes > 0 && turnTimeMinutes < 120) {
            turnTimes.push(turnTimeMinutes);
          }
        }
      }
    }

    // Calculate average turn time
    const avgTurnTime = turnTimes.length > 0
      ? turnTimes.reduce((sum, t) => sum + t, 0) / turnTimes.length
      : 0;

    const salesData = {
      location: locationKey,
      startDate: startDateStr,
      endDate: endDateStr,
      totalSales: Math.round(netSales * 100) / 100,
      netSales: Math.round(netSales * 100) / 100,
      totalTax: Math.round(totalTax * 100) / 100,
      grossSales: Math.round((netSales + totalTax) * 100) / 100,
      totalOrders: validOrderCount,
      averageCheck: validOrderCount > 0 ? Math.round((netSales / validOrderCount) * 100) / 100 : 0,
      totalTips: Math.round(totalTips * 100) / 100,
      averageTurnTime: avgTurnTime,
      paymentMethods,
      hourlySales,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Toast Sales] SUCCESS: ${locationKey} = $${salesData.totalSales} net, ${salesData.totalOrders} orders from ${allOrders.length} raw`);

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(salesData);

  } catch (error: any) {
    console.error(`[Toast Sales] ERROR for ${locationKey}:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch sales data', message: error.message });
  }
}
