import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/client';
import { ACTIVE_PUBLISHED_FILTER, PUBLISHED_FILTER } from '@/features/cms/constants';
import { publicDoctorListSelect, publicDoctorWhereFor } from '@/features/cms/queries/doctors-public';
import { requireTenantContext } from '@/server/tenant';

const departmentListSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  description: true,
  imageUrl: true,
  icon: true,
  displayOrder: true,
  isFeatured: true,
  seoTitle: true,
  seoDescription: true,
} as const;

function departmentDetailSelectFor(tenantId: string) {
  const doctorWhere = publicDoctorWhereFor(tenantId);
  return {
    ...departmentListSelect,
    fullDescription: true,
    _count: {
      select: {
        doctors: {
          where: doctorWhere,
        },
      },
    },
    doctors: {
      where: doctorWhere,
      select: publicDoctorListSelect,
      orderBy: [{ isFeatured: 'desc' as const }, { displayOrder: 'asc' as const }, { fullName: 'asc' as const }],
    },
  } satisfies Prisma.DepartmentSelect;
}

const specialityListSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  imageUrl: true,
  icon: true,
  displayOrder: true,
  isFeatured: true,
  seoTitle: true,
  seoDescription: true,
  department: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
} as const;

const centreListSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  heroImageUrl: true,
  icon: true,
  displayOrder: true,
  isFeatured: true,
  seoTitle: true,
  seoDescription: true,
} as const;

const serviceListSelect = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  imageUrl: true,
  icon: true,
  displayOrder: true,
  seoTitle: true,
  seoDescription: true,
} as const;

const packageListSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  price: true,
  currency: true,
  duration: true,
  isDemoPricing: true,
  displayOrder: true,
  seoTitle: true,
  seoDescription: true,
} as const;

const faqSelect = {
  id: true,
  question: true,
  answer: true,
  category: true,
  displayOrder: true,
} as const;

const resourceSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  fileUrl: true,
  category: true,
  displayOrder: true,
} as const;

const insurancePartnerSelect = {
  id: true,
  name: true,
  slug: true,
  logoUrl: true,
  description: true,
  displayOrder: true,
} as const;

export async function getPublishedDepartments() {
  const { tenantId } = await requireTenantContext();
  const fetchDepartments = async () => {
    const depts = await prisma.department.findMany({
      where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
      select: departmentListSelect,
      orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
    });
    const map = new Map<string, (typeof depts)[0]>();
    for (const dept of depts) {
      const key = dept.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, dept);
      }
    }
    return Array.from(map.values());
  };

  try {
    return await unstable_cache(
      fetchDepartments,
      ['published-departments-list', tenantId],
      { revalidate: 300, tags: [`public-departments-${tenantId}`] }
    )();
  } catch {
    return fetchDepartments();
  }
}

export async function getDepartmentBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.department.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: departmentDetailSelectFor(tenantId),
  });
}

export async function getPublishedSpecialities() {
  const { tenantId } = await requireTenantContext();
  const specs = await prisma.speciality.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: specialityListSelect,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });
  const map = new Map<string, (typeof specs)[0]>();
  for (const spec of specs) {
    const key = spec.name.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, spec);
    }
  }
  return Array.from(map.values());
}

export async function getSpecialityBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.speciality.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...specialityListSelect,
      fullDescription: true,
      department: {
        select: {
          id: true,
          name: true,
          slug: true,
          shortDescription: true,
        },
      },
      doctors: {
        where: { doctor: publicDoctorWhereFor(tenantId) },
        select: {
          doctor: {
            select: publicDoctorListSelect,
          },
        },
      },
      articles: {
        where: { ...PUBLISHED_FILTER, tenantId },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          publishedAt: true,
        },
        orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
        take: 6,
      },
    },
  });
}

export async function getPublishedCentres() {
  const { tenantId } = await requireTenantContext();
  return prisma.centreOfExcellence.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: centreListSelect,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getCentreBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.centreOfExcellence.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...centreListSelect,
      fullDescription: true,
      clinicalFocus: true,
      specialities: {
        where: { speciality: { ...ACTIVE_PUBLISHED_FILTER, tenantId } },
        select: {
          speciality: {
            select: {
              id: true,
              name: true,
              slug: true,
              shortDescription: true,
              icon: true,
            },
          },
        },
      },
      doctors: {
        where: { doctor: publicDoctorWhereFor(tenantId) },
        select: {
          doctor: {
            select: publicDoctorListSelect,
          },
        },
      },
      services: {
        where: { service: { ...ACTIVE_PUBLISHED_FILTER, tenantId } },
        select: {
          service: {
            select: serviceListSelect,
          },
        },
      },
    },
  });
}

export async function getPublishedServices() {
  const { tenantId } = await requireTenantContext();
  return prisma.hospitalService.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: serviceListSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getServiceBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.hospitalService.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...serviceListSelect,
      fullDescription: true,
    },
  });
}

export async function getPublishedPackages() {
  const { tenantId } = await requireTenantContext();
  return prisma.healthPackage.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: packageListSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getPackageBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  return prisma.healthPackage.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...packageListSelect,
      detailedDescription: true,
      eligibility: true,
      includedItems: true,
      preparationInstructions: true,
    },
  });
}

export async function getPublishedFaqs() {
  const { tenantId } = await requireTenantContext();
  return prisma.faqItem.findMany({
    where: { ...PUBLISHED_FILTER, tenantId },
    select: faqSelect,
    orderBy: [{ displayOrder: 'asc' }, { question: 'asc' }],
  });
}

export async function getPublishedResources() {
  const { tenantId } = await requireTenantContext();
  return prisma.patientResource.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: resourceSelect,
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
  });
}

export async function getPublishedInsurancePartners() {
  const { tenantId } = await requireTenantContext();
  return prisma.insurancePartner.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: insurancePartnerSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getInternationalPageContent() {
  const { tenantId } = await requireTenantContext();
  return prisma.internationalPageContent.findFirst({
    where: { tenantId },
    select: {
      id: true,
      title: true,
      introduction: true,
      howToRequest: true,
      secondOpinion: true,
      requiredDocuments: true,
      travelInformation: true,
      accommodationInfo: true,
      coordinatorContact: true,
      updatedAt: true,
    },
  });
}

export async function getEnabledHomepageSections() {
  const { tenantId } = await requireTenantContext();
  return prisma.homepageSection.findMany({
    where: { isEnabled: true, tenantId },
    select: {
      id: true,
      sectionType: true,
      title: true,
      subtitle: true,
      content: true,
      imageUrl: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: 'asc' },
  });
}
