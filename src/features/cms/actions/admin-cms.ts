'use server';

import { z } from 'zod';
import {
  ContactMessageStatus,
  EnquiryStatus,
  Prisma,
} from '@prisma/client';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { revalidatePath, revalidateTag } from 'next/cache';
import { writeAuditLog } from '@/server/security/audit';
import { parseFooterConfig } from '@/features/cms/footer-config';

export type AdminCmsActionResult = { success: true } | { success: false; error: string };

const HospitalProfileSchema = z.object({
  id: z.string().uuid().optional(),
  hospitalName: z.string().trim().min(2, 'Hospital name is required.'),
  shortDescription: z.string().trim().optional(),
  fullDescription: z.string().trim().optional(),
  tagline: z.string().trim().optional(),
  country: z.string().trim().optional(),
  timezone: z.string().trim().optional(),
  websiteUrl: z.string().trim().optional(),
  mission: z.string().trim().optional(),
  vision: z.string().trim().optional(),
  values: z.string().trim().optional(),
  heroImageUrl: z.string().trim().optional().or(z.literal('')),
  logoUrl: z.string().trim().optional().or(z.literal('')),
  customDomain: z.string().trim().optional().or(z.literal('')),
  subdomain: z.string().trim().optional().or(z.literal('')),
  primaryColor: z.string().trim().optional(),
  secondaryColor: z.string().trim().optional(),
  fontFamily: z.string().trim().optional(),
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
    const admin = await requireAdmin();

    const parsed = HospitalProfileSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid profile data.' };
    }

    const data = {
      hospitalName: parsed.data.hospitalName,
      shortDescription: parsed.data.shortDescription || null,
      fullDescription: parsed.data.fullDescription || null,
      tagline: parsed.data.tagline || null,
      country: parsed.data.country || null,
      timezone: parsed.data.timezone || null,
      websiteUrl: parsed.data.websiteUrl || null,
      mission: parsed.data.mission || null,
      vision: parsed.data.vision || null,
      values: parsed.data.values || null,
      heroImageUrl: parsed.data.heroImageUrl || null,
      logoUrl: parsed.data.logoUrl || null,
      customDomain: parsed.data.customDomain || null,
      subdomain: parsed.data.subdomain || null,
      primaryColor: parsed.data.primaryColor || null,
      secondaryColor: parsed.data.secondaryColor || null,
      fontFamily: parsed.data.fontFamily || null,
      isActive: true,
    };

    if (parsed.data.id) {
      if (parsed.data.id !== admin.tenantId) {
        return { success: false, error: 'You can only update the current hospital profile.' };
      }
      await prisma.hospitalProfile.update({
        where: { id: admin.tenantId },
        data,
      });
    } else {
      await prisma.hospitalProfile.update({
        where: { id: admin.tenantId },
        data,
      });
    }

    safeRevalidate('/admin/content/hospital');
    safeRevalidate('/admin/content/footer');
    safeRevalidate('/');
    try {
      revalidateTag(`hospital-profile-${admin.tenantId}`);
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to save hospital profile.' };
  }
}

const FooterContactSchema = z.object({
  legalName: z.string().trim().max(160).optional(),
  phone: z.string().trim().max(40).optional(),
  emergencyPhone: z.string().trim().max(40).optional(),
  email: z.string().trim().email('Invalid email.').max(120).optional().or(z.literal('')),
  addressLine1: z.string().trim().max(160).optional(),
  addressLine2: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(80).optional(),
  postalCode: z.string().trim().max(20).optional(),
  workingHours: z.string().trim().max(200).optional(),
  facebookUrl: z.string().trim().max(300).optional().or(z.literal('')),
  twitterUrl: z.string().trim().max(300).optional().or(z.literal('')),
  instagramUrl: z.string().trim().max(300).optional().or(z.literal('')),
  linkedinUrl: z.string().trim().max(300).optional().or(z.literal('')),
  footerConfig: z.unknown(),
});

export async function updateFooterSettingsAction(
  rawInput: z.infer<typeof FooterContactSchema>
): Promise<AdminCmsActionResult> {
  try {
    const admin = await requireAdmin();
    const parsed = FooterContactSchema.safeParse(rawInput);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message ?? 'Invalid footer data.' };
    }

    const profile = await prisma.hospitalProfile.findFirst({
      where: { id: admin.tenantId },
      select: { hospitalName: true },
    });
    if (!profile) {
      return { success: false, error: 'Hospital profile was not found for this tenant.' };
    }

    const footerConfig = parseFooterConfig(parsed.data.footerConfig, profile.hospitalName);

    await prisma.hospitalProfile.update({
      where: { id: admin.tenantId },
      data: {
        legalName: parsed.data.legalName || null,
        phone: parsed.data.phone || null,
        emergencyPhone: parsed.data.emergencyPhone || null,
        email: parsed.data.email || null,
        addressLine1: parsed.data.addressLine1 || null,
        addressLine2: parsed.data.addressLine2 || null,
        city: parsed.data.city || null,
        state: parsed.data.state || null,
        postalCode: parsed.data.postalCode || null,
        workingHours: parsed.data.workingHours || null,
        facebookUrl: parsed.data.facebookUrl || null,
        twitterUrl: parsed.data.twitterUrl || null,
        instagramUrl: parsed.data.instagramUrl || null,
        linkedinUrl: parsed.data.linkedinUrl || null,
      },
    });

    try {
      await prisma.$executeRaw(
        Prisma.sql`UPDATE "HospitalProfile" SET "footerConfig" = ${JSON.stringify(footerConfig)}::jsonb WHERE id = ${admin.tenantId}::uuid`
      );
    } catch {
      return {
        success: false,
        error: 'Footer contact details saved, but the footer links column is not on this database yet. Run prisma migrate deploy, then save again.',
      };
    }

    await writeAuditLog({
      tenantId: admin.tenantId,
      actorUserId: admin.id,
      action: 'cms.mutate',
      entityType: 'HospitalProfile',
      entityId: admin.tenantId,
      after: { area: 'footer' },
    });

    safeRevalidate('/admin/content/footer');
    safeRevalidate('/');
    try {
      revalidateTag(`hospital-profile-${admin.tenantId}`);
    } catch {
      // Ignored outside Next.js request context
    }
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to save footer settings.' };
  }
}

export async function updateEnquiryStatusAction(input: {
  type: z.infer<typeof EnquiryTypeSchema>;
  id: string;
  status: EnquiryStatus;
}): Promise<AdminCmsActionResult> {
  try {
    const admin = await requireAdmin();

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
        await prisma.appointmentEnquiry.updateMany({ where: { id, tenantId: admin.tenantId }, data: { status } });
        break;
      case 'international':
        await prisma.internationalPatientEnquiry.updateMany({ where: { id, tenantId: admin.tenantId }, data: { status } });
        break;
      case 'package':
        await prisma.packageInformationRequest.updateMany({ where: { id, tenantId: admin.tenantId }, data: { status } });
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
    const admin = await requireAdmin();

    const idParsed = z.string().uuid().safeParse(input.id);
    const statusParsed = ContactMessageStatusSchema.safeParse(input.status);

    if (!idParsed.success || !statusParsed.success) {
      return { success: false, error: 'Invalid contact message update request.' };
    }

    await prisma.contactMessage.updateMany({
      where: { id: idParsed.data, tenantId: admin.tenantId },
      data: { status: statusParsed.data },
    });

    safeRevalidate('/admin/enquiries');
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to update contact message status.' };
  }
}
