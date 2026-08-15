'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';

interface DepartmentOption {
  id: string;
  name: string;
}

interface DoctorOption {
  id: string;
  fullName: string;
}

interface Props {
  departments: DepartmentOption[];
  doctors: DoctorOption[];
  currentSearch: string;
  currentDepartment: string;
  currentDoctor: string;
  currentStatus: string;
  totalCount: number;
}

export default function AdminAppointmentFilters({
  departments,
  doctors,
  currentSearch,
  currentDepartment,
  currentDoctor,
  currentStatus,
  totalCount,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set('page', '1');

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const hasActiveFilters = Boolean(
    currentSearch || currentDepartment || currentDoctor || currentStatus
  );

  return (
    <form
      className="card-surface space-y-4 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const searchInput = form.elements.namedItem('search') as HTMLInputElement | null;
        const dept = form.elements.namedItem('department') as HTMLSelectElement | null;
        const doctor = form.elements.namedItem('doctor') as HTMLSelectElement | null;
        const status = form.elements.namedItem('status') as HTMLSelectElement | null;
        const params = new URLSearchParams();
        const q = searchInput?.value.trim() || '';
        if (q) params.set('search', q);
        if (dept?.value) params.set('department', dept.value);
        if (doctor?.value) params.set('doctor', doctor.value);
        if (status?.value) params.set('status', status.value);
        params.set('page', '1');
        startTransition(() => {
          const query = params.toString();
          router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
        });
      }}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        {/* Live Search Input */}
        <div className="md:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-ink">
            Interactive Search (Patient / Doctor / Reason)
          </label>
          <InteractiveSearchInput
            placeholder="Type patient, doctor name or reason..."
            defaultValue={currentSearch}
          />
        </div>

        {/* Department Filter */}
        <div className="md:col-span-3">
          <label htmlFor="adminDeptFilter" className="mb-1 block text-xs font-semibold text-ink">
            Department
          </label>
          <select
            id="adminDeptFilter"
            name="department"
            value={currentDepartment}
            onChange={(e) => updateParam('department', e.target.value)}
            className="input-field !py-2 text-xs sm:text-sm"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Doctor Filter */}
        <div className="md:col-span-3">
          <label htmlFor="adminDoctorFilter" className="mb-1 block text-xs font-semibold text-ink">
            Doctor
          </label>
          <select
            id="adminDoctorFilter"
            name="doctor"
            value={currentDoctor}
            onChange={(e) => updateParam('doctor', e.target.value)}
            className="input-field !py-2 text-xs sm:text-sm"
          >
            <option value="">All Doctors</option>
            {doctors.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.fullName}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="md:col-span-2">
          <label htmlFor="adminStatusFilter" className="mb-1 block text-xs font-semibold text-ink">
            Status
          </label>
          <select
            id="adminStatusFilter"
            name="status"
            value={currentStatus}
            onChange={(e) => updateParam('status', e.target.value)}
            className="input-field !py-2 text-xs sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="BOOKED">BOOKED</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
            <option value="NO_SHOW">NO_SHOW</option>
          </select>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-ink-muted">
            Found <strong className="text-ink">{totalCount}</strong> matching appointments
          </span>
          {isPending && (
            <span className="flex items-center gap-1.5 font-semibold text-brand-700">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              Updating results...
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                startTransition(() => {
                  router.replace(pathname, { scroll: false });
                });
              }}
              className="font-semibold text-brand-700 hover:underline"
            >
              Reset Filters
            </button>
          )}
          <button type="submit" className="btn-primary !py-1.5 !text-xs">
            Filter
          </button>
        </div>
      </div>
    </form>
  );
}
