import { prisma } from '../src/server/db/client';
import { verifyPassword } from '../src/server/security/password';

async function testAdmin() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@hospital.com' },
  });

  console.log('User found in DB:', user?.email, 'Role:', user?.role, 'IsActive:', user?.isActive);
  if (user) {
    const isValid = await verifyPassword('test123', user.passwordHash);
    console.log('Password "test123" verification result:', isValid);
  }
}

testAdmin();
