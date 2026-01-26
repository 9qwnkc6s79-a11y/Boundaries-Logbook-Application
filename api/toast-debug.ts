/**
 * Debug endpoint to see raw Toast order structure
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

async function getAuthToken(): Promise<string> {
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  const authResponse = await fetch('https://ws-api.toasttab.com/authentication/v1/authentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId,
      clientSecret,
      userAccessType: 'TOAST_MACHINE_CLIENT'
    })
  });

  const authData = await authResponse.json();
  return authData.token.accessToken;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;
  
  try {
    const token = await getAuthToken();
    
    // Fetch just 1 hour to get sample orders
    const start = new Date('2026-01-25T15:00:00.000Z');
    const end = new Date('2026-01-25T16:00:00.000Z');
    
    const url = `https://ws-api.toasttab.com/orders/v2/ordersBulk?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid!,
      },
    });
    
    const data = await response.json();
    
    // Return first order's structure
    const orders = Array.isArray(data) ? data : (data.data || []);
    
    return res.status(200).json({
      totalOrders: orders.length,
      sampleOrder: orders[0] || null,
      orderKeys: orders[0] ? Object.keys(orders[0]) : [],
    });
    
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
