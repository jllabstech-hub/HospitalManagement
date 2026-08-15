import { AppointmentStatus } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { getHospitalTodayDateString, parseDateStringToUTCDate } from '@/lib/date-utils';
import { computeAvailableSlots } from '../domain/slot-engine';
import { AvailableSlot, WeeklyAvailabilityItem, BlockedDateItem, ActiveAppointmentItem } from '../domain/slot-types';
import { getWeekdayFromDateString } from '../domain/time-utils';
import { requireTenantContext } from '@/server/tenant';
import { DEFAULT_TENANT_TIMEZONE } from '@/server/tenant/types';

export interface GetSlotsResult {
  success: boolean;
  slots: AvailableSlot[];
  error?: string;
  isDoctorUnavailable?: boolean;
  isFullyBlocked?: boolean;
}

export async function getAvailableSlotsForDoctorDate(
  doctorId: string,
  dateStr: string
): Promise<GetSlotsResult> {
  try {
    if (!doctorId || typeof doctorId !== 'string') {
      return { success: false, slots: [], error: 'Invalid doctor ID.' };
    }

    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return { success: false, slots: [], error: 'Invalid date format. Expected YYYY-MM-DD.' };
    }

    const tenant = await requireTenantContext();
    const timezone = tenant.timezone || DEFAULT_TENANT_TIMEZONE;
    const todayStr = getHospitalTodayDateString(timezone);
    if (dateStr < todayStr) {
      return { success: false, slots: [], error: 'Cannot check availability for a date in the past.' };
    }

    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, tenantId: tenant.tenantId },
      select: {
        id: true,
        department: { select: { isActive: true, tenantId: true } },
        user: { select: { isActive: true } },
      },
    });

    if (
      !doctor ||
      !doctor.user.isActive ||
      !doctor.department.isActive ||
      doctor.department.tenantId !== tenant.tenantId
    ) {
      return {
        success: false,
        slots: [],
        error: 'This doctor is currently unavailable for appointments.',
        isDoctorUnavailable: true,
      };
    }

    const dayOfWeek = getWeekdayFromDateString(dateStr);
    const targetUtcDate = parseDateStringToUTCDate(dateStr);

    const [weeklyAvailability, blockedDates, activeAppts] = await Promise.all([
      prisma.weeklyAvailability.findMany({
        where: { doctorId, dayOfWeek, tenantId: tenant.tenantId },
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
          tenantId: tenant.tenantId,
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
          tenantId: tenant.tenantId,
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

    const slots = computeAvailableSlots({
      date: dateStr,
      timezone,
      weeklyAvailability: domainWeekly,
      blockedDates: domainBlocked,
      activeAppointments: domainActiveAppts,
      currentDate: todayStr,
    });

    return {
      success: true,
      slots,
    };
  } catch {
    return {
      success: false,
      slots: [],
      error: 'An error occurred while calculating appointment slots.',
    };
  }
}
