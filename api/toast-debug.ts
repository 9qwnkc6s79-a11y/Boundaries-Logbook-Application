/**
 * Debug endpoint to check restaurant and sales field details
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
  const restaurantGuid = req.query.guid as string || process.env.VITE_TOAST_RESTAURANT_GUID;
  
  try {
    const token = await getAuthToken();
    
    // Try to get restaurant info
    const restaurantResponse = await fetch(`https://ws-api.toasttab.com/restaurants/v1/restaurants/${restaurantGuid}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    });
    
    let restaurantInfo = null;
    if (restaurantResponse.ok) {
      restaurantInfo = await restaurantResponse.json();
    }
    
    // Fetch sample order to see all amount fields
    const start = new Date('2026-01-25T15:00:00.000Z');
    const end = new Date('2026-01-25T16:00:00.000Z');
    
    const url = `https://ws-api.toasttab.com/orders/v2/ordersBulk?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    });
    
    const data = await response.json();
    const orders = Array.isArray(data) ? data : (data.data || []);
    
    // Extract all amount-related fields from first order's check
    const sampleCheck = orders[0]?.checks?.[0] || null;
    const checkAmountFields = sampleCheck ? {
      amount: sampleCheck.amount,
      totalAmount: sampleCheck.totalAmount,
      taxAmount: sampleCheck.taxAmount,
      // Look for net sales fields
      netAmount: sampleCheck.netAmount,
      subtotal: sampleCheck.subtotal,
      allKeys: Object.keys(sampleCheck),
    } : null;

    return res.status(200).json({
      testedGuid: restaurantGuid,
      restaurantInfo: restaurantInfo ? {
        name: restaurantInfo.name || restaurantInfo.restaurantName,
        location: restaurantInfo.location,
        allKeys: Object.keys(restaurantInfo),
      } : 'Could not fetch restaurant info',
      ordersFound: orders.length,
      checkAmountFields,
      sampleCheckFull: sampleCheck,
    });
    
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
