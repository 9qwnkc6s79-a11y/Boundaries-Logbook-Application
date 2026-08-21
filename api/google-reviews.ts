/**
 * Vercel Serverless Function: Google Places Reviews API Proxy
 * Fetches reviews for specified store location using Places API
 * Uses legacy Places API to support reviews_sort=newest
 *
 * Self-contained: do not import ./_lib (Vercel ESM cannot resolve those).
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Pinned Place IDs — source of truth. Verified against public Google Maps
// (Little Elm: 27078 E University Dr, Savannah/Little Elm TX;
//  Prosper/Celina: 1410 W Frontier Pkwy).
//
// Do NOT prefer Vercel env VITE_GOOGLE_PLACE_ID_LITTLEELM / _PROSPER.
// Those production values are reversed. Do not swap the env var names
// either: Feb 2026 code read the opposite var, Aug 9 PR #22 un-crossed
// the names, and ManagerHub v4 then flipped every stored row. A third
// name-swap or blanket store-elm ↔ store-prosper flip would scramble
// older trackedReviews.
//
// Unused (reversed in production — do not reintroduce as fallback):
//   process.env.VITE_GOOGLE_PLACE_ID_LITTLEELM
//   process.env.VITE_GOOGLE_PLACE_ID_PROSPER
const PLACE_IDS: Record<string, string> = {
  littleelm: 'ChIJ0ZxTHVs_FUQRd_o0bDQBv4M',
  prosper: 'ChIJRWTcb9hBTIYRdcWWthkQiHA',
};

function json(res: VercelResponse, status: number, body: Record<string, unknown>) {
  return res.status(status).json(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  const location = (Array.isArray(req.query.location)
    ? req.query.location[0]
    : req.query.location)?.toLowerCase() || 'littleelm';

  const placeId = PLACE_IDS[location];
  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!apiKey || !placeId) {
    return json(res, 200, {
      location,
      placeId: placeId || null,
      reviews: [],
      fetchedAt: new Date().toISOString(),
      configured: false,
    });
  }

  try {
    // Use legacy Places API which supports reviews_sort=newest
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&reviews_sort=newest&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Reviews] API error (${response.status}):`, errorText);
      return json(res, response.status, {
        error: 'Google Places API error',
        details: errorText.substring(0, 200),
      });
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`[Google Reviews] Places API status: ${data.status}`, data.error_message);
      return json(res, 200, {
        location,
        placeId,
        reviews: [],
        fetchedAt: new Date().toISOString(),
        configured: true,
        error: data.error_message || data.status,
      });
    }

    const reviews = (data.result?.reviews || []).map((r: any) => ({
      authorName: r.author_name || 'Anonymous',
      rating: r.rating || 0,
      text: r.text || '',
      publishTime: r.time ? new Date(r.time * 1000).toISOString() : '',
      profilePhotoUrl: r.profile_photo_url || null,
    }));

    console.log(`[Google Reviews] Fetched ${reviews.length} reviews for ${location} (sorted by newest)`);

    res.setHeader('Cache-Control', 's-maxage=120');
    return json(res, 200, {
      location,
      placeId,
      reviews,
      fetchedAt: new Date().toISOString(),
      configured: true,
    });
  } catch (error: any) {
    console.error('[Google Reviews] Unhandled error:', error);
    return json(res, 500, {
      error: 'Failed to fetch Google reviews',
      message: error.message,
    });
  }
}
