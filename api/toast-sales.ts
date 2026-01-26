/**
 * Vercel Serverless Function: Toast Sales API Proxy
 *
 * This function acts as a proxy to fetch sales data from Toast API
 * to avoid CORS issues with direct browser requests.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  // Get Toast credentials from environment
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;
  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;

  if (!clientId || !clientSecret || !restaurantGuid) {
    return res.status(500).json({ error: 'Toast API not configured' });
  }

  try {
    console.log(`[Toast Proxy] Fetching sales: ${startDate} to ${endDate}`);

    // Toast uses Basic Auth with Client ID and Client Secret
    const authString = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Call Toast Orders API
    const ordersUrl = `https://ws-api.toasttab.com/orders/v2/orders?startDate=${startDate}&endDate=${endDate}`;

    const response = await fetch(ordersUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Toast Proxy] Error ${response.status}: ${errorText}`);
      return res.status(response.status).json({
        error: `Toast API Error: ${response.statusText}`,
        details: errorText
      });
    }

    const orders = await response.json();

    // Process orders to calculate totals
    const totalSales = orders.reduce((sum: number, order: any) => sum + (order.totalAmount || 0), 0);
    const totalOrders = orders.length;
    const totalTips = orders.reduce((sum: number, order: any) => sum + (order.tip || 0), 0);

    // Calculate payment method breakdown
    const paymentMethods: Record<string, number> = {};
    orders.forEach((order: any) => {
      const method = order.paymentType || 'Unknown';
      paymentMethods[method] = (paymentMethods[method] || 0) + (order.totalAmount || 0);
    });

    // Get hourly breakdown
    const hourlySales: Record<number, number> = {};
    orders.forEach((order: any) => {
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

    console.log(`[Toast Proxy] Success: ${totalOrders} orders, $${salesData.totalSales}`);

    // Cache for 2 minutes
    res.setHeader('Cache-Control', 's-maxage=120');
    return res.status(200).json(salesData);

  } catch (error: any) {
    console.error('[Toast Proxy] Failed:', error);
    return res.status(500).json({
      error: 'Failed to fetch sales data',
      message: error.message
    });
  }
}
