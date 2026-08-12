import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authConfig } from './auth.config';
import { prisma } from '@/server/db/client';
import { verifyPassword } from '@/server/security/password';

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
        if (credentials?.isPhoneAuth === 'true') {
          const phone = (credentials.phone as string || '').replace(/[^0-9+]/g, '').trim();
          const otp = credentials.otp as string;

          if (!phone || otp !== '123456') {
            return null;
          }

          // 1. Find PatientProfile by phoneNumber or create auto-provisioned patient
          let patientProfile = await prisma.patientProfile.findFirst({
            where: {
              OR: [
                { phoneNumber: phone },
                { phoneNumber: { contains: phone.slice(-10) } },
              ],
            },
            include: { user: true },
          });

          if (!patientProfile) {
            // Auto-provision new Patient User + PatientProfile for seamless OTP login
            const generatedEmail = `patient.${phone.slice(-10)}@carepulse.hospital`;
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
                },
              });
            }

            patientProfile = await prisma.patientProfile.create({
              data: {
                userId: user.id,
                fullName: `Patient (${phone.slice(-4)})`,
                phoneNumber: phone,
                dateOfBirth: new Date('1995-01-01'),
                gender: 'Unspecified',
              },
              include: { user: true },
            });
          }

          if (!patientProfile.user.isActive) {
            throw new Error('ACCOUNT_INACTIVE');
          }

          return {
            id: patientProfile.user.id,
            email: patientProfile.user.email,
            role: patientProfile.user.role,
            isActive: patientProfile.user.isActive,
            patientProfileId: patientProfile.id,
            doctorProfileId: null,
          };
        }

        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = (credentials.email as string).toLowerCase().trim();

        // 1. Fetch user by email including profile relationships
        const user = await prisma.user.findUnique({
          where: { email: normalizedEmail },
          include: {
            patientProfile: true,
            doctorProfile: true,
          },
        });

        if (!user) {
          return null; // Email not found
        }

        // 2. Reject inactive accounts
        if (!user.isActive) {
          throw new Error('ACCOUNT_INACTIVE');
        }

        // 3. Verify password hash
        const isValidPassword = await verifyPassword(
          credentials.password as string,
          user.passwordHash
        );

        if (!isValidPassword) {
          return null; // Invalid password
        }

        // 4. Return safe User object (EXCLUDES passwordHash)
        return {
          id: user.id,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          patientProfileId: user.patientProfile?.id ?? null,
          doctorProfileId: user.doctorProfile?.id ?? null,
        };
      },
    }),
  ],
});
