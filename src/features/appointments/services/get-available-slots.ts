import { AppointmentStatus } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { getHospitalTodayDateString, parseDateStringToUTCDate } from '@/lib/date-utils';
import { computeAvailableSlots } from '../domain/slot-engine';
import { AvailableSlot, WeeklyAvailabilityItem, BlockedDateItem, ActiveAppointmentItem } from '../domain/slot-types';
import { getWeekdayFromDateString } from '../domain/time-utils';

export interface GetSlotsResult {
  success: boolean;
  slots: AvailableSlot[];
  error?: string;
  isDoctorUnavailable?: boolean;
  isFullyBlocked?: boolean;
}

/**
 * Server-side service to fetch doctor schedule data from Prisma and compute available slots
 * via the pure computeAvailableSlots domain engine.
 *
 * NO DATABASE WRITES occur in this service.
 */
export async function getAvailableSlotsForDoctorDate(
  doctorId: string,
  dateStr: string
): Promise<GetSlotsResult> {
  try {
    // 1. Defensive validation of doctorId and date format
    if (!doctorId || typeof doctorId !== 'string') {
      return { success: false, slots: [], error: 'Invalid doctor ID.' };
    }

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, slots: [], error: 'Invalid date format. Expected YYYY-MM-DD.' };
    }

    const todayStr = getHospitalTodayDateString();
    if (dateStr < todayStr) {
      return { success: false, slots: [], error: 'Cannot check availability for a date in the past.' };
    }

    // 2. Fetch Doctor Profile & User Active Status
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        department: { select: { isActive: true } },
        user: { select: { isActive: true } },
      },
    });

    if (!doctor || !doctor.user.isActive || !doctor.department.isActive) {
      return {
        success: false,
        slots: [],
        error: 'This doctor is currently unavailable for appointments.',
        isDoctorUnavailable: true,
      };
    }

    // 3. Determine Weekday in Asia/Kolkata
    const dayOfWeek = getWeekdayFromDateString(dateStr);
    const targetUtcDate = parseDateStringToUTCDate(dateStr);

    // 4. Fetch Weekly Availability, Blocked Dates, and Active Appointments concurrently
    const [weeklyAvailability, blockedDates, activeAppts] = await Promise.all([
      prisma.weeklyAvailability.findMany({
        where: {
          doctorId,
          dayOfWeek,
        },
        select: {
          id: true,
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          slotDurationMinutes: true,
        },
      }),
      prisma.blockedDate.findMany({
        where: {
          doctorId,
          startDate: { lte: targetUtcDate },
          endDate: { gte: targetUtcDate },
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          startTime: true,
          endTime: true,
          reason: true,
        },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: targetUtcDate,
          status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED] },
        },
        select: {
          id: true,
          appointmentDate: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      }),
    ]);

    // Check full-day block flag for UX messaging
    const hasFullDayBlock = blockedDates.some(
      (b) => !b.startTime || !b.endTime || b.startTime.trim() === '' || b.endTime.trim() === ''
    );

    if (hasFullDayBlock) {
      return {
        success: true,
        slots: [],
        isFullyBlocked: true,
      };
    }

    // 5. Map Prisma records to pure domain input formats
    const domainWeekly: WeeklyAvailabilityItem[] = weeklyAvailability.map((w) => ({
      id: w.id,
      dayOfWeek: w.dayOfWeek,
      startTime: w.startTime,
      endTime: w.endTime,
      slotDurationMinutes: w.slotDurationMinutes,
    }));

    const domainBlocked: BlockedDateItem[] = blockedDates.map((b) => ({
      id: b.id,
      startDate: dateStr,
      endDate: dateStr,
      isFullDay: !b.startTime || !b.endTime || b.startTime.trim() === '' || b.endTime.trim() === '',
      startTime: b.startTime,
      endTime: b.endTime,
      reason: b.reason,
    }));

    const domainActiveAppts: ActiveAppointmentItem[] = activeAppts.map((a) => ({
      id: a.id,
      appointmentDate: dateStr,
      startTime: a.startTime,
      endTime: a.endTime,
      status: a.status,
    }));

    // 6. Invoke pure domain slot engine
    const slots = computeAvailableSlots({
      date: dateStr,
      weeklyAvailability: domainWeekly,
      blockedDates: domainBlocked,
      activeAppointments: domainActiveAppts,
      currentDate: todayStr,
    });

    return {
      success: true,
      slots,
    };
  } catch (error: unknown) {
    console.error('getAvailableSlotsForDoctorDate error:', error);
    return {
      success: false,
      slots: [],
      error: 'An error occurred while calculating appointment slots.',
    };
  }
}
