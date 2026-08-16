import { prisma } from '@/server/db/client';
import type { CmsImagePromptType, ImageAspectRatio } from '@/server/ai/image-generation';
import type { CmsImageContentType } from './types';

export interface CmsImageTarget {
  contentType: CmsImageContentType;
  promptType: CmsImagePromptType;
  imageField: 'imageUrl' | 'coverImageUrl' | 'heroImageUrl';
  aspectRatio: ImageAspectRatio;
  adminPath: string;
  publicPathPrefix: string;
}

export const CMS_IMAGE_TARGETS: Record<CmsImageContentType, CmsImageTarget> = {
  SPECIALITY: {
    contentType: 'SPECIALITY',
    promptType: 'SPECIALITY',
    imageField: 'imageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/specialities',
    publicPathPrefix: '/specialities',
  },
  DEPARTMENT: {
    contentType: 'DEPARTMENT',
    promptType: 'DEPARTMENT',
    imageField: 'imageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/departments',
    publicPathPrefix: '/departments',
  },
  CENTRE: {
    contentType: 'CENTRE',
    promptType: 'CENTRE',
    imageField: 'heroImageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/centres',
    publicPathPrefix: '/centres-of-excellence',
  },
  SERVICE: {
    contentType: 'SERVICE',
    promptType: 'SERVICE',
    imageField: 'imageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/services',
    publicPathPrefix: '/services',
  },
  HEALTH_PACKAGE: {
    contentType: 'HEALTH_PACKAGE',
    promptType: 'HEALTH_PACKAGE',
    imageField: 'imageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/health-packages',
    publicPathPrefix: '/health-packages',
  },
  FACILITY: {
    contentType: 'FACILITY',
    promptType: 'FACILITY',
    imageField: 'imageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/facilities',
    publicPathPrefix: '/about/facilities',
  },
  ARTICLE: {
    contentType: 'ARTICLE',
    promptType: 'ARTICLE',
    imageField: 'coverImageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/health-library',
    publicPathPrefix: '/health-library',
  },
  NEWS: {
    contentType: 'NEWS',
    promptType: 'NEWS',
    imageField: 'coverImageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/news',
    publicPathPrefix: '/news',
  },
  HOSPITAL_HERO: {
    contentType: 'HOSPITAL_HERO',
    promptType: 'HOSPITAL_HERO',
    imageField: 'heroImageUrl',
    aspectRatio: '16:9',
    adminPath: '/admin/content/hospital',
    publicPathPrefix: '/',
  },
};

export interface LoadedCmsImageRecord {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  slug: string | null;
  relatedNames: string[];
}

export async function loadCmsImageRecord(
  contentType: CmsImageContentType,
  recordId: string,
  tenantId: string
): Promise<LoadedCmsImageRecord | null> {
  switch (contentType) {
    case 'SPECIALITY': {
      const record = await prisma.speciality.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          imageUrl: true,
          department: { select: { name: true } },
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.name,
        description: record.fullDescription || record.shortDescription,
        imageUrl: record.imageUrl,
        slug: record.slug,
        relatedNames: record.department?.name ? [record.department.name] : [],
      };
    }
    case 'DEPARTMENT': {
      const record = await prisma.department.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          description: true,
          shortDescription: true,
          fullDescription: true,
          imageUrl: true,
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.name,
        description: record.fullDescription || record.shortDescription || record.description,
        imageUrl: record.imageUrl,
        slug: record.slug,
        relatedNames: [],
      };
    }
    case 'CENTRE': {
      const record = await prisma.centreOfExcellence.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          clinicalFocus: true,
          heroImageUrl: true,
          specialities: { select: { speciality: { select: { name: true } } }, take: 8 },
          services: { select: { service: { select: { name: true } } }, take: 8 },
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.name,
        description: record.fullDescription || record.clinicalFocus || record.shortDescription,
        imageUrl: record.heroImageUrl,
        slug: record.slug,
        relatedNames: [
          ...record.specialities.map((item) => item.speciality.name),
          ...record.services.map((item) => item.service.name),
        ],
      };
    }
    case 'SERVICE': {
      const record = await prisma.hospitalService.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          shortDescription: true,
          fullDescription: true,
          imageUrl: true,
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.name,
        description: record.fullDescription || record.shortDescription,
        imageUrl: record.imageUrl,
        slug: record.slug,
        relatedNames: [],
      };
    }
    case 'HEALTH_PACKAGE': {
      const record = await prisma.healthPackage.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          description: true,
          detailedDescription: true,
          imageUrl: true,
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.name,
        description: record.detailedDescription || record.description,
        imageUrl: record.imageUrl,
        slug: record.slug,
        relatedNames: [],
      };
    }
    case 'FACILITY': {
      const record = await prisma.facility.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          description: true,
          category: true,
          imageUrl: true,
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.name,
        description: record.description,
        imageUrl: record.imageUrl,
        slug: record.slug,
        relatedNames: record.category ? [record.category] : [],
      };
    }
    case 'ARTICLE': {
      const record = await prisma.healthArticle.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          title: true,
          slug: true,
          excerpt: true,
          coverImageUrl: true,
          speciality: { select: { name: true } },
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.title,
        description: record.excerpt,
        imageUrl: record.coverImageUrl,
        slug: record.slug,
        relatedNames: record.speciality?.name ? [record.speciality.name] : [],
      };
    }
    case 'NEWS': {
      const record = await prisma.newsArticle.findFirst({
        where: { id: recordId, tenantId },
        select: {
          id: true,
          tenantId: true,
          title: true,
          slug: true,
          excerpt: true,
          category: true,
          coverImageUrl: true,
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.tenantId,
        title: record.title,
        description: record.excerpt,
        imageUrl: record.coverImageUrl,
        slug: record.slug,
        relatedNames: record.category ? [record.category] : [],
      };
    }
    case 'HOSPITAL_HERO': {
      const record = await prisma.hospitalProfile.findFirst({
        where: { id: recordId === tenantId ? recordId : tenantId },
        select: {
          id: true,
          hospitalName: true,
          shortDescription: true,
          heroImageUrl: true,
        },
      });
      if (!record) return null;
      return {
        id: record.id,
        tenantId: record.id,
        title: record.hospitalName,
        description: record.shortDescription,
        imageUrl: record.heroImageUrl,
        slug: null,
        relatedNames: [],
      };
    }
    default:
      return null;
  }
}

