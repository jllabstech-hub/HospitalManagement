import type { NextAuthConfig } from 'next-auth';
import { getAuthSecret } from '@/server/security/auth-secret';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: getAuthSecret(),
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        if (user.id) token.userId = user.id;
        token.role = user.role;
        token.isActive = user.isActive;
        token.tenantId = user.tenantId;
        token.patientProfileId = user.patientProfileId;
        token.doctorProfileId = user.doctorProfileId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        if (token.userId) session.user.id = token.userId;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
        session.user.tenantId = token.tenantId;
        session.user.patientProfileId = token.patientProfileId;
        session.user.doctorProfileId = token.doctorProfileId;
      }
      return session;
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
    updateAge: 30 * 60,
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
