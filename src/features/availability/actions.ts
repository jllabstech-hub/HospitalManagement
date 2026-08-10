'use server';

import { requireDoctor } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { DomainError } from '@/server/errors/domain-error';
import {
  doTimeWindowsOverlap,
  getHospitalTodayDateString,
  parseDateStringToUTCDate,
} from '@/lib/date-utils';
import {
  CreateAvailabilitySchema,
  CreateAvailabilityInput,
  UpdateAvailabilitySchema,
  UpdateAvailabilityInput,
  CreateBlockedDateSchema,
  CreateBlockedDateInput,
  UpdateBlockedDateSchema,
  UpdateBlockedDateInput,
} from './schemas';
import { revalidatePath } from 'next/cache';

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored outside Next.js request context
  }
}

/**
 * Normalizes time string to "HH:mm:ss" format for database storage.
 */
function normalizeTimeFormat(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const hh = parts[0].padStart(2, '0');
  const mm = parts[1].padStart(2, '0');
  const ss = parts[2] ? parts[2].padStart(2, '0') : '00';
  return `${hh}:${mm}:${ss}`;
}

// ==========================================
// WEEKLY AVAILABILITY ACTIONS
// ==========================================

/**
 * Creates a new weekly working window for the authenticated doctor.
 * SERVER AUTHORIZATION: Requires DOCTOR role & resolves DoctorProfile ID from session.
 */
export async function createAvailabilityAction(
  rawInput: CreateAvailabilityInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireDoctor();
    const doctorId = user.doctorProfileId;

    if (!doctorId) {
      return { success: false, error: 'Doctor profile not found for current session.' };
    }

    const parsed = CreateAvailabilitySchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid availability data.';
      return { success: false, error: issue };
    }

    const { dayOfWeek, startTime, endTime } = parsed.data;
    const formattedStart = normalizeTimeFormat(startTime);
    const formattedEnd = normalizeTimeFormat(endTime);

    // Fetch existing availability windows for this doctor on this weekday
    const existingWindows = await prisma.weeklyAvailability.findMany({
      where: {
        doctorId,
        dayOfWeek,
      },
    });

    // Enforce server-side overlap rule
    for (const win of existingWindows) {
      if (doTimeWindowsOverlap(formattedStart, formattedEnd, win.startTime, win.endTime)) {
        return {
          success: false,
          error: `This time window (${startTime} – ${endTime}) overlaps with an existing availability window on this day (${win.startTime.slice(0, 5)} – ${win.endTime.slice(0, 5)}).`,
        };
      }
    }

    const record = await prisma.weeklyAvailability.create({
      data: {
        doctorId,
        dayOfWeek,
        startTime: formattedStart,
        endTime: formattedEnd,
        slotDurationMinutes: 30,
      },
    });

    safeRevalidate('/doctor/availability');
    return { success: true, data: { id: record.id } };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Create availability error:', error);
    return { success: false, error: 'An error occurred while adding availability.' };
  }
}

/**
 * Updates an existing weekly working window.
 * SERVER AUTHORIZATION & OWNERSHIP: Requires DOCTOR role & verifies DoctorProfile ID ownership.
 */
