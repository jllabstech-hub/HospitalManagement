import { prisma } from '@/server/db/client';
import { getTenantContext } from '@/server/tenant';
import { DEFAULT_TENANT_TIMEZONE } from '@/server/tenant/types';

export async function getTenantBranding() {
  const tenant = await getTenantContext();
  if (!tenant) return null;
  const profile = await prisma.hospitalProfile.findFirst({
    where: { id: tenant.tenantId, isActive: true },
    select: {
      id: true,
      hospitalName: true,
      shortDescription: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      fontFamily: true,
      timezone: true,
    },
  });

  if (!profile) return null;
  return {
    ...profile,
    timezone: profile.timezone || DEFAULT_TENANT_TIMEZONE,
  };
}
