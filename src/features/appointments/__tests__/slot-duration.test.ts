import { describe, it, expect } from 'vitest';
import { computeAvailableSlots } from '../domain/slot-engine';
import { formatSlotDurationLabel } from '../domain/slot-duration';
import { ComputeSlotsInput } from '../domain/slot-types';

describe('Dynamic Slot Duration Regression Tests', () => {
  const baseInput: ComputeSlotsInput = {
    date: '2026-10-12', // Monday
    currentDate: '2026-10-01',
    timezone: 'Asia/Kolkata',
    blockedDates: [],
    activeAppointments: [],
    weeklyAvailability: [],
  };

  it('generates 15-minute slots with slotDurationMinutes = 15', () => {
    const slots = computeAvailableSlots({
      ...baseInput,
      weeklyAvailability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '10:00',
          slotDurationMinutes: 15,
        },
      ],
    });

    expect(slots.length).toBe(4);
    expect(slots[0]).toEqual({
      date: '2026-10-12',
      startTime: '09:00',
      endTime: '09:15',
      slotDurationMinutes: 15,
    });
    expect(slots[3]).toEqual({
      date: '2026-10-12',
      startTime: '09:45',
      endTime: '10:00',
      slotDurationMinutes: 15,
    });
  });

  it('generates 60-minute slots with slotDurationMinutes = 60', () => {
    const slots = computeAvailableSlots({
      ...baseInput,
      weeklyAvailability: [
        {
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '12:00',
          slotDurationMinutes: 60,
        },
      ],
    });

    expect(slots.length).toBe(3);
    expect(slots[0].slotDurationMinutes).toBe(60);
    expect(slots[0].endTime).toBe('10:00');
    expect(slots[2].slotDurationMinutes).toBe(60);
    expect(slots[2].endTime).toBe('12:00');
  });

  it('formats UI labels from the generated slot duration, not a global 30-minute constant', () => {
    expect(formatSlotDurationLabel({ startTime: '09:00', endTime: '09:15', slotDurationMinutes: 15 })).toBe('15 min');
    expect(formatSlotDurationLabel({ startTime: '09:00', endTime: '09:30', slotDurationMinutes: 30 })).toBe('30 min');
    expect(formatSlotDurationLabel({ startTime: '09:00', endTime: '09:45', slotDurationMinutes: 45 })).toBe('45 min');
    expect(formatSlotDurationLabel({ startTime: '09:00', endTime: '10:00', slotDurationMinutes: 60 })).toBe('60 min');
    expect(formatSlotDurationLabel({ startTime: '09:00', endTime: '09:20' })).toBe('20 min');
  });
});
