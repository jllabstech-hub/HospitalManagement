import type { NavItemData } from './SiteHeaderClient';

export interface TenantNavLink {
  name: string;
  slug: string;
  shortDescription?: string | null;
}

export function buildTenantNav(input: {
  hospitalName?: string | null;
  specialities: TenantNavLink[];
  centres: TenantNavLink[];
}): NavItemData[] {
  const hospitalName = input.hospitalName?.trim() || 'the hospital';
  const specialityItems = input.specialities.slice(0, 6).map((spec) => ({
    href: `/specialities/${spec.slug}`,
    title: spec.name,
    description: spec.shortDescription || undefined,
  }));
  const centreItems = input.centres.slice(0, 6).map((centre) => ({
    href: `/centres-of-excellence/${centre.slug}`,
    title: centre.name,
    description: centre.shortDescription || undefined,
  }));

  return [
    {
      href: '/about',
      label: 'About Us',
      subtitle: 'Excellence & Leadership',
      columns: [
        {
          title: 'Hospital Overview',
          items: [
            { href: '/about', title: `About ${hospitalName}`, description: 'Hospital overview, leadership and facilities.' },
            { href: '/about/leadership', title: 'Leadership & Management', description: 'Medical directors and operational leaders.' },
            { href: '/about/facilities', title: 'Advanced Facilities', description: 'Theatres, ICUs and diagnostic imaging.' },
          ],
        },
        {
          title: 'Patient Trust',
          items: [
            { href: '/success-stories', title: 'Patient Success Stories', description: 'Recovery journeys and surgical outcomes.' },
            { href: '/news', title: 'News & Media Updates', description: 'Clinical achievements and hospital news.' },
          ],
        },
      ],
    },
    {
      href: '/specialities',
      label: 'Specialities',
      subtitle: 'Clinical Care Centers',
      columns: [
        {
          title: 'Key Medical Specialities',
          items: [
            { href: '/specialities', title: 'All Specialities', description: 'Explore clinical specialities and treatment areas.' },
            { href: '/departments', title: 'Clinical Departments', description: 'Browse medical and surgical units.' },
            { href: '/services', title: 'Diagnostic & Lab Services', description: 'Pathology, radiology and imaging.' },
            ...specialityItems,
          ],
        },
      ],
    },
    {
      href: '/centres-of-excellence',
      label: 'Centres of Excellence',
      subtitle: 'Specialised Units',
      columns: [
        {
          title: 'Centres of Excellence',
          items: [
            { href: '/centres-of-excellence', title: 'Browse All Centres', description: 'Explore multi-disciplinary centres of excellence.' },
            ...centreItems,
          ],
        },
      ],
    },
    {
      href: '/doctors',
      label: 'Find a Doctor',
      subtitle: 'Specialist Directory',
      columns: [
        {
          title: 'Doctor Directory',
          items: [
            { href: '/doctors', title: 'Search Specialists', description: 'Find doctors by name, department, or expertise.' },
            { href: '/book-appointment', title: 'Instant Online Slot Booking', description: 'Pick consultation slots with real-time confirmation.' },
          ],
        },
      ],
    },
    {
      href: '/health-packages',
      label: 'Health Checkups',
      subtitle: 'Preventive Care',
      columns: [
        {
          title: 'Preventive Wellness',
          items: [
            { href: '/health-packages', title: 'All Health Packages', description: 'Comprehensive screening packages.' },
          ],
        },
      ],
    },
    {
      href: '/patient-resources',
      label: 'Patient Care',
      subtitle: 'Services & Support',
      columns: [
        {
          title: 'Patient Services',
          items: [
            { href: '/patient-resources', title: 'Patient Resources & Downloads', description: 'Pre-visit checklists and admission guides.' },
            { href: '/patient-resources/faq', title: 'Frequently Asked Questions', description: 'Visiting hours, OPD timings and registration.' },
            { href: '/insurance', title: 'Insurance & Cashless Support', description: 'Insurance partners and TPA assistance.' },
          ],
        },
        {
          title: 'International Care',
          items: [
            { href: '/international-patients', title: 'International Patient Desk', description: 'Coordinators, visa assistance and remote opinion.' },
            { href: '/contact', title: 'Contact & Emergency Desk', description: 'Hospital address, directions and helpline.' },
          ],
        },
      ],
    },
  ];
}
