import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || 'dev-super-secret-key-min-32-chars-change-in-prod',
  providers: [], // Added in index.ts for Node.js runtime
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
    maxAge: 30 * 24 * 60 * 60, // 30 Days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
};
