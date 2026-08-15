'use server';

import { RegisterSchema, RegisterInput } from './schemas';
import { prisma } from '@/server/db/client';
import { hashPassword } from '@/server/security/password';
import { Role } from '@prisma/client';
import { requireTenantContext } from '@/server/tenant';
import { issueOtpChallenge, isOtpDemoMode, normalizePhone } from '@/server/security/otp';
import { DomainError } from '@/server/errors/domain-error';
import { logger } from '@/lib/logger';
import { headers } from 'next/headers';

export type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string };

export async function registerPatientAction(
  rawInput: RegisterInput
): Promise<ActionResult> {
  try {
    const tenant = await requireTenantContext();
    const parsed = RegisterSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message || 'Invalid input data.';
      return { success: false, error: firstIssue };
    }

    const { fullName, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Unable to create account with these details. Please check your information or sign in.',
      };
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: Role.PATIENT,
          isActive: true,
          tenantId: tenant.tenantId,
        },
      });

      await tx.patientProfile.create({
        data: {
          userId: user.id,
          tenantId: tenant.tenantId,
          fullName,
          phoneNumber: '',
          dateOfBirth: new Date('2000-01-01'),
          gender: 'Unspecified',
        },
      });
    });

    return { success: true };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    logger.error({ event: 'auth.register_failed' }, 'Registration failed');
    return {
      success: false,
      error: 'An unexpected error occurred during registration. Please try again later.',
    };
  }
}

export async function sendOtpAction(phoneNumber: string): Promise<ActionResult<{ isRealSmsSent: boolean; demoMode: boolean }>> {
  try {
    const tenant = await requireTenantContext();
    const cleanedPhone = normalizePhone(phoneNumber);
    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() || headerList.get('x-real-ip') || null;

    const challenge = await issueOtpChallenge({
      tenantId: tenant.tenantId,
      phone: cleanedPhone,
      ipAddress: ip,
    });

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;
    const hasProvider = Boolean(accountSid && authToken && fromPhone);

    if (!hasProvider) {
      if (process.env.NODE_ENV === 'production' && !isOtpDemoMode()) {
        return { success: false, error: 'SMS verification is not configured.' };
      }
      if (!isOtpDemoMode() && process.env.NODE_ENV !== 'test') {
        return { success: false, error: 'SMS verification is not configured.' };
      }
      return { success: true, data: { isRealSmsSent: false, demoMode: true } };
    }

    const formattedToPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+91${cleanedPhone}`;
    const authHeader = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const bodyData = new URLSearchParams({
      To: formattedToPhone,
      From: fromPhone as string,
      Body: `Your hospital verification code is valid for 8 minutes. Do not share this code.`,
    });

    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyData.toString(),
      }
    );

    if (!twilioRes.ok) {
      if (process.env.NODE_ENV === 'production') {
        return { success: false, error: 'Unable to send verification code. Please try again.' };
      }
      if (!isOtpDemoMode()) {
        return { success: false, error: 'Unable to send verification code. Please try again.' };
      }
      return { success: true, data: { isRealSmsSent: false, demoMode: true } };
    }

    void challenge;
    logger.info({ event: 'otp.sms_sent', tenantId: tenant.tenantId }, 'OTP SMS dispatched');
    return { success: true, data: { isRealSmsSent: true, demoMode: false } };
  } catch (error) {
    if (error instanceof DomainError) {
      return { success: false, error: error.message };
    }
    logger.error({ event: 'otp.send_failed' }, 'Failed to dispatch OTP');
    return { success: false, error: 'Failed to dispatch OTP. Please try again.' };
  }
}
