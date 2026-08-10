import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { requirePatient } from '@/server/security/auth-helpers';
import { getDoctorPublicProfile } from '@/features/doctors/queries';
import { getHospitalTodayDateString } from '@/lib/date-utils';
import DoctorProfileSlotPicker from '@/features/appointments/components/DoctorProfileSlotPicker';
import DoctorProfileHeader from '@/components/doctors/DoctorProfileHeader';
import JsonLd from '@/components/seo/JsonLd';
import { APP_CONFIG } from '@/config';

interface PageProps {
  params: Promise<{
    doctorId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { doctorId } = await params;
  const doctor = await getDoctorPublicProfile(doctorId);

  if (!doctor) {
    return {
      title: 'Doctor Not Found',
    };
  }

  const specialty = doctor.department.name;
  const title = `${doctor.fullName} · ${specialty}`;
  const description = [
    doctor.fullName,
    doctor.qualification,
    specialty,
    `${doctor.experienceYears} years experience`,
    APP_CONFIG.appName,
  ]
    .filter(Boolean)
    .join(' · ');

  return {
    title,
    description,
    openGraph: {
      title: `${doctor.fullName} | ${APP_CONFIG.shortName}`,
      description,
      type: 'profile',
    },
  };
}

export default async function DoctorProfilePage({ params }: PageProps) {
  await requirePatient();

  const resolvedParams = await params;
  const doctorId = resolvedParams.doctorId;

  const doctor = await getDoctorPublicProfile(doctorId);

  if (!doctor) {
    notFound();
  }

  const isUnavailable = !doctor.user.isActive || !doctor.department.isActive;
  const todayDate = getHospitalTodayDateString();

  const physicianLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name: doctor.fullName,
    medicalSpecialty: doctor.department.name,
    description: doctor.bio || `${doctor.qualification} at ${APP_CONFIG.appName}`,
    worksFor: {
      '@type': 'Hospital',
      name: APP_CONFIG.appName,
    },
  };

  const breadcrumbLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Find a Doctor',
        item: '/patient/doctors',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: doctor.fullName,
      },
    ],
  };

  return (
    <div className="space-y-6">
      <JsonLd data={[physicianLd, breadcrumbLd]} />

      <div className="flex items-center gap-2 text-xs font-semibold text-ink-muted">
        <Link href="/patient/doctors" className="hover:text-brand-700">
          ← Find a Doctor
        </Link>
        <span>/</span>
        <span className="text-ink">{doctor.fullName}</span>
      </div>

      {isUnavailable ? (
        <div className="card-surface space-y-4 p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">Doctor Unavailable</h2>
          <p className="mx-auto max-w-md text-sm text-ink-muted">
            This doctor or their medical department is currently unavailable for outpatient
            appointments. Please return to the doctor directory to select an active doctor.
          </p>
          <div className="pt-2">
            <Link href="/patient/doctors" className="btn-primary">
              Browse Active Doctors
            </Link>
          </div>
        </div>
      ) : (
        <>
          <DoctorProfileHeader doctor={doctor} />
          <DoctorProfileSlotPicker
            doctorId={doctor.id}
            doctorName={doctor.fullName}
            departmentName={doctor.department.name}
            todayDate={todayDate}
          />
        </>
      )}
    </div>
  );
}
