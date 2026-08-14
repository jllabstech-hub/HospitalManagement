import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { APP_CONFIG } from '@/config';

const FOOTER_COLS = [
  {
    title: 'Hospital',
    links: [
      { href: '/about/overview', label: 'About CarePulse' },
      { href: '/centres-of-excellence', label: 'Centres of Excellence' },
      { href: '/locations', label: 'Locations' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Care',
    links: [
      { href: '/departments', label: 'Departments' },
      { href: '/specialities', label: 'Specialities' },
      { href: '/doctors', label: 'Find a Doctor' },
      { href: '/services', label: 'Services' },
    ],
  },
  {
    title: 'Patient Services',
    links: [
      { href: '/book-appointment', label: 'Book Appointment' },
      { href: '/patient-resources', label: 'Patient Resources' },
      { href: '/health-packages', label: 'Health Packages' },
      { href: '/login', label: 'Patient Portal' },
    ],
  },
];

interface SiteFooterProps {
  profile?: {
    hospitalName?: string | null;
    phone?: string | null;
    email?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    emergencyPhone?: string | null;
    workingHours?: string | null;
  } | null;
}

export default function SiteFooter({ profile }: SiteFooterProps) {
  const year = new Date().getUTCFullYear();
  const phone = profile?.phone ?? APP_CONFIG.contact.phone;
  const email = profile?.email ?? APP_CONFIG.contact.email;
  const emergency = profile?.emergencyPhone ? `Emergency: ${profile.emergencyPhone}` : APP_CONFIG.contact.emergency;
  const hours = profile?.workingHours ?? APP_CONFIG.contact.hours;
  const address = profile
    ? [profile.addressLine1, profile.addressLine2, profile.city, profile.state, profile.postalCode].filter(Boolean).join(', ')
    : APP_CONFIG.contact.address;
  const phoneHref = profile?.phone ? `tel:${profile.phone.replace(/[^0-9+]/g, '')}` : APP_CONFIG.contact.phoneHref;

  return (
    <footer className="border-t border-[#dde5e9] bg-brand-950 text-brand-50">
      <div className="container-page section-pad-sm">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <BrandLogo href="/" variant="light" showTagline />
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-brand-200">
              A modern outpatient hospital experience—find specialists, book 30-minute
              consultations, and manage your care with clarity and confidence.
            </p>
            <div className="mt-6 space-y-2 text-sm text-brand-100">
              <p>
                <a href={phoneHref} className="font-semibold hover:text-white">
                  {phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${email}`}
                  className="hover:text-white"
                >
                  {email}
                </a>
              </p>
              <p className="text-brand-300">{address}</p>
            </div>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-brand-100 transition hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-300">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-brand-100">
              <li>{hours}</li>
              <li>{emergency}</li>
              <li>
                <Link href="/login" className="font-semibold text-white hover:underline">
                  Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-brand-300 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {APP_CONFIG.appName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/patient-resources" className="hover:text-white">
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
