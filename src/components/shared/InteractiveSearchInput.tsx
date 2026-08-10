'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

interface Props {
  placeholder?: string;
  paramName?: string;
  className?: string;
  defaultValue?: string;
}

export default function InteractiveSearchInput({
  placeholder = 'Search...',
  paramName = 'search',
  className = '',
  defaultValue = '',
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
    const timer = setTimeout(() => {
      const currentVal = searchParams.get(paramName) || '';
      if (text !== currentVal) {
        const params = new URLSearchParams(searchParams.toString());
        if (text.trim()) {
          params.set(paramName, text.trim());
        } else {
          params.delete(paramName);
        }
        params.set('page', '1'); // Reset to page 1 on new search

        startTransition(() => {
          router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        });
      }
    }, 150); // 150ms instant response

    return () => clearTimeout(timer);
  }, [text, searchParams, paramName, pathname, router]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <input
        id="searchInput"
        type="text"
        name="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="input-field pr-8 text-xs font-medium sm:text-sm"
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
