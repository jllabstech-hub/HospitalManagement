'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition, useState, useEffect } from 'react';

interface DepartmentOption {
  id: string;
  name: string;
}

interface SpecialityOption {
  id: string;
  name: string;
}

interface Props {
  departments: DepartmentOption[];
  specialities: SpecialityOption[];
}

export default function DoctorDirectoryFilters({ departments, specialities }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSearch = searchParams.get('search') ?? '';
  const currentDepartment = searchParams.get('department') ?? '';
  const currentSpeciality = searchParams.get('speciality') ?? '';

  const [searchTerm, setSearchTerm] = useState(currentSearch);

  // Sync state if searchParams change externally
  useEffect(() => {
    setSearchTerm(currentSearch);
  }, [currentSearch]);

  const updateFilters = useCallback(
    (newSearch: string, newDept: string, newSpec: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (newSearch.trim()) {
        params.set('search', newSearch.trim());
      } else {
        params.delete('search');
      }

      if (newDept) {
        params.set('department', newDept);
      } else {
        params.delete('department');
      }

      if (newSpec) {
        params.set('speciality', newSpec);
      } else {
        params.delete('speciality');
      }

      // Reset to page 1 on filter change
      params.delete('page');

      startTransition(() => {
        const query = params.toString();
        router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  // Debounced search term update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== currentSearch) {
        updateFilters(searchTerm, currentDepartment, currentSpeciality);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, currentSearch, currentDepartment, currentSpeciality, updateFilters]);

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters(searchTerm, e.target.value, currentSpeciality);
  };

  const handleSpecialityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateFilters(searchTerm, currentDepartment, e.target.value);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  };

  const hasActiveFilters = Boolean(currentSearch || currentDepartment || currentSpeciality);

  return (
    <div className="card-surface mb-8 space-y-4 p-4 sm:p-5">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Search Input with Auto-Debounce */}
        <label className="block text-sm sm:col-span-2 lg:col-span-1">
          <span className="font-semibold text-ink">Search Doctor</span>
          <div className="relative mt-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, qualification, or designation..."
              className="w-full rounded-button border border-[#dde5e9] bg-white py-2.5 pl-9 pr-8 text-sm placeholder:text-ink-soft focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
            />
            <svg
              viewBox="0 0 20 20"
              className="absolute left-3 top-3 h-4 w-4 fill-ink-soft pointer-events-none"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-xs font-bold text-ink-soft hover:text-ink"
              >
                ✕
              </button>
            )}
          </div>
        </label>

        {/* Instant Department Select */}
        <label className="block text-sm">
          <span className="font-semibold text-ink">Department</span>
          <select
            value={currentDepartment}
            onChange={handleDepartmentChange}
            className="mt-1 w-full rounded-button border border-[#dde5e9] bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All Departments ({departments.length})</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>

        {/* Instant Speciality Select */}
        <label className="block text-sm">
          <span className="font-semibold text-ink">Speciality</span>
          <select
            value={currentSpeciality}
            onChange={handleSpecialityChange}
            className="mt-1 w-full rounded-button border border-[#dde5e9] bg-white px-3 py-2.5 text-sm font-medium text-ink focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100"
          >
            <option value="">All Specialities ({specialities.length})</option>
            {specialities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Status indicator & reset button */}
      <div className="flex items-center justify-between border-t border-[#dde5e9]/70 pt-3 text-xs">
        <div className="flex items-center gap-2">
          {isPending && (
            <span className="flex items-center gap-1.5 font-semibold text-brand-700">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              Updating results...
            </span>
          )}
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearFilters}
            className="font-semibold text-rose-700 hover:text-rose-900 hover:underline"
          >
            Reset all filters
          </button>
        )}
      </div>
    </div>
  );
}
