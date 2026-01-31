/**
 * Vercel Serverless Function: Toast Employee Sync API
 *
 * Returns the full employee list from Toast with resolved job titles,
 * location mapping, and all available fields for syncing with the logbook app.
 *
 * Supports ?location=littleelm|prosper (returns both if omitted)
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Restaurant GUIDs — same mapping as toast-labor.ts
const LOCATIONS: Record<string, { guids: string[]; storeId: string }> = {
  'littleelm': {
    guids: [process.env.VITE_TOAST_RESTAURANT_GUID || ''],
    storeId: 'store-elm',
  },
  'prosper': {
    guids: [
      'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
      'd1e0f278-e871-4635-8d33-74532858ccaf',
    ],
    storeId: 'store-prosper',
  },
};

// In-memory caches (persist across warm Vercel instances)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  const authResponse = await fetch(
    'https://ws-api.toasttab.com/authentication/v1/authentication/login',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        clientSecret,
        userAccessType: 'TOAST_MACHINE_CLIENT',
      }),
    }
  );

  if (!authResponse.ok) {
    const errorText = await authResponse.text();
    console.error('[Toast Auth] HTTP', authResponse.status, ':', errorText);
    throw new Error(`Toast auth failed (${authResponse.status}): ${errorText}`);
  }

  const authData = await authResponse.json();
  if (!authData.token || !authData.token.accessToken) {
    throw new Error('Invalid auth response from Toast');
  }

  cachedToken = authData.token.accessToken;
  tokenExpiry = now + 23 * 60 * 60 * 1000; // 23 hours
  return cachedToken;
}

async function fetchEmployeesRaw(token: string, restaurantGuid: string): Promise<any[]> {
  try {
    const response = await fetch('https://ws-api.toasttab.com/labor/v1/employees', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`[Toast Employees] Failed for GUID ${restaurantGuid.substring(0, 8)}: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return Array.isArray(data) ? data : data.employees || [];
  } catch (error: any) {
    console.log(`[Toast Employees] Error: ${error.message}`);
    return [];
  }
}

async function fetchJobs(token: string, restaurantGuid: string): Promise<Map<string, string>> {
  const jobMap = new Map<string, string>();
  try {
    const response = await fetch('https://ws-api.toasttab.com/labor/v1/jobs', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) return jobMap;

    const data = await response.json();
    const jobs = Array.isArray(data) ? data : data.jobs || [];
    jobs.forEach((job: any) => {
      const guid = job.guid || job.id;
      const name = job.title || job.name || 'Unknown';
      if (guid) jobMap.set(guid, name);
    });

    console.log(`[Toast Jobs] Fetched ${jobMap.size} jobs for GUID ${restaurantGuid.substring(0, 8)}`);
  } catch (error: any) {
    console.log(`[Toast Jobs] Error: ${error.message}`);
  }
  return jobMap;
}

interface MappedEmployee {
  guid: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  location: string;
  storeId: string;
  externalId: string;
  deleted: boolean;
}

async function fetchAndMapEmployees(
  token: string,
  locationKey: string,
  locationConfig: { guids: string[]; storeId: string }
): Promise<MappedEmployee[]> {
  const results: MappedEmployee[] = [];

  for (const guid of locationConfig.guids) {
    const [rawEmployees, jobMap] = await Promise.all([
      fetchEmployeesRaw(token, guid),
      fetchJobs(token, guid),
    ]);

    if (rawEmployees.length === 0) continue;

    for (const emp of rawEmployees) {
      const employeeGuid = emp.guid || emp.id || '';
      if (!employeeGuid) continue;

      // Build display name
      let name = 'Unknown';
      if (emp.chosenName) {
        name = emp.chosenName;
      } else if (emp.firstName && emp.lastName) {
        name = `${emp.firstName} ${emp.lastName}`;
      } else if (emp.firstName) {
        name = emp.firstName;
      }

      // Resolve job title from jobReference or jobs array
      let jobTitle = 'Staff';
      if (emp.jobReference?.guid) {
        jobTitle = jobMap.get(emp.jobReference.guid) || jobTitle;
      } else if (emp.jobs && Array.isArray(emp.jobs) && emp.jobs.length > 0) {
        // Some Toast responses include a jobs array with job references
        const firstJob = emp.jobs[0];
        const jobGuid = firstJob?.guid || firstJob?.jobReference?.guid;
        if (jobGuid) {
          jobTitle = jobMap.get(jobGuid) || firstJob?.title || firstJob?.name || jobTitle;
        }
      } else if (emp.jobTitle) {
        jobTitle = emp.jobTitle;
      }

      results.push({
        guid: employeeGuid,
        name,
        firstName: emp.firstName || '',
        lastName: emp.lastName || '',
        email: emp.email || emp.v2EmployeeGuid || '',
        phone: emp.phoneNumber || emp.phone || '',
        jobTitle,
        location: locationKey,
        storeId: locationConfig.storeId,
        externalId: emp.externalEmployeeId || '',
        deleted: emp.deleted === true,
      });
    }

    // If we got results from this GUID, no need to try the others
    if (results.length > 0) {
      console.log(`[Toast Employees] Got ${results.length} employees from GUID ${guid.substring(0, 8)} for ${locationKey}`);
      break;
    }
  }

  return results;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { location } = req.query;
    const locationKey = (Array.isArray(location) ? location[0] : location)?.toLowerCase();

    const token = await getAuthToken();

    let allEmployees: MappedEmployee[] = [];

    if (locationKey && LOCATIONS[locationKey]) {
      // Fetch single location
      allEmployees = await fetchAndMapEmployees(token, locationKey, LOCATIONS[locationKey]);
    } else {
      // Fetch both locations in parallel
      const [littleelm, prosper] = await Promise.all([
        fetchAndMapEmployees(token, 'littleelm', LOCATIONS['littleelm']),
        fetchAndMapEmployees(token, 'prosper', LOCATIONS['prosper']),
      ]);
      allEmployees = [...littleelm, ...prosper];
    }

    // Filter out deleted employees and deduplicate by GUID
    const seen = new Set<string>();
    const activeEmployees = allEmployees.filter((emp) => {
      if (emp.deleted || seen.has(emp.guid)) return false;
      seen.add(emp.guid);
      return true;
    });

    console.log(
      `[Toast Employees] Returning ${activeEmployees.length} active employees` +
        (locationKey ? ` for ${locationKey}` : ' (all locations)')
    );

    res.setHeader('Cache-Control', 's-maxage=120');
    return res.status(200).json({
      employees: activeEmployees,
      total: activeEmployees.length,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Toast Employees] UNHANDLED ERROR:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Failed to fetch employees',
      message: error.message || 'Unknown error',
    });
  }
}
