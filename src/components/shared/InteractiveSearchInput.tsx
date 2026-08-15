'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  placeholder?: string;
  paramName?: string;
  className?: string;
  defaultValue?: string;
  /** When false, typing does not update the URL until a parent form submits. */
  live?: boolean;
}

export default function InteractiveSearchInput({
  placeholder = 'Search...',
  paramName = 'search',
  className = '',
  defaultValue = '',
  live = true,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [text, setText] = useState(defaultValue);
  const [isPending, startTransition] = useTransition();

  // Sync state if URL changes externally
  useEffect(() => {
    setText(searchParams.get(paramName) || '');
  }, [searchParams, paramName]);

  // Debounced URL update on keypress
  useEffect(() => {
    if (!live) return;
    const timer = setTimeout(() => {
      const liveParams = new URLSearchParams(window.location.search);
      const currentVal = liveParams.get(paramName) || '';
      if (text === currentVal) return;

      if (text.trim()) {
        liveParams.set(paramName, text.trim());
      } else {
        liveParams.delete(paramName);
      }
      liveParams.set('page', '1');

      startTransition(() => {
        const qs = liveParams.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [text, paramName, pathname, router, live]);

  return (
    <div className={`relative flex items-center ${className}`}>
      {/* Search Magnifying Glass Icon */}
      <svg
        className="pointer-events-none absolute left-3 h-4 w-4 text-ink-muted"
        viewBox="0 0 20 20"
        fill="currentColor"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
          clipRule="evenodd"
        />
      </svg>

      <input
        id="searchInput"
        type="text"
        name="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-9 pr-8 text-xs font-medium sm:text-sm"
      />

      {text ? (
        <button
          type="button"
          onClick={() => {
            setText('');
            const params = new URLSearchParams(searchParams.toString());
            params.delete(paramName);
            params.set('page', '1');
            startTransition(() => {
              router.replace(`${pathname}?${params.toString()}`, { scroll: false });
            });
          }}
          className="absolute right-2.5 rounded-full p-1 text-xs font-bold text-ink-soft transition hover:bg-brand-50 hover:text-ink"
          title="Clear search"
        >
          ✕
        </button>
      ) : isPending ? (
        <span className="absolute right-3 h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      ) : null}
    </div>
  );
}
