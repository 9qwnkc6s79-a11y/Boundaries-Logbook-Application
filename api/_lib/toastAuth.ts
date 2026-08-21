/**
 * Shared Toast machine-client auth + restaurant GUIDs.
 * Matches the pattern in api/toast-orders.ts.
 */

export const TOAST_API = 'https://ws-api.toasttab.com';

export const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

export const STORE_BY_LOCATION: Record<string, string> = {
  littleelm: 'store-elm',
  prosper: 'store-prosper',
};

export const LOCATION_BY_RESTAURANT: Record<string, string> = Object.fromEntries(
  Object.entries(RESTAURANTS).map(([location, guid]) => [guid.toLowerCase(), location])
);

export const DEFAULT_ORG_ID = 'org-boundaries';

let cachedToken: { token: string; expires: number } | null = null;

export async function getAuthToken(): Promise<string> {
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
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' }),
  });

  if (!response.ok) {
    throw new Error(`Toast auth failed (${response.status})`);
  }

  const data = await response.json();
  const token = data.token?.accessToken || data.accessToken;
  if (!token) throw new Error('Invalid auth response');

  cachedToken = {
    token,
    expires: Date.now() + 23 * 60 * 60 * 1000,
  };

  return token;
}

export function resolveLocation(raw?: string | string[]): string {
  const key = (Array.isArray(raw) ? raw[0] : raw)?.toLowerCase() || 'littleelm';
  return RESTAURANTS[key] ? key : 'littleelm';
}

export function restaurantForLocation(location: string): string {
  return RESTAURANTS[location] || RESTAURANTS.littleelm;
}

export function locationForRestaurant(restaurantGuid?: string): string | null {
  if (!restaurantGuid) return null;
  return LOCATION_BY_RESTAURANT[restaurantGuid.toLowerCase()] || null;
}

export function storeIdForLocation(location: string): string {
  return STORE_BY_LOCATION[location] || 'store-elm';
}

export function setCors(res: { setHeader: (k: string, v: string) => void }, methods = 'GET, OPTIONS') {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', methods);
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Toast-Restaurant-External-ID');
}
