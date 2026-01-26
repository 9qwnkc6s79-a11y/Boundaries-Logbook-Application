/**
 * Vercel Serverless Function: Toast Sales API Proxy
 *
 * Fetches sales data using OAuth2 authentication and orders endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT'
    })
  });

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    throw new Error(`Toast auth failed (${authResponse.status}): ${errorText}`);
  }

  const authData = await authResponse.json();
  if (!authData.token?.accessToken) {
    throw new Error('Invalid auth response from Toast');
  }
  return authData.token.accessToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate } = req.query;
  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
  const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;

  if (!restaurantGuid) {
    return res.status(500).json({ error: 'Toast API not configured' });
  }

  try {
    const token = await getAuthToken();
    const start = new Date(`${startDateStr}T00:00:00.000`);
    const end = new Date(`${endDateStr}T23:59:59.999`);
    
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

    // Process orders - Toast stores amounts in DOLLARS (not cents!)
    let totalSales = 0;
    let totalTips = 0;
    const paymentMethods: Record<string, number> = {};
    const hourlySales: Record<number, number> = {};

    allOrders.forEach(order => {
      // Sum up all checks in the order
      const checks = order.checks || [];
      checks.forEach((check: any) => {
        const checkTotal = check.totalAmount || 0;
        totalSales += checkTotal;
        
        // Get tips and payment types from payments
        const payments = check.payments || [];
        payments.forEach((payment: any) => {
          totalTips += payment.tipAmount || 0;
          const method = payment.type || payment.cardType || 'Unknown';
          paymentMethods[method] = (paymentMethods[method] || 0) + (payment.amount || 0);
        });
      });
      
      // Hourly breakdown
      const hour = new Date(order.openedDate || order.createdDate).getHours();
      hourlySales[hour] = (hourlySales[hour] || 0) + checks.reduce((sum: number, c: any) => sum + (c.totalAmount || 0), 0);
    });

    const salesData = {
      startDate: startDateStr,
      endDate: endDateStr,
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders: allOrders.length,
      averageCheck: allOrders.length > 0 ? Math.round((totalSales / allOrders.length) * 100) / 100 : 0,
      totalTips: Math.round(totalTips * 100) / 100,
      paymentMethods,
      hourlySales,
      requestsMade: requestCount,
      lastUpdated: new Date().toISOString(),
    };

    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(salesData);

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch sales data',
      message: error.message,
    });
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
