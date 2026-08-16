'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateDepartmentSchema,
  CreateDepartmentInput,
  UpdateDepartmentSchema,
  UpdateDepartmentInput,
} from '../schemas';
import { BusyLabel } from '@/components/ui/Spinner';
import {
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
} from '../actions';

import { useRouter, useSearchParams } from 'next/navigation';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';
import AdminPageHeader from '@/components/admin/AdminPageHeader';

import CmsImagePicker from '@/features/cms-images/components/CmsImagePicker';
import { fillMissingCmsImagesFromCatalogAction } from '@/features/cms-images/actions';

interface DepartmentItem {
  id: string;
  name: string;
  description: string | null;
  imageUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    doctors: number;
  };
}

interface Props {
  departments: DepartmentItem[];
  currentPage?: number;
  totalPages?: number;
  totalDepartments?: number;
  currentSearch?: string;
  currentLimit?: number;
}

export default function DepartmentManagement({
  departments,
  currentPage = 1,
  totalPages = 1,
  totalDepartments = departments.length,
  currentSearch = '',
  currentLimit = 10,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [limitFilter, setLimitFilter] = useState(currentLimit);

  const applyFilters = (newSearch = currentSearch, page = 1, newLimit = limitFilter) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set('search', newSearch); else params.delete('search');
    params.set('page', page.toString());
    params.set('limit', newLimit.toString());
    router.push(`/admin/departments?${params.toString()}`);
  };
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [confirmToggleDept, setConfirmToggleDept] = useState<DepartmentItem | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [departmentRows, setDepartmentRows] = useState(departments);
  const [fillingImages, setFillingImages] = useState(false);

  useEffect(() => {
    setDepartmentRows(departments);
  }, [departments]);

  // Form hook for Create
  const createForm = useForm<CreateDepartmentInput>({
    resolver: zodResolver(CreateDepartmentSchema),
    defaultValues: { name: '', description: '', imageUrl: '' },
  });

  // Form hook for Edit
  const editForm = useForm<UpdateDepartmentInput>({
    resolver: zodResolver(UpdateDepartmentSchema),
  });

  const handleCreateSubmit = async (data: CreateDepartmentInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await createDepartmentAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Department created successfully!');
    createForm.reset();
    setIsCreateOpen(false);
    applyFilters(data.name.trim(), 1, limitFilter);
  };

  const handleEditSubmit = async (data: UpdateDepartmentInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await updateDepartmentAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Department updated successfully!');
    setEditingDept(null);
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleDept) return;
    setServerError(null);
    setSuccessMessage(null);

    const dept = confirmToggleDept;
    const wasActive = dept.isActive;
    setConfirmToggleDept(null);

    const res = await toggleDepartmentStatusAction(dept.id);
    if (!res.success) {
      setServerError(res.error);
    } else {
      setDepartmentRows((rows) =>
        rows.map((row) =>
          row.id === dept.id ? { ...row, isActive: !wasActive } : row
        )
      );
      setSuccessMessage(
        `Department ${wasActive ? 'deactivated' : 'activated'} successfully!`
      );
    }
  };

  const openEditModal = (dept: DepartmentItem & { seoTitle?: string | null, seoDescription?: string | null }) => {
    setEditingDept(dept as DepartmentItem);
    editForm.reset({
      id: dept.id,
      name: dept.name,
      description: dept.description || '',
      imageUrl: dept.imageUrl || '',
      seoTitle: dept.seoTitle || '',
      seoDescription: dept.seoDescription || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Frontend URL hint & Live Preview */}
      <AdminPageHeader
        title="Departments"
        description="Manage hospital medical departments and specialties."
        frontendPath="/departments"
      >
        <button
          type="button"
          disabled={fillingImages || departmentRows.every((dept) => dept.imageUrl)}
          onClick={async () => {
            setFillingImages(true);
            setServerError(null);
            const result = await fillMissingCmsImagesFromCatalogAction({ contentType: 'DEPARTMENT' });
            setFillingImages(false);
            if (!result.success) {
              setServerError(result.error || 'Unable to attach images.');
              return;
            }
            setSuccessMessage(`Attached ${result.data?.attached ?? 0} relevant department images.`);
            router.refresh();
          }}
          className="btn-secondary"
        >
          {fillingImages ? 'Filling images...' : 'Fill missing images'}
        </button>
        <button
          onClick={() => {
            setServerError(null);
            setIsCreateOpen(true);
          }}
          className="btn-primary"
        >
          <span>+ Add Department</span>
        </button>
      </AdminPageHeader>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-card border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold text-accent-600 hover:text-accent-900"
          >
            ✕
          </button>
        </div>
      )}

      {serverError && (
        <div className="flex items-center justify-between rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{serverError}</span>
          <button
            onClick={() => setServerError(null)}
            className="text-xs font-bold text-rose-600 hover:text-rose-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card-surface grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-12">
        <div className="sm:col-span-8">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Interactive Search Departments</label>
          <InteractiveSearchInput
            placeholder="Type department name or description..."
            defaultValue={currentSearch}
          />
        </div>

        <div className="sm:col-span-4">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Entries per page</label>
          <select
            value={limitFilter}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setLimitFilter(newLimit);
              applyFilters(currentSearch, 1, newLimit);
            }}
            className="input-field !py-2 text-xs font-medium sm:text-sm"
          >
            <option value="5">5 entries</option>
            <option value="10">10 entries</option>
            <option value="15">15 entries</option>
            <option value="20">20 entries</option>
            <option value="50">50 entries</option>
          </select>
        </div>
      </div>

      {/* Departments Table */}
      <div className="card-surface overflow-hidden">
        {departmentRows.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-base font-semibold text-ink">No departments found</h3>
            <p className="mt-1 text-sm text-ink-muted">Create your first medical department to get started.</p>
            <button onClick={() => setIsCreateOpen(true)} className="btn-primary mt-4">
              + Create Department
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-muted">
              <thead className="border-b border-[#dde5e9] bg-surface-muted text-xs font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Doctors</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde5e9]/60">
                {departmentRows.map((dept) => (
                  <tr key={dept.id} className="transition hover:bg-brand-50/40">
                    <td className="px-6 py-4 font-semibold text-ink">{dept.name}</td>
                    <td className="max-w-xs truncate px-6 py-4 text-ink-muted">
                      {dept.description || <span className="italic text-ink-soft">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center rounded-pill bg-surface-soft px-2.5 py-1 text-xs font-semibold text-ink">
                        {dept._count.doctors} {dept._count.doctors === 1 ? 'Doctor' : 'Doctors'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dept.isActive ? (
                        <span className="inline-block rounded-pill bg-accent-100 px-2.5 py-0.5 text-xs font-semibold text-accent-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block rounded-pill bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-ink-muted">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="space-x-2 px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="rounded-button bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-brand-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmToggleDept(dept)}
                        className={`rounded-button px-3 py-1.5 text-xs font-medium transition ${
                          dept.isActive
                            ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100'
                        }`}
                      >
                        {dept.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {departmentRows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#dde5e9] bg-surface-muted p-4 text-xs text-ink-muted sm:flex-row">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalDepartments} total departments)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => applyFilters(currentSearch, currentPage - 1, limitFilter)}
                className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(currentSearch, currentPage + 1, limitFilter)}
                className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h2 className="font-display text-xl font-semibold text-ink">Add Department</h2>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Create a new medical department or specialty area.</p>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Department Name *</label>
                <input
                  type="text"
                  {...createForm.register('name')}
                  className="input-field"
                  placeholder="e.g. Cardiology"
                />
                {createForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-rose-600">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Description (Optional)</label>
                <textarea
                  rows={3}
                  {...createForm.register('description')}
                  className="input-field"
                  placeholder="Summary of department services..."
                />
                {createForm.formState.errors.description && (
                  <p className="mt-1 text-xs text-rose-600">{createForm.formState.errors.description.message}</p>
                )}
              </div>

              <CmsImagePicker
                label="Department cover image"
                description="Upload, browse the library, or pick a relevant medical photo. This image appears on /departments."
                value={createForm.watch('imageUrl')}
                onChange={(url) => createForm.setValue('imageUrl', url)}
                title={createForm.watch('name')}
              />

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">SEO Title (Optional)</label>
                <input
                  type="text"
                  {...createForm.register('seoTitle')}
                  className="input-field"
                  placeholder="e.g. Best Cardiology Hospital in City"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">SEO Description (Optional)</label>
                <textarea
                  rows={2}
                  {...createForm.register('seoDescription')}
                  className="input-field"
                  placeholder="Meta description for search engines..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary">
                  {createForm.formState.isSubmitting ? <BusyLabel>Creating...</BusyLabel> : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h2 className="font-display text-xl font-semibold text-ink">Edit Department</h2>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Update department details.</p>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <input type="hidden" {...editForm.register('id')} />

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Department Name *</label>
                <input type="text" {...editForm.register('name')} className="input-field" />
                {editForm.formState.errors.name && (
                  <p className="mt-1 text-xs text-rose-600">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">Description (Optional)</label>
                <textarea rows={3} {...editForm.register('description')} className="input-field" />
                {editForm.formState.errors.description && (
                  <p className="mt-1 text-xs text-rose-600">{editForm.formState.errors.description.message}</p>
                )}
              </div>

              <CmsImagePicker
                label="Department cover image"
                description="Upload, browse the library, or pick a relevant medical photo. This image appears on /departments."
                value={editForm.watch('imageUrl')}
                onChange={(url) => editForm.setValue('imageUrl', url)}
                title={editForm.watch('name')}
                contentType="DEPARTMENT"
                recordId={editingDept.id}
              />

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">SEO Title (Optional)</label>
                <input
                  type="text"
                  {...editForm.register('seoTitle')}
                  className="input-field"
                  placeholder="e.g. Best Cardiology Hospital in City"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-ink">SEO Description (Optional)</label>
                <textarea
                  rows={2}
                  {...editForm.register('seoDescription')}
                  className="input-field"
                  placeholder="Meta description for search engines..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingDept(null)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={editForm.formState.isSubmitting} className="btn-primary">
                  {editForm.formState.isSubmitting ? <BusyLabel>Saving...</BusyLabel> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deactivation / Reactivation */}
      {confirmToggleDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-card border border-[#dde5e9] bg-white p-6 text-center shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">
              {confirmToggleDept.isActive ? 'Deactivate Department?' : 'Reactivate Department?'}
            </h3>
            <p className="mt-2 text-xs text-ink-muted">
              {confirmToggleDept.isActive
                ? `Deactivating "${confirmToggleDept.name}" will prevent new doctors from being assigned to it. Existing doctor relationships and historical records remain preserved.`
                : `Reactivating "${confirmToggleDept.name}" will allow new doctors to be assigned to this department.`}
            </p>

            <div className="mt-6 flex justify-center space-x-3">
              <button onClick={() => setConfirmToggleDept(null)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`rounded-button px-4 py-2.5 text-sm font-semibold text-white shadow-soft ${
                  confirmToggleDept.isActive
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-accent-600 hover:bg-accent-700'
                }`}
              >
                Confirm {confirmToggleDept.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
