'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export interface SiteHeaderNavLink {
  href: string;
  label: string;
}

interface SiteHeaderClientProps {
  utilityLeft: string;
  utilityPhone: string;
  utilityPhoneHref: string;
  brand: ReactNode;
  desktopNav: ReactNode;
  desktopActions: ReactNode;
  navLinks: SiteHeaderNavLink[];
}

/**
 * Client chrome for sticky scroll styling and mobile navigation only.
 * Brand, desktop nav, and CTAs are passed as Server Component children.
 */
export default function SiteHeaderClient({
  utilityLeft,
  utilityPhone,
  utilityPhoneHref,
  brand,
  desktopNav,
  desktopActions,
  navLinks,
}: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition duration-brand',
        scrolled || open
          ? 'border-b border-[#dde5e9]/90 bg-white/95 shadow-header backdrop-blur-md'
          : 'border-b border-transparent bg-surface-warm/80 backdrop-blur-sm'
      )}
    >
      <div className="border-b border-[#dde5e9]/70 bg-brand-950 text-brand-50">
        <div className="container-page flex h-9 items-center justify-between gap-4 text-[11px] sm:text-xs">
          <p className="truncate font-medium tracking-wide text-brand-100">{utilityLeft}</p>
          <a
            href={utilityPhoneHref}
            className="shrink-0 font-semibold text-white transition hover:text-brand-100"
          >
            {utilityPhone}
          </a>
        </div>
      </div>

      <div className="container-page flex h-[4.25rem] items-center justify-between gap-4">
        {brand}

        <div className="hidden lg:block">{desktopNav}</div>
        <div className="hidden lg:block">{desktopActions}</div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-button border border-[#dde5e9] bg-white text-ink lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">Menu</span>
          <span className="relative block h-4 w-5">
            <span
              className={cn(
                'absolute left-0 top-0 h-0.5 w-full rounded bg-ink transition duration-brand',
                open && 'top-1.5 rotate-45'
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-1.5 h-0.5 w-full rounded bg-ink transition duration-brand',
                open && 'opacity-0'
              )}
            />
            <span
              className={cn(
                'absolute left-0 top-3 h-0.5 w-full rounded bg-ink transition duration-brand',
                open && 'top-1.5 -rotate-45'
              )}
            />
          </span>
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav"
          className="border-t border-[#dde5e9] bg-white lg:hidden animate-fade-in"
        >
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-button px-3 py-3 text-base font-medium text-ink hover:bg-brand-50"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-3 grid gap-2 border-t border-[#dde5e9] pt-4">
              <Link href="/login" className="btn-secondary w-full" onClick={() => setOpen(false)}>
                Patient Login
              </Link>
              <Link
                href="/book-appointment"
                className="btn-primary w-full"
                onClick={() => setOpen(false)}
              >
                Book Appointment
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
