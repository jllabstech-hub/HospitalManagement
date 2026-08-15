import { z } from 'zod';

export const CreateInsurancePartnerSchema = z.object({
  name: z.string().trim().min(2, { message: 'Name must be at least 2 characters.' }),
  description: z.string().trim().optional().or(z.literal('')),
});

export type CreateInsurancePartnerInput = z.infer<typeof CreateInsurancePartnerSchema>;

export const UpdateInsurancePartnerSchema = CreateInsurancePartnerSchema.extend({
  id: z.string().uuid(),
});

export type UpdateInsurancePartnerInput = z.infer<typeof UpdateInsurancePartnerSchema>;
