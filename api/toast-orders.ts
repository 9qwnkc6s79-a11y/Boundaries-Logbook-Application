/**
 * Vercel Serverless Function: Toast Orders API
 * Fetches closed orders with details for shift leader attribution
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOAST_API = 'https://ws-api.toasttab.com';

// Restaurant GUIDs - hardcoded with env var fallbacks for serverless compatibility
const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

// In-memory token cache
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
    expires: Date.now() + 23 * 60 * 60 * 1000
  };

  return token;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  openedAt: string;
  closedAt: string;
  netAmount: number;
  turnTimeMinutes: number;
  guestCount: number;
  checkGuid: string;
  paymentStatus: string;
}

// Fetch orders with pagination
async function getClosedOrders(
  restaurantGuid: string,
  startDate: string,
  endDate: string,
  token: string
): Promise<OrderDetail[]> {
  const allOrders: OrderDetail[] = [];
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
      if (response.status === 404) break;
      const errorText = await response.text();
      throw new Error(`Toast API Error (${response.status}): ${errorText.substring(0, 100)}`);
    }

    const orders = await response.json();

    if (Array.isArray(orders) && orders.length > 0) {
      // Process each order
      for (const order of orders) {
        // Skip voided orders
        if (order.voided) continue;

        // Process each check in the order
        const checks = order.checks || [];
        for (const check of checks) {
          // Only include CLOSED checks (completed transactions)
          if (check.voided || check.paymentStatus !== 'CLOSED') continue;

          // Calculate turn time
          const openedAt = order.openedDate || order.createdDate;
          const closedAt = order.closedDate || check.closedDate;

          if (!openedAt || !closedAt) continue;

          const openedTime = new Date(openedAt).getTime();
          const closedTime = new Date(closedAt).getTime();
          const turnTimeMinutes = (closedTime - openedTime) / 1000 / 60;

          // Skip invalid turn times (negative or outliers > 15 min which are likely technical errors)
          if (turnTimeMinutes < 0 || turnTimeMinutes > 15) continue;

          allOrders.push({
            id: order.guid,
            orderNumber: order.displayNumber || order.guid.substring(0, 8),
            openedAt,
            closedAt,
            netAmount: check.amount || 0,
            turnTimeMinutes: Math.round(turnTimeMinutes * 100) / 100,
            guestCount: order.numberOfGuests || 1,
            checkGuid: check.guid,
            paymentStatus: check.paymentStatus,
          });
        }
      }

      if (orders.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    } else {
      hasMore = false;
    }

    // Safety limit
    if (page > 50) {
      console.warn('[Toast Orders] Hit pagination safety limit');
      break;
    }
  }

  console.log(`[Toast Orders] Fetched ${allOrders.length} closed orders across ${page} page(s)`);
  return allOrders;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

  const restaurantGuid = RESTAURANTS[locationKey] || RESTAURANTS['littleelm'];

  if (!restaurantGuid) {
    return res.status(500).json({ error: 'Toast API not configured for this location' });
  }

  console.log(`[Toast Orders] Fetching ${locationKey} orders from ${startDateStr} to ${endDateStr}`);

  try {
    const token = await getAuthToken();
    const orders = await getClosedOrders(restaurantGuid, startDateStr, endDateStr, token);

    // Sort by openedAt (oldest first for attribution processing)
    orders.sort((a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime());

    console.log(`[Toast Orders] SUCCESS: ${orders.length} orders for ${locationKey}`);

    res.setHeader('Cache-Control', 's-maxage=60'); // Cache for 1 minute
    return res.status(200).json({
      location: locationKey,
      startDate: startDateStr,
      endDate: endDateStr,
      orderCount: orders.length,
      orders,
    });

  } catch (error: any) {
    console.error(`[Toast Orders] ERROR:`, error.message);
    return res.status(500).json({ error: 'Failed to fetch orders', message: error.message });
  }
}
