import { AppointmentStatus, Role, Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { getHospitalTodayDateString } from '@/lib/date-utils';
import { getHospitalCurrentTimeHHMM } from '../domain/time-utils';
import { buildFuzzyAppointmentWhere } from '@/lib/fuzzy-search';
import { notificationService } from '@/services/notifications/NotificationService';


export interface TransitionStatusInput {
  appointmentId: string;
  actorUser: {
    id: string;
    role: Role;
    patientProfileId?: string;
    doctorProfileId?: string;
  };
  targetStatus: AppointmentStatus;
  cancellationReason?: string;
}

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * Validates state machine transitions according to approved business rules.
 */
export function isValidStateTransition(
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus,
  actorRole: Role
): boolean {
  // Terminal states cannot transition out
  if (
    currentStatus === AppointmentStatus.COMPLETED ||
    currentStatus === AppointmentStatus.CANCELLED ||
    currentStatus === AppointmentStatus.NO_SHOW
  ) {
    return false;
  }

  // BOOKED transitions
  if (currentStatus === AppointmentStatus.BOOKED) {
    if (targetStatus === AppointmentStatus.CONFIRMED && actorRole === Role.DOCTOR) {
      return true;
    }
    if (targetStatus === AppointmentStatus.CANCELLED) {
      return true; // Patient, Doctor, or Admin
    }
    return false;
  }

  // CONFIRMED transitions
  if (currentStatus === AppointmentStatus.CONFIRMED) {
    if (targetStatus === AppointmentStatus.COMPLETED && actorRole === Role.DOCTOR) {
      return true;
    }
    if (targetStatus === AppointmentStatus.CANCELLED) {
      return true;
    }
    if (targetStatus === AppointmentStatus.NO_SHOW && actorRole === Role.DOCTOR) {
      return true;
    }
    return false;
  }

  return false;
}

/**
 * Transitions appointment status with role-based authorization and state machine validation.
 */
export async function transitionAppointmentStatus({
  appointmentId,
  actorUser,
  targetStatus,
  cancellationReason,
}: TransitionStatusInput): Promise<ServiceResult<{ id: string; status: AppointmentStatus }>> {
  try {
    if (!appointmentId || typeof appointmentId !== 'string') {
      return { success: false, code: 'INVALID_INPUT', error: 'Invalid appointment ID.' };
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: {
        doctor: { select: { fullName: true } },
        patient: { 
          select: { 
            fullName: true,
            phoneNumber: true,
            user: { select: { email: true } }
          } 
        },
      },
    });

    if (!appointment) {
      return { success: false, code: 'NOT_FOUND', error: 'Appointment not found.' };
    }

    // Authorization & Ownership Verification
    if (actorUser.role === Role.PATIENT) {
      if (appointment.patientId !== actorUser.patientProfileId) {
        return { success: false, code: 'FORBIDDEN', error: 'You do not have permission to modify this appointment.' };
      }
      if (targetStatus !== AppointmentStatus.CANCELLED) {
        return { success: false, code: 'FORBIDDEN', error: 'Patients can only cancel appointments.' };
      }

      // Check if appointment is in the past in Asia/Kolkata
      const todayStr = getHospitalTodayDateString();
      const currentTimeHHMM = getHospitalCurrentTimeHHMM();
      const apptDateStr = appointment.appointmentDate.toISOString().split('T')[0];

      if (apptDateStr < todayStr || (apptDateStr === todayStr && appointment.startTime < currentTimeHHMM)) {
        return { success: false, code: 'APPOINTMENT_NOT_CANCELLABLE', error: 'Past appointments cannot be cancelled.' };
      }
    } else if (actorUser.role === Role.DOCTOR) {
      if (appointment.doctorId !== actorUser.doctorProfileId) {
        return { success: false, code: 'FORBIDDEN', error: 'You can only manage your own appointments.' };
      }
    } else if (actorUser.role !== Role.ADMIN) {
      return { success: false, code: 'FORBIDDEN', error: 'Unauthorized role.' };
    }

    // State Machine Transition Validation
    if (!isValidStateTransition(appointment.status, targetStatus, actorUser.role)) {
      return {
        success: false,
        code: 'INVALID_TRANSITION',
        error: `Cannot transition appointment from ${appointment.status} to ${targetStatus}.`,
      };
    }

    // Apply Update
    const updatedAppt = await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: targetStatus,
        cancelledBy: targetStatus === AppointmentStatus.CANCELLED ? actorUser.role : undefined,
        cancellationReason: targetStatus === AppointmentStatus.CANCELLED ? cancellationReason || null : undefined,
      },
      select: {
        id: true,
        status: true,
        appointmentDate: true,
        startTime: true,
      },
    });

    // Fire notifications asynchronously
    const dateTimeString = `${updatedAppt.appointmentDate.toISOString().split('T')[0]} at ${updatedAppt.startTime}`;
    if (targetStatus === AppointmentStatus.CONFIRMED) {
      notificationService.notifyAppointmentConfirmed(
        null, // tenantId
        appointment.patientId,
        appointment.id,
        appointment.patient.fullName,
        appointment.doctor.fullName,
        dateTimeString,
        appointment.patient.user.email,
        appointment.patient.phoneNumber
      ).catch(err => console.error('Notification error:', err));
    } else if (targetStatus === AppointmentStatus.CANCELLED) {
      notificationService.notifyAppointmentCancelled(
        null,
        appointment.patientId,
        appointment.id,
        appointment.patient.fullName,
        appointment.doctor.fullName,
        dateTimeString,
        cancellationReason || 'No reason provided',
        appointment.patient.user.email,
        appointment.patient.phoneNumber
      ).catch(err => console.error('Notification error:', err));
    }

    return { success: true, data: updatedAppt };
  } catch (error: unknown) {
    console.error('transitionAppointmentStatus error:', error);
    return { success: false, code: 'SERVER_ERROR', error: 'An error occurred while updating the appointment status.' };
  }
}

