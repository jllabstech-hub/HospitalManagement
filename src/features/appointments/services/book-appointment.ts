import { AppointmentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { parseDateStringToUTCDate, getHospitalTodayDateString } from '@/lib/date-utils';
import { computeAvailableSlots } from '../domain/slot-engine';
import { getWeekdayFromDateString, minutesToTimeStr, timeStrToMinutes } from '../domain/time-utils';
import {
  BookAppointmentResult,
  BookAppointmentSchema,
} from '../schemas/booking-schema';
import { notificationService } from '@/services/notifications/NotificationService';

/**
 * Calculates end time for a 30-minute slot (e.g., '10:30' -> '11:00').
 */
export function calculateSlotEndTime(startTime: string): string {
  const startMin = timeStrToMinutes(startTime);
  const endMin = startMin + 30;
  return minutesToTimeStr(endMin);
}

/**
 * Executes server-side transactional appointment booking.
 * Recomputes live slot availability before attempting creation and relies on
 * PostgreSQL partial unique index `unique_active_doctor_slot` as final concurrency defense.
 */
export async function bookAppointmentTransaction(
  patientProfileId: string,
  rawInput: unknown
): Promise<BookAppointmentResult> {
  try {
    // 1. Zod Validation
    const parseResult = BookAppointmentSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid booking input.';
      return { success: false, code: 'VALIDATION_ERROR', message: firstError };
    }

    const { doctorId, appointmentDate, startTime } = parseResult.data;

    // 2. Validate Patient Profile Exists & Active in Database
    if (!patientProfileId || typeof patientProfileId !== 'string') {
      return { success: false, code: 'UNAUTHORIZED', message: 'Invalid patient profile.' };
    }

    const patient = await prisma.patientProfile.findUnique({
      where: { id: patientProfileId },
      select: { 
        id: true, 
        fullName: true,
        phoneNumber: true,
        user: { select: { isActive: true, email: true } } 
      },
    });

    if (!patient || !patient.user.isActive) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Your patient profile record was not found or is inactive. Please log in again.',
      };
    }

    // 3. Validate Doctor & Department Active Status
    const doctor = await prisma.doctorProfile.findUnique({
      where: { id: doctorId },
      select: {
        id: true,
        fullName: true,
        department: { select: { name: true, isActive: true } },
        user: { select: { isActive: true } },
      },
    });

    if (!doctor || !doctor.user.isActive || !doctor.department.isActive) {
      return {
        success: false,
        code: 'DOCTOR_UNAVAILABLE',
        message: 'This doctor is currently unavailable for appointments.',
      };
    }

    // 4. Validate Date (Asia/Kolkata not past)
    const todayStr = getHospitalTodayDateString();
    if (appointmentDate < todayStr) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Cannot book appointments for past dates.',
      };
    }

    // 5. Calculate 30-Minute End Time
    const endTime = calculateSlotEndTime(startTime);
    const dayOfWeek = getWeekdayFromDateString(appointmentDate);
    const targetUtcDate = parseDateStringToUTCDate(appointmentDate);

    // 6. Re-fetch live schedule data to recompute availability
    const [weeklyAvailability, blockedDates, activeAppts] = await Promise.all([
      prisma.weeklyAvailability.findMany({
        where: { doctorId, dayOfWeek },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, slotDurationMinutes: true },
      }),
      prisma.blockedDate.findMany({
        where: { doctorId, startDate: { lte: targetUtcDate }, endDate: { gte: targetUtcDate } },
        select: { id: true, startDate: true, endDate: true, startTime: true, endTime: true, reason: true },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: targetUtcDate,
          status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED] },
        },
        select: { id: true, appointmentDate: true, startTime: true, endTime: true, status: true },
      }),
    ]);

    // Check full-day block flag
    const hasFullDayBlock = blockedDates.some(
      (b) => !b.startTime || !b.endTime || b.startTime.trim() === '' || b.endTime.trim() === ''
    );
    if (hasFullDayBlock) {
      return {
        success: false,
        code: 'SLOT_UNAVAILABLE',
        message: 'This time slot was just booked or blocked. Please select another time.',
      };
    }

    // Call pure domain slot engine
    const availableSlots = computeAvailableSlots({
      date: appointmentDate,
      weeklyAvailability: weeklyAvailability.map((w) => ({
        id: w.id,
        dayOfWeek: w.dayOfWeek,
        startTime: w.startTime,
        endTime: w.endTime,
        slotDurationMinutes: w.slotDurationMinutes,
      })),
      blockedDates: blockedDates.map((b) => ({
        id: b.id,
        startDate: appointmentDate,
        endDate: appointmentDate,
        isFullDay: !b.startTime || !b.endTime || b.startTime.trim() === '' || b.endTime.trim() === '',
        startTime: b.startTime,
        endTime: b.endTime,
        reason: b.reason,
      })),
      activeAppointments: activeAppts.map((a) => ({
        id: a.id,
        appointmentDate: appointmentDate,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
      })),
      currentDate: todayStr,
    });

    // 7. Verify requested startTime exists in computed available slots
    const isSlotAvailable = availableSlots.some((s) => s.startTime === startTime);
    if (!isSlotAvailable) {
      return {
        success: false,
        code: 'SLOT_UNAVAILABLE',
        message: 'This time slot was just booked by another patient. Please choose another slot.',
      };
    }

    // 8. Create Appointment with PostgreSQL Concurrency Protection
    try {
      const createdAppt = await prisma.appointment.create({
        data: {
          patientId: patientProfileId,
          doctorId,
          appointmentDate: targetUtcDate,
          startTime,
          endTime,
          status: AppointmentStatus.BOOKED,
        },
        select: {
          id: true,
          appointmentDate: true,
          startTime: true,
          endTime: true,
          status: true,
        },
      });

      // Fire notification in background (don't await to avoid slowing down request)
      const dateTimeString = `${appointmentDate} at ${startTime}`;
      // Note: tenantId is null here until fully migrated
      notificationService.notifyAppointmentBooked(
        null,
        patientProfileId,
        createdAppt.id,
        patient.fullName,
        doctor.fullName,
        dateTimeString,
        patient.user.email,
        patient.phoneNumber
      ).catch(err => console.error('Notification dispatch failed:', err));

      return {
        success: true,
        appointment: {
          id: createdAppt.id,
          doctorId,
          doctorName: doctor.fullName,
          departmentName: doctor.department.name,
          appointmentDate,
          startTime: createdAppt.startTime,
          endTime: createdAppt.endTime,
          status: 'BOOKED',
        },
      };
    } catch (dbError: unknown) {
      // 9. Catch PostgreSQL Constraint Violations (P2002 Unique, P2003 FK)
      if (dbError instanceof Prisma.PrismaClientKnownRequestError) {
        if (dbError.code === 'P2002') {
          return {
            success: false,
            code: 'SLOT_UNAVAILABLE',
            message: 'This time slot was just booked by another patient. Please choose another slot.',
          };
        }
        if (dbError.code === 'P2003') {
          return {
            success: false,
            code: 'UNAUTHORIZED',
            message: 'Your account session or patient profile is invalid. Please log in again.',
          };
        }
      }
      throw dbError;
    }
  } catch (error: unknown) {
    console.error('bookAppointmentTransaction error:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      message: 'An unexpected server error occurred while booking your appointment. Please try again.',
    };
  }
}
