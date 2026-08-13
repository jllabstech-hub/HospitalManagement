'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { GlobalSearchResult } from '@/features/cms/queries/search';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// In-memory lightweight client LRU cache (limit 30 entries)
const clientSearchCache = new Map<string, GlobalSearchResult>();

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeRequestRef = useRef<AbortController | null>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults(null);
      setSelectedIndex(-1);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Flattened results for keyboard navigation (up/down arrow & enter)
  const flattenedItems = useCallback(() => {
    if (!results) return [];
    const items: { category: string; title: string; subtitle?: string; href: string }[] = [];

    results.doctors.forEach((d) => {
      items.push({
        category: 'Doctor',
        title: d.publicDisplayName ?? d.fullName,
        subtitle: d.department ? `${d.qualification} · ${d.department.name}` : d.qualification,
        href: `/doctors/${d.slug ?? d.id}`,
      });
    });

    results.departments.forEach((dept) => {
      items.push({
        category: 'Department',
        title: dept.name,
        subtitle: dept.shortDescription ?? undefined,
        href: `/departments/${dept.slug}`,
      });
    });

    results.specialities.forEach((s) => {
      items.push({
        category: 'Speciality',
        title: s.name,
        subtitle: s.shortDescription ?? undefined,
        href: `/specialities/${s.slug}`,
      });
    });

    results.services.forEach((svc) => {
      items.push({
        category: 'Service',
        title: svc.name,
        subtitle: svc.shortDescription ?? undefined,
        href: `/services/${svc.slug}`,
      });
    });

    results.articles.forEach((a) => {
      items.push({
        category: 'Health Article',
        title: a.title,
        subtitle: a.excerpt ?? undefined,
        href: `/health-library/${a.slug}`,
      });
    });

    results.news.forEach((n) => {
      items.push({
        category: 'News',
        title: n.title,
        subtitle: n.excerpt ?? undefined,
        href: `/news/${n.slug}`,
      });
    });

    return items;
  }, [results]);

  // Handle typing search with 180ms debounce + AbortController + Client Cache
  useEffect(() => {
    const trimmed = query.trim().toLowerCase();
    setSelectedIndex(-1);

    if (!trimmed) {
      setResults(null);
      setIsLoading(false);
      setError(false);
      return;
    }

    // Check client cache first for instant response
    if (clientSearchCache.has(trimmed)) {
      setResults(clientSearchCache.get(trimmed)!);
      setIsLoading(false);
      setError(false);
      return;
    }

    const timer = setTimeout(() => {
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
      }

      const controller = new AbortController();
      activeRequestRef.current = controller;

      setIsLoading(true);
      setError(false);

      fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then((res) => {
          if (!res.ok) throw new Error('Search failed');
          return res.json();
        })
        .then((data: GlobalSearchResult) => {
          // Store in client cache (LRU trim if > 30)
          if (clientSearchCache.size >= 30) {
            const firstKey = clientSearchCache.keys().next().value;
            if (firstKey) clientSearchCache.delete(firstKey);
          }
          clientSearchCache.set(trimmed, data);

          setResults(data);
          setIsLoading(false);
        })
        .catch((err) => {
          if (err.name !== 'AbortError') {
            setError(true);
            setIsLoading(false);
          }
        });
    }, 180);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // Keyboard Navigation (Escape, ArrowUp, ArrowDown, Enter)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = flattenedItems();

    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (items.length > 0) {
        setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (items.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
      }
    } else if (e.key === 'Enter') {
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        e.preventDefault();
        const selected = items[selectedIndex];
        onClose();
        router.push(selected.href);
      } else if (query.trim()) {
        e.preventDefault();
        onClose();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      }
    }
  };

  if (!isOpen) return null;

  const items = flattenedItems();
  const totalCount = items.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-brand-950/60 p-4 sm:p-6 md:p-10 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="relative w-full max-w-3xl overflow-hidden rounded-card border border-[#dde5e9] bg-white shadow-elevated transition-all max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Interactive Search Header */}
        <div className="relative flex items-center border-b border-[#dde5e9] px-4 py-3.5 sm:px-6">
          <svg viewBox="0 0 20 20" className="h-5 w-5 fill-ink-soft shrink-0" aria-hidden>
            <path
              fillRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
              clipRule="evenodd"
            />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors, departments, specialities, health articles..."
            className="w-full bg-transparent px-3 text-sm sm:text-base font-medium text-ink placeholder:text-ink-soft focus:outline-none"
            aria-label="Global interactive hospital search"
          />

          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent shrink-0" />
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="rounded-full p-1 text-xs font-bold text-ink-soft hover:bg-brand-50 hover:text-ink shrink-0"
              title="Clear query"
            >
              ✕
            </button>
          ) : (
            <kbd className="hidden sm:inline-block rounded border border-[#dde5e9] bg-surface-warm px-2 py-0.5 text-[10px] font-semibold text-ink-soft">
              ESC to close
            </kbd>
          )}

          <button
            type="button"
            onClick={onClose}
            className="ml-3 rounded-full p-1.5 text-xs font-bold text-ink-soft hover:bg-surface-soft hover:text-ink sm:hidden"
          >
            ✕
          </button>
        </div>

        {/* Results Area */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 flex-1">
          {/* Default state when empty */}
          {!query.trim() && (
            <div className="py-6 text-center text-xs text-ink-muted">
              <p className="font-semibold text-ink">Interactive Hospital Search</p>
              <p className="mt-1">
                Type a doctor name (e.g. &quot;Smith&quot;), department (&quot;Cardiology&quot;), or service to view live results as you type.
              </p>
            </div>
          )}

          {/* Loading Indicator bar */}
          {isLoading && !results && (
            <div className="py-8 text-center text-xs font-medium text-brand-700 space-y-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              <p>Searching hospital records as you type...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="py-6 text-center text-xs font-semibold text-rose-700">
              Search temporarily unavailable. Please try again.
            </div>
          )}

          {/* No Results State */}
          {query.trim() && !isLoading && results && totalCount === 0 && (
            <div className="py-8 text-center text-xs text-ink-muted">
              <p className="font-bold text-ink text-sm">No matching results for &quot;{query}&quot;</p>
              <p className="mt-1">Try checking for typos or searching by specialty/department.</p>
              <Link
                href="/doctors"
                onClick={onClose}
                className="mt-4 inline-block font-semibold text-brand-700 hover:underline"
              >
                Browse All Doctors Directory →
              </Link>
            </div>
          )}

          {/* Results Rendered Grouped by Category */}
          {results && totalCount > 0 && (
            <div className="space-y-6">
              {/* Doctors Section */}
              {results.doctors.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#dde5e9]/70 pb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800">
                      Doctors ({results.doctors.length})
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {results.doctors.map((d) => {
                      const itemIndex = items.findIndex((i) => i.href === `/doctors/${d.slug ?? d.id}`);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <Link
                          key={d.id}
                          href={`/doctors/${d.slug ?? d.id}`}
                          onClick={onClose}
                          className={`group flex items-center justify-between rounded-button p-2.5 transition ${
                            isSelected ? 'bg-brand-100/80 text-brand-900' : 'hover:bg-brand-50/80'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-800 font-bold text-xs">
                              👨‍⚕️
                            </div>
                            <div>
                              <p className="text-xs font-bold text-ink group-hover:text-brand-900">
                                {d.publicDisplayName ?? d.fullName}
                              </p>
                              <p className="text-[11px] text-ink-muted">
                                {d.qualification} {d.department ? `· ${d.department.name}` : ''}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-brand-700 opacity-0 group-hover:opacity-100 transition">
                            Book / Profile →
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Departments Section */}
              {results.departments.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#dde5e9]/70 pb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800">
                      Departments ({results.departments.length})
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {results.departments.map((dept) => {
                      const itemIndex = items.findIndex((i) => i.href === `/departments/${dept.slug}`);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <Link
                          key={dept.id}
                          href={`/departments/${dept.slug}`}
                          onClick={onClose}
                          className={`flex flex-col rounded-button p-2.5 transition ${
                            isSelected ? 'bg-brand-100/80 text-brand-900' : 'hover:bg-brand-50/80'
                          }`}
                        >
                          <span className="text-xs font-bold text-brand-700">{dept.name}</span>
                          {dept.shortDescription && (
                            <span className="text-[11px] text-ink-muted truncate">{dept.shortDescription}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Specialities Section */}
              {results.specialities.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#dde5e9]/70 pb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800">
                      Specialities ({results.specialities.length})
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {results.specialities.map((s) => {
                      const itemIndex = items.findIndex((i) => i.href === `/specialities/${s.slug}`);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <Link
                          key={s.id}
                          href={`/specialities/${s.slug}`}
                          onClick={onClose}
                          className={`flex flex-col rounded-button p-2.5 transition ${
                            isSelected ? 'bg-brand-100/80 text-brand-900' : 'hover:bg-brand-50/80'
                          }`}
                        >
                          <span className="text-xs font-bold text-brand-700">{s.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Hospital Services Section */}
              {results.services.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#dde5e9]/70 pb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800">
                      Hospital Services ({results.services.length})
                    </span>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {results.services.map((svc) => {
                      const itemIndex = items.findIndex((i) => i.href === `/services/${svc.slug}`);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <Link
                          key={svc.id}
                          href={`/services/${svc.slug}`}
                          onClick={onClose}
                          className={`flex flex-col rounded-button p-2.5 transition ${
                            isSelected ? 'bg-brand-100/80 text-brand-900' : 'hover:bg-brand-50/80'
                          }`}
                        >
                          <span className="text-xs font-bold text-brand-700">{svc.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Articles & Health Content */}
              {results.articles.length > 0 && (
                <div>
                  <div className="flex items-center justify-between border-b border-[#dde5e9]/70 pb-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-800">
                      Health Library ({results.articles.length})
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {results.articles.map((art) => {
                      const itemIndex = items.findIndex((i) => i.href === `/health-library/${art.slug}`);
                      const isSelected = itemIndex === selectedIndex;
                      return (
                        <Link
                          key={art.id}
                          href={`/health-library/${art.slug}`}
                          onClick={onClose}
                          className={`block rounded-button p-2.5 transition ${
                            isSelected ? 'bg-brand-100/80 text-brand-900' : 'hover:bg-brand-50/80'
                          }`}
                        >
                          <span className="text-xs font-bold text-ink">{art.title}</span>
                          {art.excerpt && (
                            <span className="block text-[11px] text-ink-muted truncate">{art.excerpt}</span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Bar */}
        {query.trim() && (
          <div className="border-t border-[#dde5e9] bg-surface-soft p-3 text-center text-xs font-semibold">
            <Link
              href={`/search?q=${encodeURIComponent(query.trim())}`}
              onClick={onClose}
              className="text-brand-700 hover:underline"
            >
              View Full Search Results Page for &quot;{query.trim()}&quot; →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
