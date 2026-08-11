import type { MetadataRoute } from 'next';
import {
  getPublishedDepartments,
  getPublishedSpecialities,
  getPublishedCentres,
  getPublishedServices,
  getPublishedPackages,
} from '@/features/cms/queries/catalog';
import { getPublishedLocations } from '@/features/cms/queries/hospital';
import { getPublishedArticles, getPublishedNews, getPublishedSuccessStories } from '@/features/cms/queries/content';
import { searchPublicDoctors } from '@/features/cms/queries/doctors-public';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://carepulse.hospital';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/about/overview',
    '/about/leadership',
    '/about/facilities',
    '/departments',
    '/specialities',
    '/centres-of-excellence',
    '/doctors',
    '/services',
    '/health-packages',
    '/patient-resources',
    '/patient-resources/faq',
    '/international-patients',
    '/health-library',
    '/news',
    '/success-stories',
    '/contact',
    '/locations',
    '/insurance',
    '/search',
    '/book-appointment',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.7,
  }));

  const [
    departments,
    specialities,
    centres,
    services,
    packages,
    locations,
    articles,
    news,
    stories,
    doctors,
  ] = await Promise.all([
    getPublishedDepartments(),
    getPublishedSpecialities(),
    getPublishedCentres(),
    getPublishedServices(),
    getPublishedPackages(),
    getPublishedLocations(),
    getPublishedArticles({ limit: 100 }),
    getPublishedNews({ limit: 100 }),
    getPublishedSuccessStories(),
    searchPublicDoctors({ limit: 100 }),
  ]);

  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...departments.map((d) => ({
      url: `${BASE_URL}/departments/${d.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...specialities.map((s) => ({
      url: `${BASE_URL}/specialities/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...centres.map((c) => ({
      url: `${BASE_URL}/centres-of-excellence/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...services.map((s) => ({
      url: `${BASE_URL}/services/${s.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...packages.map((p) => ({
      url: `${BASE_URL}/health-packages/${p.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...locations.map((l) => ({
      url: `${BASE_URL}/locations/${l.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
    ...articles.articles.map((a) => ({
      url: `${BASE_URL}/health-library/${a.slug}`,
      lastModified: a.publishedAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    ...news.news.map((n) => ({
      url: `${BASE_URL}/news/${n.slug}`,
      lastModified: n.publishedAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    ...stories.map((s) => ({
      url: `${BASE_URL}/success-stories/${s.slug}`,
      lastModified: s.publishedAt ?? new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.4,
    })),
    ...doctors.doctors.map((d) => ({
      url: `${BASE_URL}/doctors/${d.slug ?? d.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];

  return [...staticRoutes, ...dynamicRoutes];
}
