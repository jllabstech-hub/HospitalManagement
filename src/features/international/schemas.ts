import { z } from 'zod';

export const InternationalPageSchema = z.object({
  title: z.string().trim().min(2, { message: 'Title is required.' }),
  introduction: z.string().trim().optional().or(z.literal('')),
  howToRequest: z.string().trim().optional().or(z.literal('')),
  secondOpinion: z.string().trim().optional().or(z.literal('')),
  requiredDocuments: z.string().trim().optional().or(z.literal('')),
  travelInformation: z.string().trim().optional().or(z.literal('')),
  accommodationInfo: z.string().trim().optional().or(z.literal('')),
  coordinatorContact: z.string().trim().optional().or(z.literal('')),
});

export type InternationalPageInput = z.infer<typeof InternationalPageSchema>;
