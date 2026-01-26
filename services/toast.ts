/**
 * Toast POS API Integration (via Vercel Serverless Proxy)
 *
 * This service calls Vercel serverless functions which act as a proxy
 * to fetch data from Toast API, avoiding CORS issues.
 *
 * API Documentation: https://doc.toasttab.com/
 */

import { ToastSalesData, ToastLaborEntry, ToastTimeEntry } from '../types';

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
    const today = new Date().toISOString().split('T')[0];
    const data = await this.getLaborData(today, today);
    return data.currentlyClocked;
  }

  /**
   * Get today's live sales snapshot
   * @param location - Campus location (littleelm, prosper)
   */
  async getTodaySales(location?: string): Promise<ToastSalesData> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSalesData(today, today, location);
  }
}

// Export singleton instance
export const toastAPI = new ToastAPI();
