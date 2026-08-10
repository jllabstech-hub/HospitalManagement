import type { Metadata } from 'next';
import Link from 'next/link';
import Breadcrumbs from '@/components/public/Breadcrumbs';
import PageHero from '@/components/public/PageHero';
import ContactForm from '@/features/cms/components/ContactForm';
import AppointmentEnquiryForm from '@/features/cms/components/AppointmentEnquiryForm';
import { getActiveHospitalProfile, getPublishedLocations } from '@/features/cms/queries/hospital';
import { getPublishedDepartments } from '@/features/cms/queries/catalog';
import { searchPublicDoctors } from '@/features/cms/queries/doctors-public';
import { APP_CONFIG } from '@/config';

export const metadata: Metadata = {
  title: `Contact · ${APP_CONFIG.appName}`,
  description: `Contact ${APP_CONFIG.appName} for appointments, enquiries, and general information.`,
};

export default async function ContactPage() {
  const [profile, locations, departments, doctorResult] = await Promise.all([
    getActiveHospitalProfile(),
    getPublishedLocations(),
    getPublishedDepartments(),
    searchPublicDoctors({ limit: 50, sort: 'name' }),
  ]);

  const primaryLocation = locations.find((l) => l.isPrimary) ?? locations[0];

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact us"
        subtitle="Reach our outpatient desk for appointments, general enquiries, or directions to the hospital."
      />
      <section className="section-pad">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-3">
            <div className="space-y-6">
              <div className="card-surface p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Hospital information</h2>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="font-medium text-ink">Phone</dt>
                    <dd>
                      <a
                        href={APP_CONFIG.contact.phoneHref}
                        className="text-brand-700 hover:underline"
                      >
                        {profile?.phone ?? APP_CONFIG.contact.phone}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Email</dt>
                    <dd>
                      <a
                        href={`mailto:${profile?.email ?? APP_CONFIG.contact.email}`}
                        className="text-brand-700 hover:underline"
                      >
                        {profile?.email ?? APP_CONFIG.contact.email}
                      </a>
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Emergency</dt>
                    <dd>{profile?.emergencyPhone ?? APP_CONFIG.contact.emergency}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Address</dt>
                    <dd className="text-ink-muted">
                      {primaryLocation
                        ? [primaryLocation.address, primaryLocation.city, primaryLocation.state]
                            .filter(Boolean)
                            .join(', ')
                        : APP_CONFIG.contact.address}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-medium text-ink">Hours</dt>
                    <dd className="text-ink-muted">{APP_CONFIG.contact.hours}</dd>
                  </div>
                </dl>
                <Link href="/locations" className="mt-4 inline-block text-sm font-semibold text-brand-700">
                  View all locations →
                </Link>
              </div>

              <div className="card-surface p-6">
                <h2 className="font-display text-lg font-semibold text-ink">Book online</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Prefer self-service booking? Choose a doctor and pick a live availability slot.
                </p>
                <Link href="/book-appointment" className="btn-primary mt-4">
                  Book appointment
                </Link>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-10">
              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Send a message</h2>
                <div className="mt-4">
                  <ContactForm />
                </div>
              </div>

              <div>
                <h2 className="font-display text-lg font-semibold text-ink">Appointment enquiry</h2>
                <p className="mt-2 text-sm text-ink-muted">
                  Not ready to book online? Submit an enquiry and our team will assist.
                </p>
                <div className="mt-4">
                  <AppointmentEnquiryForm
                    departments={departments.map((d) => ({ id: d.id, name: d.name }))}
                    doctors={doctorResult.doctors.map((d) => ({
                      id: d.id,
                      fullName: d.publicDisplayName ?? d.fullName,
                    }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
