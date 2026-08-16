import { prisma } from '@/server/db/client';

export async function countMediaUrlReferences(tenantId: string, url: string): Promise<number> {
  if (!url) return 0;
  const [
    departments,
    specialities,
    centres,
    services,
    packages,
    facilities,
    articles,
    news,
    leadership,
    stories,
    insurance,
    doctors,
    homepage,
    hospital,
  ] = await Promise.all([
    prisma.department.count({ where: { tenantId, imageUrl: url } }),
    prisma.speciality.count({ where: { tenantId, imageUrl: url } }),
    prisma.centreOfExcellence.count({ where: { tenantId, heroImageUrl: url } }),
    prisma.hospitalService.count({ where: { tenantId, imageUrl: url } }),
    prisma.healthPackage.count({ where: { tenantId, imageUrl: url } }),
    prisma.facility.count({ where: { tenantId, imageUrl: url } }),
    prisma.healthArticle.count({ where: { tenantId, coverImageUrl: url } }),
    prisma.newsArticle.count({ where: { tenantId, coverImageUrl: url } }),
    prisma.leadershipMember.count({ where: { tenantId, imageUrl: url } }),
    prisma.successStory.count({ where: { tenantId, imageUrl: url } }),
    prisma.insurancePartner.count({ where: { tenantId, logoUrl: url } }),
    prisma.doctorProfile.count({ where: { tenantId, profileImageUrl: url } }),
    prisma.homepageSection.count({ where: { tenantId, imageUrl: url } }),
    prisma.hospitalProfile.count({
      where: {
        id: tenantId,
        OR: [{ logoUrl: url }, { heroImageUrl: url }],
      },
    }),
  ]);

  return (
    departments +
    specialities +
    centres +
    services +
    packages +
    facilities +
    articles +
    news +
    leadership +
    stories +
    insurance +
    doctors +
    homepage +
    hospital
  );
}

export async function isMediaAssetReferenced(tenantId: string, url: string): Promise<boolean> {
  return (await countMediaUrlReferences(tenantId, url)) > 0;
}
