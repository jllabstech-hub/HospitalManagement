import { timeToMinutes } from '@/lib/date-utils';
import type { AvailableSlot } from './slot-types';

export function durationMinutesFromRange(startTime: string, endTime: string): number {
  return Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));
}

export function slotDurationMinutes(slot: Pick<AvailableSlot, 'startTime' | 'endTime' | 'slotDurationMinutes'>): number {
  if (slot.slotDurationMinutes && slot.slotDurationMinutes > 0) {
    return slot.slotDurationMinutes;
  }
  return durationMinutesFromRange(slot.startTime, slot.endTime);
}

export function formatSlotDurationLabel(slot: Pick<AvailableSlot, 'startTime' | 'endTime' | 'slotDurationMinutes'>): string {
  return `${slotDurationMinutes(slot)} min`;
}
