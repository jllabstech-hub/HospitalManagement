import Link from 'next/link';
import BrandLogo from './BrandLogo';
import { APP_CONFIG } from '@/config';
import { footerHasLoginLink, parseFooterConfig } from '@/features/cms/footer-config';

interface SiteFooterProps {
  profile?: {
    hospitalName?: string | null;
    legalName?: string | null;
    phone?: string | null;
    email?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    state?: string | null;
    postalCode?: string | null;
    emergencyPhone?: string | null;
    workingHours?: string | null;
    facebookUrl?: string | null;
    twitterUrl?: string | null;
    instagramUrl?: string | null;
    linkedinUrl?: string | null;
    footerConfig?: unknown;
  } | null;
}

function addressLines(profile: SiteFooterProps['profile']): string[] {
  if (!profile) return [APP_CONFIG.contact.address];
  const street = [profile.addressLine1, profile.addressLine2].filter(Boolean).join(', ');
  const city = [profile.city, profile.state, profile.postalCode].filter(Boolean).join(', ');
  const lines = [street, city].filter(Boolean);
  return lines.length > 0 ? lines : [APP_CONFIG.contact.address];
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 fill-current" aria-hidden>
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .192.078.376.217.511l3.5 3.25a.75.75 0 101.066-1.052L10.75 9.69V5z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function SocialGlyph({ name }: { name: 'facebook' | 'twitter' | 'instagram' | 'linkedin' }) {
  if (name === 'facebook') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-1c0-.6.4-1 1-1z" />
      </svg>
    );
  }
  if (name === 'twitter') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M14.2 10.3 22.4 1h-1.9l-7.1 8.1L7.7 1H1.5l8.6 12.3L1.5 23h1.9l7.5-8.6L16.3 23h6.2l-8.3-12.7zm-2.6 3 1-1.1L5.1 2.5h2.3l6.1 8.6-1 1.1L19 21.5h-2.3l-5.1-8.2z" />
      </svg>
    );
  }
  if (name === 'instagram') {
    return (
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
        <path d="M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm10 2H7a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2zm-5 3.2A3.8 3.8 0 1112 16.8 3.8 3.8 0 0112 8.2zm0 2a1.8 1.8 0 100 3.6 1.8 1.8 0 000-3.6zM17.4 6.3a.9.9 0 11-1.8 0 .9.9 0 011.8 0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden>
      <path d="M6.5 9H4V20h2.5V9zM5.3 4A1.5 1.5 0 105.3 7a1.5 1.5 0 000-3zM20 20h-2.5v-5.6c0-1.6-.6-2.6-2-2.6-1.1 0-1.7.7-2 1.4-.1.2-.1.6-.1.9V20H11V9h2.5v1.5c.5-.8 1.5-1.8 3.5-1.8 2.5 0 4 1.6 4 5.1V20z" />
    </svg>
  );
}

export default function SiteFooter({ profile }: SiteFooterProps) {
  const year = new Date().getUTCFullYear();
  const footer = parseFooterConfig(profile?.footerConfig, profile?.hospitalName);
  const phone = profile?.phone ?? APP_CONFIG.contact.phone;
  const email = profile?.email ?? APP_CONFIG.contact.email;
  const emergencyPhone = profile?.emergencyPhone;
  const hours = profile?.workingHours ?? APP_CONFIG.contact.hours;
  const phoneHref = profile?.phone
    ? `tel:${profile.phone.replace(/[^0-9+]/g, '')}`
    : APP_CONFIG.contact.phoneHref;
  const emergencyHref = emergencyPhone
    ? `tel:${emergencyPhone.replace(/[^0-9+]/g, '')}`
    : undefined;
  const copyrightName = profile?.legalName || profile?.hospitalName || APP_CONFIG.appName;
  const showLogin = footer.showLogin && !footerHasLoginLink(footer.columns);
  const lines = addressLines(profile);

  const social = [
    profile?.facebookUrl && { href: profile.facebookUrl, label: 'Facebook', name: 'facebook' as const },
    profile?.twitterUrl && { href: profile.twitterUrl, label: 'Twitter', name: 'twitter' as const },
    profile?.instagramUrl && { href: profile.instagramUrl, label: 'Instagram', name: 'instagram' as const },
    profile?.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', name: 'linkedin' as const },
  ].filter(Boolean) as Array<{
    href: string;
    label: string;
    name: 'facebook' | 'twitter' | 'instagram' | 'linkedin';
  }>;

  return (
    <footer className="border-t border-[#dde5e9] bg-brand-950 text-brand-50">
      <div className="container-page py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-3">
            <BrandLogo href="/" variant="light" stacked />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-brand-200">
              {lines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </p>
            {social.length > 0 && (
              <div className="mt-5 flex items-center gap-2">
                {social.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={item.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-brand-100 transition hover:border-white/40 hover:bg-white/10 hover:text-white"
                  >
                    <SocialGlyph name={item.name} />
                  </a>
                ))}
              </div>
            )}
            {showLogin && (
              <Link
                href="/login"
                className="mt-5 inline-flex text-sm font-medium text-white hover:underline"
              >
                {footer.loginLabel}
              </Link>
            )}
          </div>

          <div className="lg:col-span-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
              Contact
            </h3>
            <ul className="mt-5 space-y-4 text-sm text-brand-100">
              <li className="flex gap-3">
                <span className="mt-0.5 text-brand-300">
                  <PhoneIcon />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-400">Phone</p>
                  <a href={phoneHref} className="mt-0.5 block font-medium text-white hover:text-brand-100">
                    {phone}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-brand-300">
                  <MailIcon />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-400">Email</p>
                  <a href={`mailto:${email}`} className="mt-0.5 block hover:text-white">
                    {email}
                  </a>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 text-brand-300">
                  <ClockIcon />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-brand-400">OPD hours</p>
                  <p className="mt-0.5 text-brand-200">{hours}</p>
                </div>
              </li>
            </ul>
            <a
              href={emergencyHref ?? phoneHref}
              className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/15 px-3.5 py-1.5 text-xs font-medium text-brand-50 transition hover:border-white/35 hover:bg-white/5"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
              {emergencyPhone ? `Emergency · ${emergencyPhone}` : APP_CONFIG.contact.emergency}
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-6">
            {footer.columns.map((col, index) => (
              <div key={`${col.title}-${index}`}>
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-300">
                  {col.title}
                </h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={`${link.href}-${link.label}`}>
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
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-brand-400 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {copyrightName}. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {footer.legalLinks.map((link) => (
              <Link key={`${link.href}-${link.label}`} href={link.href} className="hover:text-white">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
