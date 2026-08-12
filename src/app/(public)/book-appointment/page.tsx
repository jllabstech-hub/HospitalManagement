import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import DoctorCard from '@/components/doctors/DoctorCard';
import EmptyState from '@/components/ui/EmptyState';
import Card from '@/components/ui/Card';
import { auth } from '@/features/auth';
import { getPublishedDepartments } from '@/features/cms/queries/catalog';
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
    step?: string;
  }>;
}

export default async function BookAppointmentPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const session = await auth();
  const isPatient = session?.user?.role === 'PATIENT';

  const doctorId = params.doctorId?.trim();
  const departmentId = params.department?.trim();
  const step = params.step ?? (doctorId ? 'doctor' : departmentId ? 'doctors' : 'department');

  const [departments, preselectedDoctor, deptDoctors] = await Promise.all([
    getPublishedDepartments(),
    doctorId ? getPublicDoctorByIdOrSlug(doctorId) : Promise.resolve(null),
    departmentId
      ? searchPublicDoctors({ departmentId, limit: 50, sort: 'featured' })
      : Promise.resolve(null),
  ]);

  const patientBookingHref = (id: string) =>
    isPatient
      ? `/patient/doctors/${id}`
      : `/login?callbackUrl=${encodeURIComponent(`/patient/doctors/${id}`)}`;

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
            <StepBadge active={step === 'department' || !departmentId} label="1. Department" />
            <StepBadge active={step === 'doctors' || !!departmentId} label="2. Doctor" />
            <StepBadge active={step === 'doctor' || !!doctorId} label="3. Book slot" />
          </div>

          {preselectedDoctor && (
            <div className="mb-10 card-surface p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-[#dde5e9] pb-6">
                <div>
                  <span className="rounded-pill bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
                    {preselectedDoctor.department.name}
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-ink">
                    Dr. {preselectedDoctor.publicDisplayName ?? preselectedDoctor.fullName}
                  </h2>
                  <p className="text-sm font-semibold text-brand-700">{preselectedDoctor.qualification}</p>
                </div>
                <div className="flex gap-3">
                  <Link
                    href={`/doctors/${preselectedDoctor.slug ?? preselectedDoctor.id}`}
                    className="btn-secondary text-xs"
                  >
                    View Full Profile
                  </Link>
                  <Link href="/book-appointment" className="btn-secondary text-xs">
                    Choose Another Doctor
                  </Link>
                </div>
              </div>

              {isPatient ? (
                <div className="mt-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-wider text-emerald-700">
                    ✓ Logged in as Patient — Select Consultation Date & Time Slot:
                  </p>
                  <Link
                    href={`/patient/doctors/${preselectedDoctor.id}`}
                    className="btn-primary w-full sm:w-auto py-3 text-base shadow-elevated"
                  >
                    Proceed to Select Live Appointment Slot →
                  </Link>
                </div>
              ) : (
                <div className="mt-6 rounded-card bg-brand-50/70 p-5 border border-brand-200">
                  <p className="text-sm font-semibold text-brand-900">
                    Sign in with your phone number to view live 30-minute availability slots for Dr. {preselectedDoctor.fullName}:
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/login?callbackUrl=${encodeURIComponent(`/patient/doctors/${preselectedDoctor.id}`)}`}
                      className="btn-primary shadow-soft"
                    >
                      Sign In / Enter Mobile OTP →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {!preselectedDoctor && !departmentId && (
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

          {!preselectedDoctor && departmentId && deptDoctors && (
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
                      bookHref={patientBookingHref(doc.id)}
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
