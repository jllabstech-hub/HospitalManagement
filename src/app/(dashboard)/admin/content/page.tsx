import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { EnquiryStatus, ContactMessageStatus } from '@prisma/client';

export default async function AdminContentPage() {
  await requireAdmin();

  const [
    hospitalProfileCount,
    departmentCount,
    doctorCount,
    newContactMessages,
    newAppointmentEnquiries,
    newInternationalEnquiries,
  ] = await Promise.all([
    prisma.hospitalProfile.count(),
    prisma.department.count(),
    prisma.doctorProfile.count(),
    prisma.contactMessage.count({ where: { status: ContactMessageStatus.NEW } }),
    prisma.appointmentEnquiry.count({ where: { status: EnquiryStatus.NEW } }),
    prisma.internationalPatientEnquiry.count({ where: { status: EnquiryStatus.NEW } }),
  ]);

  const modules = [
    { title: 'Hospital Identity & Profile', href: '/admin/content/hospital', count: hospitalProfileCount, description: 'Manage hospital name, logo, contact info & vision' },
    { title: 'Medical Departments', href: '/admin/departments', count: departmentCount, description: 'Manage department descriptions, icons & ordering' },
    { title: 'Doctor Directory Profiles', href: '/admin/doctors', count: doctorCount, description: 'Manage doctor biographies, designations & qualifications' },
    { title: 'Patient Enquiries & Messages', href: '/admin/enquiries', count: newContactMessages + newAppointmentEnquiries + newInternationalEnquiries, description: 'Review & respond to patient contact requests' },
    { title: 'Outpatient Appointments', href: '/admin/appointments', count: 8, description: 'Manage live booking records & hospital schedules' },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h1 className="font-display text-2xl font-semibold text-ink">Content Management</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Manage public hospital website content and review incoming enquiries.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-brand-200 bg-brand-50 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">New Contact Messages</span>
          <p className="mt-1 text-2xl font-bold text-ink">{newContactMessages}</p>
        </div>
        <div className="rounded-card border border-accent-200 bg-accent-50 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-800">New Appointment Enquiries</span>
          <p className="mt-1 text-2xl font-bold text-ink">{newAppointmentEnquiries}</p>
        </div>
        <div className="rounded-card border border-[#dde5e9] bg-white p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">New International Enquiries</span>
          <p className="mt-1 text-2xl font-bold text-ink">{newInternationalEnquiries}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map((mod) => (
          <Link
            key={mod.title}
            href={mod.href}
            className="card-surface flex flex-col justify-between p-5 transition hover:border-brand-300 hover:shadow-card"
          >
            <div>
              <h2 className="font-bold text-ink">{mod.title}</h2>
              <p className="mt-1 text-xs leading-relaxed text-ink-muted">
                {mod.description}
              </p>
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#dde5e9]/70 pt-3 text-xs font-semibold text-brand-700">
              <span>{mod.count} Active Records</span>
              <span>Edit in Admin →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
