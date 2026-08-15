import { AppointmentStatus, Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { parseDateStringToUTCDate, getHospitalTodayDateString } from '@/lib/date-utils';
import { computeAvailableSlots } from '../domain/slot-engine';
import { getWeekdayFromDateString } from '../domain/time-utils';
import {
  BookAppointmentResult,
  BookAppointmentSchema,
} from '../schemas/booking-schema';
import { enqueueAppointmentNotification } from '@/server/notifications/outbox';
import { writeAuditLog } from '@/server/security/audit';
import { requireTenantContext } from '@/server/tenant';
import { DEFAULT_TENANT_TIMEZONE } from '@/server/tenant/types';

export async function bookAppointmentTransaction(
  patientProfileId: string,
  rawInput: unknown,
  actorUserId?: string
): Promise<BookAppointmentResult> {
  try {
    const tenant = await requireTenantContext();
    const timezone = tenant.timezone || DEFAULT_TENANT_TIMEZONE;

    const parseResult = BookAppointmentSchema.safeParse(rawInput);
    if (!parseResult.success) {
      const firstError = parseResult.error.issues[0]?.message || 'Invalid booking input.';
      return { success: false, code: 'VALIDATION_ERROR', message: firstError };
    }

    const { doctorId, appointmentDate, startTime } = parseResult.data;

    if (!patientProfileId || typeof patientProfileId !== 'string') {
      return { success: false, code: 'UNAUTHORIZED', message: 'Invalid patient profile.' };
    }

    const patient = await prisma.patientProfile.findFirst({
      where: { id: patientProfileId, tenantId: tenant.tenantId },
      select: {
        id: true,
        tenantId: true,
        userId: true,
        fullName: true,
        user: { select: { isActive: true } },
      },
    });

    if (!patient || !patient.user.isActive) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Your patient profile record was not found or is inactive. Please log in again.',
      };
    }

    const doctor = await prisma.doctorProfile.findFirst({
      where: { id: doctorId, tenantId: tenant.tenantId },
      select: {
        id: true,
        tenantId: true,
        fullName: true,
        department: { select: { name: true, isActive: true, tenantId: true } },
        user: { select: { isActive: true } },
      },
    });

    if (
      !doctor ||
      !doctor.user.isActive ||
      !doctor.department.isActive ||
      doctor.tenantId !== patient.tenantId ||
      doctor.department.tenantId !== tenant.tenantId
    ) {
      return {
        success: false,
        code: 'DOCTOR_UNAVAILABLE',
        message: 'This doctor is currently unavailable for appointments.',
      };
    }

    const todayStr = getHospitalTodayDateString(timezone);
    if (appointmentDate < todayStr) {
      return {
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Cannot book appointments for past dates.',
      };
    }

    const dayOfWeek = getWeekdayFromDateString(appointmentDate);
    const targetUtcDate = parseDateStringToUTCDate(appointmentDate);

    const [weeklyAvailability, blockedDates, activeAppts] = await Promise.all([
      prisma.weeklyAvailability.findMany({
        where: { doctorId, dayOfWeek, tenantId: tenant.tenantId },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true, slotDurationMinutes: true },
      }),
      prisma.blockedDate.findMany({
        where: { doctorId, tenantId: tenant.tenantId, startDate: { lte: targetUtcDate }, endDate: { gte: targetUtcDate } },
        select: { id: true, startDate: true, endDate: true, startTime: true, endTime: true, reason: true },
      }),
      prisma.appointment.findMany({
        where: {
          doctorId,
          tenantId: tenant.tenantId,
          appointmentDate: targetUtcDate,
          status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.CONFIRMED] },
        },
        select: { id: true, appointmentDate: true, startTime: true, endTime: true, status: true },
      }),
    ]);

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

    const availableSlots = computeAvailableSlots({
      date: appointmentDate,
      timezone,
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
        appointmentDate,
        startTime: a.startTime,
        endTime: a.endTime,
        status: a.status,
      })),
      currentDate: todayStr,
    });

    const matchedSlot = availableSlots.find((s) => s.startTime === startTime);
    if (!matchedSlot) {
      return {
        success: false,
        code: 'SLOT_UNAVAILABLE',
        message: 'This time slot was just booked by another patient. Please choose another slot.',
      };
    }

    try {
      const createdAppt = await prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            patientId: patientProfileId,
            doctorId,
            tenantId: tenant.tenantId,
            appointmentDate: targetUtcDate,
            startTime: matchedSlot.startTime,
            endTime: matchedSlot.endTime,
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

        await writeAuditLog(
          {
            tenantId: tenant.tenantId,
            actorUserId: actorUserId ?? patient.userId,
            action: 'appointment.create',
            entityType: 'Appointment',
            entityId: appointment.id,
            after: { status: 'BOOKED', doctorId, appointmentDate, startTime: matchedSlot.startTime },
          },
          tx
        );

        await enqueueAppointmentNotification(
          {
            tenantId: tenant.tenantId,
            type: 'APPOINTMENT_BOOKED',
            recipientUserId: patient.userId,
            appointmentId: appointment.id,
          },
          tx
        );

        return appointment;
      });

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
  } catch {
    return {
      success: false,
      code: 'SERVER_ERROR',
      message: 'An unexpected server error occurred while booking your appointment. Please try again.',
    };
  }
}
