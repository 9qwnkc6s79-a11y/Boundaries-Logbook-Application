/**
 * Vercel Serverless Function: Google Places Reviews API Proxy
 * Fetches reviews for specified store location using Places API (New)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const PLACE_IDS: Record<string, string> = {
  'littleelm': process.env.VITE_GOOGLE_PLACE_ID_LITTLEELM || '',
  'prosper': process.env.VITE_GOOGLE_PLACE_ID_PROSPER || '',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const location = (Array.isArray(req.query.location)
    ? req.query.location[0]
    : req.query.location)?.toLowerCase() || 'littleelm';

  const placeId = PLACE_IDS[location];
  const apiKey = process.env.VITE_GOOGLE_PLACES_API_KEY;

  if (!apiKey || !placeId) {
    return res.status(200).json({
      location,
      reviews: [],
      fetchedAt: new Date().toISOString(),
      configured: false,
    });
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'reviews',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Reviews] API error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: 'Google Places API error',
        details: errorText.substring(0, 200),
      });
    }

    const data = await response.json();

    const reviews = (data.reviews || []).map((r: any) => ({
      authorName: r.authorAttribution?.displayName || 'Anonymous',
      rating: r.rating || 0,
      text: r.text?.text || r.originalText?.text || '',
      publishTime: r.publishTime || '',
      profilePhotoUrl: r.authorAttribution?.photoUri || null,
    }));

    console.log(`[Google Reviews] Fetched ${reviews.length} reviews for ${location}`);

    res.setHeader('Cache-Control', 's-maxage=120');
    return res.status(200).json({
      location,
      reviews,
      fetchedAt: new Date().toISOString(),
      configured: true,
    });
  } catch (error: any) {
    console.error('[Google Reviews] Unhandled error:', error);
    return res.status(500).json({
      error: 'Failed to fetch Google reviews',
      message: error.message,
    });
  }
}
