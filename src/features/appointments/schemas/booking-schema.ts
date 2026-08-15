import { z } from 'zod';

/**
 * Zod schema for patient appointment booking input.
 * Client-submitted patientId, status, or endTime are strictly forbidden/ignored.
 * End time is always taken from the tenant slot engine.
 */
export const BookAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: 'Doctor ID is required.' })
    .min(1, 'Doctor ID cannot be empty.'),

  appointmentDate: z
    .string({ required_error: 'Appointment date is required.' })
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Expected YYYY-MM-DD.'),

  startTime: z
    .string({ required_error: 'Start time is required.' })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Start time must be in HH:mm format.'),
});

export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>;

export type BookAppointmentErrorCode =
  | 'UNAUTHORIZED'
  | 'VALIDATION_ERROR'
  | 'DOCTOR_UNAVAILABLE'
  | 'SLOT_UNAVAILABLE'
  | 'SERVER_ERROR';

export interface BookAppointmentSuccessResult {
  success: true;
  appointment: {
    id: string;
    doctorId: string;
    doctorName: string;
    departmentName: string;
    appointmentDate: string;
    startTime: string;
    endTime: string;
    status: 'BOOKED';
  };
}

export interface BookAppointmentErrorResult {
  success: false;
  code: BookAppointmentErrorCode;
  message: string;
}

export type BookAppointmentResult = BookAppointmentSuccessResult | BookAppointmentErrorResult;
