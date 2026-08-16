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
  brand: ReactNode;
  desktopActions: ReactNode;
  navItems: NavItemData[];
}

function splitIntoColumns<T>(items: T[], maxColumns: number): T[][] {
  if (items.length === 0) return [];
  const count = Math.min(Math.max(1, maxColumns), items.length);
  const size = Math.ceil(items.length / count);
  return Array.from({ length: count }, (_, index) => items.slice(index * size, (index + 1) * size));
}

function MegaMenuLink({
  href,
  title,
  onClick,
}: {
  href: string;
  title: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block border-b border-[#e6eae8] px-1 py-2.5 text-[13px] font-medium leading-snug text-ink transition last:border-b-0 hover:bg-brand-50 hover:text-brand-800"
    >
      {title}
    </Link>
  );
}

function MegaMenuColumn({
  title,
  items,
  onNavigate,
}: {
  title?: string;
  items: DropdownSubItem[];
  onNavigate: () => void;
}) {
  return (
    <div className="min-w-0">
      {title ? (
        <h4 className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-800/70">
          {title}
        </h4>
      ) : null}
      <div className="site-menu-scroll">
        {items.map((sub, sIdx) => (
          <MegaMenuLink key={`${sub.href}-${sIdx}`} href={sub.href} title={sub.title} onClick={onNavigate} />
        ))}
      </div>
    </div>
  );
}

function SearchTrigger({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full text-brand-800 transition hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      aria-label="Search"
    >
      <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden>
        <path
          fillRule="evenodd"
          d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
          clipRule="evenodd"
        />
      </svg>
      <span className="sr-only">Search</span>
    </button>
  );
}

export default function SiteHeaderClient({
  brand,
  desktopActions,
  navItems,
}: SiteHeaderClientProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [openMobile, setOpenMobile] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeHoverIndex, setActiveHoverIndex] = useState<number | null>(null);
  const [pinnedMenuIndex, setPinnedMenuIndex] = useState<number | null>(null);
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
    setPinnedMenuIndex(null);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = openMobile ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [openMobile]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveHoverIndex(null);
        setPinnedMenuIndex(null);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, []);

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
    <header className="sticky top-0 z-50 w-full">
      <div
        className={cn(
          'relative w-full border-b border-[#e4e7e4] transition-shadow duration-300',
          scrolled || openMobile || activeHoverIndex !== null
            ? 'bg-[#F7F8F6] shadow-header'
            : 'bg-[#F7F8F6]'
        )}
      >
        <div className="mx-auto grid h-[4.75rem] w-full min-w-0 max-w-[90rem] grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] xl:gap-6">
          <div className="min-w-0 shrink-0 justify-self-start">{brand}</div>

          <nav
            className="hidden items-center justify-center gap-4 xl:flex 2xl:gap-7"
            aria-label="Primary Navigation"
            onMouseLeave={handleMouseLeave}
          >
            {navItems.map((item, idx) => {
              const isActive = activeHoverIndex === idx || pinnedMenuIndex === idx;
              const hasDropdown = Boolean(item.columns && item.columns.length > 0);
              const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => handleMouseEnter(idx)}
                >
                  <div className="inline-flex items-center">
                    <Link
                      href={item.href}
                      className={cn(
                        'group inline-flex items-center whitespace-nowrap py-2 text-[13px] font-medium tracking-tight transition-colors duration-200 2xl:text-[13.5px]',
                        isActive || isCurrent
                          ? 'text-brand-800'
                          : 'text-[#4a5d68] hover:text-brand-800'
                      )}
                    >
                    <span>{item.label}</span>
                    </Link>
                    {hasDropdown ? (
                      <button
                        type="button"
                        className={cn(
                          'ml-0.5 inline-flex rounded p-1 text-[#4a5d68] transition hover:bg-brand-50 hover:text-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                          isActive && 'text-brand-800'
                        )}
                        aria-label={`Open ${item.label} menu`}
                        aria-expanded={isActive}
                        aria-haspopup="menu"
                        onClick={() => setPinnedMenuIndex(pinnedMenuIndex === idx ? null : idx)}
                      >
                      <svg
                        viewBox="0 0 20 20"
                        className={cn(
                          'h-3 w-3 fill-current opacity-55 transition-transform duration-200',
                          isActive && 'rotate-180'
                        )}
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                      </button>
                    ) : null}
                  </div>

                  {hasDropdown && isActive && (() => {
                    const columns = item.columns ?? [];
                    const isMultiGroup = columns.length >= 2;
                    const singleItems = columns[0]?.items ?? [];
                    const visualCount = isMultiGroup
                      ? columns.length
                      : singleItems.length > 12
                        ? 3
                        : singleItems.length > 4
                          ? 2
                          : 1;
                    const visualColumns: Array<{ title?: string; items: DropdownSubItem[] }> = isMultiGroup
                      ? columns.map((col) => ({ title: col.title, items: col.items }))
                      : splitIntoColumns(singleItems, visualCount).map((items) => ({ items }));

                    return (
                    <div
                      className={cn(
                        'absolute top-full z-50 mt-3 rounded-2xl border border-[#e4e7e4] bg-white p-4 shadow-elevated animate-fade-in',
                        idx === 0
                          ? 'left-0'
                          : idx === navItems.length - 1
                            ? 'right-0'
                            : 'left-1/2 -translate-x-1/2',
                        visualCount >= 3
                          ? 'w-[min(52rem,calc(100vw-2rem))]'
                          : visualCount === 2
                            ? 'w-[32rem]'
                            : 'w-[18rem]'
                      )}
                      onMouseEnter={() => handleMouseEnter(idx)}
                      onMouseLeave={handleMouseLeave}
                    >
                      {!isMultiGroup && columns[0]?.title ? (
                        <h4 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-brand-800/70">
                          {columns[0].title}
                        </h4>
                      ) : null}
                      <div
                        className={cn(
                          'grid gap-6',
                          visualCount >= 3 ? 'grid-cols-3' : visualCount === 2 ? 'grid-cols-2' : 'grid-cols-1'
                        )}
                      >
                        {visualColumns.map((col, cIdx) => (
                          <MegaMenuColumn
                            key={cIdx}
                            title={isMultiGroup ? col.title : undefined}
                            items={col.items}
                            onNavigate={() => {
                              setActiveHoverIndex(null);
                              setPinnedMenuIndex(null);
                            }}
                          />
                        ))}
                      </div>

                      <div className="mt-3 border-t border-[#e4e7e4] pt-3">
                        <Link
                          href={item.href}
                          className="flex items-center justify-between rounded-lg px-1 py-2 text-[12px] font-semibold text-brand-700 hover:bg-brand-50 hover:text-brand-900"
                          onClick={() => {
                            setActiveHoverIndex(null);
                            setPinnedMenuIndex(null);
                          }}
                        >
                          <span>View all {item.label.toLowerCase()}</span>
                          <span aria-hidden>→</span>
                        </Link>
                      </div>
                    </div>
                    );
                  })()}
                </div>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3">
            <SearchTrigger onOpen={() => setIsSearchOpen(true)} />
            <div className="hidden xl:flex">{desktopActions}</div>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#dbe0dc] bg-white text-ink xl:hidden hover:bg-surface-soft"
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
      </div>

      {openMobile && (
        <div
          id="mobile-nav"
          className="border-b border-[#e4e7e4] bg-[#F7F8F6] shadow-elevated xl:hidden animate-fade-in"
        >
          <nav className="container-page flex flex-col gap-1 py-4" aria-label="Mobile Navigation">
            {navItems.map((item, idx) => {
              const isExpanded = mobileExpandedIndex === idx;
              const hasColumns = Boolean(item.columns && item.columns.length > 0);

              return (
                <div key={item.href} className="border-b border-[#e4e7e4]/70 py-1">
                  {hasColumns ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 px-2 py-3 text-left text-sm font-medium text-ink hover:text-brand-700"
                      aria-expanded={isExpanded}
                      onClick={() => setMobileExpandedIndex(isExpanded ? null : idx)}
                    >
                      <span>{item.label}</span>
                      <svg
                        viewBox="0 0 20 20"
                        className={cn(
                          'h-4 w-4 shrink-0 fill-current text-ink-muted transition-transform',
                          isExpanded && 'rotate-180'
                        )}
                        aria-hidden
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-2 py-3 text-sm font-medium text-ink hover:text-brand-700"
                      onClick={() => setOpenMobile(false)}
                    >
                      {item.label}
                    </Link>
                  )}

                  {hasColumns && isExpanded && (
                    <div className="site-menu-scroll ml-3 max-h-64 border-l-2 border-brand-200 py-1 pl-3 text-sm">
                      <Link
                        href={item.href}
                        className="block border-b border-[#e6eae8] py-2.5 font-medium text-ink-muted hover:text-brand-800"
                        onClick={() => setOpenMobile(false)}
                      >
                        {item.label} overview
                      </Link>
                      {item.columns?.flatMap((col) => col.items).map((sub, sIdx) => (
                        <Link
                          key={sIdx}
                          href={sub.href}
                          className="block border-b border-[#e6eae8] py-2.5 font-medium text-ink-muted last:border-b-0 hover:text-brand-800"
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

            <div className="mt-4 grid gap-2.5 border-t border-[#e4e7e4] pt-4 xl:hidden">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full border border-brand-800/80 bg-white px-5 py-2.5 text-sm font-medium text-brand-900"
                onClick={() => setOpenMobile(false)}
              >
                Patient Login
              </Link>
              <Link
                href="/book-appointment"
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white"
                onClick={() => setOpenMobile(false)}
              >
                Book Appointment
              </Link>
            </div>
          </nav>
        </div>
      )}

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}
