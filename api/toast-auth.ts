/**
 * Vercel Serverless Function: Toast Authentication
 *
 * Gets and caches Toast OAuth2 access token
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Cache token in memory (Vercel serverless functions are stateless, but this helps within a single instance)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get Toast credentials from environment
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: 'Toast API not configured' });
  }

  try {
    // Check if we have a valid cached token
    const now = Date.now();
    if (cachedToken && tokenExpiry > now) {
      console.log('[Toast Auth] Using cached token');
      return res.status(200).json({
        accessToken: cachedToken,
        expiresIn: Math.floor((tokenExpiry - now) / 1000)
      });
    }

    console.log('[Toast Auth] Fetching new token');

    // Get new token from Toast
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
      console.error(`[Toast Auth] Error ${authResponse.status}: ${errorText}`);
      return res.status(authResponse.status).json({
        error: `Toast Auth Error: ${authResponse.statusText}`,
        details: errorText
      });
    }

    const authData = await authResponse.json();

    // Extract token from nested structure
    if (!authData.token || !authData.token.accessToken) {
      console.error('[Toast Auth] Invalid response structure:', authData);
      return res.status(500).json({
        error: 'Invalid auth response from Toast',
        details: 'Token not found in response'
      });
    }

    cachedToken = authData.token.accessToken;
    // Set expiry to 23 hours (token valid for 24 hours, refresh before expiry)
    tokenExpiry = now + (23 * 60 * 60 * 1000);

    console.log('[Toast Auth] Token obtained successfully');

    // Cache for 1 hour on client side
    res.setHeader('Cache-Control', 's-maxage=3600');

    return res.status(200).json({
      accessToken: cachedToken,
      expiresIn: authData.token.expiresIn || 86400
    });

  } catch (error: any) {
    console.error('[Toast Auth] Failed:', error);
    return res.status(500).json({
      error: 'Failed to authenticate with Toast',
      message: error.message
    });
  }
}
