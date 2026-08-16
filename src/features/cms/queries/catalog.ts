import { Prisma } from '@prisma/client';
import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/client';
import { ACTIVE_PUBLISHED_FILTER, PUBLISHED_FILTER } from '@/features/cms/constants';
import { publicDoctorListSelect, publicDoctorWhereFor } from '@/features/cms/queries/doctors-public';
import { requireTenantContext } from '@/server/tenant';
import { looksLikeForeignHospitalCopy, withoutForeignHospitalCopy } from '@/features/cms/foreign-hospital-copy';

function hideIfForeign<T>(
  record: T | null,
  fields: (item: T) => Array<string | null | undefined>
): T | null {
  if (!record) return null;
  return looksLikeForeignHospitalCopy(...fields(record)) ? null : record;
}

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
    return withoutForeignHospitalCopy(Array.from(map.values()), (dept) => [
      dept.name,
      dept.shortDescription,
      dept.description,
      dept.seoTitle,
      dept.seoDescription,
    ]);
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

  const department = await prisma.department.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: departmentDetailSelectFor(tenantId),
  });
  if (
    department &&
    looksLikeForeignHospitalCopy(
      department.name,
      department.shortDescription,
      department.description,
      department.seoTitle,
      department.seoDescription
    )
  ) {
    return null;
  }
  return department;
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
  return withoutForeignHospitalCopy(Array.from(map.values()), (spec) => [
    spec.name,
    spec.shortDescription,
    spec.seoTitle,
    spec.seoDescription,
  ]);
}

export async function getSpecialityBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  const spec = await prisma.speciality.findFirst({
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
  return hideIfForeign(spec, (item) => [
    item.name,
    item.shortDescription,
    item.fullDescription,
    item.seoTitle,
    item.seoDescription,
  ]);
}

export async function getPublishedCentres() {
  const { tenantId } = await requireTenantContext();
  const centres = await prisma.centreOfExcellence.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: centreListSelect,
    orderBy: [{ isFeatured: 'desc' }, { displayOrder: 'asc' }, { name: 'asc' }],
  });
  return withoutForeignHospitalCopy(centres, (centre) => [
    centre.name,
    centre.shortDescription,
    centre.seoTitle,
    centre.seoDescription,
  ]);
}

export async function getCentreBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  const centre = await prisma.centreOfExcellence.findFirst({
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
  const visible = hideIfForeign(centre, (item) => [
    item.name,
    item.shortDescription,
    item.fullDescription,
    item.seoTitle,
    item.seoDescription,
  ]);
  if (!visible) return null;
  return {
    ...visible,
    specialities: visible.specialities.filter(
      (row) => !looksLikeForeignHospitalCopy(row.speciality.name, row.speciality.shortDescription)
    ),
    services: visible.services.filter(
      (row) =>
        !looksLikeForeignHospitalCopy(
          row.service.name,
          row.service.shortDescription,
          row.service.seoTitle,
          row.service.seoDescription
        )
    ),
  };
}

export async function getPublishedServices() {
  const { tenantId } = await requireTenantContext();
  const services = await prisma.hospitalService.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: serviceListSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return withoutForeignHospitalCopy(services, (service) => [
    service.name,
    service.shortDescription,
    service.seoTitle,
    service.seoDescription,
  ]);
}

export async function getServiceBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  const service = await prisma.hospitalService.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...serviceListSelect,
      fullDescription: true,
    },
  });
  return hideIfForeign(service, (item) => [
    item.name,
    item.shortDescription,
    item.fullDescription,
    item.seoTitle,
    item.seoDescription,
  ]);
}

export async function getPublishedPackages() {
  const { tenantId } = await requireTenantContext();
  const packages = await prisma.healthPackage.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: packageListSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return withoutForeignHospitalCopy(packages, (item) => [
    item.name,
    item.description,
    item.seoTitle,
    item.seoDescription,
  ]);
}

export async function getPackageBySlug(slug: string) {
  if (!slug?.trim()) return null;
  const { tenantId } = await requireTenantContext();

  const pkg = await prisma.healthPackage.findFirst({
    where: { slug: slug.trim(), tenantId, ...ACTIVE_PUBLISHED_FILTER },
    select: {
      ...packageListSelect,
      detailedDescription: true,
      eligibility: true,
      includedItems: true,
      preparationInstructions: true,
    },
  });
  return hideIfForeign(pkg, (item) => [
    item.name,
    item.description,
    item.detailedDescription,
    item.seoTitle,
    item.seoDescription,
  ]);
}

export async function getPublishedFaqs() {
  const { tenantId } = await requireTenantContext();
  const faqs = await prisma.faqItem.findMany({
    where: { ...PUBLISHED_FILTER, tenantId },
    select: faqSelect,
    orderBy: [{ displayOrder: 'asc' }, { question: 'asc' }],
  });
  return withoutForeignHospitalCopy(faqs, (item) => [item.question, item.answer]);
}

export async function getPublishedResources() {
  const { tenantId } = await requireTenantContext();
  const resources = await prisma.patientResource.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: resourceSelect,
    orderBy: [{ displayOrder: 'asc' }, { title: 'asc' }],
  });
  return withoutForeignHospitalCopy(resources, (item) => [item.title, item.description]);
}

export async function getPublishedInsurancePartners() {
  const { tenantId } = await requireTenantContext();
  const partners = await prisma.insurancePartner.findMany({
    where: { ...ACTIVE_PUBLISHED_FILTER, tenantId },
    select: insurancePartnerSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
  return withoutForeignHospitalCopy(partners, (item) => [item.name, item.description]);
}

export async function getInternationalPageContent() {
  const { tenantId } = await requireTenantContext();
  const page = await prisma.internationalPageContent.findFirst({
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
  return hideIfForeign(page, (item) => [
    item.title,
    item.introduction,
    item.howToRequest,
    item.secondOpinion,
    item.requiredDocuments,
    item.travelInformation,
    item.accommodationInfo,
  ]);
}

export async function getEnabledHomepageSections() {
  const { tenantId } = await requireTenantContext();
  const sections = await prisma.homepageSection.findMany({
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
  return withoutForeignHospitalCopy(sections, (item) => [item.title, item.subtitle, item.content]);
}
