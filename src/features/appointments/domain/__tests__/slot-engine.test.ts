import { describe, it, expect } from 'vitest';
import { AppointmentStatus } from '@prisma/client';
import { computeAvailableSlots } from '../slot-engine';
import { timeToMinutes } from '@/lib/date-utils';

describe('Phase 5A: Pure Appointment Slot Computation Engine', () => {
  // Test 2026-08-20 is a Thursday (getWeekdayFromDateString => 4)
  const TEST_DATE = '2026-08-20';
  const DAY_THURSDAY = 4;

  it('TEST 1: Future date with one availability window (09:00-12:00) produces 6 slots', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(6);
    expect(slots.map((s) => s.startTime)).toEqual([
      '09:00',
      '09:30',
      '10:00',
      '10:30',
      '11:00',
      '11:30',
    ]);
    expect(slots[0]).toEqual({
      date: TEST_DATE,
      startTime: '09:00',
      endTime: '09:30',
    });
  });

  it('TEST 2: Future date with two windows (09:00-12:00, 13:00-17:00) produces 14 slots', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
        { dayOfWeek: DAY_THURSDAY, startTime: '13:00', endTime: '17:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(14);
    expect(slots.map((s) => s.startTime)).toEqual([
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    ]);
  });

  it('TEST 3: Full-day block produces 0 slots', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '17:00' },
      ],
      blockedDates: [
        { startDate: TEST_DATE, endDate: TEST_DATE, isFullDay: true, reason: 'Full day leave' },
      ],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(0);
  });

  it('TEST 4: Partial-day block (09:00-17:00, blocked 14:00-17:00) produces 10 slots', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '17:00' },
      ],
      blockedDates: [
        {
          startDate: TEST_DATE,
          endDate: TEST_DATE,
          isFullDay: false,
          startTime: '14:00',
          endTime: '17:00',
        },
      ],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(10); // 09:00 to 13:30 (10 slots)
    expect(slots.map((s) => s.startTime)).not.toContain('14:00');
    expect(slots.map((s) => s.startTime)).not.toContain('16:30');
    expect(slots[slots.length - 1].startTime).toBe('13:30');
  });

  it('TEST 5: One BOOKED appointment (10:00-10:30) removes 10:00 slot', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '17:00' },
      ],
      blockedDates: [],
      activeAppointments: [
        {
          appointmentDate: TEST_DATE,
          startTime: '10:00',
          endTime: '10:30',
          status: AppointmentStatus.BOOKED,
        },
      ],
    });

    expect(slots).toHaveLength(15);
    expect(slots.map((s) => s.startTime)).not.toContain('10:00');
    expect(slots.map((s) => s.startTime)).toContain('09:30');
    expect(slots.map((s) => s.startTime)).toContain('10:30');
  });

  it('TEST 6: One CONFIRMED appointment removes slot', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [
        {
          appointmentDate: TEST_DATE,
          startTime: '11:00',
          endTime: '11:30',
          status: AppointmentStatus.CONFIRMED,
        },
      ],
    });

    expect(slots).toHaveLength(5);
    expect(slots.map((s) => s.startTime)).not.toContain('11:00');
  });

  it('TEST 7: CANCELLED appointment leaves slot available', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [
        {
          appointmentDate: TEST_DATE,
          startTime: '10:00',
          endTime: '10:30',
          status: AppointmentStatus.CANCELLED,
        },
      ],
    });

    expect(slots).toHaveLength(6);
    expect(slots.map((s) => s.startTime)).toContain('10:00');
  });

  it('TEST 8: NO_SHOW appointment leaves slot available', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [
        {
          appointmentDate: TEST_DATE,
          startTime: '10:00',
          endTime: '10:30',
          status: AppointmentStatus.NO_SHOW,
        },
      ],
    });

    expect(slots).toHaveLength(6);
    expect(slots.map((s) => s.startTime)).toContain('10:00');
  });

  it('TEST 9: COMPLETED appointment leaves slot available for future-date computation', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [
        {
          appointmentDate: TEST_DATE,
          startTime: '09:00',
          endTime: '09:30',
          status: AppointmentStatus.COMPLETED,
        },
      ],
    });

    expect(slots).toHaveLength(6);
    expect(slots.map((s) => s.startTime)).toContain('09:00');
  });

  it('TEST 10: Past date produces 0 slots', () => {
    const slots = computeAvailableSlots({
      date: '2026-08-01',
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: 6, startTime: '09:00', endTime: '17:00' }, // Saturday
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(0);
  });

  it('TEST 11: Today with current time 10:15 (10:00-10:30 unavailable, 10:30-11:00 available)', () => {
    // 2026-08-10 is Monday (day 1)
    const slots = computeAvailableSlots({
      date: '2026-08-10',
      currentDate: '2026-08-10',
      currentTime: '10:15',
      weeklyAvailability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots.map((s) => s.startTime)).not.toContain('09:00');
    expect(slots.map((s) => s.startTime)).not.toContain('09:30');
    expect(slots.map((s) => s.startTime)).not.toContain('10:00');
    expect(slots.map((s) => s.startTime)).toContain('10:30');
    expect(slots.map((s) => s.startTime)).toContain('11:00');
    expect(slots.map((s) => s.startTime)).toContain('11:30');
    expect(slots).toHaveLength(3);
  });

  it('TEST 12: Current time exactly 10:30 (10:00-10:30 unavailable, 10:30-11:00 available)', () => {
    const slots = computeAvailableSlots({
      date: '2026-08-10',
      currentDate: '2026-08-10',
      currentTime: '10:30',
      weeklyAvailability: [
        { dayOfWeek: 1, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots.map((s) => s.startTime)).not.toContain('10:00');
    expect(slots.map((s) => s.startTime)).toContain('10:30');
    expect(slots).toHaveLength(3);
  });

  it('TEST 13: Adjacent availability windows (09:00-13:00, 13:00-17:00) produce continuous slots without duplicates', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: DAY_THURSDAY, startTime: '13:00', endTime: '17:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(16);
    expect(slots.map((s) => s.startTime)).toContain('12:30');
    expect(slots.map((s) => s.startTime)).toContain('13:00');
  });

  it('TEST 14: Gap between availability windows (09:00-13:00, 14:00-17:00) excludes 13:00-14:00', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: DAY_THURSDAY, startTime: '14:00', endTime: '17:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots.map((s) => s.startTime)).not.toContain('13:00');
    expect(slots.map((s) => s.startTime)).not.toContain('13:30');
    expect(slots.map((s) => s.startTime)).toContain('12:30');
    expect(slots.map((s) => s.startTime)).toContain('14:00');
    expect(slots).toHaveLength(14);
  });

  it('TEST 15: Partial block exactly at availability boundary (09:00-13:00 avail, 13:00-14:00 blocked) leaves 09:00-13:00 available', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '13:00' },
      ],
      blockedDates: [
        {
          startDate: TEST_DATE,
          endDate: TEST_DATE,
          isFullDay: false,
          startTime: '13:00',
          endTime: '14:00',
        },
      ],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(8);
    expect(slots[slots.length - 1].startTime).toBe('12:30');
  });

  it('TEST 16: Block starts at 10:00 (09:00-17:00 avail, 10:00-17:00 blocked) leaves 09:00-10:00 available', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '17:00' },
      ],
      blockedDates: [
        {
          startDate: TEST_DATE,
          endDate: TEST_DATE,
          isFullDay: false,
          startTime: '10:00',
          endTime: '17:00',
        },
      ],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(2);
    expect(slots.map((s) => s.startTime)).toEqual(['09:00', '09:30']);
  });

  it('TEST 17: Invalid availability range (e.g. 13:00-09:00) handled safely without generating invalid slots', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '13:00', endTime: '09:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    expect(slots).toHaveLength(0);
  });

  it('TEST 18: Chronological ordering of generated slots', () => {
    const slots = computeAvailableSlots({
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '14:00', endTime: '17:00' },
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '12:00' },
      ],
      blockedDates: [],
      activeAppointments: [],
    });

    const startTimes = slots.map((s) => s.startTime);
    const sortedStartTimes = [...startTimes].sort();

    expect(startTimes).toEqual(sortedStartTimes);
    expect(startTimes[0]).toBe('09:00');
    expect(startTimes[startTimes.length - 1]).toBe('16:30');
  });

  describe('Property-Style Invariant Checks', () => {
    const sampleInput = {
      date: TEST_DATE,
      currentDate: '2026-08-10',
      weeklyAvailability: [
        { dayOfWeek: DAY_THURSDAY, startTime: '09:00', endTime: '13:00' },
        { dayOfWeek: DAY_THURSDAY, startTime: '14:00', endTime: '18:00' },
      ],
      blockedDates: [
        { startDate: TEST_DATE, endDate: TEST_DATE, isFullDay: false, startTime: '11:00', endTime: '12:00' },
      ],
      activeAppointments: [
        { appointmentDate: TEST_DATE, startTime: '15:00', endTime: '15:30', status: AppointmentStatus.BOOKED },
        { appointmentDate: TEST_DATE, startTime: '16:00', endTime: '16:30', status: AppointmentStatus.CONFIRMED },
        { appointmentDate: TEST_DATE, startTime: '09:30', endTime: '10:00', status: AppointmentStatus.CANCELLED },
      ],
    };

    it('Invariant 1: Every returned slot is exactly 30 minutes', () => {
      const slots = computeAvailableSlots(sampleInput);
      for (const slot of slots) {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);
        expect(endMin - startMin).toBe(30);
      }
    });

    it('Invariant 2: Every returned slot starts on a 30-minute boundary', () => {
      const slots = computeAvailableSlots(sampleInput);
      for (const slot of slots) {
        const startMin = timeToMinutes(slot.startTime);
        expect(startMin % 30).toBe(0);
      }
    });

    it('Invariant 3: Every returned slot is fully inside availability windows', () => {
      const slots = computeAvailableSlots(sampleInput);
      for (const slot of slots) {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);

        const insideAnyWindow = sampleInput.weeklyAvailability.some((w) => {
          const wStart = timeToMinutes(w.startTime);
          const wEnd = timeToMinutes(w.endTime);
          return startMin >= wStart && endMin <= wEnd;
        });

        expect(insideAnyWindow).toBe(true);
      }
    });

    it('Invariant 4: No returned slot overlaps a blocked period', () => {
      const slots = computeAvailableSlots(sampleInput);
      for (const slot of slots) {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);

        const overlapsBlock = sampleInput.blockedDates.some((b) => {
          if (!b.startTime || !b.endTime) return true;
          const bStart = timeToMinutes(b.startTime);
          const bEnd = timeToMinutes(b.endTime);
          return startMin < bEnd && bStart < endMin;
        });

        expect(overlapsBlock).toBe(false);
      }
    });

    it('Invariant 5 & 6: No returned slot overlaps BOOKED or CONFIRMED appointments', () => {
      const slots = computeAvailableSlots(sampleInput);
      for (const slot of slots) {
        const startMin = timeToMinutes(slot.startTime);
        const endMin = timeToMinutes(slot.endTime);

        const overlapsActiveAppt = sampleInput.activeAppointments.some((a) => {
          if (a.status !== AppointmentStatus.BOOKED && a.status !== AppointmentStatus.CONFIRMED) {
            return false;
          }
          const aStart = timeToMinutes(a.startTime);
          const aEnd = timeToMinutes(a.endTime);
          return startMin < aEnd && aStart < endMin;
        });

        expect(overlapsActiveAppt).toBe(false);
      }
    });

    it('Invariant 7 & 8: Returned slots are chronologically sorted and contain no duplicates', () => {
      const slots = computeAvailableSlots(sampleInput);
      const startTimes = slots.map((s) => s.startTime);

      // Check unique
      const uniqueStartTimes = Array.from(new Set(startTimes));
      expect(startTimes.length).toBe(uniqueStartTimes.length);

      // Check sorted
      for (let i = 0; i < startTimes.length - 1; i++) {
        expect(timeToMinutes(startTimes[i])).toBeLessThan(timeToMinutes(startTimes[i + 1]));
      }
    });
  });
});