/**
 * Retrieves categorized appointments for a patient.
 */
export async function getPatientAppointments(patientProfileId: string) {
  const appointments = await prisma.appointment.findMany({
    where: { patientId: patientProfileId },
    select: {
      id: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      cancellationReason: true,
      cancelledBy: true,
      doctor: {
        select: {
          id: true,
          fullName: true,
          qualification: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
  });

  const todayStr = getHospitalTodayDateString();
  const currentTimeStr = getHospitalCurrentTimeHHMM();

  const formattedAppts = appointments.map((a) => {
    const dateStr = a.appointmentDate.toISOString().split('T')[0];
    const isPast = dateStr < todayStr || (dateStr === todayStr && a.startTime < currentTimeStr);
    return { ...a, dateStr, isPast };
  });

  const upcoming = formattedAppts.filter(
    (a) => !a.isPast && (a.status === AppointmentStatus.BOOKED || a.status === AppointmentStatus.CONFIRMED)
  );

  const cancelled = formattedAppts.filter((a) => a.status === AppointmentStatus.CANCELLED);

  const past = formattedAppts.filter(
    (a) => a.status === AppointmentStatus.COMPLETED || a.status === AppointmentStatus.NO_SHOW || (a.isPast && a.status !== AppointmentStatus.CANCELLED)
  );

  return { upcoming, past, cancelled, all: formattedAppts };
}

/**
 * Retrieves detailed appointment by ID for patient ownership.
 */
export async function getPatientAppointmentDetail(patientProfileId: string, appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      patientId: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      reason: true,
      cancellationReason: true,
      cancelledBy: true,
      createdAt: true,
      doctor: {
        select: {
          id: true,
          fullName: true,
          qualification: true,
          phoneNumber: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!appt || appt.patientId !== patientProfileId) {
    return null;
  }

  const dateStr = appt.appointmentDate.toISOString().split('T')[0];
  const todayStr = getHospitalTodayDateString();
  const currentTimeStr = getHospitalCurrentTimeHHMM();
  const isPast = dateStr < todayStr || (dateStr === todayStr && appt.startTime < currentTimeStr);
  const isCancellable = !isPast && (appt.status === AppointmentStatus.BOOKED || appt.status === AppointmentStatus.CONFIRMED);

  return { ...appt, dateStr, isPast, isCancellable };
}

/**
 * Retrieves doctor's daily appointments with date and status filters.
 */
export async function getDoctorAppointments(
  doctorProfileId: string,
  params: { dateStr?: string; status?: string; page?: number; limit?: number }
) {
  const targetDateStr = params.dateStr || getHospitalTodayDateString();
  const targetUtcDate = new Date(Date.parse(`${targetDateStr}T00:00:00.000Z`));
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 10));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.AppointmentWhereInput = {
    doctorId: doctorProfileId,
    appointmentDate: targetUtcDate,
  };

  if (params.status && Object.values(AppointmentStatus).includes(params.status as AppointmentStatus)) {
    whereClause.status = params.status as AppointmentStatus;
  }

  const [appointments, allDayAppts] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        status: true,
        cancellationReason: true,
        cancelledBy: true,
        patient: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
            dateOfBirth: true,
            gender: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
      skip,
      take: limit,
    }),
    prisma.appointment.findMany({
      where: { doctorId: doctorProfileId, appointmentDate: targetUtcDate },
      select: { status: true },
    }),
  ]);

  const filteredTotalCount = whereClause.status
    ? allDayAppts.filter((a) => a.status === whereClause.status).length
    : allDayAppts.length;
  const totalPages = Math.ceil(filteredTotalCount / limit) || 1;

  const formattedAppts = appointments.map((a) => ({
    ...a,
    dateStr: targetDateStr,
  }));

  // Summary counts for target date
  const counts = {
    total: allDayAppts.length,
    booked: allDayAppts.filter((a) => a.status === AppointmentStatus.BOOKED).length,
    confirmed: allDayAppts.filter((a) => a.status === AppointmentStatus.CONFIRMED).length,
    completed: allDayAppts.filter((a) => a.status === AppointmentStatus.COMPLETED).length,
    cancelled: allDayAppts.filter((a) => a.status === AppointmentStatus.CANCELLED).length,
    noShow: allDayAppts.filter((a) => a.status === AppointmentStatus.NO_SHOW).length,
  };

  return {
    appointments: formattedAppts,
    targetDateStr,
    counts,
    currentPage: page,
    totalPages,
    totalCount: filteredTotalCount,
  };
}

