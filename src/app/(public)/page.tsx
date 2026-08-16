import type { Metadata } from 'next';
import Hero from '@/components/home/Hero';
import TrustStats from '@/components/home/TrustStats';
import AboutSection from '@/components/home/AboutSection';
import ExcellenceSection from '@/components/home/ExcellenceSection';
import FeaturedDoctors from '@/components/home/FeaturedDoctors';
import Specialities from '@/components/home/Specialities';
import Services from '@/components/home/Services';
import AppointmentCTA from '@/components/home/AppointmentCTA';
import Testimonials from '@/components/home/Testimonials';
import TrustSection from '@/components/home/TrustSection';
import ContactSection from '@/components/home/ContactSection';
import JsonLd from '@/components/seo/JsonLd';
import { getActiveHospitalProfile } from '@/features/cms/queries/hospital';
import {
  getPublishedDepartments,
  getPublishedCentres,
  getPublishedSpecialities,
  getPublishedServices,
} from '@/features/cms/queries/catalog';
import { getPublishedTestimonials } from '@/features/cms/queries/content';
import { searchPublicDoctors } from '@/features/cms/queries/doctors-public';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: {
    absolute: `${APP_CONFIG.appName} · ${APP_CONFIG.tagline}`,
  },
  description:
    'Find specialists, book 30-minute outpatient consultations, and manage hospital appointments with CarePulse Hospital in Bengaluru.',
  openGraph: {
    title: APP_CONFIG.appName,
    description: APP_CONFIG.tagline,
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function HomePage() {
  const [profile, departments, centres, specialities, services, testimonials, doctorResult] =
    await Promise.all([
      getActiveHospitalProfile(),
      getPublishedDepartments(),
      getPublishedCentres(),
      getPublishedSpecialities(),
      getPublishedServices(),
      getPublishedTestimonials(),
      searchPublicDoctors({ page: 1, limit: 3, sort: 'featured' }),
    ]);

  const hospitalName = profile?.hospitalName ?? APP_CONFIG.appName;
  const hospitalTagline = profile?.tagline ?? APP_CONFIG.tagline;

  const medicalOrganizationLd = {
    '@context': 'https://schema.org',
    '@type': 'Hospital',
    name: hospitalName,
    description: hospitalTagline,
    telephone: profile?.phone ?? APP_CONFIG.contact.phone,
    email: profile?.email ?? APP_CONFIG.contact.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: profile?.addressLine1 ?? '12 Health Avenue',
      addressLocality: profile?.city ?? 'Bengaluru',
      addressRegion: profile?.state ?? 'Karnataka',
      postalCode: profile?.postalCode ?? '560001',
      addressCountry: profile?.country ?? 'IN',
    },
    openingHours: profile?.workingHours ?? 'Mo-Sa 08:00-20:00',
    medicalSpecialty: departments.map((d) => d.name),
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: '/',
      },
    ],
  };

  const deptForHome = departments.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    description: d.shortDescription ?? d.description,
    imageUrl: d.imageUrl,
  }));

  return (
    <>
      <JsonLd data={[medicalOrganizationLd, breadcrumbLd]} />
      <Hero profile={profile} />
      <TrustStats />
      <AboutSection profile={profile} />
      <ExcellenceSection centres={centres} departments={deptForHome} />
      <FeaturedDoctors doctors={doctorResult.doctors} />
      <Specialities specialities={specialities} departments={deptForHome} />
      <Services services={services} />
      <AppointmentCTA />
      <Testimonials testimonials={testimonials} />
      <TrustSection />
      <ContactSection profile={profile} />
    </>
  );
}
