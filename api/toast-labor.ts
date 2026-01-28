/**
 * Vercel Serverless Function: Toast Labor API Proxy
 *
 * Fetches labor/time entries using OAuth2 authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Restaurant GUIDs - Prosper has multiple, try both
const LOCATIONS: Record<string, string[]> = {
  'littleelm': [process.env.VITE_TOAST_RESTAURANT_GUID || ''],
  'prosper': [
    'f5e036bc-d8d0-4da9-8ec7-aec94806253b',
    'd1e0f278-e871-4635-8d33-74532858ccaf'
  ],
};

async function getAuthToken(): Promise<string> {
  // Get credentials directly instead of calling another endpoint
  const clientId = process.env.VITE_TOAST_CLIENT_ID;
  const clientSecret = process.env.VITE_TOAST_API_KEY;

  if (!clientId || !clientSecret) {
    throw new Error('Toast credentials not configured');
  }

  // Authenticate with Toast
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
    console.error('[Toast Auth] Client ID:', clientId?.substring(0, 10) + '...');
    throw new Error(`Toast auth failed (${authResponse.status}): ${errorText}`);
  }

  const authData = await authResponse.json();
  console.log('[Toast Auth] Response:', JSON.stringify(authData).substring(0, 200));

  // Extract token from nested structure
  if (!authData.token || !authData.token.accessToken) {
    throw new Error('Invalid auth response from Toast');
  }

  return authData.token.accessToken;
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

  // Get restaurant GUIDs to try for this location
  const restaurantGuids = LOCATIONS[locationKey] || LOCATIONS['littleelm'];

  if (!restaurantGuids || restaurantGuids.length === 0) {
    return res.status(500).json({ error: 'Toast API not configured for this location' });
  }

  try {
    console.log(`[Toast Labor] Fetching ${locationKey}: ${startDateStr} to ${endDateStr}`);

    // Get OAuth2 token
    const token = await getAuthToken();

    // Labor API uses businessDate format (YYYYMMDD)
    const businessDate = startDateStr.replace(/-/g, '');

    // Try each GUID until one works
    let data: any = null;
    let lastError: any = null;
    let workingGuid: string | null = null;

    for (const guid of restaurantGuids) {
      try {
        // CRITICAL: Add ?open=true to get currently clocked-in employees
        // Without this parameter, Toast only returns completed shifts
        const laborUrl = `https://ws-api.toasttab.com/labor/v1/timeEntries?businessDate=${businessDate}&open=true`;

        const response = await fetch(laborUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Toast-Restaurant-External-ID': guid,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`${response.status}: ${errorText}`);
        }

        data = await response.json();
        workingGuid = guid;
        console.log(`[Toast Labor] Using GUID: ${guid.substring(0, 8)}... for ${locationKey}`);
        break;
      } catch (err: any) {
        lastError = err;
        console.log(`[Toast Labor] GUID ${guid.substring(0, 8)}... failed: ${err.message}`);
      }
    }

    // Fetch employee data to get proper names
    let employeeMap = new Map<string, string>();
    if (workingGuid) {
      employeeMap = await fetchEmployees(token, workingGuid);
    }

    if (!data) {
      console.error(`[Toast Labor] All GUIDs failed for ${locationKey}: ${lastError}`);
      return res.status(500).json({
        error: `Toast API Error for ${locationKey}`,
        details: lastError?.message
      });
    }

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

      return {
        employeeGuid: employeeGuid,
        employeeName: employeeName,
        jobName: entry.jobReference?.name || entry.job?.name || 'Staff',
        inDate: entry.inDate,
        outDate: entry.outDate || null,
        regularHours: entry.regularHours || 0,
        overtimeHours: entry.overtimeHours || 0,
        totalHours: (entry.regularHours || 0) + (entry.overtimeHours || 0),
        deleted: entry.deleted || false,
      };
    }).filter((entry: any) => !entry.deleted);

    // Calculate labor summary
    const employeeMap = new Map<string, any>();

    timeEntries.forEach((entry: any) => {
      const existing = employeeMap.get(entry.employeeGuid);

      if (existing) {
        existing.totalHours += entry.totalHours;
        existing.regularHours += entry.regularHours;
        existing.overtimeHours += entry.overtimeHours;
        existing.shifts += 1;
      } else {
        employeeMap.set(entry.employeeGuid, {
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

    const laborSummary = Array.from(employeeMap.values()).sort((a, b) => b.totalHours - a.totalHours);

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
    return res.status(500).json({
      error: 'Failed to fetch labor data',
      message: error.message,
      type: error.constructor.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
  } catch (outerError: any) {
    console.error('[Toast Labor] OUTER ERROR (should not happen):', outerError);
    return res.status(500).json({
      error: 'Catastrophic failure',
      message: outerError.message
    });
  }
}