/**
 * Retrieves detailed appointment by ID for doctor ownership.
 */
export async function getDoctorAppointmentDetail(doctorProfileId: string, appointmentId: string) {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: {
      id: true,
      doctorId: true,
      appointmentDate: true,
      startTime: true,
      endTime: true,
      status: true,
      reason: true,
      cancellationReason: true,
      cancelledBy: true,
      createdAt: true,
      patient: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          dateOfBirth: true,
          gender: true,
        },
      },
    },
  });

  if (!appt || appt.doctorId !== doctorProfileId) {
    return null;
  }

  const dateStr = appt.appointmentDate.toISOString().split('T')[0];
  return { ...appt, dateStr };
}

/**
 * System-wide paginated appointment query for Admin.
 */
export async function getAdminAppointments(params: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  doctorId?: string;
  status?: string;
  dateStr?: string;
}) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.AppointmentWhereInput = {};

  if (params.departmentId) {
    whereClause.doctor = { departmentId: params.departmentId };
  }

  if (params.doctorId) {
    whereClause.doctorId = params.doctorId;
  }

  if (params.status && Object.values(AppointmentStatus).includes(params.status as AppointmentStatus)) {
    whereClause.status = params.status as AppointmentStatus;
  }

  if (params.dateStr && /^\d{4}-\d{2}-\d{2}$/.test(params.dateStr)) {
    whereClause.appointmentDate = new Date(Date.parse(`${params.dateStr}T00:00:00.000Z`));
  }

  if (params.search && params.search.trim().length > 0) {
    const fuzzyCond = buildFuzzyAppointmentWhere(params.search);
    if (fuzzyCond.AND) {
      whereClause.AND = fuzzyCond.AND;
    }
  }

  const [appointments, totalCount] = await Promise.all([
    prisma.appointment.findMany({
      where: whereClause,
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        endTime: true,
        status: true,
        cancellationReason: true,
        cancelledBy: true,
        createdAt: true,
        patient: { select: { id: true, fullName: true, phoneNumber: true } },
        doctor: {
          select: {
            id: true,
            fullName: true,
            department: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.appointment.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / limit) || 1;

  const formattedAppts = appointments.map((a) => ({
    ...a,
    dateStr: a.appointmentDate.toISOString().split('T')[0],
  }));

  return {
    appointments: formattedAppts,
    totalCount,
    currentPage: page,
    totalPages,
  };
}
