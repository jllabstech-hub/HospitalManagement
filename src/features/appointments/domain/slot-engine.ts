import { AppointmentStatus } from '@prisma/client';
import {
  getHospitalTodayDateString,
  formatDateToYYYYMMDD,
  doTimeWindowsOverlap,
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
 * Pure domain function to compute available 30-minute appointment slots for a given doctor date.
 *
 * Formula:
 * Available Slots = WeeklyAvailability - BlockedDate exceptions - Active Appointments (BOOKED/CONFIRMED) - Past/In-Progress Slots
 *
 * Properties:
 * - Pure, deterministic, zero database, zero auth, zero React dependency.
 * - Half-open interval convention: [start, end).
 * - Fixed 30-minute grid starts (00:00, 00:30, ..., 23:30).
 */
export function computeAvailableSlots(input: ComputeSlotsInput): AvailableSlot[] {
  const { date, weeklyAvailability, blockedDates, activeAppointments } = input;

  // Defensive validation: Validate date format
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return [];
  }

  const currentDate = input.currentDate || getHospitalTodayDateString();

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

  // Rule 3: Resolve Weekday in Asia/Kolkata
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
    ? input.currentTime || getHospitalCurrentTimeHHMM()
    : '00:00';
  const currentTimeMin = isToday ? timeStrToMinutes(currentTimeStr) : 0;

  const generatedSlotsMap = new Map<string, AvailableSlot>();

  // Rule 6: Generate 30-minute grid slots for matching availability windows
  for (const window of matchingAvailability) {
    const wStartStr = normalizeTimeToHHMM(window.startTime);
    const wEndStr = normalizeTimeToHHMM(window.endTime);

    const wStartMin = timeStrToMinutes(wStartStr);
    const wEndMin = timeStrToMinutes(wEndStr);

    if (wStartMin >= wEndMin) {
      continue; // Invalid range, skip defensively
    }

    // Align start to 30-minute grid boundary (e.g. 09:00, 09:30)
    let slotStartMin = Math.ceil(wStartMin / 30) * 30;

    while (slotStartMin + 30 <= wEndMin) {
      const slotEndMin = slotStartMin + 30;
      const slotStartStr = minutesToTimeStr(slotStartMin);
      const slotEndStr = minutesToTimeStr(slotEndMin);

      // Check Past/In-Progress time rule for today:
      // A slot starting before current time (slotStartMin < currentTimeMin) is excluded.
      if (isToday && slotStartMin < currentTimeMin) {
        slotStartMin += 30;
        continue;
      }

      // Check Partial-Day Block overlap
      const isBlocked = activePartialBlocks.some((b) =>
        doTimeWindowsOverlap(slotStartStr, slotEndStr, b.startTime, b.endTime)
      );

      if (isBlocked) {
        slotStartMin += 30;
        continue;
      }

      // Check Active Appointment overlap
      const isOccupied = activeAppts.some((a) =>
        doTimeWindowsOverlap(slotStartStr, slotEndStr, a.startTime, a.endTime)
      );

      if (isOccupied) {
        slotStartMin += 30;
        continue;
      }

      // Add valid slot
      generatedSlotsMap.set(slotStartStr, {
        date,
        startTime: slotStartStr,
        endTime: slotEndStr,
      });

      slotStartMin += 30;
    }
  }

  // Rule 7: Sort slots chronologically
  const resultSlots = Array.from(generatedSlotsMap.values());
  resultSlots.sort((a, b) => timeStrToMinutes(a.startTime) - timeStrToMinutes(b.startTime));

  return resultSlots;
}
