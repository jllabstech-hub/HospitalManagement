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
      },
      async authorize(credentials) {
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
