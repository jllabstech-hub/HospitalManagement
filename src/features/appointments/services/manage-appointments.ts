import { AppointmentStatus, Role, Prisma } from '@prisma/client';
import { prisma } from '@/server/db/client';
import { getHospitalTodayDateString } from '@/lib/date-utils';
import { getHospitalCurrentTimeHHMM } from '../domain/time-utils';
import { buildFuzzyAppointmentWhere } from '@/lib/fuzzy-search';
import { enqueueAppointmentNotification } from '@/server/notifications/outbox';
import { writeAuditLog } from '@/server/security/audit';
import { requireTenantContext } from '@/server/tenant';
import { DEFAULT_TENANT_TIMEZONE } from '@/server/tenant/types';

export interface TransitionStatusInput {
  appointmentId: string;
  actorUser: {
    id: string;
    role: Role;
    tenantId?: string;
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

export function isValidStateTransition(
  currentStatus: AppointmentStatus,
  targetStatus: AppointmentStatus,
  actorRole: Role
): boolean {
  if (
    currentStatus === AppointmentStatus.COMPLETED ||
    currentStatus === AppointmentStatus.CANCELLED ||
    currentStatus === AppointmentStatus.NO_SHOW
  ) {
    return false;
  }

  if (currentStatus === AppointmentStatus.BOOKED) {
    if (targetStatus === AppointmentStatus.CONFIRMED && actorRole === Role.DOCTOR) {
      return true;
    }
    if (targetStatus === AppointmentStatus.CANCELLED) {
      return true;
    }
    return false;
  }

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

function auditActionForStatus(status: AppointmentStatus): string {
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      return 'appointment.confirm';
    case AppointmentStatus.CANCELLED:
      return 'appointment.cancel';
    case AppointmentStatus.COMPLETED:
      return 'appointment.complete';
    case AppointmentStatus.NO_SHOW:
      return 'appointment.no_show';
    default:
      return 'appointment.update';
  }
}

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

    const tenant = await requireTenantContext();
    const timezone = tenant.timezone || DEFAULT_TENANT_TIMEZONE;

    const appointment = await prisma.appointment.findFirst({
      where: { id: appointmentId, tenantId: tenant.tenantId },
      select: {
        id: true,
        tenantId: true,
        patientId: true,
        doctorId: true,
        status: true,
        appointmentDate: true,
        startTime: true,
        patient: { select: { userId: true, tenantId: true } },
        doctor: { select: { tenantId: true } },
      },
    });

    if (!appointment) {
      return { success: false, code: 'NOT_FOUND', error: 'Appointment not found.' };
    }

    if (
      appointment.patient.tenantId !== tenant.tenantId ||
      appointment.doctor.tenantId !== tenant.tenantId
    ) {
      return { success: false, code: 'NOT_FOUND', error: 'Appointment not found.' };
    }

    if (actorUser.role === Role.PATIENT) {
      if (appointment.patientId !== actorUser.patientProfileId) {
        return { success: false, code: 'FORBIDDEN', error: 'You do not have permission to modify this appointment.' };
      }
      if (targetStatus !== AppointmentStatus.CANCELLED) {
        return { success: false, code: 'FORBIDDEN', error: 'Patients can only cancel appointments.' };
      }

      const todayStr = getHospitalTodayDateString(timezone);
      const currentTimeHHMM = getHospitalCurrentTimeHHMM(timezone);
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

    if (!isValidStateTransition(appointment.status, targetStatus, actorUser.role)) {
      return {
        success: false,
        code: 'INVALID_TRANSITION',
        error: `Cannot transition appointment from ${appointment.status} to ${targetStatus}.`,
      };
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.appointment.updateMany({
        where: {
          id: appointmentId,
          tenantId: tenant.tenantId,
          status: appointment.status,
        },
        data: {
          status: targetStatus,
          cancelledBy: targetStatus === AppointmentStatus.CANCELLED ? actorUser.role : undefined,
          cancellationReason: targetStatus === AppointmentStatus.CANCELLED ? cancellationReason || null : undefined,
        },
      });

      if (result.count !== 1) {
        return result;
      }

      await writeAuditLog(
        {
          tenantId: tenant.tenantId,
          actorUserId: actorUser.id,
          action: auditActionForStatus(targetStatus),
          entityType: 'Appointment',
          entityId: appointmentId,
          before: { status: appointment.status },
          after: { status: targetStatus },
        },
        tx
      );

      if (targetStatus === AppointmentStatus.CONFIRMED || targetStatus === AppointmentStatus.CANCELLED) {
        await enqueueAppointmentNotification(
          {
            tenantId: tenant.tenantId,
            type: targetStatus === AppointmentStatus.CONFIRMED ? 'APPOINTMENT_CONFIRMED' : 'APPOINTMENT_CANCELLED',
            recipientUserId: appointment.patient.userId,
            appointmentId: appointment.id,
          },
          tx
        );
      }

      return result;
    });

    if (updated.count !== 1) {
      return {
        success: false,
        code: 'INVALID_TRANSITION',
        error: 'Appointment was updated by another request. Please refresh and try again.',
      };
    }

    return { success: true, data: { id: appointmentId, status: targetStatus } };
  } catch {
    return { success: false, code: 'SERVER_ERROR', error: 'An error occurred while updating the appointment status.' };
  }
}

