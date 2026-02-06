/**
 * Vercel Serverless Function: Toast Team Leaders API
 *
 * Fetches labor data for the past N days and returns all unique employees
 * who have worked with leadership job titles (Team Leader, GM, Shift Lead, etc.)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const TOAST_API = 'https://ws-api.toasttab.com';

// Restaurant GUIDs - hardcoded with env var fallbacks
const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

// In-memory token cache
let cachedToken: { token: string; expires: number } | null = null;

async function getAuthToken(): Promise<string> {
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
    body: JSON.stringify({ clientId, clientSecret, userAccessType: 'TOAST_MACHINE_CLIENT' })
  });

  if (!response.ok) {
    throw new Error(`Toast auth failed (${response.status})`);
  }

  const data = await response.json();
  const token = data.token?.accessToken || data.accessToken;

  if (!token) throw new Error('Invalid auth response');

  cachedToken = {
    token,
    expires: Date.now() + 23 * 60 * 60 * 1000
  };

  return token;
}

// Leadership job title patterns
const LEADERSHIP_PATTERNS = [
  /\bgm\b/i,
  /\bgeneral\s*manager\b/i,
  /\bstore\s*manager\b/i,
  /\bmanager\b/i,
  /\b(team|shift)\s*(leader|lead)\b/i,
  /\bshift\s*manager\b/i,
  /\bsupervisor\b/i,
];

function isLeadershipTitle(jobTitle: string): boolean {
  return LEADERSHIP_PATTERNS.some(pattern => pattern.test(jobTitle));
}

interface TeamLeader {
  guid: string;
  name: string;
  jobTitle: string;
  lastWorked: string;
}

async function fetchJobsMap(token: string, restaurantGuid: string): Promise<Map<string, string>> {
  const jobMap = new Map<string, string>();
  try {
    const response = await fetch(`${TOAST_API}/labor/v1/jobs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
      },
    });
    if (response.ok) {
      const data = await response.json();
      const jobs = Array.isArray(data) ? data : (data.jobs || []);
      jobs.forEach((job: any) => {
        if (job.guid) jobMap.set(job.guid, job.title || job.name || 'Unknown');
      });
    }
  } catch (e) {
    console.warn('[TeamLeaders] Failed to fetch jobs:', e);
  }
  return jobMap;
}

async function fetchLaborForDate(
  token: string,
  restaurantGuid: string,
  date: string,
  jobMap: Map<string, string>
): Promise<{ guid: string; name: string; jobTitle: string }[]> {
  const businessDate = date.replace(/-/g, '');

  try {
    const response = await fetch(
      `${TOAST_API}/labor/v1/timeEntries?businessDate=${businessDate}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': restaurantGuid,
        },
      }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const entries = Array.isArray(data) ? data : (data.timeEntries || []);

    const leaders: { guid: string; name: string; jobTitle: string }[] = [];

    entries.forEach((entry: any) => {
      if (entry.deleted) return;

      const employeeGuid = entry.employeeReference?.guid || entry.employee?.guid || '';
      if (!employeeGuid) return;

      // Get employee name
      let name = 'Unknown';
      if (entry.employee?.chosenName) {
        name = entry.employee.chosenName;
      } else if (entry.employee?.firstName) {
        name = entry.employee.lastName
          ? `${entry.employee.firstName} ${entry.employee.lastName}`
          : entry.employee.firstName;
      } else if (entry.employeeReference?.firstName) {
        name = entry.employeeReference.lastName
          ? `${entry.employeeReference.firstName} ${entry.employeeReference.lastName}`
          : entry.employeeReference.firstName;
      }

      // Get job title
      const jobGuid = entry.jobReference?.guid || entry.job?.guid || '';
      let jobTitle = entry.jobReference?.name || entry.job?.name || '';
      if (!jobTitle && jobGuid) {
        jobTitle = jobMap.get(jobGuid) || '';
      }
      if (!jobTitle) jobTitle = 'Staff';

      // Check if this is a leadership role
      if (isLeadershipTitle(jobTitle)) {
        leaders.push({ guid: employeeGuid, name, jobTitle });
      }
    });

    return leaders;
  } catch (e) {
    console.warn(`[TeamLeaders] Failed to fetch labor for ${date}:`, e);
    return [];
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { location, days } = req.query;
  const locationKey = (Array.isArray(location) ? location[0] : location)?.toLowerCase() || 'littleelm';
  const lookbackDays = Math.min(parseInt(Array.isArray(days) ? days[0] : days || '30', 10), 60);

  const restaurantGuid = RESTAURANTS[locationKey];
  if (!restaurantGuid) {
    return res.status(400).json({ error: 'Invalid location' });
  }

  console.log(`[TeamLeaders] Fetching team leaders for ${locationKey} (last ${lookbackDays} days)`);

  try {
    const token = await getAuthToken();
    const jobMap = await fetchJobsMap(token, restaurantGuid);

    // Generate dates for the past N days
    const dates: string[] = [];
    const today = new Date();
    for (let i = 0; i < lookbackDays; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    // Fetch labor data for all dates (in batches to avoid rate limits)
    const teamLeaderMap = new Map<string, TeamLeader>();
    const batchSize = 5;

    for (let i = 0; i < dates.length; i += batchSize) {
      const batch = dates.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(date => fetchLaborForDate(token, restaurantGuid, date, jobMap))
      );

      results.forEach((leaders, idx) => {
        const date = batch[idx];
        leaders.forEach(leader => {
          const existing = teamLeaderMap.get(leader.guid);
          if (!existing || date > existing.lastWorked) {
            teamLeaderMap.set(leader.guid, {
              guid: leader.guid,
              name: leader.name,
              jobTitle: leader.jobTitle,
              lastWorked: date,
            });
          }
        });
      });
    }

    const teamLeaders = Array.from(teamLeaderMap.values())
      .sort((a, b) => b.lastWorked.localeCompare(a.lastWorked));

    console.log(`[TeamLeaders] Found ${teamLeaders.length} team leaders:`,
      teamLeaders.map(l => `${l.name} (${l.jobTitle})`).join(', '));

    res.setHeader('Cache-Control', 's-maxage=300'); // Cache for 5 minutes
    return res.status(200).json({
      location: locationKey,
      lookbackDays,
      teamLeaders,
      lastUpdated: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[TeamLeaders] Error:', error);
    return res.status(500).json({ error: 'Failed to fetch team leaders', message: error.message });
  }
}
