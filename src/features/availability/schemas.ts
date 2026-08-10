import { z } from 'zod';
import { timeToMinutes } from '@/lib/date-utils';

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

export const CreateAvailabilitySchema = z
  .object({
    dayOfWeek: z
      .coerce
      .number()
      .int()
      .min(0, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday).' })
      .max(6, { message: 'Day of week must be between 0 (Sunday) and 6 (Saturday).' }),
    startTime: z
      .string()
      .regex(timeRegex, { message: 'Start time must be in HH:mm format (e.g. 09:00).' }),
    endTime: z
      .string()
      .regex(timeRegex, { message: 'End time must be in HH:mm format (e.g. 17:00).' }),
  })
  .refine(
    (data) => timeToMinutes(data.startTime) < timeToMinutes(data.endTime),
    {
      message: 'End time must be after start time.',
      path: ['endTime'],
    }
  );

export type CreateAvailabilityInput = z.infer<typeof CreateAvailabilitySchema>;

export const UpdateAvailabilitySchema = z
  .object({
    id: z.string().uuid({ message: 'Invalid availability window ID.' }),
    startTime: z
      .string()
      .regex(timeRegex, { message: 'Start time must be in HH:mm format.' }),
    endTime: z
      .string()
      .regex(timeRegex, { message: 'End time must be in HH:mm format.' }),
  })
  .refine(
    (data) => timeToMinutes(data.startTime) < timeToMinutes(data.endTime),
    {
      message: 'End time must be after start time.',
      path: ['endTime'],
    }
  );

export type UpdateAvailabilityInput = z.infer<typeof UpdateAvailabilitySchema>;

export const CreateBlockedDateSchema = z
  .object({
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD).' }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD).' })
      .optional(),
    isFullDay: z.boolean(),
    startTime: z
      .string()
      .regex(timeRegex, { message: 'Start time must be in HH:mm format.' })
      .optional()
      .or(z.literal('')),
    endTime: z
      .string()
      .regex(timeRegex, { message: 'End time must be in HH:mm format.' })
      .optional()
      .or(z.literal('')),
    reason: z
      .string()
      .trim()
      .max(200, { message: 'Reason must not exceed 200 characters.' })
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const end = data.endDate || data.startDate;
      return data.startDate <= end;
    },
    {
      message: 'End date cannot be before start date.',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (!data.isFullDay) {
        if (!data.startTime || !data.endTime) return false;
        return timeToMinutes(data.startTime) < timeToMinutes(data.endTime);
      }
      return true;
    },
    {
      message: 'Partial day block requires start time to be before end time.',
      path: ['endTime'],
    }
  );

export type CreateBlockedDateInput = z.infer<typeof CreateBlockedDateSchema>;

export const UpdateBlockedDateSchema = z
  .object({
    id: z.string().uuid({ message: 'Invalid blocked date ID.' }),
    startDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD).' }),
    endDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please enter a valid date (YYYY-MM-DD).' })
      .optional(),
    isFullDay: z.boolean(),
    startTime: z
      .string()
      .regex(timeRegex, { message: 'Start time must be in HH:mm format.' })
      .optional()
      .or(z.literal('')),
    endTime: z
      .string()
      .regex(timeRegex, { message: 'End time must be in HH:mm format.' })
      .optional()
      .or(z.literal('')),
    reason: z
      .string()
      .trim()
      .max(200, { message: 'Reason must not exceed 200 characters.' })
      .optional()
      .or(z.literal('')),
  })
  .refine(
    (data) => {
      const end = data.endDate || data.startDate;
      return data.startDate <= end;
    },
    {
      message: 'End date cannot be before start date.',
      path: ['endDate'],
    }
  )
  .refine(
    (data) => {
      if (!data.isFullDay) {
        if (!data.startTime || !data.endTime) return false;
        return timeToMinutes(data.startTime) < timeToMinutes(data.endTime);
      }
      return true;
    },
    {
      message: 'Partial day block requires start time to be before end time.',
      path: ['endTime'],
    }
  );

export type UpdateBlockedDateInput = z.infer<typeof UpdateBlockedDateSchema>;