export async function getPatientAppointments(patientProfileId: string) {
  const tenant = await requireTenantContext();
  const timezone = tenant.timezone || DEFAULT_TENANT_TIMEZONE;

  const appointments = await prisma.appointment.findMany({
    where: { patientId: patientProfileId, tenantId: tenant.tenantId },
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

  const todayStr = getHospitalTodayDateString(timezone);
  const currentTimeStr = getHospitalCurrentTimeHHMM(timezone);

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

export async function getPatientAppointmentDetail(patientProfileId: string, appointmentId: string) {
  const tenant = await requireTenantContext();
  const timezone = tenant.timezone || DEFAULT_TENANT_TIMEZONE;

  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId: tenant.tenantId, patientId: patientProfileId },
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

  if (!appt) {
    return null;
  }

  const dateStr = appt.appointmentDate.toISOString().split('T')[0];
  const todayStr = getHospitalTodayDateString(timezone);
  const currentTimeStr = getHospitalCurrentTimeHHMM(timezone);
  const isPast = dateStr < todayStr || (dateStr === todayStr && appt.startTime < currentTimeStr);
  const isCancellable = !isPast && (appt.status === AppointmentStatus.BOOKED || appt.status === AppointmentStatus.CONFIRMED);

  return { ...appt, dateStr, isPast, isCancellable };
}

export async function getDoctorAppointments(
  doctorProfileId: string,
  params: { dateStr?: string; status?: string; page?: number; limit?: number }
) {
  const tenant = await requireTenantContext();
  const timezone = tenant.timezone || DEFAULT_TENANT_TIMEZONE;
  const targetDateStr = params.dateStr || getHospitalTodayDateString(timezone);
  const targetUtcDate = new Date(Date.parse(`${targetDateStr}T00:00:00.000Z`));
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 10));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.AppointmentWhereInput = {
    doctorId: doctorProfileId,
    tenantId: tenant.tenantId,
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
      where: { doctorId: doctorProfileId, tenantId: tenant.tenantId, appointmentDate: targetUtcDate },
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

export async function getDoctorAppointmentDetail(doctorProfileId: string, appointmentId: string) {
  const tenant = await requireTenantContext();
  const appt = await prisma.appointment.findFirst({
    where: { id: appointmentId, tenantId: tenant.tenantId, doctorId: doctorProfileId },
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

  if (!appt) {
    return null;
  }

  const dateStr = appt.appointmentDate.toISOString().split('T')[0];
  return { ...appt, dateStr };
}

export async function getAdminAppointments(params: {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  doctorId?: string;
  status?: string;
  dateStr?: string;
}) {
  const tenant = await requireTenantContext();
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 20));
  const skip = (page - 1) * limit;

  const whereClause: Prisma.AppointmentWhereInput = { tenantId: tenant.tenantId };

  if (params.departmentId) {
    whereClause.doctor = { departmentId: params.departmentId, tenantId: tenant.tenantId };
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
