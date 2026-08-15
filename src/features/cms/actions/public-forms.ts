'use server';

import { z } from 'zod';
import { prisma } from '@/server/db/client';
import { requireTenantContext } from '@/server/tenant';
import { assertRateLimit, recordAuthAttempt } from '@/server/security/rate-limit';
import { DomainError } from '@/server/errors/domain-error';
import { headers } from 'next/headers';

export type PublicFormResult = { success: true } | { success: false; error: string };

const ContactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(32).optional(),
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(10).max(4000),
});

const AppointmentEnquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(6).max(32),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  preferredDoctorId: z.string().uuid().optional().or(z.literal('')),
  preferredDate: z.string().max(32).optional(),
  message: z.string().trim().max(4000).optional(),
});

const InternationalEnquirySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(32).optional(),
  country: z.string().trim().min(2).max(80),
  treatmentInterest: z.string().trim().max(200).optional(),
  preferredDepartment: z.string().trim().max(120).optional(),
  message: z.string().trim().max(4000).optional(),
});

const PackageInfoRequestSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(32).optional(),
  packageSlug: z.string().trim().max(160).optional(),
  packageName: z.string().trim().max(160).optional(),
  message: z.string().trim().max(4000).optional(),
});

function firstZodError(result: z.SafeParseError<unknown>): string {
  return result.error.issues[0]?.message ?? 'Invalid form data.';
}

function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

async function guardPublicForm(tenantId: string): Promise<string> {
  let ip = 'unknown';
  try {
    const headerList = await headers();
    ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'unknown';
  } catch {
    ip = 'test';
  }
  const key = `form:${tenantId}:${ip}`;
  await assertRateLimit({ kind: 'PUBLIC_FORM', key, tenantId });
  return key;
}

export async function submitContactMessageAction(
  rawInput: z.infer<typeof ContactMessageSchema>
): Promise<PublicFormResult> {
  const parsed = ContactMessageSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  try {
    const tenant = await requireTenantContext();
    const key = await guardPublicForm(tenant.tenantId);
    await prisma.contactMessage.create({
      data: {
        tenantId: tenant.tenantId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });
    await recordAuthAttempt({ kind: 'PUBLIC_FORM', key, tenantId: tenant.tenantId, success: true });
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) return { success: false, error: error.message };
    return { success: false, error: 'Unable to submit your message. Please try again.' };
  }
}

export async function submitAppointmentEnquiryAction(
  rawInput: z.infer<typeof AppointmentEnquirySchema>
): Promise<PublicFormResult> {
  const parsed = AppointmentEnquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  const departmentId = parsed.data.departmentId?.trim() || null;
  const preferredDoctorId = parsed.data.preferredDoctorId?.trim() || null;
  const preferredDate = parseOptionalDate(parsed.data.preferredDate);

  try {
    const tenant = await requireTenantContext();
    const key = await guardPublicForm(tenant.tenantId);

    if (departmentId) {
      const dept = await prisma.department.findFirst({
        where: { id: departmentId, tenantId: tenant.tenantId },
        select: { id: true },
      });
      if (!dept) {
        return { success: false, error: 'Selected department is not available.' };
      }
    }

    if (preferredDoctorId) {
      const doctor = await prisma.doctorProfile.findFirst({
        where: { id: preferredDoctorId, tenantId: tenant.tenantId },
        select: { id: true },
      });
      if (!doctor) {
        return { success: false, error: 'Selected doctor is not available.' };
      }
    }

    await prisma.appointmentEnquiry.create({
      data: {
        tenantId: tenant.tenantId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        departmentId,
        preferredDoctorId,
        preferredDate,
        message: parsed.data.message || null,
      },
    });
    await recordAuthAttempt({ kind: 'PUBLIC_FORM', key, tenantId: tenant.tenantId, success: true });
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) return { success: false, error: error.message };
    return { success: false, error: 'Unable to submit your enquiry. Please try again.' };
  }
}

export async function submitInternationalEnquiryAction(
  rawInput: z.infer<typeof InternationalEnquirySchema>
): Promise<PublicFormResult> {
  const parsed = InternationalEnquirySchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  try {
    const tenant = await requireTenantContext();
    const key = await guardPublicForm(tenant.tenantId);
    await prisma.internationalPatientEnquiry.create({
      data: {
        tenantId: tenant.tenantId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        country: parsed.data.country,
        treatmentInterest: parsed.data.treatmentInterest || null,
        preferredDepartment: parsed.data.preferredDepartment || null,
        message: parsed.data.message || null,
      },
    });
    await recordAuthAttempt({ kind: 'PUBLIC_FORM', key, tenantId: tenant.tenantId, success: true });
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) return { success: false, error: error.message };
    return { success: false, error: 'Unable to submit your enquiry. Please try again.' };
  }
}

export async function submitPackageInfoRequestAction(
  rawInput: z.infer<typeof PackageInfoRequestSchema>
): Promise<PublicFormResult> {
  const parsed = PackageInfoRequestSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  try {
    const tenant = await requireTenantContext();
    const key = await guardPublicForm(tenant.tenantId);

    if (parsed.data.packageSlug) {
      const pkg = await prisma.healthPackage.findFirst({
        where: { slug: parsed.data.packageSlug, tenantId: tenant.tenantId },
        select: { id: true },
      });
      if (!pkg) {
        return { success: false, error: 'Selected package is not available.' };
      }
    }

    await prisma.packageInformationRequest.create({
      data: {
        tenantId: tenant.tenantId,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        packageSlug: parsed.data.packageSlug || null,
        packageName: parsed.data.packageName || null,
        message: parsed.data.message || null,
      },
    });
    await recordAuthAttempt({ kind: 'PUBLIC_FORM', key, tenantId: tenant.tenantId, success: true });
    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) return { success: false, error: error.message };
    return { success: false, error: 'Unable to submit your request. Please try again.' };
  }
}
