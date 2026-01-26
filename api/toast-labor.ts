/**
 * Vercel Serverless Function: Toast Labor API Proxy
 *
 * This function acts as a proxy to fetch labor/time entry data from Toast API
 * to avoid CORS issues with direct browser requests.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  // Get Toast credentials from environment
  const apiKey = process.env.VITE_TOAST_API_KEY;
  const restaurantGuid = process.env.VITE_TOAST_RESTAURANT_GUID;
  const managementGroupGuid = process.env.VITE_TOAST_MANAGEMENT_GROUP_GUID;

  if (!apiKey || !restaurantGuid || !managementGroupGuid) {
    return res.status(500).json({ error: 'Toast API not configured' });
  }

  try {
    console.log(`[Toast Proxy] Fetching labor: ${startDate} to ${endDate}`);

    // Call Toast Labor API
    const laborUrl = `https://ws-api.toasttab.com/labor/v1/timeEntries?startDate=${startDate}&endDate=${endDate}`;

    const response = await fetch(laborUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Toast-Restaurant-External-ID': restaurantGuid,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Toast Proxy] Error ${response.status}: ${errorText}`);
      return res.status(response.status).json({
        error: `Toast API Error: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Process time entries
    const timeEntries = (data.timeEntries || []).map((entry: any) => ({
      employeeGuid: entry.employeeReference?.guid || '',
      employeeName: entry.employeeReference?.entityId || 'Unknown',
      jobName: entry.jobReference?.name || 'Staff',
      inDate: entry.inDate,
      outDate: entry.outDate,
      regularHours: entry.regularHours || 0,
      overtimeHours: entry.overtimeHours || 0,
      totalHours: (entry.regularHours || 0) + (entry.overtimeHours || 0),
      deleted: entry.deleted || false,
    })).filter((entry: any) => !entry.deleted);

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

    // Get currently clocked in
    const currentlyClocked = timeEntries.filter((entry: any) => !entry.outDate);

    console.log(`[Toast Proxy] Success: ${timeEntries.length} time entries, ${currentlyClocked.length} clocked in`);

    const result = {
      timeEntries,
      laborSummary,
      currentlyClocked,
      lastUpdated: new Date().toISOString(),
    };

    // Cache for 1 minute (labor data changes more frequently)
    res.setHeader('Cache-Control', 's-maxage=60');
    return res.status(200).json(result);

  } catch (error: any) {
    console.error('[Toast Proxy] Failed:', error);
    return res.status(500).json({
      error: 'Failed to fetch labor data',
      message: error.message
    });
  }
}
