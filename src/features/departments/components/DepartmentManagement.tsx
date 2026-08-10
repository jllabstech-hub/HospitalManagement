'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateDepartmentSchema,
  CreateDepartmentInput,
  UpdateDepartmentSchema,
  UpdateDepartmentInput,
} from '../schemas';
import {
  createDepartmentAction,
  updateDepartmentAction,
  toggleDepartmentStatusAction,
} from '../actions';

import { useRouter, useSearchParams } from 'next/navigation';

interface DepartmentItem {
  id: string;
  name: string;
  description: string | null;
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

  const [search, setSearch] = useState(currentSearch);
  const [limitFilter, setLimitFilter] = useState(currentLimit);

  const applyFilters = (newSearch = search, page = 1, newLimit = limitFilter) => {
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

  // Form hook for Create
  const createForm = useForm<CreateDepartmentInput>({
    resolver: zodResolver(CreateDepartmentSchema),
    defaultValues: { name: '', description: '' },
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

    const res = await toggleDepartmentStatusAction(confirmToggleDept.id);
    if (!res.success) {
      setServerError(res.error);
    } else {
      setSuccessMessage(
        `Department ${confirmToggleDept.isActive ? 'deactivated' : 'activated'} successfully!`
      );
    }

    setConfirmToggleDept(null);
  };

  const openEditModal = (dept: DepartmentItem) => {
    setEditingDept(dept);
    editForm.reset({
      id: dept.id,
      name: dept.name,
      description: dept.description || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage hospital medical departments and specialties.
          </p>
        </div>
        <button
          onClick={() => {
            setServerError(null);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-sm transition duration-150 flex items-center justify-center space-x-2"
        >
          <span>+ Add Department</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex justify-between items-center">
          <span>{serverError}</span>
          <button onClick={() => setServerError(null)} className="text-xs text-red-600 hover:text-red-900 font-bold">✕</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <div className="sm:col-span-8">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Search Departments</label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters(search, 1, limitFilter)}
              placeholder="Department name or description..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => applyFilters(search, 1, limitFilter)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg transition"
            >
              Search
            </button>
            {search && (
              <button
                onClick={() => {
                  setSearch('');
                  applyFilters('', 1, limitFilter);
                }}
                className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs rounded-lg transition"
                title="Clear Search"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="sm:col-span-4">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Entries per page</label>
          <select
            value={limitFilter}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setLimitFilter(newLimit);
              applyFilters(search, 1, newLimit);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white font-medium"
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {departments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">🏢</div>
            <h3 className="text-base font-semibold text-slate-800">No departments found</h3>
            <p className="text-sm text-slate-500 mt-1">Create your first medical department to get started.</p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              + Create Department
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Department Name</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Doctors</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/80 transition duration-100">
                    <td className="px-6 py-4 font-semibold text-slate-800">{dept.name}</td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-500">
                      {dept.description || <span className="italic text-slate-400">No description</span>}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                        {dept._count.doctors} {dept._count.doctors === 1 ? 'Doctor' : 'Doctors'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dept.isActive ? (
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(dept)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmToggleDept(dept)}
                        className={`px-3 py-1.5 font-medium text-xs rounded-lg transition ${
                          dept.isActive
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
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
        {departments.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalDepartments} total departments)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => applyFilters(search, currentPage - 1, limitFilter)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 font-medium text-slate-700 transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(search, currentPage + 1, limitFilter)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 font-medium text-slate-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Add Department</h2>
            <p className="text-xs text-slate-500 mb-4">Create a new medical department or specialty area.</p>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  {...createForm.register('name')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="e.g. Cardiology"
                />
                {createForm.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  {...createForm.register('description')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  placeholder="Summary of department services..."
                />
                {createForm.formState.errors.description && (
                  <p className="text-xs text-red-600 mt-1">{createForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingDept && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Edit Department</h2>
            <p className="text-xs text-slate-500 mb-4">Update department details.</p>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <input type="hidden" {...editForm.register('id')} />

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Name *</label>
                <input
                  type="text"
                  {...editForm.register('name')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {editForm.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1">{editForm.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  rows={3}
                  {...editForm.register('description')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {editForm.formState.errors.description && (
                  <p className="text-xs text-red-600 mt-1">{editForm.formState.errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deactivation / Reactivation */}
      {confirmToggleDept && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl mb-2">{confirmToggleDept.isActive ? '⚠️' : '✅'}</div>
            <h3 className="text-lg font-bold text-slate-800">
              {confirmToggleDept.isActive ? 'Deactivate Department?' : 'Reactivate Department?'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {confirmToggleDept.isActive
                ? `Deactivating "${confirmToggleDept.name}" will prevent new doctors from being assigned to it. Existing doctor relationships and historical records remain preserved.`
                : `Reactivating "${confirmToggleDept.name}" will allow new doctors to be assigned to this department.`}
            </p>

            <div className="flex justify-center space-x-3 mt-6">
              <button
                onClick={() => setConfirmToggleDept(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${
                  confirmToggleDept.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
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
