/**
 * Toast POS API Integration
 *
 * This service handles communication with the Toast POS API to fetch:
 * - Employee clock-in/out data (labor hours)
 * - Sales and revenue data
 *
 * API Documentation: https://doc.toasttab.com/
 */

import { ToastEmployee, ToastSalesData, ToastLaborEntry, ToastTimeEntry } from '../types';

// Toast API Configuration
const TOAST_API_BASE = 'https://ws-api.toasttab.com';

class ToastAPI {
  private apiKey: string;
  private restaurantGuid: string;
  private managementGroupGuid: string;

  constructor() {
    // These will be loaded from environment variables
    this.apiKey = import.meta.env.VITE_TOAST_API_KEY || '';
    this.restaurantGuid = import.meta.env.VITE_TOAST_RESTAURANT_GUID || '';
    this.managementGroupGuid = import.meta.env.VITE_TOAST_MANAGEMENT_GROUP_GUID || '';
  }

  /**
   * Check if Toast API is configured
   */
  isConfigured(): boolean {
    return !!(this.apiKey && this.restaurantGuid && this.managementGroupGuid);
  }

  /**
   * Make authenticated request to Toast API
   */
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.isConfigured()) {
      throw new Error('Toast API not configured. Please set environment variables.');
    }

    const url = `${TOAST_API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Toast-Restaurant-External-ID': this.restaurantGuid,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Toast API] Error ${response.status}: ${errorText}`);
      throw new Error(`Toast API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Fetch sales data for a specific date range
   * @param startDate - ISO date string (YYYY-MM-DD)
   * @param endDate - ISO date string (YYYY-MM-DD)
   */
  async getSalesData(startDate: string, endDate: string): Promise<ToastSalesData> {
    try {
      console.log(`[Toast API] Fetching sales data: ${startDate} to ${endDate}`);

      // Toast Orders API endpoint
      const orders = await this.makeRequest<any[]>(
        `/orders/v2/orders?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      );

      // Process orders to calculate totals
      const totalSales = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
      const totalOrders = orders.length;
      const totalTips = orders.reduce((sum, order) => sum + (order.tip || 0), 0);

      // Calculate payment method breakdown
      const paymentMethods: Record<string, number> = {};
      orders.forEach(order => {
        const method = order.paymentType || 'Unknown';
        paymentMethods[method] = (paymentMethods[method] || 0) + (order.totalAmount || 0);
      });

      // Get hourly breakdown
      const hourlySales: Record<number, number> = {};
      orders.forEach(order => {
        const hour = new Date(order.createdDate).getHours();
        hourlySales[hour] = (hourlySales[hour] || 0) + (order.totalAmount || 0);
      });

      return {
        startDate,
        endDate,
        totalSales: totalSales / 100, // Toast stores in cents
        totalOrders,
        averageCheck: totalOrders > 0 ? totalSales / totalOrders / 100 : 0,
        totalTips: totalTips / 100,
        paymentMethods,
        hourlySales,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Toast API] Failed to fetch sales data:', error);
      throw error;
    }
  }

  /**
   * Fetch employee time entries (clock-in/out data)
   * @param startDate - ISO date string (YYYY-MM-DD)
   * @param endDate - ISO date string (YYYY-MM-DD)
   */
  async getTimeEntries(startDate: string, endDate: string): Promise<ToastTimeEntry[]> {
    try {
      console.log(`[Toast API] Fetching time entries: ${startDate} to ${endDate}`);

      // Toast Labor API endpoint
      const response = await this.makeRequest<any>(
        `/labor/v1/timeEntries?startDate=${startDate}&endDate=${endDate}`,
        { method: 'GET' }
      );

      const timeEntries: ToastTimeEntry[] = (response.timeEntries || []).map((entry: any) => ({
        employeeGuid: entry.employeeReference?.guid || '',
        employeeName: entry.employeeReference?.entityId || 'Unknown',
        jobName: entry.jobReference?.name || 'Staff',
        inDate: entry.inDate,
        outDate: entry.outDate,
        regularHours: entry.regularHours || 0,
        overtimeHours: entry.overtimeHours || 0,
        totalHours: (entry.regularHours || 0) + (entry.overtimeHours || 0),
        deleted: entry.deleted || false,
      }));

      return timeEntries.filter(entry => !entry.deleted);
    } catch (error) {
      console.error('[Toast API] Failed to fetch time entries:', error);
      throw error;
    }
  }

  /**
   * Get labor summary for a date range
   */
  async getLaborSummary(startDate: string, endDate: string): Promise<ToastLaborEntry[]> {
    try {
      const timeEntries = await this.getTimeEntries(startDate, endDate);

      // Group by employee
      const employeeMap = new Map<string, ToastLaborEntry>();

      timeEntries.forEach(entry => {
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

      return Array.from(employeeMap.values()).sort((a, b) => b.totalHours - a.totalHours);
    } catch (error) {
      console.error('[Toast API] Failed to get labor summary:', error);
      throw error;
    }
  }

  /**
   * Get today's live sales snapshot
   */
  async getTodaySales(): Promise<ToastSalesData> {
    const today = new Date().toISOString().split('T')[0];
    return this.getSalesData(today, today);
  }

  /**
   * Get employees currently clocked in
   */
  async getCurrentlyClocked(): Promise<ToastTimeEntry[]> {
    const today = new Date().toISOString().split('T')[0];
    const allEntries = await this.getTimeEntries(today, today);

    // Filter for entries without outDate (still clocked in)
    return allEntries.filter(entry => !entry.outDate);
  }
}

// Export singleton instance
export const toastAPI = new ToastAPI();
