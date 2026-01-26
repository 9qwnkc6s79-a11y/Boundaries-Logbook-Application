/**
 * Toast API Health Check
 * Verifies that credentials are configured and can authenticate
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;
  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;

  const status = {
    configured: {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      restaurantGuid: !!restaurantGuid,
    },
    values: {
      clientId: clientId ? clientId.substring(0, 10) + '...' : 'NOT SET',
      clientSecretLength: clientSecret?.length || 0,
      restaurantGuid: restaurantGuid ? restaurantGuid.substring(0, 10) + '...' : 'NOT SET',
    },
    authTest: null as any
  };

  // Try to authenticate
  if (clientId && clientSecret) {
    try {
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

      status.authTest = {
        status: authResponse.status,
        statusText: authResponse.statusText,
        ok: authResponse.ok,
      };

      if (authResponse.ok) {
        const data = await authResponse.json();
        status.authTest.hasToken = !!(data?.token?.accessToken);
        status.authTest.tokenLength = data?.token?.accessToken?.length || 0;
      } else {
        const errorText = await authResponse.text();
        status.authTest.error = errorText.substring(0, 500);
      }
    } catch (error: any) {
      status.authTest = {
        error: error.message
      };
    }
  }

  return res.status(200).json(status);
}
