/**
 * Vercel Serverless Function: Toast Sales API Proxy
 *
 * Fetches sales data using OAuth2 authentication and ordersBulk endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getAuthToken(): Promise<string> {
  // Get credentials directly instead of calling another endpoint
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  // Authenticate with Toast
  const authResponse = await fetch('https://ws-api.toasttab.com/authentication/v1/authentication/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT'
    })
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error('[Toast Auth] Error:', errorText);
    throw new Error(`Toast authentication failed: ${authResponse.statusText}`);
  }

  const authData = await authResponse.json();

  // Extract token from nested structure
  if (!authData.token || !authData.token.accessToken) {
    throw new Error('Invalid auth response from Toast');
  }

  return authData.token.accessToken;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;

  if (!restaurantGuid) {
    return res.status(500).json({ error: 'Toast API not configured' });
  }

  try {
    console.log(`[Toast Sales] Fetching: ${startDate} to ${endDate}`);

    // Get OAuth2 token
    const token = await getAuthToken();

    // Convert dates to full ISO format with milliseconds (required by Toast)
    const start = new Date(`${startDate}T00:00:00.000Z`);
    const end = new Date(`${endDate}T23:59:59.999Z`);

    // Toast Standard API: 1-hour limit per request
    // Break into hourly chunks if needed
    const hoursDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const allOrders: any[] = [];

    if (hoursDiff <= 1) {
      // Single request
      const orders = await fetchOrdersChunk(start.toISOString(), end.toISOString(), token, restaurantGuid);
      allOrders.push(...orders);
    } else {
      // Multiple hourly requests
      let current = new Date(start);
      while (current < end) {
        const chunkEnd = new Date(Math.min(current.getTime() + (60 * 60 * 1000), end.getTime()));
        const orders = await fetchOrdersChunk(current.toISOString(), chunkEnd.toISOString(), token, restaurantGuid);
        allOrders.push(...orders);
        current = chunkEnd;
      }
    }

    // Process orders
    const totalSales = allOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const totalOrders = allOrders.length;
    const totalTips = allOrders.reduce((sum, order) => sum + (order.tip || 0), 0);

    // Payment methods
    const paymentMethods: Record<string, number> = {};
    allOrders.forEach(order => {
      const method = order.paymentType || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + (order.totalAmount || 0);
    });

    // Hourly breakdown
    const hourlySales: Record<number, number> = {};
    allOrders.forEach(order => {
      const hour = new Date(order.createdDate).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + (order.totalAmount || 0);
    });

    const salesData = {
      startDate,
      endDate,
      totalSales: totalSales / 100, // Toast stores in cents
      totalOrders,
      averageCheck: totalOrders > 0 ? totalSales / totalOrders / 100 : 0,
      totalTips: totalTips / 100,
      paymentMethods,
      hourlySales,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Toast Sales] Success: ${totalOrders} orders, $${salesData.totalSales.toFixed(2)}`);

    res.setHeader('Cache-Control', 's-maxage=120');
    return res.status(200).json(salesData);

  } catch (error: any) {
    console.error('[Toast Sales] Failed:', error);
    return res.status(500).json({
      error: 'Failed to fetch sales data',
      message: error.message
    });
  }
}

async function fetchOrdersChunk(startDate: string, endDate: string, token: string, restaurantGuid: string): Promise<any[]> {
  // Use ordersBulk endpoint (returns full order objects)
  const url = `https://ws-api.toasttab.com/orders/v2/ordersBulk?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Toast-Restaurant-External-ID': restaurantGuid,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[Toast Sales] Chunk error ${response.status}: ${errorText}`);
    throw new Error(`Toast API Error: ${response.statusText}`);
  }

  return response.json();
}