export async function updateAvailabilityAction(
  rawInput: UpdateAvailabilityInput
): Promise<ActionResult> {
  try {
    const user = await requireDoctor();
    const doctorId = user.doctorProfileId;

    if (!doctorId) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    const parsed = UpdateAvailabilitySchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid availability data.';
      return { success: false, error: issue };
    }

    const { id, startTime, endTime } = parsed.data;
    const formattedStart = normalizeTimeFormat(startTime);
    const formattedEnd = normalizeTimeFormat(endTime);

    // Verify ownership
    const existing = await prisma.weeklyAvailability.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctorId) {
      return { success: false, error: 'Availability window not found.' };
    }

    // Check overlap with other windows on the same weekday
    const otherWindows = await prisma.weeklyAvailability.findMany({
      where: {
        doctorId,
        dayOfWeek: existing.dayOfWeek,
        id: { not: id },
      },
    });

    for (const win of otherWindows) {
      if (doTimeWindowsOverlap(formattedStart, formattedEnd, win.startTime, win.endTime)) {
        return {
          success: false,
          error: `This updated time window overlaps with an existing window (${win.startTime.slice(0, 5)} – ${win.endTime.slice(0, 5)}).`,
        };
      }
    }

    await prisma.weeklyAvailability.update({
      where: { id },
      data: {
        startTime: formattedStart,
        endTime: formattedEnd,
      },
    });

    safeRevalidate('/doctor/availability');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Update availability error:', error);
    return { success: false, error: 'An error occurred while updating availability.' };
  }
}

/**
 * Deletes a weekly working window.
 * SERVER AUTHORIZATION & OWNERSHIP: Requires DOCTOR role & verifies DoctorProfile ID ownership.
 */
export async function deleteAvailabilityAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireDoctor();
    const doctorId = user.doctorProfileId;

    if (!doctorId) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    const existing = await prisma.weeklyAvailability.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctorId) {
      return { success: false, error: 'Availability window not found.' };
    }

    await prisma.weeklyAvailability.delete({
      where: { id },
    });

    safeRevalidate('/doctor/availability');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Delete availability error:', error);
    return { success: false, error: 'An error occurred while deleting availability.' };
  }
}

// ==========================================
// BLOCKED DATE ACTIONS
// ==========================================

/**
 * Creates a new blocked date (Full-day or Partial-day).
 * SERVER AUTHORIZATION: Requires DOCTOR role & resolves DoctorProfile ID from session.
 */
export async function createBlockedDateAction(
  rawInput: CreateBlockedDateInput
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireDoctor();
    const doctorId = user.doctorProfileId;

    if (!doctorId) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    const parsed = CreateBlockedDateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid blocked date data.';
      return { success: false, error: issue };
    }

    const { startDate, endDate, isFullDay, startTime, endTime, reason } = parsed.data;
    const targetEndDateStr = endDate || startDate;

    // Past date rule check against hospital today date
    const todayStr = getHospitalTodayDateString();
    if (startDate < todayStr) {
      return { success: false, error: 'Cannot block a date in the past.' };
    }

    const startUtcDate = parseDateStringToUTCDate(startDate);
    const endUtcDate = parseDateStringToUTCDate(targetEndDateStr);

    const formattedStart = !isFullDay && startTime ? normalizeTimeFormat(startTime) : null;
    const formattedEnd = !isFullDay && endTime ? normalizeTimeFormat(endTime) : null;

    // Check existing blocks for this doctor on the target date range
    const existingBlocks = await prisma.blockedDate.findMany({
      where: {
        doctorId,
        startDate: { lte: endUtcDate },
        endDate: { gte: startUtcDate },
      },
    });

    if (isFullDay) {
      if (existingBlocks.length > 0) {
        return {
          success: false,
          error: 'A blocked date entry already exists for this date. Please edit or remove existing blocks first.',
        };
      }
    } else {
      // Partial block checks
      for (const block of existingBlocks) {
        if (!block.startTime || !block.endTime) {
          return {
            success: false,
            error: 'This date is already blocked for the full day. Remove full-day block first.',
          };
        }

        if (
          formattedStart &&
          formattedEnd &&
          doTimeWindowsOverlap(formattedStart, formattedEnd, block.startTime, block.endTime)
        ) {
          return {
            success: false,
            error: `This blocked time range (${startTime} – ${endTime}) overlaps with an existing block (${block.startTime.slice(0, 5)} – ${block.endTime.slice(0, 5)}).`,
          };
        }
      }
    }

    const record = await prisma.blockedDate.create({
      data: {
        doctorId,
        startDate: startUtcDate,
        endDate: endUtcDate,
        startTime: formattedStart,
        endTime: formattedEnd,
        reason: reason || null,
      },
    });

    safeRevalidate('/doctor/availability');
    return { success: true, data: { id: record.id } };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Create blocked date error:', error);
    return { success: false, error: 'An error occurred while adding blocked date.' };
  }
}

