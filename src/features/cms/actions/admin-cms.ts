'use server';

import { z } from 'zod';
import {
  ContactMessageStatus,
  EnquiryStatus,
} from '@prisma/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { revalidatePath } from 'next/cache';

export type AdminCmsActionResult = { success: true } | { success: false; error: string };

const HospitalProfileSchema = z.object({
  id: z.string().uuid().optional(),
  hospitalName: z.string().trim().min(2, 'Hospital name is required.'),
  legalName: z.string().trim().optional(),
  shortDescription: z.string().trim().optional(),
  fullDescription: z.string().trim().optional(),
  tagline: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  emergencyPhone: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email.').optional().or(z.literal('')),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  timezone: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  workingHours: z.string().trim().optional(),
  mission: z.string().trim().optional(),
  vision: z.string().trim().optional(),
  values: z.string().trim().optional(),
});

const EnquiryTypeSchema = z.enum([
  'appointment',
  'international',
  'package',
]);

const EnquiryStatusSchema = z.nativeEnum(EnquiryStatus);
const ContactMessageStatusSchema = z.nativeEnum(ContactMessageStatus);

function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignored outside Next.js request context
  }
}

export async function upsertHospitalProfileAction(
  rawInput: z.infer<typeof HospitalProfileSchema>
): Promise<AdminCmsActionResult> {
  try {
    await requireAdmin();

    const parsed = HospitalProfileSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid profile data.' };
    }

    const data = {
      hospitalName: parsed.data.hospitalName,
      legalName: parsed.data.legalName || null,
      shortDescription: parsed.data.shortDescription || null,
      fullDescription: parsed.data.fullDescription || null,
      tagline: parsed.data.tagline || null,
      phone: parsed.data.phone || null,
      emergencyPhone: parsed.data.emergencyPhone || null,
      email: parsed.data.email || null,
      addressLine1: parsed.data.addressLine1 || null,
      addressLine2: parsed.data.addressLine2 || null,
      city: parsed.data.city || null,
      state: parsed.data.state || null,
      postalCode: parsed.data.postalCode || null,
      country: parsed.data.country || null,
      timezone: parsed.data.timezone || null,
      websiteUrl: parsed.data.websiteUrl || null,
      workingHours: parsed.data.workingHours || null,
      mission: parsed.data.mission || null,
      vision: parsed.data.vision || null,
      values: parsed.data.values || null,
      isActive: true,
    };

    if (parsed.data.id) {
      await prisma.hospitalProfile.update({
        where: { id: parsed.data.id },
        data,
      });
    } else {
      const existing = await prisma.hospitalProfile.findFirst({ select: { id: true } });
      if (existing) {
        await prisma.hospitalProfile.update({
          where: { id: existing.id },
          data,
        });
      } else {
        await prisma.hospitalProfile.create({ data });
      }
    }

    safeRevalidate('/admin/content/hospital');
    safeRevalidate('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to save hospital profile.' };
  }
}

export async function updateEnquiryStatusAction(input: {
  type: z.infer<typeof EnquiryTypeSchema>;
  id: string;
  status: EnquiryStatus;
}): Promise<AdminCmsActionResult> {
  try {
    await requireAdmin();

    const typeParsed = EnquiryTypeSchema.safeParse(input.type);
    const statusParsed = EnquiryStatusSchema.safeParse(input.status);
    const idParsed = z.string().uuid().safeParse(input.id);

    if (!typeParsed.success || !statusParsed.success || !idParsed.success) {
      return { success: false, error: 'Invalid enquiry update request.' };
    }

    const { type, id, status } = {
      type: typeParsed.data,
      id: idParsed.data,
      status: statusParsed.data,
    };

    switch (type) {
      case 'appointment':
        await prisma.appointmentEnquiry.update({ where: { id }, data: { status } });
        break;
      case 'international':
        await prisma.internationalPatientEnquiry.update({ where: { id }, data: { status } });
        break;
      case 'package':
        await prisma.packageInformationRequest.update({ where: { id }, data: { status } });
        break;
    }

    safeRevalidate('/admin/enquiries');
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to update enquiry status.' };
  }
}

export async function updateContactMessageStatusAction(input: {
  id: string;
  status: ContactMessageStatus;
}): Promise<AdminCmsActionResult> {
  try {
    await requireAdmin();

    const idParsed = z.string().uuid().safeParse(input.id);
    const statusParsed = ContactMessageStatusSchema.safeParse(input.status);

    if (!idParsed.success || !statusParsed.success) {
      return { success: false, error: 'Invalid contact message update request.' };
    }

    await prisma.contactMessage.update({
      where: { id: idParsed.data },
      data: { status: statusParsed.data },
    });

    safeRevalidate('/admin/enquiries');
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to update contact message status.' };
  }
}
