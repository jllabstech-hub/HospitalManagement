import { AppointmentStatus } from '@prisma/client';

export interface AvailableSlot {
  date: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes?: number;
}

export interface WeeklyAvailabilityItem {
  id?: string;
  dayOfWeek: number;
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;   // HH:mm or HH:mm:ss
  slotDurationMinutes?: number;
}

export interface BlockedDateItem {
  id?: string;
  startDate: string | Date;
  endDate?: string | Date | null;
  isFullDay?: boolean;
  startTime?: string | null; // HH:mm or HH:mm:ss
  endTime?: string | null;   // HH:mm or HH:mm:ss
  reason?: string | null;
}

export interface ActiveAppointmentItem {
  id?: string;
  appointmentDate: string | Date;
  startTime: string; // HH:mm or HH:mm:ss
  endTime: string;   // HH:mm or HH:mm:ss
  status: AppointmentStatus;
}

export interface ComputeSlotsInput {
  /** Target date in YYYY-MM-DD format */
  date: string;
  /** Recurring weekly availability windows for the doctor */
  weeklyAvailability: WeeklyAvailabilityItem[];
  /** Blocked date exceptions for the doctor */
  blockedDates: BlockedDateItem[];
  /** Existing appointments for the doctor */
  activeAppointments: ActiveAppointmentItem[];
  /**
   * Optional override for current hospital time in HH:mm format.
   * If omitted, defaults to the tenant timezone current time.
   */
  currentTime?: string;
  /**
   * Optional override for current hospital date in YYYY-MM-DD format.
   * If omitted, defaults to the tenant timezone current date.
   */
  currentDate?: string;
  /**
   * IANA timezone used when currentDate/currentTime are omitted.
   */
  timezone?: string;
}
