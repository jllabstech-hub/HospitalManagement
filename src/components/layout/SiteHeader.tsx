import Link from 'next/link';
import BrandLogo from './BrandLogo';
import SiteHeaderClient from './SiteHeaderClient';
import { APP_CONFIG } from '@/config';

const NAV_LINKS = [
  { href: '/about', label: 'About' },
  { href: '/doctors', label: 'Doctors' },
  { href: '/specialities', label: 'Specialities' },
  { href: '/centres-of-excellence', label: 'Centres' },
  { href: '/services', label: 'Services' },
  { href: '/health-packages', label: 'Health Packages' },
  { href: '/patient-resources', label: 'Patient Resources' },
  { href: '/contact', label: 'Contact' },
];

/**
 * Public site header — Server Component shell with a narrow client chrome boundary.
 */
export default function SiteHeader() {
  return (
    <SiteHeaderClient
      utilityLeft={`${APP_CONFIG.contact.emergency} · Outpatient bookings online`}
      utilityPhone={APP_CONFIG.contact.phone}
      utilityPhoneHref={APP_CONFIG.contact.phoneHref}
      navLinks={NAV_LINKS}
      brand={<BrandLogo showTagline className="min-w-0" />}
      desktopNav={
        <nav className="flex items-center gap-7" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="link-nav">
              {link.label}
            </Link>
          ))}
        </nav>
      }
      desktopActions={
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost">
            Patient Login
          </Link>
          <Link href="/book-appointment" className="btn-primary">
            Book Appointment
          </Link>
        </div>
      }
    />
  );
}
