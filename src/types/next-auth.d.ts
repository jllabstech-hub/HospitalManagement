import { Role } from '@prisma/client';
import { DefaultSession } from 'next-auth';
import { JWT as DefaultJWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      isActive: boolean;
      patientProfileId?: string | null;
      doctorProfileId?: string | null;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    role: Role;
    isActive: boolean;
    patientProfileId?: string | null;
    doctorProfileId?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    userId: string;
    role: Role;
    isActive: boolean;
    patientProfileId?: string | null;
    doctorProfileId?: string | null;
  }
}
