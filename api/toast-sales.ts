/**
 * Vercel Serverless Function: Toast Sales API Proxy
 *
 * Fetches sales data using OAuth2 authentication and orders endpoint
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function getAuthToken(): Promise<string> {
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

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
    console.error('[Toast Auth] HTTP', authResponse.status, ':', errorText);
    throw new Error(`Toast auth failed (${authResponse.status}): ${errorText}`);
  }

  const authData = await authResponse.json();
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

  const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
  const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;

  if (!restaurantGuid) {
    return res.status(500).json({ error: 'Toast API not configured' });
  }

  try {
    console.log(`[Toast Sales] Fetching: ${startDateStr} to ${endDateStr}`);
    const token = await getAuthToken();

    // Toast ordersBulk supports up to 1 hour per request
    // For a single day, we need to make multiple requests
    const start = new Date(`${startDateStr}T00:00:00.000`);
    const end = new Date(`${endDateStr}T23:59:59.999`);
    
    const allOrders: any[] = [];
    let current = new Date(start);
    let requestCount = 0;
    const maxRequests = 25; // Safety limit
    
    while (current < end && requestCount < maxRequests) {
      // 1-hour chunks
      const chunkEnd = new Date(Math.min(current.getTime() + (60 * 60 * 1000), end.getTime()));
      
      try {
        const orders = await fetchOrdersChunk(
          current.toISOString(),
          chunkEnd.toISOString(),
          token,
          restaurantGuid
        );
        allOrders.push(...orders);
      } catch (chunkError: any) {
        // If rate limited, wait and retry once
        if (chunkError.message?.includes('429')) {
          console.log('[Toast Sales] Rate limited, waiting 2s...');
          await delay(2000);
          try {
            const orders = await fetchOrdersChunk(
              current.toISOString(),
              chunkEnd.toISOString(),
              token,
              restaurantGuid
            );
            allOrders.push(...orders);
          } catch (retryError: any) {
            console.error('[Toast Sales] Retry also failed:', retryError.message);
            // Continue to next chunk instead of failing completely
          }
        } else if (!chunkError.message?.includes('404')) {
          // Log but don't throw for non-404 errors
          console.error('[Toast Sales] Chunk error:', chunkError.message);
        }
      }
      
      current = chunkEnd;
      requestCount++;
      
      // Small delay between requests to avoid rate limiting
      if (current < end) {
        await delay(200);
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
      startDate: startDateStr,
      endDate: endDateStr,
      totalSales: totalSales / 100,
      totalOrders,
      averageCheck: totalOrders > 0 ? totalSales / totalOrders / 100 : 0,
      totalTips: totalTips / 100,
      paymentMethods,
      hourlySales,
      requestsMade: requestCount,
      lastUpdated: new Date().toISOString(),
    };

    console.log(`[Toast Sales] Success: ${totalOrders} orders, $${salesData.totalSales.toFixed(2)}`);
    res.setHeader('Cache-Control', 's-maxage=300');
    return res.status(200).json(salesData);

  } catch (error: any) {
    console.error('[Toast Sales] Failed:', error);
    return res.status(500).json({
      error: 'Failed to fetch sales data',
      message: error.message,
      details: error.toString()
    });
  }
}

async function fetchOrdersChunk(
  startDate: string,
  endDate: string,
  token: string,
  restaurantGuid: string
): Promise<any[]> {
  const url = `https://ws-api.toasttab.com/orders/v2/ordersBulk?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
  
  console.log(`[Toast Sales] Fetching chunk: ${startDate} to ${endDate}`);

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
    console.error(`[Toast Sales] Chunk error ${response.status}: ${errorText.substring(0, 200)}`);
    
    if (response.status === 404) {
      return []; // No orders in this time range
    }
    
    throw new Error(`Toast API Error (${response.status}): ${errorText.substring(0, 100)}`);
  }

  const data = await response.json();
  console.log(`[Toast Sales] Got ${Array.isArray(data) ? data.length : 'N/A'} orders`);

  if (Array.isArray(data)) {
    return data;
  } else if (data && Array.isArray(data.data)) {
    return data.data;
  }
  
  return [];
}
