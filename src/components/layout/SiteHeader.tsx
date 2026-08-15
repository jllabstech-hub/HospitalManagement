import Link from 'next/link';
import BrandLogo from './BrandLogo';
import SiteHeaderClient, { NavItemData } from './SiteHeaderClient';
import { APP_CONFIG } from '@/config';

const NAV_ITEMS: NavItemData[] = [
  {
    href: '/about',
    label: 'About Us',
    subtitle: 'Excellence & Leadership',
    featuredBadge: 'NABH Accredited',
    columns: [
      {
        title: 'Hospital Overview',
        items: [
          { href: '/about', title: 'About CarePulse', description: 'Bengaluru’s leading multi-speciality patient-first healthcare destination.' },
          { href: '/about/leadership', title: 'Leadership & Management', description: 'Experienced medical directors and operational leaders.' },
          { href: '/about/facilities', title: 'Advanced Facilities', description: 'Modular OTs, 24x7 Trauma, ICUs & Diagnostic Imaging.' },
        ],
      },
      {
        title: 'Patient Trust',
        items: [
          { href: '/success-stories', title: 'Patient Success Stories', description: 'Real recovery journeys & surgical outcomes.' },
          { href: '/news', title: 'News & Media Updates', description: 'Clinical achievements and hospital expansion news.' },
        ],
      },
    ],
  },
  {
    href: '/specialities',
    label: 'Specialities',
    subtitle: 'Clinical Care Centers',
    featuredBadge: '30+ Specialities',
    columns: [
      {
        title: 'Key Medical Specialities',
        items: [
          { href: '/specialities/interventional-cardiology', title: 'Cardiology', description: 'Cath Lab, Coronary Angioplasty, Arrhythmia & Heart Failure.' },
          { href: '/specialities/joint-replacement', title: 'Orthopedics', description: 'Robotic Knee/Hip Replacement, Arthroscopy & Trauma.' },
          { href: '/specialities/neuro-rehabilitation', title: 'Neurology & Neurosurgery', description: 'Stroke care, Brain Tumor Surgery & Neuro Rehab.' },
          { href: '/specialities/pediatric-care', title: 'Pediatrics & Neonatology', description: 'Level-3 NICU, Pediatric Intensive Care & Immunization.' },
        ],
      },
      {
        title: 'Specialised Departments',
        items: [
          { href: '/departments', title: 'All Clinical Departments', description: 'Browse our full directory of medical and surgical units.' },
          { href: '/services', title: 'Diagnostic & Lab Services', description: '24/7 Pathology, Radiology, MRI, CT & Ultrasound.' },
        ],
      },
    ],
  },
  {
    href: '/centres-of-excellence',
    label: 'Centres of Excellence',
    subtitle: 'Specialised Units',
    featuredBadge: 'Super Speciality',
    columns: [
      {
        title: 'Centres of Excellence',
        items: [
          { href: '/centres-of-excellence/heart-vascular-centre', title: 'Heart & Vascular Centre', description: 'Dedicated Cardiac Care Unit with 24/7 Cath Lab.' },
          { href: '/centres-of-excellence/orthopedic-sports-centre', title: 'Orthopedic & Sports Centre', description: 'Advanced Joint Clinic and Sports Injury Rehab.' },
        ],
      },
    ],
  },
  {
    href: '/doctors',
    label: 'Find a Doctor',
    subtitle: 'Specialist Directory',
    featuredBadge: '150+ Consultants',
    columns: [
      {
        title: 'Doctor Directory',
        items: [
          { href: '/doctors', title: 'Search Specialists', description: 'Find top doctors by name, department, or clinical expertise.' },
          { href: '/book-appointment', title: 'Instant Online Slot Booking', description: 'Pick 30-min consultation slots with real-time confirmation.' },
        ],
      },
    ],
  },
  {
    href: '/health-packages',
    label: 'Health Checkups',
    subtitle: 'Preventive Care',
    featuredBadge: 'Custom Packages',
    columns: [
      {
        title: 'Preventive Wellness',
        items: [
          { href: '/health-packages', title: 'All Health Packages', description: 'Comprehensive executive & cardiac screening packages.' },
          { href: '/health-packages/essential-heart-screening', title: 'Essential Heart Screening', description: 'ECG, Lipid Profile, Cardiac Consultation & TMT.' },
          { href: '/health-packages/executive-wellness-panel', title: 'Executive Wellness Panel', description: 'Full body checkup with multi-specialist review.' },
        ],
      },
    ],
  },
  {
    href: '/patient-resources',
    label: 'Patient Care',
    subtitle: 'Services & Support',
    featuredBadge: '24x7 Assistance',
    columns: [
      {
        title: 'Patient Services',
        items: [
          { href: '/patient-resources', title: 'Patient Resources & Downloads', description: 'Pre-visit checklists, admission & discharge guides.' },
          { href: '/patient-resources/faq', title: 'Frequently Asked Questions', description: 'Visiting hours, OPD timings, insurance and registration.' },
          { href: '/insurance', title: 'Insurance & Cashless Support', description: 'Information on insurance partners and TPA assistance.' },
        ],
      },
      {
        title: 'International Care',
        items: [
          { href: '/international-patients', title: 'International Patient Desk', description: 'Dedicated coordinators, visa assistance & remote opinion.' },
          { href: '/contact', title: 'Contact & Emergency Desk', description: 'Hospital address, route directions and 24/7 helpline.' },
        ],
      },
    ],
  },
];

interface SiteHeaderProps {
  profile?: {
    phone?: string | null;
    emergencyPhone?: string | null;
  } | null;
}

/**
 * Public site header — Server Component shell with streamlined nav.
 */
export default function SiteHeader({ profile }: SiteHeaderProps) {
  const phone = profile?.phone ?? APP_CONFIG.contact.phone;
  const emergencyPhone = profile?.emergencyPhone ?? APP_CONFIG.contact.emergency;
  const phoneHref = profile?.phone ? `tel:${profile.phone.replace(/[^0-9+]/g, '')}` : APP_CONFIG.contact.phoneHref;

  return (
    <SiteHeaderClient
      utilityLeft={`${emergencyPhone} · Outpatient bookings online`}
      utilityPhone={phone}
      utilityPhoneHref={phoneHref}
      navItems={NAV_ITEMS}
      brand={<BrandLogo showTagline={false} size="md" className="min-w-0" />}
      desktopActions={
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-button border border-brand-200/80 bg-brand-50/50 px-4 py-2 text-xs font-bold text-brand-800 transition duration-brand hover:border-brand-300 hover:bg-brand-100/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            Patient Login
          </Link>
          <Link
            href="/book-appointment"
            className="inline-flex items-center justify-center gap-1.5 rounded-button bg-brand-700 px-4 py-2 text-xs font-bold text-white shadow-soft transition duration-brand hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current opacity-90" aria-hidden>
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>Book Appointment</span>
          </Link>
        </div>
      }
    />
  );
}

