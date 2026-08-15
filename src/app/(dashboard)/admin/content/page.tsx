import Link from 'next/link';
import { requireAdmin } from '@/server/security/auth-helpers';
import { prisma } from '@/server/db/client';
import { EnquiryStatus, ContactMessageStatus } from '@prisma/client';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

interface ContentItem {
  title: string;
  href: string;
  count: number;
  description: string;
  frontendUrl: string;
  subMenuLabel: string;
}

interface ContentGroup {
  category: string;
  badge: string;
  icon: string;
  frontendUrl: string;
  description: string;
  subMenus: {
    subMenuTitle: string;
    items: ContentItem[];
  }[];
}

export default async function AdminContentPage() {
  const admin = await requireAdmin();
  const tenantId = admin.tenantId;

  const [
    hospitalProfileCount,
    leadershipCount,
    facilityCount,
    departmentCount,
    doctorCount,
    newContactMessages,
    newAppointmentEnquiries,
    mediaAssetCount,
    specialityCount,
    centreCount,
    serviceCount,
    healthPackageCount,
    healthArticleCount,
    newsArticleCount,
    successStoryCount,
    faqItemCount,
    patientResourceCount,
    insuranceCount,
    internationalCount,
    appointmentCount,
  ] = await Promise.all([
    prisma.hospitalProfile.count({ where: { id: tenantId } }).catch(() => 0),
    prisma.leadershipMember.count({ where: { tenantId } }).catch(() => 0),
    prisma.facility.count({ where: { tenantId } }).catch(() => 0),
    prisma.department.count({ where: { tenantId } }).catch(() => 0),
    prisma.doctorProfile.count({ where: { tenantId } }).catch(() => 0),
    prisma.contactMessage.count({ where: { tenantId, status: ContactMessageStatus.NEW } }).catch(() => 0),
    prisma.appointmentEnquiry.count({ where: { tenantId, status: EnquiryStatus.NEW } }).catch(() => 0),
    prisma.mediaAsset.count({ where: { tenantId } }).catch(() => 0),
    prisma.speciality.count({ where: { tenantId } }).catch(() => 0),
    prisma.centreOfExcellence.count({ where: { tenantId } }).catch(() => 0),
    prisma.hospitalService.count({ where: { tenantId } }).catch(() => 0),
    prisma.healthPackage.count({ where: { tenantId } }).catch(() => 0),
    prisma.healthArticle.count({ where: { tenantId } }).catch(() => 0),
    prisma.newsArticle.count({ where: { tenantId } }).catch(() => 0),
    prisma.successStory.count({ where: { tenantId } }).catch(() => 0),
    prisma.faqItem.count({ where: { tenantId } }).catch(() => 0),
    prisma.patientResource.count({ where: { tenantId } }).catch(() => 0),
    prisma.insurancePartner.count({ where: { tenantId } }).catch(() => 0),
    prisma.internationalPageContent.count({ where: { tenantId } }).catch(() => 0),
    prisma.appointment.count({ where: { tenantId } }).catch(() => 0),
  ]);

  // Content groups strictly matching Public Site Header Dropdowns & Sub-menu Columns
  const groups: ContentGroup[] = [
    {
      category: 'About Us',
      badge: 'Main Header #1',
      icon: '🏥',
      frontendUrl: '/about',
      description: 'Hospital identity, leadership details, facilities, news updates, and patient trust.',
      subMenus: [
        {
          subMenuTitle: 'Sub-Menu: Hospital Overview',
          items: [
            {
              title: 'Hospital Profile & Branding',
              href: '/admin/content/hospital',
              count: hospitalProfileCount,
              description: 'Manage legal name, logo, hero banner, tagline, mission & vision',
              frontendUrl: '/about',
              subMenuLabel: 'About CarePulse Hospital',
            },
            {
              title: 'Leadership & Management',
              href: '/admin/leadership',
              count: leadershipCount,
              description: 'Publish medical directors and operational leaders',
              frontendUrl: '/about/leadership',
              subMenuLabel: 'Leadership & Management',
            },
            {
              title: 'Advanced Facilities',
              href: '/admin/facilities',
              count: facilityCount,
              description: 'Manage theatres, ICUs, imaging, and other hospital facilities',
              frontendUrl: '/about/facilities',
              subMenuLabel: 'Advanced Facilities',
            },
            {
              title: 'Media Library',
              href: '/admin/media',
              count: mediaAssetCount,
              description: 'Upload photos used across hospital pages',
              frontendUrl: '/about/facilities',
              subMenuLabel: 'Media assets',
            },
          ],
        },
        {
          subMenuTitle: 'Sub-Menu: Patient Trust & Media',
          items: [
            {
              title: 'Patient Success Stories',
              href: '/admin/success-stories',
              count: successStoryCount,
              description: 'Manage patient recovery journeys & surgical outcome stories',
              frontendUrl: '/success-stories',
              subMenuLabel: 'Patient Success Stories',
            },
            {
              title: 'News & Media Updates',
              href: '/admin/news',
              count: newsArticleCount,
              description: 'Publish hospital achievements, press releases, & announcements',
              frontendUrl: '/news',
              subMenuLabel: 'News & Media Updates',
            },
          ],
        },
      ],
    },
    {
      category: 'Specialities',
      badge: 'Main Header #2',
      icon: '🩺',
      frontendUrl: '/specialities',
      description: 'Clinical specialities, medical departments, and diagnostic lab services.',
      subMenus: [
        {
          subMenuTitle: 'Sub-Menu: Key Medical Specialities',
          items: [
            {
              title: 'All Specialities',
              href: '/admin/specialities',
              count: specialityCount,
              description: 'Manage clinical specialities shown in the Specialities dropdown',
              frontendUrl: '/specialities',
              subMenuLabel: 'All Specialities',
            },
          ],
        },
        {
          subMenuTitle: 'Sub-Menu: Specialised Departments & Services',
          items: [
            {
              title: 'All Clinical Departments',
              href: '/admin/departments',
              count: departmentCount,
              description: 'Manage department units, cover images, & medical descriptions',
              frontendUrl: '/departments',
              subMenuLabel: 'Clinical Departments',
            },
            {
              title: 'Diagnostic & Lab Services',
              href: '/admin/services',
              count: serviceCount,
              description: 'Manage pathology, radiology, MRI, CT & inpatient amenities',
              frontendUrl: '/services',
              subMenuLabel: 'Diagnostic & Lab Services',
            },
          ],
        },
      ],
    },
    {
      category: 'Centres of Excellence',
      badge: 'Main Header #3',
      icon: '🏛️',
      frontendUrl: '/centres-of-excellence',
      description: 'Specialized super-speciality institutes and dedicated clinical units.',
      subMenus: [
        {
          subMenuTitle: 'Sub-Menu: Super Speciality Centres',
          items: [
            {
              title: 'Centres of Excellence',
              href: '/admin/centres',
              count: centreCount,
              description: 'Manage Heart & Vascular, Orthopedics, & Super Speciality units',
              frontendUrl: '/centres-of-excellence',
              subMenuLabel: 'Specialised Units',
            },
          ],
        },
      ],
    },
    {
      category: 'Find a Doctor',
      badge: 'Main Header #4',
      icon: '👨‍⚕️',
      frontendUrl: '/doctors',
      description: 'Doctor specialist directory, credentials, and instant online booking slots.',
      subMenus: [
        {
          subMenuTitle: 'Sub-Menu: Specialist Directory & Booking',
          items: [
            {
              title: 'Search Specialists (Doctors)',
              href: '/admin/doctors',
              count: doctorCount,
              description: 'Manage doctor profiles, qualifications, experience, & photos',
              frontendUrl: '/doctors',
              subMenuLabel: 'Search Specialists',
            },
            {
              title: 'Instant Online Slot Booking',
              href: '/admin/appointments',
              count: appointmentCount,
              description: 'Supervise live appointment bookings, consultation slots & schedules',
              frontendUrl: '/book-appointment',
              subMenuLabel: 'Instant Online Booking',
            },
          ],
        },
      ],
    },
    {
      category: 'Health Checkups',
      badge: 'Main Header #5',
      icon: '💊',
      frontendUrl: '/health-packages',
      description: 'Preventive wellness screening panels, cardiac checkups, and health packages.',
      subMenus: [
        {
          subMenuTitle: 'Sub-Menu: Preventive Wellness Packages',
          items: [
            {
              title: 'Health Checkup Packages',
              href: '/admin/health-packages',
              count: healthPackageCount,
              description: 'Manage executive wellness panels, cardiac packages, & pricing',
              frontendUrl: '/health-packages',
              subMenuLabel: 'All Health Packages',
            },
          ],
        },
      ],
    },
    {
      category: 'Patient Care',
      badge: 'Main Header #6',
      icon: '💙',
      frontendUrl: '/patient-resources',
      description: 'Patient resources, FAQs, health library articles, and contact enquiries desk.',
      subMenus: [
        {
          subMenuTitle: 'Sub-Menu: Patient Support & Education',
          items: [
            {
              title: 'Patient Resources & Downloads',
              href: '/admin/patient-resources',
              count: patientResourceCount,
              description: 'Manage pre-visit checklists, admission guides, & downloadable forms',
              frontendUrl: '/patient-resources',
              subMenuLabel: 'Patient Resources & Downloads',
            },
            {
              title: 'Frequently Asked Questions',
              href: '/admin/faqs',
              count: faqItemCount,
              description: 'Manage visiting hours, OPD timings, insurance & registration FAQs',
              frontendUrl: '/patient-resources/faq',
              subMenuLabel: 'Frequently Asked Questions',
            },
            {
              title: 'Insurance & Cashless Support',
              href: '/admin/insurance',
              count: insuranceCount,
              description: 'Manage empanelled insurers, TPAs, and cashless support copy',
              frontendUrl: '/insurance',
              subMenuLabel: 'Insurance & Cashless Support',
            },
            {
              title: 'Health Library Articles',
              href: '/admin/health-library',
              count: healthArticleCount,
              description: 'Publish medical education blogs, health tips, & wellness articles',
              frontendUrl: '/health-library',
              subMenuLabel: 'Health Articles',
            },
          ],
        },
        {
          subMenuTitle: 'Sub-Menu: International Care',
          items: [
            {
              title: 'International Patient Desk',
              href: '/admin/international',
              count: internationalCount,
              description: 'Edit visa assistance, second-opinion, and coordinator content',
              frontendUrl: '/international-patients',
              subMenuLabel: 'International Patient Desk',
            },
            {
              title: 'Contact & Emergency Desk',
              href: '/admin/enquiries',
              count: newContactMessages + newAppointmentEnquiries,
              description: 'Review incoming contact requests, appointment enquiries & messages',
              frontendUrl: '/contact',
              subMenuLabel: 'Contact & Emergency Desk',
            },
          ],
        },
      ],
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <AdminPageHeader
        title="Content Management & Navigation Hierarchy"
        description="CMS modules organized to match public website headers and dropdown sub-menu items."
        frontendPath="/about"
      />

      {/* KPI Notification Cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-card border border-brand-200 bg-brand-50 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
            New Patient Contact Messages
          </span>
          <p className="mt-1 text-2xl font-bold text-ink">{newContactMessages}</p>
        </div>
        <div className="rounded-card border border-accent-200 bg-accent-50 p-4">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-800">
            New Appointment Enquiries
          </span>
          <p className="mt-1 text-2xl font-bold text-ink">{newAppointmentEnquiries}</p>
        </div>
      </div>

      {/* Grouped Content Modules matching Header & Sub-Menus */}
      <div className="space-y-12">
        {groups.map((group) => (
          <section key={group.category} className="rounded-card border border-[#dde5e9] bg-white p-6 shadow-sm space-y-6">
            {/* Header Level Title */}
            <div className="flex flex-wrap items-center justify-between border-b border-[#dde5e9] pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{group.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display text-xl font-bold text-ink">{group.category}</h2>
                    <span className="rounded bg-brand-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-brand-800">
                      {group.badge}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">{group.description}</p>
                </div>
              </div>
              <a
                href={group.frontendUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-button border border-brand-300 bg-brand-50 px-3.5 py-1.5 text-xs font-bold text-brand-800 transition hover:bg-brand-100"
              >
                Open Frontend Menu: {group.category} ↗
              </a>
            </div>

            {/* Sub-Menu Columns */}
            <div className="space-y-6">
              {group.subMenus.map((sub) => (
                <div key={sub.subMenuTitle} className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand-600"></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-brand-900">
                      {sub.subMenuTitle}
                    </h3>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sub.items.map((item) => (
                      <Link
                        key={item.title}
                        href={item.href}
                        className="card-surface flex flex-col justify-between p-4 transition hover:border-brand-400 hover:shadow-card group"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-ink group-hover:text-brand-700 transition">{item.title}</h4>
                            <span className="rounded bg-brand-50 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">
                              Sub-item: {item.subMenuLabel}
                            </span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                            {item.description}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-[#dde5e9]/70 pt-2.5 text-xs font-semibold text-brand-700">
                          <span className="text-ink-muted font-normal">{item.count} Active Records</span>
                          <span className="group-hover:underline">Edit in Admin →</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