/**
 * Updates an existing blocked date entry.
 * SERVER AUTHORIZATION & OWNERSHIP: Requires DOCTOR role & verifies DoctorProfile ID ownership.
 */
export async function updateBlockedDateAction(
  rawInput: UpdateBlockedDateInput
): Promise<ActionResult> {
  try {
    const user = await requireDoctor();
    const doctorId = user.doctorProfileId;

    if (!doctorId) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    const parsed = UpdateBlockedDateSchema.safeParse(rawInput);
    if (!parsed.success) {
      const issue = parsed.error.issues[0]?.message || 'Invalid blocked date data.';
      return { success: false, error: issue };
    }

    const { id, startDate, endDate, isFullDay, startTime, endTime, reason } = parsed.data;
    const targetEndDateStr = endDate || startDate;

    const existing = await prisma.blockedDate.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctorId) {
      return { success: false, error: 'Blocked date record not found.' };
    }

    // Past date check
    const todayStr = getHospitalTodayDateString();
    if (startDate < todayStr) {
      return { success: false, error: 'Cannot set blocked date to a past date.' };
    }

    const startUtcDate = parseDateStringToUTCDate(startDate);
    const endUtcDate = parseDateStringToUTCDate(targetEndDateStr);

    const formattedStart = !isFullDay && startTime ? normalizeTimeFormat(startTime) : null;
    const formattedEnd = !isFullDay && endTime ? normalizeTimeFormat(endTime) : null;

    // Check overlap with other blocks
    const otherBlocks = await prisma.blockedDate.findMany({
      where: {
        doctorId,
        id: { not: id },
        startDate: { lte: endUtcDate },
        endDate: { gte: startUtcDate },
      },
    });

    if (isFullDay) {
      if (otherBlocks.length > 0) {
        return {
          success: false,
          error: 'Another block already exists on this date. Remove existing blocks first.',
        };
      }
    } else {
      for (const block of otherBlocks) {
        if (!block.startTime || !block.endTime) {
          return {
            success: false,
            error: 'This date is already blocked for the full day by another entry.',
          };
        }

        if (
          formattedStart &&
          formattedEnd &&
          doTimeWindowsOverlap(formattedStart, formattedEnd, block.startTime, block.endTime)
        ) {
          return {
            success: false,
            error: 'This blocked time range overlaps with an existing block on this date.',
          };
        }
      }
    }

    await prisma.blockedDate.update({
      where: { id },
      data: {
        startDate: startUtcDate,
        endDate: endUtcDate,
        startTime: formattedStart,
        endTime: formattedEnd,
        reason: reason || null,
      },
    });

    safeRevalidate('/doctor/availability');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Update blocked date error:', error);
    return { success: false, error: 'An error occurred while updating blocked date.' };
  }
}

/**
 * Deletes a blocked date entry.
 * SERVER AUTHORIZATION & OWNERSHIP: Requires DOCTOR role & verifies DoctorProfile ID ownership.
 */
export async function deleteBlockedDateAction(id: string): Promise<ActionResult> {
  try {
    const user = await requireDoctor();
    const doctorId = user.doctorProfileId;

    if (!doctorId) {
      return { success: false, error: 'Doctor profile not found.' };
    }

    const existing = await prisma.blockedDate.findUnique({
      where: { id },
    });

    if (!existing || existing.doctorId !== doctorId) {
      return { success: false, error: 'Blocked date record not found.' };
    }

    await prisma.blockedDate.delete({
      where: { id },
    });

    safeRevalidate('/doctor/availability');
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    console.error('Delete blocked date error:', error);
    return { success: false, error: 'An error occurred while deleting blocked date.' };
  }
}
