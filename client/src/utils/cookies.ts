/**
 * Utilities for working with cookies in the browser
 */

// Cookie name for report history
const REPORT_HISTORY_COOKIE = "gmod_scanner_report_history";

// Report history entry
export interface ReportHistoryEntry {
  reportId: string;
  serverIp: string;
  date: string;
}

/**
 * Get the report history from cookies
 */
export function getReportHistory(): ReportHistoryEntry[] {
  try {
    const cookie = getCookie(REPORT_HISTORY_COOKIE);
    if (!cookie) return [];
    
    const parsed = JSON.parse(cookie);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse report history cookie:", error);
    return [];
  }
}

/**
 * Add a report to the history
 */
export function addReportToHistory(entry: ReportHistoryEntry): void {
  try {
    // Get current history
    const history = getReportHistory();
    
    // Check if this report is already in history
    const exists = history.some(item => item.reportId === entry.reportId);
    if (exists) return;
    
    // Add new report to the beginning
    const newHistory = [entry, ...history];
    
    // Keep only the most recent 10 reports
    const trimmedHistory = newHistory.slice(0, 10);
    
    // Save back to cookie
    setCookie(REPORT_HISTORY_COOKIE, JSON.stringify(trimmedHistory), 30); // 30 days expiry
  } catch (error) {
    console.error("Failed to update report history cookie:", error);
  }
}

/**
 * Set a cookie with a specified expiry time
 */
function setCookie(name: string, value: string, daysToExpire: number): void {
  const date = new Date();
  date.setTime(date.getTime() + daysToExpire * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${date.toUTCString()};path=/`;
}

/**
 * Get a cookie by name
 */
function getCookie(name: string): string | null {
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  
  return null;
}

/**
 * Delete a cookie by name
 */
export function deleteCookie(name: string): void {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
}