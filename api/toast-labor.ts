/**
 * Vercel Serverless Function: Toast Labor API Proxy
 *
 * Fetches labor/time entries using OAuth2 authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Restaurant GUIDs - hardcoded with env var fallbacks for serverless compatibility
const RESTAURANTS: Record<string, string> = {
  littleelm: process.env.TOAST_RESTAURANT_LITTLEELM || '40980097-47ac-447d-8221-a5574db1b2f7',
  prosper: process.env.TOAST_RESTAURANT_PROSPER || 'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
};

// In-memory caches (persist across requests on warm Vercel instances)
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid
  const now = Date.now();
  if (cachedToken && tokenExpiry > now) {
    return cachedToken;
  }

  const clientId = process.env.VITE_TOAST_CLIENT_ID || process.env.TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY || process.env.TOAST_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

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
    console.error('[Toast Auth] HTTP', authResponse.status, ':', errorText);
    throw new Error(`Toast auth failed (${authResponse.status}): ${errorText}`);
  }

  const authData = await authResponse.json();

  if (!authData.token || !authData.token.accessToken) {
    throw new Error('Invalid auth response from Toast');
  }

  cachedToken = authData.token.accessToken;
  tokenExpiry = now + (23 * 60 * 60 * 1000); // 23 hours
  return cachedToken;
}

async function fetchEmployees(token: string, restaurantGuid: string): Promise<Map<string, string>> {
  const employeeMap = new Map<string, string>();

  try {
    const response = await fetch('https://ws-api.toasttab.com/labor/v1/employees', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`[Toast Employees] Failed to fetch employees: ${response.status}`);
      return employeeMap;
    }

    const data = await response.json();
    const employees = Array.isArray(data) ? data : (data.employees || []);

    employees.forEach((emp: any) => {
      const guid = emp.guid || emp.id;
      let name = 'Unknown';

      if (emp.chosenName) {
        name = emp.chosenName;
      } else if (emp.firstName && emp.lastName) {
        name = `${emp.firstName} ${emp.lastName}`;
      } else if (emp.firstName) {
        name = emp.firstName;
      } else if (emp.externalEmployeeId) {
        name = emp.externalEmployeeId;
      }

      if (guid) {
        employeeMap.set(guid, name);
      }
    });

    console.log(`[Toast Employees] Fetched ${employeeMap.size} employees`);
  } catch (error: any) {
    console.log(`[Toast Employees] Error fetching employees: ${error.message}`);
  }

  return employeeMap;
}

async function fetchJobs(token: string, restaurantGuid: string): Promise<Map<string, string>> {
  const jobMap = new Map<string, string>();

  try {
    const response = await fetch('https://ws-api.toasttab.com/labor/v1/jobs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.log(`[Toast Jobs] Failed to fetch jobs: ${response.status}`);
      return jobMap;
    }

    const data = await response.json();
    const jobs = Array.isArray(data) ? data : (data.jobs || []);

    jobs.forEach((job: any) => {
      const guid = job.guid || job.id;
      const name = job.title || job.name || 'Unknown';
      if (guid) {
        jobMap.set(guid, name);
      }
    });

    console.log(`[Toast Jobs] Fetched ${jobMap.size} jobs:`, Array.from(jobMap.entries()).map(([g, n]) => `${n} (${g.substring(0,8)}...)`).join(', '));
  } catch (error: any) {
    console.log(`[Toast Jobs] Error fetching jobs: ${error.message}`);
  }

  return jobMap;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { startDate, endDate, location } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate and endDate are required' });
    }

    // Ensure query params are strings (not arrays)
    const startDateStr = Array.isArray(startDate) ? startDate[0] : startDate;
    const endDateStr = Array.isArray(endDate) ? endDate[0] : endDate;
    const locationKey = (Array.isArray(location) ? location[0] : location)?.toLowerCase() || 'littleelm';

    // Get restaurant GUID for this location
    const restaurantGuid = RESTAURANTS[locationKey] || RESTAURANTS['littleelm'];

    if (!restaurantGuid) {
      return res.status(500).json({ error: 'Toast API not configured for this location' });
    }

    console.log(`[Toast Labor] Fetching ${locationKey} (${restaurantGuid.substring(0, 8)}...): ${startDateStr} to ${endDateStr}`);

    // Get OAuth2 token
    const token = await getAuthToken();

    // Labor API uses businessDate format (YYYYMMDD)
    const businessDate = startDateStr.replace(/-/g, '');

    // Check if this is today's date - if so, include open entries
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const isToday = businessDate === todayStr;

    // Fetch labor data + employees + jobs in parallel for speed
    // Use open=true for today to include currently clocked-in staff, omit for historical dates
    const laborUrl = isToday
      ? `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}&open=true`
      : `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}`;

    const [laborResponse, employeeMap, jobMap] = await Promise.all([
      fetch(laborUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Toast-Restaurant-External-ID': restaurantGuid,
          'Content-Type': 'application/json',
        },
      }),
      fetchEmployees(token, restaurantGuid),
      fetchJobs(token, restaurantGuid),
    ]);

    if (!laborResponse.ok) {
      const errorText = await laborResponse.text();
      console.error(`[Toast Labor] Failed for ${locationKey}: ${laborResponse.status} - ${errorText}`);
      return res.status(500).json({
        error: `Toast API Error for ${locationKey}`,
        details: `${laborResponse.status}: ${errorText.substring(0, 100)}`
      });
    }

    const data = await laborResponse.json();

    // Process time entries
    // IMPORTANT: With ?open=true, Toast returns array directly, not wrapped in {timeEntries: [...]}
    const rawEntries = Array.isArray(data) ? data : (data.timeEntries || []);
    const timeEntries = rawEntries.map((entry: any) => {
      const employeeGuid = entry.employeeReference?.guid || entry.employee?.guid || '';

      // First, try to get name from employee map (most reliable)
      let employeeName = employeeMap.get(employeeGuid);

      // If not found in map, extract from entry data
      if (!employeeName) {
        if (entry.employee) {
          // If full employee object is included
          if (entry.employee.chosenName) {
            employeeName = entry.employee.chosenName;
          } else if (entry.employee.firstName && entry.employee.lastName) {
            employeeName = `${entry.employee.firstName} ${entry.employee.lastName}`;
          } else if (entry.employee.firstName) {
            employeeName = entry.employee.firstName;
          }
        } else if (entry.employeeReference) {
          // If only reference is included
          if (entry.employeeReference.firstName && entry.employeeReference.lastName) {
            employeeName = `${entry.employeeReference.firstName} ${entry.employeeReference.lastName}`;
          } else if (entry.employeeReference.firstName) {
            employeeName = entry.employeeReference.firstName;
          } else if (entry.employeeReference.entityId) {
            // entityId might be the employee number or username
            employeeName = entry.employeeReference.entityId;
          }
        }
      }

      // Fallback to Unknown if still not found
      if (!employeeName) {
        employeeName = 'Unknown';
      }

      // Resolve job name: try inline name first, then look up GUID in jobs map
      const jobGuid = entry.jobReference?.guid || entry.job?.guid || '';
      let jobName = entry.jobReference?.name || entry.job?.name || '';
      if (!jobName && jobGuid) {
        jobName = jobMap.get(jobGuid) || '';
      }
      if (!jobName) {
        jobName = 'Staff';
      }

      return {
        employeeGuid: employeeGuid,
        employeeName: employeeName,
        jobName: jobName,
        inDate: entry.inDate,
        outDate: entry.outDate || null,
        regularHours: entry.regularHours || 0,
        overtimeHours: entry.overtimeHours || 0,
        totalHours: (entry.regularHours || 0) + (entry.overtimeHours || 0),
        deleted: entry.deleted || false,
      };
    }).filter((entry: any) => !entry.deleted);

    // Calculate labor summary
    const laborSummaryMap = new Map<string, any>();

    timeEntries.forEach((entry: any) => {
      const existing = laborSummaryMap.get(entry.employeeGuid);

      if (existing) {
        existing.totalHours += entry.totalHours;
        existing.regularHours += entry.regularHours;
        existing.overtimeHours += entry.overtimeHours;
        existing.shifts += 1;
      } else {
        laborSummaryMap.set(entry.employeeGuid, {
          employeeGuid: entry.employeeGuid,
          employeeName: entry.employeeName,
          jobName: entry.jobName,
          totalHours: entry.totalHours,
          regularHours: entry.regularHours,
          overtimeHours: entry.overtimeHours,
          shifts: 1,
        });
      }
    });

    const laborSummary = Array.from(laborSummaryMap.values()).sort((a, b) => b.totalHours - a.totalHours);

    // Currently clocked in (no outDate, null outDate, or empty string outDate)
    const currentlyClocked = timeEntries.filter((entry: any) => {
      const hasNoOutDate = !entry.outDate || entry.outDate === null || entry.outDate === '' || entry.outDate === undefined;
      return hasNoOutDate;
    });

    console.log(`[Toast Labor] SUCCESS for ${locationKey}: ${timeEntries.length} total entries`);
    console.log(`[Toast Labor] Currently clocked in: ${currentlyClocked.length}`);

    // Debug: Log raw data structure from first entry to see what Toast actually returns
    if (timeEntries.length > 0 && rawEntries[0]) {
      console.log(`[Toast Labor] RAW API RESPONSE (first entry):`, JSON.stringify({
        employeeReference: rawEntries[0].employeeReference,
        employee: rawEntries[0].employee,
        jobReference: rawEntries[0].jobReference,
        inDate: rawEntries[0].inDate,
        outDate: rawEntries[0].outDate
      }));
    }

    if (currentlyClocked.length > 0) {
      console.log(`[Toast Labor] WHO'S CLOCKED IN:`, currentlyClocked.map(e =>
        `${e.employeeName} (${e.jobName}) - IN: ${e.inDate?.substring(11,19) || 'unknown'}`
      ).join(', '));
    } else {
      console.log(`[Toast Labor] ⚠️ NO STAFF CLOCKED IN - Showing all entries for debugging:`);
      timeEntries.slice(0, 10).forEach((e: any) => {
        console.log(`  - ${e.employeeName}: IN=${e.inDate?.substring(11,19) || 'null'}, OUT=${e.outDate?.substring(11,19) || 'NONE'}, outDate type=${typeof e.outDate}`);
      });
    }

    const result = {
      timeEntries,
      laborSummary,
      currentlyClocked,
      lastUpdated: new Date().toISOString(),
    };

    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[Toast Labor] UNHANDLED ERROR:', error);
    console.error('[Toast Labor] Error stack:', error.stack);
    console.error('[Toast Labor] Error type:', error.constructor.name);

    // Ensure we always return JSON, never HTML
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      error: 'Failed to fetch labor data',
      message: error.message || 'Unknown error',
      type: error.constructor?.name || 'Error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
