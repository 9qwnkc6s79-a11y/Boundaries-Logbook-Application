/**
 * Order Attribution Service
 *
 * Attributes each closed order to the shift leader on duty when the order was opened.
 * This enables accurate performance metrics per team leader:
 * - Turn time
 * - Average ticket
 * - Total sales
 */

import { AttributedOrder, ShiftLeaderMetrics, ToastTimeEntry, User, ChecklistSubmission, ChecklistTemplate, UserRole } from '../types';
import { detectLeaders, calculateTimelinessScore } from './leadershipTracking';

// Types for Toast API responses
interface ToastOrderDetail {
  id: string;
  orderNumber: string;
  openedAt: string;
  closedAt: string;
  netAmount: number;
  turnTimeMinutes: number;
  guestCount: number;
  checkGuid: string;
  paymentStatus: string;
}

interface ToastOrdersResponse {
  location: string;
  startDate: string;
  endDate: string;
  orderCount: number;
  orders: ToastOrderDetail[];
}

interface ToastLaborResponse {
  timeEntries: ToastTimeEntry[];
  laborSummary: any[];
  currentlyClocked: ToastTimeEntry[];
  lastUpdated: string;
}

/**
 * Fetch closed orders from the Toast API for a date range
 */
export async function fetchToastOrders(
  location: string,
  startDate: string,
  endDate: string
): Promise<ToastOrderDetail[]> {
  try {
    const url = `/api/toast-orders?location=${location}&startDate=${startDate}&endDate=${endDate}`;
    console.log(`[OrderAttribution] Fetching orders: ${url}`);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch orders: ${response.status}`);
    }

    const data: ToastOrdersResponse = await response.json();
    console.log(`[OrderAttribution] Fetched ${data.orderCount} orders for ${location}`);
    return data.orders;
  } catch (error: any) {
    console.error(`[OrderAttribution] Error fetching orders:`, error);
    return [];
  }
}

/**
 * Fetch labor/time entries for a specific date
 */
export async function fetchLaborForDate(
  location: string,
  date: string
): Promise<ToastTimeEntry[]> {
  try {
    const url = `/api/toast-labor?location=${location}&startDate=${date}&endDate=${date}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch labor: ${response.status}`);
    }

    const data: ToastLaborResponse = await response.json();
    return data.timeEntries;
  } catch (error: any) {
    console.error(`[OrderAttribution] Error fetching labor for ${date}:`, error);
    return [];
  }
}

/**
 * Find who was clocked in at a specific timestamp
 */
function findClockedInAt(timeEntries: ToastTimeEntry[], timestamp: Date): ToastTimeEntry[] {
  const targetMs = timestamp.getTime();

  return timeEntries.filter(entry => {
    if (!entry.inDate) return false;

    const inMs = new Date(entry.inDate).getTime();
    const outMs = entry.outDate ? new Date(entry.outDate).getTime() : Date.now();

    // Employee was clocked in if: inDate <= timestamp <= outDate (or still clocked in)
    return inMs <= targetMs && targetMs <= outMs;
  });
}

/**
 * Attribute orders to shift leaders based on who was clocked in when each order was opened.
 *
 * Strategy:
 * 1. Group orders by date
 * 2. Fetch labor data for each date
 * 3. For each order, find who was clocked in at openedAt time
 * 4. Use detectLeaders to identify the shift leader
 * 5. Attribute the order to the highest-priority leader on duty
 */
export async function attributeOrdersToLeaders(
  location: string,
  orders: ToastOrderDetail[],
  storeId: string,
  allUsers: User[]
): Promise<AttributedOrder[]> {
  if (orders.length === 0) return [];

  // Group orders by date (YYYY-MM-DD)
  const ordersByDate = new Map<string, ToastOrderDetail[]>();
  orders.forEach(order => {
    const date = order.openedAt.substring(0, 10);
    const dateOrders = ordersByDate.get(date) || [];
    dateOrders.push(order);
    ordersByDate.set(date, dateOrders);
  });

  console.log(`[OrderAttribution] Processing ${orders.length} orders across ${ordersByDate.size} days`);

  const attributedOrders: AttributedOrder[] = [];

  // Process each date
  for (const [date, dateOrders] of ordersByDate) {
    // Fetch labor data for this date
    const timeEntries = await fetchLaborForDate(location, date);

    if (timeEntries.length === 0) {
      console.warn(`[OrderAttribution] No labor data for ${date}, skipping ${dateOrders.length} orders`);
      continue;
    }

    // Attribute each order
    for (const order of dateOrders) {
      const openedAt = new Date(order.openedAt);
      const clockedInAtOpen = findClockedInAt(timeEntries, openedAt);

      if (clockedInAtOpen.length === 0) {
        console.warn(`[OrderAttribution] No staff clocked in at ${order.openedAt}, skipping order ${order.orderNumber}`);
        continue;
      }

      // Detect leaders from staff clocked in at order open time
      const leaders = detectLeaders(clockedInAtOpen, allUsers);

      if (leaders.length === 0) {
        console.warn(`[OrderAttribution] No leader found for order ${order.orderNumber} at ${order.openedAt}`);
        continue;
      }

      // Attribute to highest priority leader (GM > Team Leader)
      const leader = leaders[0];

      attributedOrders.push({
        id: order.id,
        storeId,
        orderNumber: order.orderNumber,
        openedAt: order.openedAt,
        closedAt: order.closedAt,
        netAmount: order.netAmount,
        turnTimeMinutes: order.turnTimeMinutes,
        guestCount: order.guestCount,
        shiftLeaderId: leader.userId,
        shiftLeaderName: leader.name,
        shiftLeaderToastGuid: leader.employeeGuid,
        attributedAt: new Date().toISOString(),
        checkGuid: order.checkGuid,
      });
    }
  }

  console.log(`[OrderAttribution] Attributed ${attributedOrders.length} of ${orders.length} orders`);
  return attributedOrders;
}

/**
 * Sync order attributions for a store.
 * This is the main entry point - call this from ManagerHub or a background job.
 */
export async function syncOrderAttributions(
  location: string,
  storeId: string,
  startDate: string,
  endDate: string,
  allUsers: User[]
): Promise<AttributedOrder[]> {
  console.log(`[OrderAttribution] Starting sync for ${location}: ${startDate} to ${endDate}`);

  // Fetch orders from Toast
  const orders = await fetchToastOrders(location, startDate, endDate);

  if (orders.length === 0) {
    console.log(`[OrderAttribution] No orders found`);
    return [];
  }

  // Attribute orders to leaders
  const attributed = await attributeOrdersToLeaders(location, orders, storeId, allUsers);

  return attributed;
}

/**
 * Calculate aggregated metrics for each shift leader from attributed orders.
 */
export function calculateShiftLeaderMetrics(
  orders: AttributedOrder[],
  submissions: ChecklistSubmission[],
  templates: ChecklistTemplate[],
  allUsers: User[],
  periodStart: string,
  periodEnd: string
): ShiftLeaderMetrics[] {
  // Get all team leaders
  const teamLeaders = allUsers.filter(u =>
    u.role === UserRole.MANAGER || u.role === UserRole.ADMIN
  );

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);
  endDate.setHours(23, 59, 59, 999);

  // Filter orders to period
  const periodOrders = orders.filter(o => {
    const openedAt = new Date(o.openedAt);
    return openedAt >= startDate && openedAt <= endDate;
  });

  // Filter submissions to period
  const periodSubmissions = submissions.filter(sub => {
    if (!sub.submittedAt) return false;
    const submittedAt = new Date(sub.submittedAt);
    return submittedAt >= startDate && submittedAt <= endDate;
  });

  // Calculate metrics per leader
  const metrics: ShiftLeaderMetrics[] = teamLeaders.map(leader => {
    // Get orders attributed to this leader
    const leaderOrders = periodOrders.filter(o => o.shiftLeaderId === leader.id);

    // Calculate order metrics
    const totalOrders = leaderOrders.length;
    const totalNetSales = leaderOrders.reduce((sum, o) => sum + o.netAmount, 0);
    const avgTicket = totalOrders > 0 ? totalNetSales / totalOrders : 0;
    const avgTurnTime = totalOrders > 0
      ? leaderOrders.reduce((sum, o) => sum + o.turnTimeMinutes, 0) / totalOrders
      : 0;
    const totalGuests = leaderOrders.reduce((sum, o) => sum + o.guestCount, 0);

    // Get submissions where this leader submitted or completed tasks
    const leaderSubmissions = periodSubmissions.filter(sub => {
      // Check if leader submitted or completed tasks
      const taskResults = sub.taskResults || [];
      return sub.userId === leader.id ||
        taskResults.some(tr => tr.completed && tr.completedByUserId === leader.id);
    });

    // Calculate timeliness metrics
    let onTimeSubmissions = 0;
    let lateSubmissions = 0;
    let totalDelayMinutes = 0;

    leaderSubmissions.forEach(sub => {
      const template = templates.find(t => t.id === sub.templateId);
      if (!template || !sub.submittedAt) return;

      const deadline = new Date(sub.date);
      deadline.setHours(template.deadlineHour, 0, 0, 0);
      const submittedAt = new Date(sub.submittedAt);
      const delayMinutes = Math.floor((submittedAt.getTime() - deadline.getTime()) / 60000);

      totalDelayMinutes += delayMinutes;

      if (delayMinutes <= 0) {
        onTimeSubmissions++;
      } else {
        lateSubmissions++;
      }
    });

    const checklistsSubmitted = leaderSubmissions.length;
    const avgDelayMinutes = checklistsSubmitted > 0
      ? totalDelayMinutes / checklistsSubmitted
      : 0;

    // Calculate scores (0-100 scale)
    // Turn time: <3.5min = 40, 3.5-4.5 = 35, 4.5-5 = -10, 5+ = -20 (scaled to 0-40)
    let turnTimeScore = 0;
    if (avgTurnTime > 0) {
      if (avgTurnTime < 3.5) turnTimeScore = 40;
      else if (avgTurnTime < 4.5) turnTimeScore = 35;
      else if (avgTurnTime < 5) turnTimeScore = 25;
      else turnTimeScore = 10;
    }

    // Avg ticket: $10+ = 25, $8-10 = 20, $6-8 = 15, $4-6 = 5, <$4 = 0
    let avgTicketScore = 0;
    if (avgTicket >= 10) avgTicketScore = 25;
    else if (avgTicket >= 8) avgTicketScore = 20;
    else if (avgTicket >= 6) avgTicketScore = 15;
    else if (avgTicket >= 4) avgTicketScore = 5;

    // Timeliness: on-time rate as percentage of 40
    const timelinessScore = checklistsSubmitted > 0
      ? (onTimeSubmissions / checklistsSubmitted) * 40
      : 0;

    // Review bonus placeholder (to be implemented with Google Reviews)
    const reviewBonus = 0;

    // Total score
    const totalScore = turnTimeScore + avgTicketScore + timelinessScore + reviewBonus;

    return {
      userId: leader.id,
      name: leader.name,
      storeId: leader.storeId,
      periodStart,
      periodEnd,
      totalOrders,
      totalNetSales: Math.round(totalNetSales * 100) / 100,
      avgTicket: Math.round(avgTicket * 100) / 100,
      avgTurnTime: Math.round(avgTurnTime * 100) / 100,
      totalGuests,
      checklistsSubmitted,
      onTimeSubmissions,
      lateSubmissions,
      avgDelayMinutes: Math.round(avgDelayMinutes),
      turnTimeScore,
      avgTicketScore,
      timelinessScore: Math.round(timelinessScore),
      reviewBonus,
      totalScore: Math.round(totalScore),
    };
  });

  // Sort by total score descending
  return metrics.sort((a, b) => b.totalScore - a.totalScore);
}
