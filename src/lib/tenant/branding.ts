import { headers } from 'next/headers';
import { prisma } from '@/server/db/client';

export async function getTenantBranding() {
  const headersList = await headers();
  let host = headersList.get('x-tenant-host') || '';

  // Remove port in dev (e.g. localhost:5000)
  if (host.includes(':')) {
    host = host.split(':')[0];
  }

  // 1. First, try finding a tenant by custom domain
  let profile = await prisma.hospitalProfile.findUnique({
    where: { customDomain: host },
  });

  // 2. Fallback to subdomain mapping
  if (!profile) {
    profile = await prisma.hospitalProfile.findUnique({
      where: { subdomain: host },
    });
  }

  // 3. Fallback to the first active tenant in a multi-tenant DB if no domain matches
  // In a strict production system, this could return null or redirect to a 404 page
  if (!profile) {
    profile = await prisma.hospitalProfile.findFirst({
      where: { isActive: true },
    });
  }

  return profile;
}
