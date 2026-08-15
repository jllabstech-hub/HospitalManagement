/**
 * Date and Time utilities for Hospital Appointment Management System.
 * Prefer passing the current tenant timezone. HospitalProfile.timezone is authoritative.
 */

import { DEFAULT_TENANT_TIMEZONE } from '@/server/tenant/types';

export const HOSPITAL_TIMEZONE =
  process.env.NEXT_PUBLIC_HOSPITAL_TIMEZONE || DEFAULT_TENANT_TIMEZONE;

export function resolveTimezone(timezone?: string | null): string {
  const candidate = timezone?.trim();
  if (candidate) return candidate;
  return HOSPITAL_TIMEZONE;
}

/**
 * Returns today's date string in YYYY-MM-DD format according to the given timezone.
 */
export function getHospitalTodayDateString(timezone?: string | null): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: resolveTimezone(timezone),
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Converts a YYYY-MM-DD string into a UTC Date object set to 00:00:00.000
 * suitable for Prisma @db.Date fields.
 */
export function parseDateStringToUTCDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Formats a Date object or ISO string to YYYY-MM-DD string.
 */
export function formatDateToYYYYMMDD(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Converts a time string "HH:mm" or "HH:mm:ss" into total minutes from midnight.
 * Example: "09:30" => 570
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  const hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  return hours * 60 + minutes;
}

/**
 * Checks if two time windows [startA, endA) and [startB, endB) overlap.
 * Adjacent time windows (e.g. 09:00-13:00 and 13:00-17:00) do NOT overlap.
 */
export function doTimeWindowsOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const minStartA = timeToMinutes(startA);
  const minEndA = timeToMinutes(endA);
  const minStartB = timeToMinutes(startB);
  const minEndB = timeToMinutes(endB);

  return minStartA < minEndB && minStartB < minEndA;
}

/**
 * Formats "14:00" or "14:00:00" into 12-hour AM/PM format ("02:00 PM").
 */
export function formatTimeTo12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':').map(Number);
  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const formattedHours = String(hours).padStart(2, '0');
  const formattedMinutes = String(minutes).padStart(2, '0');
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
}
