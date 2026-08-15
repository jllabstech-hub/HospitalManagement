import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { headers } from 'next/headers';
import { authConfig } from './auth.config';
import { prisma } from '@/server/db/client';
import { verifyPassword } from '@/server/security/password';
import { Role } from '@prisma/client';
import { requireTenantByHost } from '@/server/tenant/resolve';
import { normalizePhone, verifyOtpChallenge } from '@/server/security/otp';
import { assertRateLimit, recordAuthAttempt } from '@/server/security/rate-limit';
import { DomainError } from '@/server/errors/domain-error';

async function resolveRequestTenant() {
  const headerList = await headers();
  const host = headerList.get('x-tenant-host') || headerList.get('host') || '';
  return requireTenantByHost(host);
}

function clientIpFromHeaders(): string {
  return 'unknown';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        phone: { label: 'Phone', type: 'text' },
        otp: { label: 'OTP', type: 'text' },
        isPhoneAuth: { label: 'IsPhoneAuth', type: 'text' },
      },
      async authorize(credentials) {
        const tenant = await resolveRequestTenant();
        const ip = clientIpFromHeaders();

        if (credentials?.isPhoneAuth === 'true') {
          const phone = normalizePhone((credentials.phone as string) || '');
          const otp = (credentials.otp as string) || '';

          try {
            await verifyOtpChallenge({
              tenantId: tenant.tenantId,
              phone,
              otp,
              ipAddress: ip,
            });
          } catch {
            return null;
          }

          let patientProfile = await prisma.patientProfile.findFirst({
            where: {
              tenantId: tenant.tenantId,
              OR: [{ phoneNumber: phone }, { phoneNumber: { contains: phone.slice(-10) } }],
            },
            include: { user: true },
          });

          if (!patientProfile) {
            const generatedEmail = `patient.${phone.slice(-10)}.${tenant.tenantId.slice(0, 8)}@carepulse.hospital`;
            const dummyHash = 'otp-authenticated-user';

            let user = await prisma.user.findUnique({
              where: { email: generatedEmail },
            });

            if (!user) {
              user = await prisma.user.create({
                data: {
                  email: generatedEmail,
                  passwordHash: dummyHash,
                  role: Role.PATIENT,
                  isActive: true,
                  tenantId: tenant.tenantId,
                },
              });
            } else if (user.tenantId !== tenant.tenantId) {
              return null;
            }

            patientProfile = await prisma.patientProfile.create({
              data: {
                userId: user.id,
                tenantId: tenant.tenantId,
                fullName: `Patient (${phone.slice(-4)})`,
                phoneNumber: phone,
                dateOfBirth: new Date('1995-01-01'),
                gender: 'Unspecified',
              },
              include: { user: true },
            });
          }

          if (patientProfile.tenantId !== tenant.tenantId || patientProfile.user.tenantId !== tenant.tenantId) {
            return null;
          }

          if (!patientProfile.user.isActive) {
            throw new Error('ACCOUNT_INACTIVE');
          }

          return {
            id: patientProfile.user.id,
            email: patientProfile.user.email,
            role: patientProfile.user.role,
            isActive: patientProfile.user.isActive,
            tenantId: patientProfile.user.tenantId,
            patientProfileId: patientProfile.id,
            doctorProfileId: null,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = (credentials.email as string).toLowerCase().trim();
        const rateKey = `login:${tenant.tenantId}:${normalizedEmail}`;

        try {
          await assertRateLimit({ kind: 'LOGIN', key: rateKey, tenantId: tenant.tenantId });
        } catch (error) {
          if (error instanceof DomainError) {
            throw new Error('RATE_LIMITED');
          }
          throw error;
        }

        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            patientProfile: true,
            doctorProfile: true,
          },
        });

        if (!user || user.tenantId !== tenant.tenantId) {
          await recordAuthAttempt({ kind: 'LOGIN', key: rateKey, tenantId: tenant.tenantId, success: false });
          return null;
        }

        if (!user.isActive) {
          await recordAuthAttempt({ kind: 'LOGIN', key: rateKey, tenantId: tenant.tenantId, success: false });
          throw new Error('ACCOUNT_INACTIVE');
        }

        const isValidPassword = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          await recordAuthAttempt({ kind: 'LOGIN', key: rateKey, tenantId: tenant.tenantId, success: false });
          return null;
        }

        await recordAuthAttempt({ kind: 'LOGIN', key: rateKey, tenantId: tenant.tenantId, success: true });

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          tenantId: user.tenantId,
          patientProfileId: user.patientProfile?.id ?? null,
          doctorProfileId: user.doctorProfile?.id ?? null,
        };
      },
    }),
  ],
});
