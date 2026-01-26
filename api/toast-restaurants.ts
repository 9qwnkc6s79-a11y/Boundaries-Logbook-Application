/**
 * List all restaurants accessible with current Toast credentials
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  try {
    const token = await getAuthToken();

    // Try to get restaurant info from Toast
    const response = await fetch('https://ws-api.toasttab.com/config/v2/restaurants', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({
        error: 'Failed to fetch restaurants',
        details: errorText
      });
    }

    const data = await response.json();

    // Extract useful info
    const restaurants = Array.isArray(data) ? data : [data];
    const formatted = restaurants.map((r: any) => ({
      guid: r.guid || r.externalId || r.restaurantGuid,
      name: r.name || r.restaurantName,
      locationName: r.locationName,
      address: r.address,
    }));

    return res.status(200).json({
      count: formatted.length,
      restaurants: formatted,
      raw: data // Include raw response for debugging
    });

  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch restaurants',
      message: error.message
    });
  }
}
