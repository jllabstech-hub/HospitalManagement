import { timeToMinutes, doTimeWindowsOverlap, resolveTimezone } from '@/lib/date-utils';

/**
 * Returns total minutes from midnight for a time string "HH:mm" or "HH:mm:ss".
 */
export function timeStrToMinutes(timeStr: string): number {
  return timeToMinutes(timeStr);
}

/**
 * Converts total minutes from midnight to a 24-hour time string "HH:mm".
 * Example: 570 => "09:30"
 */
export function minutesToTimeStr(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Normalizes a time string from "HH:mm:ss" or "HH:mm" to standard "HH:mm".
 */
export function normalizeTimeToHHMM(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return '';
  const h = String(Number(parts[0])).padStart(2, '0');
  const m = String(Number(parts[1])).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Determines the hospital-local weekday (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * for a date string in "YYYY-MM-DD" format.
 */
export function getWeekdayFromDateString(dateStr: string): number {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    throw new Error(`Invalid date string format: "${dateStr}". Expected YYYY-MM-DD.`);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  // Noon UTC avoids daylight savings or edge-of-day offset shifts
  const utcNoonDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return utcNoonDate.getUTCDay();
}

/**
 * Returns current hospital time in HH:mm format according to Asia/Kolkata timezone.
 */
export function getHospitalCurrentTimeHHMM(timezone?: string | null): string {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: resolveTimezone(timezone),
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(new Date());
}

/**
 * Checks if two half-open intervals [startA, endA) and [startB, endB) overlap.
 */
export function doHalfOpenIntervalsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return doTimeWindowsOverlap(startA, endA, startB, endB);
}
