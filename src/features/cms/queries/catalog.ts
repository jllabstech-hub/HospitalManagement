import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/client';
import { ACTIVE_PUBLISHED_FILTER, PUBLISHED_FILTER } from '@/features/cms/constants';
import { publicDoctorListSelect, publicDoctorWhere } from '@/features/cms/queries/doctors-public';

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

const departmentDetailSelect = {
  ...departmentListSelect,
  fullDescription: true,
  _count: {
    select: {
      doctors: {
        where: publicDoctorWhere,
      },
    },
  },
  doctors: {
    where: publicDoctorWhere,
    select: publicDoctorListSelect,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { fullName: 'asc' }],
  },
} satisfies Prisma.DepartmentSelect;

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
  const fetchDepartments = async () => {
    const depts = await prisma.department.findMany({
      where: ACTIVE_PUBLISHED_FILTER,
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
      ['published-departments-list'],
      { revalidate: 300, tags: ['public-departments'] }
    )();
  } catch {
    return fetchDepartments();
  }
}

export async function getDepartmentBySlug(slug: string) {
  if (!slug?.trim()) return null;

  return prisma.department.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
    select: departmentDetailSelect,
  });
}

export async function getPublishedSpecialities() {
  const specs = await prisma.speciality.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
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

  return prisma.speciality.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
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
        where: { doctor: publicDoctorWhere },
        select: {
          doctor: {
            select: publicDoctorListSelect,
          },
        },
      },
      articles: {
        where: PUBLISHED_FILTER,
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
  return prisma.centreOfExcellence.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: centreListSelect,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getCentreBySlug(slug: string) {
  if (!slug?.trim()) return null;

  return prisma.centreOfExcellence.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...centreListSelect,
      fullDescription: true,
      clinicalFocus: true,
      specialities: {
        where: { speciality: ACTIVE_PUBLISHED_FILTER },
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
        where: { doctor: publicDoctorWhere },
        select: {
          doctor: {
            select: publicDoctorListSelect,
          },
        },
      },
      services: {
        where: { service: ACTIVE_PUBLISHED_FILTER },
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
  return prisma.hospitalService.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: serviceListSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getServiceBySlug(slug: string) {
  if (!slug?.trim()) return null;

  return prisma.hospitalService.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...serviceListSelect,
      fullDescription: true,
    },
  });
}

export async function getPublishedPackages() {
  return prisma.healthPackage.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: packageListSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getPackageBySlug(slug: string) {
  if (!slug?.trim()) return null;

  return prisma.healthPackage.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
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
  return prisma.faqItem.findMany({
    where: PUBLISHED_FILTER,
    select: faqSelect,
    orderBy: [{ displayOrder: 'asc' }, { question: 'asc' }],
  });
}

export async function getPublishedResources() {
  return prisma.patientResource.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: resourceSelect,
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
  });
}

export async function getPublishedInsurancePartners() {
  return prisma.insurancePartner.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: insurancePartnerSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getInternationalPageContent() {
  return prisma.internationalPageContent.findFirst({
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
  return prisma.homepageSection.findMany({
    where: { isEnabled: true },
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
