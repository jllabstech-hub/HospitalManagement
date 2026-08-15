'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import SearchOverlay from '@/components/shared/SearchOverlay';

export interface DropdownSubItem {
  href: string;
  title: string;
  description?: string;
}

export interface DropdownColumn {
  title: string;
  items: DropdownSubItem[];
}

export interface NavItemData {
  href: string;
  label: string;
  subtitle?: string;
  featuredBadge?: string;
  columns?: DropdownColumn[];
}

interface SiteHeaderClientProps {
  utilityLeft: string;
  utilityPhone: string;
  utilityPhoneHref: string;
  brand: ReactNode;
  desktopActions: ReactNode;
  navItems: NavItemData[];
}

export default function SiteHeaderClient({
  utilityLeft,
  utilityPhone,
  utilityPhoneHref,
  brand,
  desktopActions,
  navItems,
}: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [mobileExpandedIndex, setMobileExpandedIndex] = useState<number | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpenMobile(false);
    setActiveHoverIndex(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = openMobile ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openMobile]);

  const handleMouseEnter = (index: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveHoverIndex(index);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveHoverIndex(null);
    }, 150);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300">
      {/* Top Emergency Utility Bar */}
      <div className="overflow-x-hidden border-b border-brand-900/60 bg-brand-950 text-brand-50">
        <div className="container-page flex h-8 w-full max-w-full min-w-0 items-center justify-between gap-2 overflow-hidden text-[11px] font-medium tracking-wide sm:text-xs">
          <p className="hidden min-w-0 truncate text-brand-100/90 sm:flex sm:items-center sm:gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
            <span>{utilityLeft}</span>
          </p>
          <div className="flex items-center gap-4 text-[11px] sm:text-xs">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-1.5 font-medium text-brand-100/90 transition hover:text-white"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-current opacity-80" aria-hidden>
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
              <span>Search</span>
            </button>
            <span className="h-3 w-px bg-brand-800" aria-hidden />
            <Link
              href="/contact"
              className="font-medium text-brand-100/90 transition hover:text-white"
            >
              Contact Us
            </Link>
            <span className="h-3 w-px bg-brand-800" aria-hidden />
            <a
              href={utilityPhoneHref}
              className="inline-flex items-center gap-1.5 font-bold text-white transition hover:text-brand-100"
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-accent-400" aria-hidden>
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>{utilityPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Streamlined Navigation Bar */}
      <div
        className={cn(
          'relative w-full border-b transition-all duration-300 backdrop-blur-md',
          scrolled || openMobile || activeHoverIndex !== null
            ? 'border-[#dde5e9]/90 bg-white/95 shadow-header'
            : 'border-[#dde5e9]/60 bg-white/90 shadow-soft'
        )}
      >
        <div className="container-page flex h-[4rem] min-w-0 items-center justify-between gap-4">
          {/* Hospital Brand Logo */}
          <div className="min-w-0 shrink-0">{brand}</div>

          {/* Desktop Navigation Menu */}
          <nav
            className="hidden items-center gap-1 xl:flex"
            aria-label="Primary Navigation"
            onMouseLeave={handleMouseLeave}
          >
            {navItems.map((item, idx) => {
              const isActive = activeHoverIndex === idx;
              const hasDropdown = Boolean(item.columns && item.columns.length > 0);

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(idx)}
                >
                  <Link
                    href={item.href}
                    className={cn(
                      'group relative inline-flex items-center gap-1 rounded-button px-3.5 py-2 text-xs font-bold tracking-tight transition-all duration-200',
                      isActive || pathname.startsWith(item.href)
                        ? 'bg-brand-50 text-brand-800'
                        : 'text-ink-muted hover:bg-surface-soft hover:text-brand-800'
                    )}
                  >
                    <span>{item.label}</span>
                    {hasDropdown && (
                      <svg
                        viewBox="0 0 20 20"
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200 fill-current opacity-70',
                          isActive ? 'rotate-180 text-brand-700' : 'group-hover:text-brand-700'
                        )}
                        aria-hidden
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>

                  {/* Mega-Menu Dropdown Panel with Smooth Animation */}
                  {hasDropdown && isActive && (
                    <div
                      className="absolute left-1/2 top-full z-50 mt-1 w-[38rem] -translate-x-1/2 transform rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated transition-all duration-200 animate-fade-in"
                      onMouseEnter={() => handleMouseEnter(idx)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {/* Header Badge */}
                      {item.featuredBadge && (
                        <div className="mb-4 flex items-center justify-between border-b border-[#dde5e9]/70 pb-3">
                          <span className="rounded-pill bg-brand-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-brand-800">
                            {item.featuredBadge}
                          </span>
                          <span className="text-[11px] font-medium text-ink-soft">
                            {item.subtitle}
                          </span>
                        </div>
                      )}

                      {/* Multi-column grid */}
                      <div className="grid grid-cols-2 gap-6">
                        {item.columns?.map((col, cIdx) => (
                          <div key={cIdx} className="space-y-3">
                            <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-brand-900/80">
                              {col.title}
                            </h4>
                            <div className="space-y-1">
                              {col.items.map((sub, sIdx) => (
                                <Link
                                  key={sIdx}
                                  href={sub.href}
                                  className="group/item flex flex-col rounded-button p-2.5 transition duration-brand hover:bg-brand-50/70"
                                  onClick={() => setActiveHoverIndex(null)}
                                >
                                  <span className="text-xs font-bold text-ink transition group-hover/item:text-brand-800">
                                    {sub.title}
                                  </span>
                                  {sub.description && (
                                    <span className="mt-0.5 text-[11px] font-normal leading-normal text-ink-muted line-clamp-2">
                                      {sub.description}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Bottom Quick Link Footer */}
                      <div className="mt-5 flex items-center justify-between border-t border-[#dde5e9]/70 pt-3 text-[11px]">
                        <span className="font-medium text-ink-soft">
                          Need personal guidance?
                        </span>
                        <Link
                          href={item.href}
                          className="inline-flex items-center gap-1 font-bold text-brand-700 hover:text-brand-900 hover:underline"
                          onClick={() => setActiveHoverIndex(null)}
                        >
                          <span>Explore {item.label} Overview</span>
                          <span>→</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons */}
          <div className="hidden shrink-0 items-center gap-3 lg:flex">
            {desktopActions}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-button border border-[#dde5e9] bg-white text-ink xl:hidden hover:bg-surface-soft"
            aria-expanded={openMobile}
            aria-controls="mobile-nav"
            aria-label={openMobile ? 'Close menu' : 'Open menu'}
            onClick={() => setOpenMobile((v) => !v)}
          >
            <span className="sr-only">Toggle Menu</span>
            <span className="relative block h-4 w-5">
              <span
                className={cn(
                  'absolute left-0 top-0 h-0.5 w-full rounded bg-ink transition duration-brand',
                  openMobile && 'top-1.5 rotate-45'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-1.5 h-0.5 w-full rounded bg-ink transition duration-brand',
                  openMobile && 'opacity-0'
                )}
              />
              <span
                className={cn(
                  'absolute left-0 top-3 h-0.5 w-full rounded bg-ink transition duration-brand',
                  openMobile && 'top-1.5 -rotate-45'
                )}
              />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {openMobile && (
        <div
          id="mobile-nav"
          className="border-t border-[#dde5e9] bg-white shadow-elevated xl:hidden animate-fade-in"
        >
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile Navigation">
            {navItems.map((item, idx) => {
              const isExpanded = mobileExpandedIndex === idx;
              const hasColumns = Boolean(item.columns && item.columns.length > 0);

              return (
                <div key={item.href} className="border-b border-[#dde5e9]/50 py-1">
                  <div className="flex items-center justify-between">
                    <Link
                      href={item.href}
                      className="px-2 py-2 text-sm font-bold text-ink hover:text-brand-700"
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.label}
                    </Link>

                    {hasColumns && (
                      <button
                        type="button"
                        onClick={() => setMobileExpandedIndex(isExpanded ? null : idx)}
                        className="p-2 text-ink-muted hover:text-brand-700"
                      >
                        <svg
                          viewBox="0 0 20 20"
                          className={cn('h-4 w-4 transform fill-current transition-transform', isExpanded && 'rotate-180')}
                        >
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                  </div>

                  {hasColumns && isExpanded && (
                    <div className="ml-3 space-y-2 border-l-2 border-brand-200 pl-3 py-2 text-xs">
                      {item.columns?.flatMap((col) => col.items).map((sub, sIdx) => (
                        <Link
                          key={sIdx}
                          href={sub.href}
                          className="block py-1 font-medium text-ink-muted hover:text-brand-800"
                          onClick={() => setOpenMobile(false)}
                        >
                          {sub.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="mt-4 grid gap-2.5 border-t border-[#dde5e9] pt-4">
              <Link
                href="/login"
                className="btn-secondary w-full text-center"
                onClick={() => setOpenMobile(false)}
              >
                Patient Login
              </Link>
              <Link
                href="/book-appointment"
                className="btn-primary w-full text-center"
                onClick={() => setOpenMobile(false)}
              >
                Book Appointment
              </Link>
            </div>
          </nav>
        </div>
      )}

      {/* Global Interactive Search Overlay */}
      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

