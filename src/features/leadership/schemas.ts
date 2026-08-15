import { z } from 'zod';

export const CreateLeadershipSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
  designation: z.string().trim().min(2, { message: 'Designation is required.' }),
  shortBio: z.string().trim().optional().or(z.literal('')),
});

export type CreateLeadershipInput = z.infer<typeof CreateLeadershipSchema>;

export const UpdateLeadershipSchema = CreateLeadershipSchema.extend({
  id: z.string().uuid(),
});

export type UpdateLeadershipInput = z.infer<typeof UpdateLeadershipSchema>;
