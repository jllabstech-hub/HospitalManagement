import { unstable_cache } from 'next/cache';
import { prisma } from '@/server/db/client';
import { ACTIVE_PUBLISHED_FILTER } from '@/features/cms/constants';

const hospitalProfileSelect = {
  id: true,
  hospitalName: true,
  legalName: true,
  shortDescription: true,
  fullDescription: true,
  tagline: true,
  phone: true,
  emergencyPhone: true,
  email: true,
  addressLine1: true,
  addressLine2: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  latitude: true,
  longitude: true,
  timezone: true,
  websiteUrl: true,
  logoUrl: true,
  heroImageUrl: true,
  mission: true,
  vision: true,
  values: true,
  workingHours: true,
  customDomain: true,
  subdomain: true,
  primaryColor: true,
  secondaryColor: true,
  fontFamily: true,
  facebookUrl: true,
  twitterUrl: true,
  instagramUrl: true,
  linkedinUrl: true,
} as const;

const locationSelect = {
  id: true,
  name: true,
  slug: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  phone: true,
  emergencyPhone: true,
  email: true,
  latitude: true,
  longitude: true,
  mapUrl: true,
  directionsUrl: true,
  seoTitle: true,
  seoDescription: true,
  isPrimary: true,
} as const;

const leadershipSelect = {
  id: true,
  name: true,
  slug: true,
  designation: true,
  shortBio: true,
  fullBio: true,
  imageUrl: true,
  displayOrder: true,
} as const;

const facilitySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  imageUrl: true,
  category: true,
  displayOrder: true,
} as const;

export async function getActiveHospitalProfile() {
  try {
    return await unstable_cache(
      async () => {
        return prisma.hospitalProfile.findFirst({
          where: { isActive: true },
          select: hospitalProfileSelect,
        });
      },
      ['active-hospital-profile'],
      { revalidate: 600, tags: ['hospital-profile'] }
    )();
  } catch {
    return prisma.hospitalProfile.findFirst({
      where: { isActive: true },
      select: hospitalProfileSelect,
    });
  }
}

export async function getPublishedLocations() {
  try {
    return await unstable_cache(
      async () => {
        return prisma.hospitalLocation.findMany({
          where: ACTIVE_PUBLISHED_FILTER,
          select: locationSelect,
          orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
        });
      },
      ['published-locations-list'],
      { revalidate: 600, tags: ['hospital-locations'] }
    )();
  } catch {
    return prisma.hospitalLocation.findMany({
      where: ACTIVE_PUBLISHED_FILTER,
      select: locationSelect,
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    });
  }
}

export async function getLocationBySlug(slug: string) {
  if (!slug?.trim()) return null;

  return prisma.hospitalLocation.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
    select: locationSelect,
  });
}

export async function getPublishedLeadership() {
  return prisma.leadershipMember.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: leadershipSelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}

export async function getLeadershipBySlug(slug: string) {
  if (!slug?.trim()) return null;

  return prisma.leadershipMember.findFirst({
    where: { slug: slug.trim(), ...ACTIVE_PUBLISHED_FILTER },
    select: leadershipSelect,
  });
}

export async function getPublishedFacilities() {
  return prisma.facility.findMany({
    where: ACTIVE_PUBLISHED_FILTER,
    select: facilitySelect,
    orderBy: [{ displayOrder: 'asc' }, { name: 'asc' }],
  });
}
