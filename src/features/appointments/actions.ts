'use server';

import { requirePatient, requireDoctor } from '@/server/security/auth-helpers';
import { getAvailableSlotsForDoctorDate, GetSlotsResult } from './services/get-available-slots';
import { bookAppointmentTransaction } from './services/book-appointment';
import { transitionAppointmentStatus } from './services/manage-appointments';
import { BookAppointmentResult } from './schemas/booking-schema';
import { AppointmentStatus, Role } from '@prisma/client';
import { DomainError } from '@/server/errors/domain-error';

/**
 * Server Action for patient slot retrieval.
 * SERVER AUTHORIZATION: Requires PATIENT role.
 */
export async function getAvailableSlotsAction(
  doctorId: string,
  dateStr: string
): Promise<GetSlotsResult> {
  try {
    await requirePatient();
    return await getAvailableSlotsForDoctorDate(doctorId, dateStr);
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, slots: [], error: error.message };
    }
    console.error('getAvailableSlotsAction error:', error);
    return { success: false, slots: [], error: 'An error occurred while retrieving available slots.' };
  }
}

/**
 * Server Action for transactional appointment booking.
 * SERVER AUTHORIZATION: Requires PATIENT role.
 * Resolves PatientProfile ID exclusively from authenticated session.
 */
export async function bookAppointmentAction(
  input: unknown
): Promise<BookAppointmentResult> {
  try {
    const user = await requirePatient();

    if (!user.patientProfileId) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Patient profile record is missing for this account.',
      };
    }

    return await bookAppointmentTransaction(user.patientProfileId, input);
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return {
        success: false,
        code: 'UNAUTHORIZED',
        message: error.message,
      };
    }
    console.error('bookAppointmentAction error:', error);
    return {
      success: false,
      code: 'SERVER_ERROR',
      message: 'An error occurred while submitting your appointment booking.',
    };
  }
}

/**
 * Server Action for Patient Appointment Cancellation.
 */
export async function cancelPatientAppointmentAction(input: {
  appointmentId: string;
  cancellationReason?: string;
}) {
  try {
    const user = await requirePatient();
    return await transitionAppointmentStatus({
      appointmentId: input.appointmentId,
      actorUser: {
        id: user.id,
        role: Role.PATIENT,
        patientProfileId: user.patientProfileId,
      },
      targetStatus: AppointmentStatus.CANCELLED,
      cancellationReason: input.cancellationReason,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, code: 'FORBIDDEN', error: error.message };
    }
    console.error('cancelPatientAppointmentAction error:', error);
    return { success: false, code: 'SERVER_ERROR', error: 'Failed to cancel appointment.' };
  }
}

/**
 * Server Action for Doctor Confirmation (BOOKED -> CONFIRMED).
 */
export async function confirmDoctorAppointmentAction(input: { appointmentId: string }) {
  try {
    const user = await requireDoctor();
    return await transitionAppointmentStatus({
      appointmentId: input.appointmentId,
      actorUser: {
        id: user.id,
        role: Role.DOCTOR,
        doctorProfileId: user.doctorProfileId,
      },
      targetStatus: AppointmentStatus.CONFIRMED,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, code: 'FORBIDDEN', error: error.message };
    }
    console.error('confirmDoctorAppointmentAction error:', error);
    return { success: false, code: 'SERVER_ERROR', error: 'Failed to confirm appointment.' };
  }
}

/**
 * Server Action for Doctor Completion (CONFIRMED -> COMPLETED).
 */
export async function completeDoctorAppointmentAction(input: { appointmentId: string }) {
  try {
    const user = await requireDoctor();
    return await transitionAppointmentStatus({
      appointmentId: input.appointmentId,
      actorUser: {
        id: user.id,
        role: Role.DOCTOR,
        doctorProfileId: user.doctorProfileId,
      },
      targetStatus: AppointmentStatus.COMPLETED,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, code: 'FORBIDDEN', error: error.message };
    }
    console.error('completeDoctorAppointmentAction error:', error);
    return { success: false, code: 'SERVER_ERROR', error: 'Failed to complete appointment.' };
  }
}

/**
 * Server Action for Doctor No-Show (CONFIRMED -> NO_SHOW).
 */
export async function noShowDoctorAppointmentAction(input: { appointmentId: string }) {
  try {
    const user = await requireDoctor();
    return await transitionAppointmentStatus({
      appointmentId: input.appointmentId,
      actorUser: {
        id: user.id,
        role: Role.DOCTOR,
        doctorProfileId: user.doctorProfileId,
      },
      targetStatus: AppointmentStatus.NO_SHOW,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, code: 'FORBIDDEN', error: error.message };
    }
    console.error('noShowDoctorAppointmentAction error:', error);
    return { success: false, code: 'SERVER_ERROR', error: 'Failed to mark appointment as no-show.' };
  }
}

/**
 * Server Action for Doctor Cancellation (BOOKED / CONFIRMED -> CANCELLED).
 */
export async function cancelDoctorAppointmentAction(input: {
  appointmentId: string;
  cancellationReason?: string;
}) {
  try {
    const user = await requireDoctor();
    return await transitionAppointmentStatus({
      appointmentId: input.appointmentId,
      actorUser: {
        id: user.id,
        role: Role.DOCTOR,
        doctorProfileId: user.doctorProfileId,
      },
      targetStatus: AppointmentStatus.CANCELLED,
      cancellationReason: input.cancellationReason,
    });
  } catch (error: unknown) {
    if (error instanceof DomainError) {
      return { success: false, code: 'FORBIDDEN', error: error.message };
    }
    console.error('cancelDoctorAppointmentAction error:', error);
    return { success: false, code: 'SERVER_ERROR', error: 'Failed to cancel appointment.' };
  }
}
