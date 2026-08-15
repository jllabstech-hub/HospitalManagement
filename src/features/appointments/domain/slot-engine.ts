import { AppointmentStatus } from '@prisma/client';
import {
  getHospitalTodayDateString,
  formatDateToYYYYMMDD,
  doTimeWindowsOverlap,
  resolveTimezone,
} from '@/lib/date-utils';
import {
  ComputeSlotsInput,
  AvailableSlot,
} from './slot-types';
import {
  timeStrToMinutes,
  minutesToTimeStr,
  getWeekdayFromDateString,
  getHospitalCurrentTimeHHMM,
  normalizeTimeToHHMM,
} from './time-utils';

/**
 * Pure domain function to compute available appointment slots for a given doctor date.
 *
 * Slot length is taken from WeeklyAvailability.slotDurationMinutes (default 30).
 * Available Slots = WeeklyAvailability - BlockedDate exceptions - Active Appointments - Past slots
 */
export function computeAvailableSlots(input: ComputeSlotsInput): AvailableSlot[] {
  const { date, weeklyAvailability, blockedDates, activeAppointments } = input;
  const timezone = resolveTimezone(input.timezone);

  // Defensive validation: Validate date format
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return [];
  }

  const currentDate = input.currentDate || getHospitalTodayDateString(timezone);

  // Rule 1: Past date has 0 available slots
  if (date < currentDate) {
    return [];
  }

  // Helper to standardize date inputs into YYYY-MM-DD
  const normalizeDate = (d: string | Date): string => {
    if (typeof d === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
      return formatDateToYYYYMMDD(new Date(d));
    }
    return formatDateToYYYYMMDD(d);
  };

  // Rule 2: Full-Day Block check
  for (const block of blockedDates || []) {
    const bStart = normalizeDate(block.startDate);
    const bEnd = block.endDate ? normalizeDate(block.endDate) : bStart;

    if (date >= bStart && date <= bEnd) {
      const isFullDay =
        block.isFullDay === true ||
        !block.startTime ||
        !block.endTime ||
        block.startTime.trim() === '' ||
        block.endTime.trim() === '';

      if (isFullDay) {
        return []; // Entire day is blocked
      }
    }
  }

  // Rule 3: Resolve Weekday from the civil date (YYYY-MM-DD is timezone-independent).
  let dayOfWeek: number;
  try {
    dayOfWeek = getWeekdayFromDateString(date);
  } catch {
    return [];
  }

  // Rule 4: Match Weekly Availability for resolved weekday
  const matchingAvailability = (weeklyAvailability || []).filter(
    (w) => w.dayOfWeek === dayOfWeek
  );

  if (matchingAvailability.length === 0) {
    return [];
  }

  // Extract partial-day blocks for target date
  const activePartialBlocks = (blockedDates || [])
    .filter((b) => {
      const bStart = normalizeDate(b.startDate);
      const bEnd = b.endDate ? normalizeDate(b.endDate) : bStart;
      const isDateInRange = date >= bStart && date <= bEnd;
      const isPartial =
        b.isFullDay === false &&
        Boolean(b.startTime) &&
        Boolean(b.endTime) &&
        b.startTime!.trim() !== '' &&
        b.endTime!.trim() !== '';
      return isDateInRange && isPartial;
    })
    .map((b) => ({
      startTime: normalizeTimeToHHMM(b.startTime!),
      endTime: normalizeTimeToHHMM(b.endTime!),
    }));

  // Extract active appointments (BOOKED or CONFIRMED) for target date
  const activeAppts = (activeAppointments || [])
    .filter((a) => {
      const apptDate = normalizeDate(a.appointmentDate);
      const isActiveStatus =
        a.status === AppointmentStatus.BOOKED ||
        a.status === AppointmentStatus.CONFIRMED;
      return apptDate === date && isActiveStatus;
    })
    .map((a) => ({
      startTime: normalizeTimeToHHMM(a.startTime),
      endTime: normalizeTimeToHHMM(a.endTime),
    }));

  // Rule 5: Calculate today's current time boundary if target date is today
  const isToday = date === currentDate;
  const currentTimeStr = isToday
    ? input.currentTime || getHospitalCurrentTimeHHMM(timezone)
    : '00:00';
  const currentTimeMin = isToday ? timeStrToMinutes(currentTimeStr) : 0;

  const generatedSlotsMap = new Map<string, AvailableSlot>();

  // Rule 6: Generate slots using each window's configured duration
  for (const window of matchingAvailability) {
    const duration =
      window.slotDurationMinutes && window.slotDurationMinutes > 0
        ? window.slotDurationMinutes
        : 30;

    const wStartStr = normalizeTimeToHHMM(window.startTime);
    const wEndStr = normalizeTimeToHHMM(window.endTime);

    const wStartMin = timeStrToMinutes(wStartStr);
    const wEndMin = timeStrToMinutes(wEndStr);

    if (wStartMin >= wEndMin) {
      continue; // Invalid range, skip defensively
    }

    let slotStartMin = wStartMin;

    while (slotStartMin + duration <= wEndMin) {
      const slotEndMin = slotStartMin + duration;
      const slotStartStr = minutesToTimeStr(slotStartMin);
      const slotEndStr = minutesToTimeStr(slotEndMin);

      // Check Past/In-Progress time rule for today:
      // A slot starting before current time (slotStartMin < currentTimeMin) is excluded.
      if (isToday && slotStartMin < currentTimeMin) {
        slotStartMin += duration;
        continue;
      }

      // Check Partial-Day Block overlap
      const isBlocked = activePartialBlocks.some((b) =>
        doTimeWindowsOverlap(slotStartStr, slotEndStr, b.startTime, b.endTime)
      );

      if (isBlocked) {
        slotStartMin += duration;
        continue;
      }

      // Check Active Appointment overlap
      const isOccupied = activeAppts.some((a) =>
        doTimeWindowsOverlap(slotStartStr, slotEndStr, a.startTime, a.endTime)
      );

      if (isOccupied) {
        slotStartMin += duration;
        continue;
      }

      // Add valid slot
      generatedSlotsMap.set(slotStartStr, {
        date,
        startTime: slotStartStr,
        endTime: slotEndStr,
        slotDurationMinutes: duration,
      });

      slotStartMin += duration;
    }
  }

  // Rule 7: Sort slots chronologically
  const resultSlots = Array.from(generatedSlotsMap.values());
  resultSlots.sort((a, b) => timeStrToMinutes(a.startTime) - timeStrToMinutes(b.startTime));

  return resultSlots;
}
