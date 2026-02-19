/**
 * Vercel Serverless Function: Google Places Reviews API Proxy
 * Fetches reviews for specified store location using Places API
 * Uses legacy Places API to support reviews_sort=newest
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
    // Use legacy Places API which supports reviews_sort=newest
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews&reviews_sort=newest&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Google Reviews] API error (${response.status}):`, errorText);
      return res.status(response.status).json({
        error: 'Google Places API error',
        details: errorText.substring(0, 200),
      });
    }

    const data = await response.json();

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error(`[Google Reviews] Places API status: ${data.status}`, data.error_message);
      return res.status(200).json({
        location,
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
