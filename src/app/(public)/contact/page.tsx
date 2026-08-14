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
  title: `Contact Us · ${APP_CONFIG.appName}`,
  description: `Contact ${APP_CONFIG.appName} for appointments, 24/7 emergency care, patient enquiries, and hospital directions.`,
};

export default async function ContactPage() {
  const [profile, locations, departments, doctorResult] = await Promise.all([
    getActiveHospitalProfile(),
    getPublishedLocations(),
    getPublishedDepartments(),
    searchPublicDoctors({ limit: 50, sort: 'name' }),
  ]);

  const primaryLocation = locations.find((l) => l.isPrimary) ?? locations[0];
  const phone = profile?.phone ?? APP_CONFIG.contact.phone;
  const email = profile?.email ?? APP_CONFIG.contact.email;
  const emergencyPhone = profile?.emergencyPhone ?? APP_CONFIG.contact.emergency;

  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title="Contact CarePulse Hospital"
        subtitle="Our outpatient desk and 24/7 emergency center are here to assist you with appointments, consultations, and medical support."
      />

      <section className="section-pad bg-gradient-to-b from-white via-surface-warm/30 to-white">
        <div className="container-page">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
            className="mb-8"
          />

          {/* Top Row: Apollo Hospitals Style 4-Card Contact Grid */}
          <div className="mb-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: 24/7 Emergency Hotline */}
            <div className="group relative overflow-hidden rounded-card border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-600 text-white font-bold text-xl shadow-md">
                🚨
              </div>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-rose-700">
                24/7 Emergency Care
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">{emergencyPhone}</h3>
              <p className="mt-1 text-xs text-ink-muted">Immediate trauma & ambulance assistance</p>
            </div>

            {/* Card 2: Outpatient Desk Phone */}
            <div className="group relative overflow-hidden rounded-card border border-[#dde5e9] bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold text-xl shadow-inner">
                📞
              </div>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-brand-700">
                Outpatient Desk
              </p>
              <h3 className="mt-1 font-display text-xl font-bold text-ink">
                <a href={APP_CONFIG.contact.phoneHref} className="hover:text-brand-700">
                  {phone}
                </a>
              </h3>
              <p className="mt-1 text-xs text-ink-muted">Mon – Sat: 8:00 AM – 8:00 PM</p>
            </div>

            {/* Card 3: Email Support */}
            <div className="group relative overflow-hidden rounded-card border border-[#dde5e9] bg-white p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold text-xl shadow-inner">
                ✉️
              </div>
              <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-brand-700">
                Email Desk
              </p>
              <h3 className="mt-1 font-display text-base font-bold text-ink truncate">
                <a href={`mailto:${email}`} className="hover:text-brand-700">
                  {email}
                </a>
              </h3>
              <p className="mt-1 text-xs text-ink-muted">General enquiries & response in 24h</p>
            </div>

            {/* Card 4: Quick Online Booking Banner */}
            <div className="group relative overflow-hidden rounded-card border border-brand-200 bg-gradient-to-br from-brand-900 to-brand-950 p-6 text-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
              <p className="text-xs font-extrabold uppercase tracking-wider text-brand-200">
                Self-Service Portal
              </p>
              <h3 className="mt-1 font-display text-lg font-bold">Book Slot Online</h3>
              <p className="mt-1 text-xs text-brand-100/90">Pick live 30-min doctor availability</p>
              <Link
                href="/book-appointment"
                className="mt-4 inline-flex items-center justify-center rounded-button bg-white px-3.5 py-2 text-xs font-bold text-brand-950 shadow-soft transition hover:bg-brand-50"
              >
                Book Appointment →
              </Link>
            </div>
          </div>

          {/* Main Grid: Forms Left / Location & Information Right */}
          <div className="grid gap-10 lg:grid-cols-12">
            {/* Left 7 Columns: Send Message & Appointment Enquiry Tabs */}
            <div className="space-y-8 lg:col-span-7">
              <div className="card-surface p-6 sm:p-8">
                <div className="border-b border-[#dde5e9] pb-4">
                  <span className="rounded-pill bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
                    Get In Touch
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-ink">Send Us a Message</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Have a general inquiry, feedback, or need information about hospital services? Fill out the form below.
                  </p>
                </div>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>

              <div className="card-surface p-6 sm:p-8">
                <div className="border-b border-[#dde5e9] pb-4">
                  <span className="rounded-pill bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Outpatient Assistance
                  </span>
                  <h2 className="mt-2 font-display text-2xl font-bold text-ink">Appointment Enquiry</h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Need help finding the right specialist or scheduling assistance? Submit an enquiry and our outpatient coordinator will contact you.
                  </p>
                </div>
                <div className="mt-6">
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

            {/* Right 5 Columns: Location, Address & Hours Sidebar */}
            <div className="space-y-6 lg:col-span-5">
              <div className="card-surface p-6 sm:p-8 space-y-6">
                <div>
                  <span className="rounded-pill bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
                    Hospital Campus
                  </span>
                  <h3 className="mt-2 font-display text-xl font-bold text-ink">
                    {primaryLocation?.name ?? 'CarePulse Main Campus'}
                  </h3>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex gap-3">
                    <span className="mt-0.5 text-base">📍</span>
                    <div>
                      <p className="font-semibold text-ink">Address</p>
                      <p className="mt-0.5 text-ink-muted leading-relaxed">
                        {primaryLocation
                          ? [primaryLocation.address, primaryLocation.city, primaryLocation.state, primaryLocation.postalCode]
                              .filter(Boolean)
                              .join(', ')
                          : APP_CONFIG.contact.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="mt-0.5 text-base">⏰</span>
                    <div>
                      <p className="font-semibold text-ink">Outpatient OPD Hours</p>
                      <p className="mt-0.5 text-ink-muted">{profile?.workingHours || APP_CONFIG.contact.hours}</p>
                      <p className="mt-1 text-xs font-semibold text-emerald-700">
                        * 24/7 Emergency & Casualty Services Open Always
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <span className="mt-0.5 text-base">🚌</span>
                    <div>
                      <p className="font-semibold text-ink">Getting Here</p>
                      <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
                        Conveniently located with dedicated patient parking, valet assistance, and accessible entrance ramps.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#dde5e9]">
                  <Link
                    href="/locations"
                    className="inline-flex items-center justify-center rounded-button border border-[#dde5e9] bg-white px-4 py-2.5 text-xs font-bold text-ink transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 w-full"
                  >
                    View All Hospital Branches & Clinics →
                  </Link>
                </div>
              </div>

              {/* Embedded Interactive Map Card */}
              <div className="overflow-hidden rounded-card border border-[#dde5e9] shadow-soft">
                <iframe
                  title="CarePulse Hospital Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3888.752391694709!2d77.5945627!3d12.9248447!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae150821213f59%3A0xa6218d6a89c8a980!2sJayanagar%2C%20Bengaluru%2C%20Karnataka!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="260"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full grayscale transition-all duration-500 hover:grayscale-0"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

