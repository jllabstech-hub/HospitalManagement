import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { EnquiryStatus, ContactMessageStatus } from '@prisma/client';

export default async function AdminContentPage() {
  await requireAdmin();

  const [
    hospitalProfileCount,
    locationCount,
    specialityCount,
    centreCount,
    serviceCount,
    packageCount,
    articleCount,
    newsCount,
    faqCount,
    newContactMessages,
    newAppointmentEnquiries,
    newInternationalEnquiries,
  ] = await Promise.all([
    prisma.hospitalProfile.count(),
    prisma.hospitalLocation.count(),
    prisma.speciality.count(),
    prisma.centreOfExcellence.count(),
    prisma.hospitalService.count(),
    prisma.healthPackage.count(),
    prisma.healthArticle.count(),
    prisma.newsArticle.count(),
    prisma.faqItem.count(),
    prisma.contactMessage.count({ where: { status: ContactMessageStatus.NEW } }),
    prisma.appointmentEnquiry.count({ where: { status: EnquiryStatus.NEW } }),
    prisma.internationalPatientEnquiry.count({ where: { status: EnquiryStatus.NEW } }),
  ]);

  const modules = [
    { title: 'Hospital Profile', href: '/admin/content/hospital', count: hospitalProfileCount },
    { title: 'Locations', href: '/locations', count: locationCount, external: true },
    { title: 'Specialities', href: '/specialities', count: specialityCount, external: true },
    { title: 'Centres of Excellence', href: '/centres-of-excellence', count: centreCount, external: true },
    { title: 'Services', href: '/services', count: serviceCount, external: true },
    { title: 'Health Packages', href: '/health-packages', count: packageCount, external: true },
    { title: 'Health Library', href: '/health-library', count: articleCount, external: true },
    { title: 'News', href: '/news', count: newsCount, external: true },
    { title: 'FAQs', href: '/faqs', count: faqCount, external: true },
    { title: 'Enquiries', href: '/admin/enquiries', count: newContactMessages + newAppointmentEnquiries + newInternationalEnquiries },
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
            {...(mod.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="card-surface block p-5 transition hover:border-brand-300 hover:shadow-card"
          >
            <h2 className="font-semibold text-ink">{mod.title}</h2>
            <p className="mt-1 text-xs text-ink-muted">
              {mod.external ? 'View public page' : 'Manage in admin'} · {mod.count} record{mod.count === 1 ? '' : 's'}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
