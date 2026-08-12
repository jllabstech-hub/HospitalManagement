'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';

export default function GlobalSearchInput() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentQuery = searchParams.get('q') ?? '';
  const [query, setQuery] = useState(currentQuery);

  useEffect(() => {
    setQuery(currentQuery);
  }, [currentQuery]);

  const updateSearch = useCallback(
    (newQuery: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newQuery.trim()) {
        params.set('q', newQuery.trim());
      } else {
        params.delete('q');
      }

      startTransition(() => {
        const searchString = params.toString();
        router.push(searchString ? `${pathname}?${searchString}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Debounced search on every key stroke
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== currentQuery) {
        updateSearch(query);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, currentQuery, updateSearch]);

  return (
    <div className="card-surface mb-8 p-4">
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search doctors, departments, specialities, health packages, articles, or news..."
          className="w-full rounded-button border border-[#dde5e9] bg-white py-3.5 pl-11 pr-10 text-sm placeholder:text-ink-soft focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100 font-medium"
          autoFocus
        />
        <svg
          viewBox="0 0 20 20"
          className="absolute left-3.5 h-4 w-4 fill-ink-soft pointer-events-none"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
            clipRule="evenodd"
          />
        </svg>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              startTransition(() => {
                router.push(pathname, { scroll: false });
              });
            }}
            className="absolute right-3.5 text-xs font-bold text-ink-soft hover:text-ink"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {isPending && (
        <div className="mt-2.5 flex items-center gap-2 text-xs font-semibold text-brand-700">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span>Searching hospital database as you type...</span>
        </div>
      )}
    </div>
  );
}
