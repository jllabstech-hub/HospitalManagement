import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { APP_CONFIG } from '@/config';

const FOOTER_COLS = [
  {
    title: 'Hospital',
    links: [
      { href: '/#about', label: 'About CarePulse' },
      { href: '/#excellence', label: 'Centres of Excellence' },
      { href: '/#contact', label: 'Location & Hours' },
      { href: '/login', label: 'Patient Portal' },
    ],
  },
  {
    title: 'Departments',
    links: [
      { href: '/#specialities', label: 'All Specialities' },
      { href: '/login?callbackUrl=%2Fpatient%2Fdoctors', label: 'Find a Doctor' },
      { href: '/register', label: 'Create Patient Account' },
    ],
  },
  {
    title: 'Patient Services',
    links: [
      { href: '/login?callbackUrl=%2Fpatient%2Fdoctors', label: 'Book Appointment' },
      { href: '/login?callbackUrl=%2Fpatient%2Fappointments', label: 'My Appointments' },
      { href: '/#services', label: 'Outpatient Services' },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getUTCFullYear();

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
                <a href={APP_CONFIG.contact.phoneHref} className="font-semibold hover:text-white">
                  {APP_CONFIG.contact.phone}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${APP_CONFIG.contact.email}`}
                  className="hover:text-white"
                >
                  {APP_CONFIG.contact.email}
                </a>
              </p>
              <p className="text-brand-300">{APP_CONFIG.contact.address}</p>
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
              <li>{APP_CONFIG.contact.hours}</li>
              <li>{APP_CONFIG.contact.emergency}</li>
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
            <span>Privacy</span>
            <span>Terms</span>
            <span>Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
