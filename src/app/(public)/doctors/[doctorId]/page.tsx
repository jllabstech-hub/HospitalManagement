import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import DoctorProfileHeader from '@/components/doctors/DoctorProfileHeader';
import JsonLd from '@/components/seo/JsonLd';
import { getPublicDoctorByIdOrSlug } from '@/features/cms/queries/doctors-public';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{ doctorId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { doctorId } = await params;
  const doctor = await getPublicDoctorByIdOrSlug(doctorId);
  if (!doctor) return { title: 'Doctor not found' };

  const displayName = doctor.publicDisplayName ?? doctor.fullName;
  return {
    title: doctor.seoTitle ?? `${displayName} · ${APP_CONFIG.appName}`,
    description:
      doctor.seoDescription ??
      doctor.publicBio ??
      doctor.bio ??
      `${displayName} — ${doctor.qualification} at ${doctor.department.name}.`,
  };
}

export default async function PublicDoctorPage({ params }: PageProps) {
  const { doctorId } = await params;
  const doctor = await getPublicDoctorByIdOrSlug(doctorId);
  if (!doctor) notFound();

  const displayName = doctor.publicDisplayName ?? doctor.fullName;
  const bio = doctor.publicBio ?? doctor.bio;

  const physicianLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: displayName,
    medicalSpecialty: doctor.specialities.map((s) => s.speciality.name),
    worksFor: {
      '@type': 'Hospital',
      name: APP_CONFIG.appName,
    },
  };

  return (
    <>
      <JsonLd data={physicianLd} />
      <section className="section-pad">
        <div className="container-page max-w-4xl">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Doctors', href: '/doctors' },
              { label: displayName },
            ]}
            className="mb-8"
          />

          <DoctorProfileHeader
            doctor={{
              fullName: displayName,
              phoneNumber: doctor.phoneNumber,
              qualification: doctor.qualification,
              experienceYears: doctor.experienceYears,
              bio,
              department: {
                name: doctor.department.name,
                description: doctor.department.shortDescription ?? doctor.department.description,
              },
            }}
          />

          {doctor.specialities.length > 0 && (
            <div className="card-surface mt-6 p-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-soft">
                Specialities
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {doctor.specialities.map(({ speciality }) => (
                  <Link
                    key={speciality.id}
                    href={`/specialities/${speciality.slug}`}
                    className="rounded-pill bg-brand-50 px-3 py-1 text-sm font-medium text-brand-800"
                  >
                    {speciality.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {(doctor.education || doctor.certifications || doctor.areasOfInterest) && (
            <div className="card-surface mt-6 space-y-4 p-6">
              {doctor.education && (
                <div>
                  <h2 className="text-sm font-semibold text-ink">Education</h2>
                  <p className="mt-1 text-sm text-ink-muted whitespace-pre-line">{doctor.education}</p>
                </div>
              )}
              {doctor.certifications && (
                <div>
                  <h2 className="text-sm font-semibold text-ink">Certifications</h2>
                  <p className="mt-1 text-sm text-ink-muted whitespace-pre-line">
                    {doctor.certifications}
                  </p>
                </div>
              )}
              {doctor.areasOfInterest && (
                <div>
                  <h2 className="text-sm font-semibold text-ink">Areas of interest</h2>
                  <p className="mt-1 text-sm text-ink-muted whitespace-pre-line">
                    {doctor.areasOfInterest}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={`/book-appointment?doctorId=${doctor.id}`} className="btn-primary">
              Book appointment
            </Link>
            <Link href={`/departments/${doctor.department.slug}`} className="btn-secondary">
              View {doctor.department.name}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
