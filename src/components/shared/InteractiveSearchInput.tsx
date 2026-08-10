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
      <span className="absolute left-3 text-slate-400 text-sm pointer-events-none">🔍</span>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium text-slate-800 placeholder-slate-400 transition"
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
          className="absolute right-2.5 text-xs text-slate-400 hover:text-slate-700 font-bold p-1 rounded-full hover:bg-slate-100 transition"
          title="Clear search"
        >
          ✕
        </button>
      ) : isPending ? (
        <span className="absolute right-3 text-xs text-purple-600 animate-spin">⏳</span>
      ) : null}
    </div>
  );
}