export async function listCmsImageRecords(
  contentType: CmsImageContentType,
  tenantId: string
): Promise<LoadedCmsImageRecord[]> {
  switch (contentType) {
    case 'SPECIALITY': {
      const rows = await prisma.speciality.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, name: true, slug: true, shortDescription: true, imageUrl: true },
        orderBy: { name: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.name,
        description: row.shortDescription,
        imageUrl: row.imageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'DEPARTMENT': {
      const rows = await prisma.department.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, name: true, slug: true, description: true, imageUrl: true },
        orderBy: { name: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'CENTRE': {
      const rows = await prisma.centreOfExcellence.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, name: true, slug: true, shortDescription: true, heroImageUrl: true },
        orderBy: { name: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.name,
        description: row.shortDescription,
        imageUrl: row.heroImageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'SERVICE': {
      const rows = await prisma.hospitalService.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, name: true, slug: true, shortDescription: true, imageUrl: true },
        orderBy: { name: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.name,
        description: row.shortDescription,
        imageUrl: row.imageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'HEALTH_PACKAGE': {
      const rows = await prisma.healthPackage.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, name: true, slug: true, description: true, imageUrl: true },
        orderBy: { name: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'FACILITY': {
      const rows = await prisma.facility.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, name: true, slug: true, description: true, imageUrl: true },
        orderBy: { name: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.name,
        description: row.description,
        imageUrl: row.imageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'ARTICLE': {
      const rows = await prisma.healthArticle.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, title: true, slug: true, excerpt: true, coverImageUrl: true },
        orderBy: { title: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.title,
        description: row.excerpt,
        imageUrl: row.coverImageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'NEWS': {
      const rows = await prisma.newsArticle.findMany({
        where: { tenantId },
        select: { id: true, tenantId: true, title: true, slug: true, excerpt: true, coverImageUrl: true },
        orderBy: { title: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        tenantId: row.tenantId,
        title: row.title,
        description: row.excerpt,
        imageUrl: row.coverImageUrl,
        slug: row.slug,
        relatedNames: [],
      }));
    }
    case 'HOSPITAL_HERO': {
      const record = await loadCmsImageRecord('HOSPITAL_HERO', tenantId, tenantId);
      return record ? [record] : [];
    }
    default:
      return [];
  }
}

export async function attachImageUrlToRecord(input: {
  contentType: CmsImageContentType;
  recordId: string;
  tenantId: string;
  url: string;
}): Promise<boolean> {
  const { contentType, recordId, tenantId, url } = input;
  switch (contentType) {
    case 'SPECIALITY':
      return (await prisma.speciality.updateMany({ where: { id: recordId, tenantId }, data: { imageUrl: url } })).count === 1;
    case 'DEPARTMENT':
      return (await prisma.department.updateMany({ where: { id: recordId, tenantId }, data: { imageUrl: url } })).count === 1;
    case 'CENTRE':
      return (await prisma.centreOfExcellence.updateMany({ where: { id: recordId, tenantId }, data: { heroImageUrl: url } })).count === 1;
    case 'SERVICE':
      return (await prisma.hospitalService.updateMany({ where: { id: recordId, tenantId }, data: { imageUrl: url } })).count === 1;
    case 'HEALTH_PACKAGE':
      return (await prisma.healthPackage.updateMany({ where: { id: recordId, tenantId }, data: { imageUrl: url } })).count === 1;
    case 'FACILITY':
      return (await prisma.facility.updateMany({ where: { id: recordId, tenantId }, data: { imageUrl: url } })).count === 1;
    case 'ARTICLE':
      return (await prisma.healthArticle.updateMany({ where: { id: recordId, tenantId }, data: { coverImageUrl: url } })).count === 1;
    case 'NEWS':
      return (await prisma.newsArticle.updateMany({ where: { id: recordId, tenantId }, data: { coverImageUrl: url } })).count === 1;
    case 'HOSPITAL_HERO':
      return (
        await prisma.hospitalProfile.updateMany({
          where: { id: tenantId },
          data: { heroImageUrl: url },
        })
      ).count === 1;
    default:
      return false;
  }
}
