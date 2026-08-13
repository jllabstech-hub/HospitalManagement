'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import InteractiveSearchInput from './InteractiveSearchInput';

interface DepartmentOption {
  id: string;
  name: string;
}

interface Props {
  departments: DepartmentOption[];
  currentSearch: string;
  currentDepartment: string;
}

export default function PatientDoctorSearchFilters({
  departments,
  currentSearch,
  currentDepartment,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const deptId = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (deptId) {
      params.set('department', deptId);
    } else {
      params.delete('department');
    }
    params.set('page', '1');

    startTransition(() => {
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  return (
    <div className="card-surface p-5 sm:p-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-7">
          <label className="mb-1 block text-xs font-semibold text-ink">
            Interactive Search (Doctor / Specialization / Keyword)
          </label>
          <InteractiveSearchInput
            placeholder="Type doctor name, specialty, qualification..."
            defaultValue={currentSearch}
          />
        </div>

        <div className="md:col-span-5">
          <label htmlFor="deptFilter" className="mb-1 block text-xs font-semibold text-ink">
            Medical Department
          </label>
          <select
            id="deptFilter"
            name="department"
            value={currentDepartment}
            onChange={handleDepartmentChange}
            className="input-field"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-xs font-semibold text-brand-700">
          <span className="h-3 w-3 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <span>Updating doctor directory results...</span>
        </div>
      )}
    </div>
  );
}
