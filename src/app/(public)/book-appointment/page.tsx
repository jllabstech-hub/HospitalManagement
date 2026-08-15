import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import DoctorProfileHeader from '@/components/doctors/DoctorProfileHeader';
import DoctorProfileSlotPicker from '@/features/appointments/components/DoctorProfileSlotPicker';
import { getHospitalTodayDateString } from '@/lib/date-utils';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { auth } from '@/features/auth';
import { getPublishedDepartments, getPublishedSpecialities } from '@/features/cms/queries/catalog';
import {
  getPublicDoctorByIdOrSlug,
  searchPublicDoctors,
} from '@/features/cms/queries/doctors-public';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Book Appointment · ${APP_CONFIG.appName}`,
  description: `Book a 30-minute outpatient consultation at ${APP_CONFIG.appName}.`,
};

interface PageProps {
  searchParams: Promise<{
    doctorId?: string;
    department?: string;
    speciality?: string;
    step?: string;
  }>;
}

export default async function BookAppointmentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const isPatient = session?.user?.role === 'PATIENT';
  const todayDate = getHospitalTodayDateString();

  const doctorId = params.doctorId?.trim();
  const departmentIdParam = params.department?.trim();
  const specialityParam = params.speciality?.trim();

  const [departments, specialities, preselectedDoctor] = await Promise.all([
    getPublishedDepartments(),
    getPublishedSpecialities(),
    doctorId ? getPublicDoctorByIdOrSlug(doctorId) : Promise.resolve(null),
  ]);

  let targetDepartmentId = departmentIdParam;
  if (!targetDepartmentId && specialityParam) {
    const matchedDept = departments.find(
      (d) => d.slug.toLowerCase() === specialityParam.toLowerCase() || d.id === specialityParam
    );
    if (matchedDept) {
      targetDepartmentId = matchedDept.id;
    } else {
      const matchedSpec = specialities.find(
        (s) => s.slug.toLowerCase() === specialityParam.toLowerCase() || s.id === specialityParam
      );
      if (matchedSpec?.department?.id) {
        targetDepartmentId = matchedSpec.department.id;
      }
    }
  }

  const deptDoctors = targetDepartmentId
    ? await searchPublicDoctors({ departmentId: targetDepartmentId, limit: 50, sort: 'featured' })
    : null;

  const step = params.step ?? (doctorId ? 'doctor' : targetDepartmentId ? 'doctors' : 'department');

  return (
    <>
      <PageHero
        eyebrow="Outpatient booking"
        title="Book an appointment"
        subtitle="Choose a department and doctor, then sign in to pick a live 30-minute consultation slot."
      />
      <section className="section-pad">
        <div className="container-page max-w-4xl">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Book Appointment' }]}
            className="mb-8"
          />

          <div className="mb-8 flex flex-wrap gap-2 text-sm">
            <StepBadge active={step === 'department' || !targetDepartmentId} label="1. Department" />
            <StepBadge active={step === 'doctors' || !!targetDepartmentId} label="2. Doctor" />
            <StepBadge active={step === 'doctor' || !!doctorId} label="3. Book slot" />
          </div>

          {preselectedDoctor && (
            <div className="space-y-6">
              <DoctorProfileHeader
                doctor={{
                  fullName: preselectedDoctor.publicDisplayName ?? preselectedDoctor.fullName,
                  qualification: preselectedDoctor.qualification,
                  experienceYears: preselectedDoctor.experienceYears,
                  bio: preselectedDoctor.publicBio ?? preselectedDoctor.bio,
                  department: preselectedDoctor.department,
                }}
              />

              <DoctorProfileSlotPicker
                doctorId={preselectedDoctor.id}
                doctorName={preselectedDoctor.fullName}
                departmentName={preselectedDoctor.department.name}
                todayDate={todayDate}
                isGuestMode={!isPatient}
              />
            </div>
          )}

          {!preselectedDoctor && !targetDepartmentId && (
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">Step 1 — Choose department</h2>
              {departments.length === 0 ? (
                <EmptyState
                  className="mt-6"
                  title="No departments available"
                  description="Departments will appear here once published."
                  actionHref="/contact"
                  actionLabel="Contact us"
                />
              ) : (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {departments.map((dept) => (
                    <Card key={dept.id} hover padding="sm">
                      <Link
                        href={`/book-appointment?department=${dept.id}&step=doctors`}
                        className="block font-semibold text-ink hover:text-brand-700"
                      >
                        {dept.name}
                      </Link>
                      {dept.shortDescription && (
                        <p className="mt-1 text-xs text-ink-muted line-clamp-2">
                          {dept.shortDescription}
                        </p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {!preselectedDoctor && targetDepartmentId && deptDoctors && (
            <div>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="font-display text-xl font-semibold text-ink">Step 2 — Choose doctor</h2>
                <Link href="/book-appointment" className="text-sm font-semibold text-brand-700">
                  ← Change department
                </Link>
              </div>

              {deptDoctors.doctors.length === 0 ? (
                <EmptyState
                  title="No doctors in this department"
                  description="Try another department or browse the full directory."
                  actionHref="/doctors"
                  actionLabel="Browse all doctors"
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {deptDoctors.doctors.map((doc) => (
                    <DoctorCard
                      key={doc.id}
                      doctor={{
                        id: doc.id,
                        fullName: doc.publicDisplayName ?? doc.fullName,
                        qualification: doc.qualification,
                        experienceYears: doc.experienceYears,
                        department: doc.department,
                      }}
                      href={`/doctors/${doc.slug ?? doc.id}`}
                      bookHref={`/book-appointment?doctorId=${doc.id}`}
                      publicMode
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {!isPatient && (
            <p className="mt-10 text-sm text-ink-muted">
              Already a patient?{' '}
              <Link href="/login?callbackUrl=%2Fbook-appointment" className="font-semibold text-brand-700">
                Sign in
              </Link>{' '}
              or{' '}
              <Link href="/register" className="font-semibold text-brand-700">
                register
              </Link>{' '}
              to book with live availability.
            </p>
          )}
        </div>
      </section>
    </>
  );
}

function StepBadge({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded-pill px-3 py-1 font-medium ${
        active ? 'bg-brand-100 text-brand-800' : 'bg-surface-muted text-ink-muted'
      }`}
    >
      {label}
    </span>
  );
}
