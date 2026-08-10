'use server';

import { z } from 'zod';
import { prisma } from '@/server/db/client';

export type PublicFormResult = { success: true } | { success: false; error: string };

const ContactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z.string().trim().optional(),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters.'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters.'),
});

const AppointmentEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z.string().trim().min(6, 'Please enter a valid phone number.'),
  departmentId: z.string().uuid().optional().or(z.literal('')),
  preferredDoctorId: z.string().uuid().optional().or(z.literal('')),
  preferredDate: z.string().optional(),
  message: z.string().trim().optional(),
});

const InternationalEnquirySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z.string().trim().optional(),
  country: z.string().trim().min(2, 'Country is required.'),
  treatmentInterest: z.string().trim().optional(),
  preferredDepartment: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

const PackageInfoRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.'),
  phone: z.string().trim().optional(),
  packageSlug: z.string().trim().optional(),
  packageName: z.string().trim().optional(),
  message: z.string().trim().optional(),
});

function firstZodError(result: z.SafeParseError<unknown>): string {
  return result.error.issues[0]?.message ?? 'Invalid form data.';
}

function parseOptionalDate(value?: string): Date | null {
  if (!value?.trim()) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function submitContactMessageAction(
  rawInput: z.infer<typeof ContactMessageSchema>
): Promise<PublicFormResult> {
  const parsed = ContactMessageSchema.safeParse(rawInput);
  if (!parsed.success) {
    return { success: false, error: firstZodError(parsed) };
  }

  try {
    await prisma.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        subject: parsed.data.subject,
        message: parsed.data.message,
      },
    });
    return { success: true };
  } catch {
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
    await prisma.appointmentEnquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        departmentId,
        preferredDoctorId,
        preferredDate,
        message: parsed.data.message || null,
      },
    });
    return { success: true };
  } catch {
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
    await prisma.internationalPatientEnquiry.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        country: parsed.data.country,
        treatmentInterest: parsed.data.treatmentInterest || null,
        preferredDepartment: parsed.data.preferredDepartment || null,
        message: parsed.data.message || null,
      },
    });
    return { success: true };
  } catch {
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
    await prisma.packageInformationRequest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        packageSlug: parsed.data.packageSlug || null,
        packageName: parsed.data.packageName || null,
        message: parsed.data.message || null,
      },
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Unable to submit your request. Please try again.' };
  }
}
