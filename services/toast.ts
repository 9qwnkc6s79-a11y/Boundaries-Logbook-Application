/**
 * Toast POS API Integration (via Vercel Serverless Proxy)
 *
 * This service calls Vercel serverless functions which act as a proxy
 * to fetch data from Toast API, avoiding CORS issues.
 *
 * API Documentation: https://doc.toasttab.com/
 */

import { ToastSalesData, ToastLaborEntry, ToastTimeEntry, ToastSyncEmployee } from '../types';

class ToastAPI {
  /**
   * Check if Toast API is configured
   * In production, this checks if serverless functions are available
   * In development, checks environment variables
   */
  isConfigured(): boolean {
    // Check if environment variables are set
    const clientId = import.meta.env.VITE_TOAST_CLIENT_ID;
    const clientSecret = import.meta.env.VITE_TOAST_API_KEY;
    const restaurantGuid = import.meta.env.VITE_TOAST_RESTAURANT_GUID;

    return !!(clientId && clientSecret && restaurantGuid);
  }

  /**
   * Fetch sales data for a specific date range via proxy
   * @param startDate - ISO date string (YYYY-MM-DD)
   * @param endDate - ISO date string (YYYY-MM-DD)
   * @param location - Campus location (littleelm, prosper)
   */
  async getSalesData(startDate: string, endDate: string, location?: string): Promise<ToastSalesData> {
    try {
      const locationParam = location ? `&location=${location}` : '';
      console.log(`[Toast API] Fetching sales data: ${startDate} to ${endDate} (${location || 'littleelm'})`);

      const response = await fetch(`/api/toast-sales?startDate=${startDate}&endDate=${endDate}${locationParam}`);

      if (!response.ok) {
        const error = await response.json();
        console.error(`[Toast API] Sales error:`, error);
        throw new Error(error.error || 'Failed to fetch sales data');
      }

      const data = await response.json();
      console.log(`[Toast API] Sales data received: ${data.totalOrders} orders, $${data.totalSales}`);
      return data;
    } catch (error) {
      console.error('[Toast API] Failed to fetch sales data:', error);
      throw error;
    }
  }

  /**
   * Get labor data (time entries, summary, currently clocked) via proxy
   * @param startDate - ISO date string (YYYY-MM-DD)
   * @param endDate - ISO date string (YYYY-MM-DD)
   * @param location - Campus location (littleelm, prosper)
   */
  async getLaborData(startDate: string, endDate: string, location?: string): Promise<{
    timeEntries: ToastTimeEntry[];
    laborSummary: ToastLaborEntry[];
    currentlyClocked: ToastTimeEntry[];
  }> {
    try {
      const locationParam = location ? `&location=${location}` : '';
      console.log(`[Toast API] Fetching labor data: ${startDate} to ${endDate} (${location || 'littleelm'})`);

      const response = await fetch(`/api/toast-labor?startDate=${startDate}&endDate=${endDate}${locationParam}`);

      if (!response.ok) {
        const error = await response.json();
        console.error(`[Toast API] Labor error:`, error);
        throw new Error(error.error || 'Failed to fetch labor data');
      }

      const data = await response.json();
      console.log(`[Toast API] Labor data received: ${data.timeEntries.length} entries, ${data.currentlyClocked.length} clocked in`);
      return data;
    } catch (error) {
      console.error('[Toast API] Failed to fetch labor data:', error);
      throw error;
    }
  }

  /**
   * Get labor summary for a date range
   */
  async getLaborSummary(startDate: string, endDate: string): Promise<ToastLaborEntry[]> {
    const data = await this.getLaborData(startDate, endDate);
    return data.laborSummary;
  }

  /**
   * Get employees currently clocked in
   */
  async getCurrentlyClocked(): Promise<ToastTimeEntry[]> {
    // Use Central Time (America/Chicago) for "today" instead of UTC
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    const data = await this.getLaborData(today, today);
    return data.currentlyClocked;
  }

  /**
   * Fetch employees from Toast for syncing with the logbook app.
   * Calls the /api/toast-employees serverless endpoint.
   * @param location - Optional campus location (littleelm, prosper). Fetches both if omitted.
   */
  async getEmployees(location?: string): Promise<ToastSyncEmployee[]> {
    try {
      const locationParam = location ? `?location=${location}` : '';
      console.log(`[Toast API] Fetching employees${location ? ` for ${location}` : ' (all locations)'}`);

      const response = await fetch(`/api/toast-employees${locationParam}`);

      if (!response.ok) {
        const error = await response.json();
        console.error(`[Toast API] Employee sync error:`, error);
        throw new Error(error.error || 'Failed to fetch employees from Toast');
      }

      const data = await response.json();
      console.log(`[Toast API] Employee sync: ${data.total} employees returned`);
      return data.employees || [];
    } catch (error) {
      console.error('[Toast API] Failed to fetch employees:', error);
      throw error;
    }
  }

  /**
   * Get today's live sales snapshot
   * @param location - Campus location (littleelm, prosper)
   */
  async getTodaySales(location?: string): Promise<ToastSalesData> {
    // Use Central Time (America/Chicago) for "today" instead of UTC
    // This ensures we get the current business day's sales, not tomorrow's
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    return this.getSalesData(today, today, location);
  }

  /**
   * Get sales data from last week (same day of week, same time)
   * @param location - Campus location (littleelm, prosper)
   */
  async getLastWeekSales(location?: string): Promise<ToastSalesData> {
    // Get current time in Central Time
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekDate = lastWeek.toLocaleDateString('en-CA', { timeZone: 'America/Chicago' });
    return this.getSalesData(lastWeekDate, lastWeekDate, location);
  }

  /**
   * Get today's sales with comparison to last week
   * @param location - Campus location (littleelm, prosper)
   */
  async getTodaySalesWithComparison(location?: string): Promise<{
    today: ToastSalesData;
    lastWeek: ToastSalesData | null;
    comparison: {
      salesDiff: number;
      salesPercent: number;
      ordersDiff: number;
      ordersPercent: number;
    } | null;
  }> {
    try {
      const [today, lastWeek] = await Promise.all([
        this.getTodaySales(location),
        this.getLastWeekSales(location).catch(err => {
          console.warn('[Toast API] Failed to fetch last week data:', err);
          return null;
        })
      ]);

      let comparison = null;
      if (lastWeek && lastWeek.totalSales > 0) {
        const salesDiff = today.totalSales - lastWeek.totalSales;
        const salesPercent = (salesDiff / lastWeek.totalSales) * 100;
        const ordersDiff = today.totalOrders - lastWeek.totalOrders;
        const ordersPercent = lastWeek.totalOrders > 0 ? (ordersDiff / lastWeek.totalOrders) * 100 : 0;

        comparison = {
          salesDiff,
          salesPercent,
          ordersDiff,
          ordersPercent
        };
      }

      return { today, lastWeek, comparison };
    } catch (error) {
      console.error('[Toast API] Failed to fetch sales with comparison:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const toastAPI = new ToastAPI();
