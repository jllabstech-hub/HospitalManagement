'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateDoctorSchema,
  CreateDoctorInput,
  UpdateDoctorSchema,
  UpdateDoctorInput,
} from '../schemas';
import {
  createDoctorAction,
  updateDoctorAction,
  toggleDoctorStatusAction,
} from '../actions';
import { useRouter, useSearchParams } from 'next/navigation';
import InteractiveSearchInput from '@/components/shared/InteractiveSearchInput';

interface ActiveDepartment {
  id: string;
  name: string;
}

interface DoctorItem {
  id: string;
  fullName: string;
  phoneNumber: string;
  qualification: string;
  experienceYears: number;
  bio: string | null;
  department: {
    id: string;
    name: string;
    isActive: boolean;
  };
  user: {
    id: string;
    email: string;
    isActive: boolean;
  };
}

interface Props {
  doctors: DoctorItem[];
  departments: ActiveDepartment[];
  totalDoctors: number;
  currentPage: number;
  totalPages: number;
  currentLimit?: number;
  currentSearch: string;
  currentDepartmentId: string;
  currentStatus: string;
}

export default function DoctorManagement({
  doctors,
  departments,
  totalDoctors,
  currentPage,
  totalPages,
  currentLimit = 10,
  currentSearch,
  currentDepartmentId,
  currentStatus,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorItem | null>(null);
  const [confirmToggleDoctor, setConfirmToggleDoctor] = useState<DoctorItem | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [doctorRows, setDoctorRows] = useState(doctors);

  useEffect(() => {
    setDoctorRows(doctors);
  }, [doctors]);

  // Search and filter local state
  const [deptFilter, setDeptFilter] = useState(currentDepartmentId);
  const [statusFilter, setStatusFilter] = useState(currentStatus);
  const [limitFilter, setLimitFilter] = useState(currentLimit);

  // Create Form Hook
  const createForm = useForm<CreateDoctorInput>({
    resolver: zodResolver(CreateDoctorSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      departmentId: departments[0]?.id || '',
      qualification: '',
      experienceYears: 1,
      phoneNumber: '',
      bio: '',
    },
  });

  // Edit Form Hook
  const editForm = useForm<UpdateDoctorInput>({
    resolver: zodResolver(UpdateDoctorSchema),
  });

  const applyFilters = (
    newSearch = currentSearch,
    newDept = deptFilter,
    newStatus = statusFilter,
    page = 1,
    newLimit = limitFilter
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSearch) params.set('search', newSearch); else params.delete('search');
    if (newDept) params.set('departmentId', newDept); else params.delete('departmentId');
    if (newStatus) params.set('status', newStatus); else params.delete('status');
    params.set('page', page.toString());
    params.set('limit', newLimit.toString());
    router.push(`/admin/doctors?${params.toString()}`);
  };

  const handleCreateSubmit = async (data: CreateDoctorInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await createDoctorAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Doctor account created successfully!');
    createForm.reset();
    setIsCreateOpen(false);
  };

  const handleEditSubmit = async (data: UpdateDoctorInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await updateDoctorAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Doctor details updated successfully!');
    setEditingDoctor(null);
  };

  const handleToggleStatus = async () => {
    if (!confirmToggleDoctor) return;
    setServerError(null);
    setSuccessMessage(null);

    const doctor = confirmToggleDoctor;
    const wasActive = doctor.user.isActive;
    setConfirmToggleDoctor(null);

    const res = await toggleDoctorStatusAction(doctor.id);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    // Flip status immediately so Activate/Deactivate labels match before RSC refresh.
    // Prevents Playwright has-text("Activate") from matching a still-visible Deactivate button.
    setDoctorRows((rows) =>
      rows.map((row) =>
        row.id === doctor.id
          ? { ...row, user: { ...row.user, isActive: !wasActive } }
          : row
      )
    );

    setSuccessMessage(
      `Doctor account ${wasActive ? 'deactivated' : 'activated'} successfully!`
    );
    router.refresh();
  };

  const openEditModal = (doc: DoctorItem) => {
    setEditingDoctor(doc);
    editForm.reset({
      id: doc.id,
      fullName: doc.fullName,
      departmentId: doc.department.id,
      qualification: doc.qualification,
      experienceYears: doc.experienceYears,
      phoneNumber: doc.phoneNumber,
      bio: doc.bio || '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Doctors</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Manage hospital doctor profiles, credentials, and account statuses.
          </p>
        </div>
        <button
          onClick={() => {
            setServerError(null);
            setIsCreateOpen(true);
          }}
          className="btn-primary"
        >
          <span>+ Add Doctor</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center justify-between rounded-card border border-accent-200 bg-accent-50 p-4 text-sm text-accent-800">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-xs font-bold text-accent-600">
            ✕
          </button>
        </div>
      )}

      {serverError && (
        <div className="flex items-center justify-between rounded-card border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <span>{serverError}</span>
          <button onClick={() => setServerError(null)} className="text-xs font-bold text-rose-600">
            ✕
          </button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="card-surface grid grid-cols-1 items-end gap-3 p-4 sm:grid-cols-2 md:grid-cols-12">
        <div className="md:col-span-5">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Interactive Search Doctors</label>
          <InteractiveSearchInput
            placeholder="Type name, email, qualification, phone..."
            defaultValue={currentSearch}
          />
        </div>

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              applyFilters(currentSearch, e.target.value, statusFilter, 1, limitFilter);
            }}
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

        <div className="md:col-span-3">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Account Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              applyFilters(currentSearch, deptFilter, e.target.value, 1, limitFilter);
            }}
            className="input-field !py-2 text-xs sm:text-sm"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Entries per page</label>
          <select
            value={limitFilter}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setLimitFilter(newLimit);
              applyFilters(currentSearch, deptFilter, statusFilter, 1, newLimit);
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

      {/* Doctors Table */}
      <div className="card-surface overflow-hidden">
        {doctorRows.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-base font-semibold text-ink">No doctor records found</h3>
            <p className="mt-1 text-sm text-ink-muted">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-ink-muted">
              <thead className="border-b border-[#dde5e9] bg-surface-muted text-xs font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-6 py-4">Doctor Info</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Qualification & Exp.</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde5e9]/60">
                {doctorRows.map((doc) => (
                  <tr key={doc.id} className="transition hover:bg-brand-50/40">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-ink">{doc.fullName}</p>
                      <p className="text-xs text-ink-muted">{doc.user.email}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">{doc.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-ink">
                      {doc.department.name}
                      {!doc.department.isActive && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                          Dept Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-ink-muted">
                      <p className="text-xs font-medium text-ink">{doc.qualification}</p>
                      <p className="text-xs text-ink-muted">{doc.experienceYears} Years Exp.</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {doc.user.isActive ? (
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
                        type="button"
                        onClick={() => openEditModal(doc)}
                        className="rounded-button bg-surface-muted px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-brand-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmToggleDoctor(doc)}
                        className={`rounded-button px-3 py-1.5 text-xs font-medium transition ${
                          doc.user.isActive
                            ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                            : 'border border-accent-200 bg-accent-50 text-accent-700 hover:bg-accent-100'
                        }`}
                      >
                        {doc.user.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {doctorRows.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-3 border-t border-[#dde5e9] bg-surface-muted p-4 text-xs text-ink-muted sm:flex-row">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalDoctors} total doctors)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => applyFilters(currentSearch, deptFilter, statusFilter, currentPage - 1, limitFilter)}
                className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(currentSearch, deptFilter, statusFilter, currentPage + 1, limitFilter)}
                className="btn-secondary !px-3 !py-1.5 !text-xs disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Doctor Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h2 className="font-display text-xl font-semibold text-ink">Add Doctor Account</h2>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Onboard a new medical specialist.</p>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink">Full Name *</label>
                  <input
                    type="text"
                    {...createForm.register('fullName')}
                    className="input-field !py-2"
                    placeholder="Dr. Jane Smith"
                  />
                  {createForm.formState.errors.fullName && (
                    <p className="mt-0.5 text-rose-600">{createForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-ink">Email Address *</label>
                  <input
                    type="email"
                    {...createForm.register('email')}
                    className="input-field !py-2"
                    placeholder="dr.smith@hospital.com"
                  />
                  {createForm.formState.errors.email && (
                    <p className="mt-0.5 text-rose-600">{createForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink">Temporary Password *</label>
                  <input
                    type="password"
                    {...createForm.register('password')}
                    className="input-field !py-2"
                    placeholder="Minimum 8 characters"
                  />
                  {createForm.formState.errors.password && (
                    <p className="mt-0.5 text-rose-600">{createForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-ink">Medical Department *</label>
                  <select {...createForm.register('departmentId')} className="input-field !py-2">
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {createForm.formState.errors.departmentId && (
                    <p className="mt-0.5 text-rose-600">{createForm.formState.errors.departmentId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-ink">Qualification *</label>
                  <input
                    type="text"
                    {...createForm.register('qualification')}
                    className="input-field !py-2"
                    placeholder="MBBS, MD Cardiology"
                  />
                  {createForm.formState.errors.qualification && (
                    <p className="mt-0.5 text-rose-600">{createForm.formState.errors.qualification.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-ink">Exp. Years *</label>
                  <input
                    type="number"
                    min="0"
                    {...createForm.register('experienceYears')}
                    className="input-field !py-2"
                  />
                  {createForm.formState.errors.experienceYears && (
                    <p className="mt-0.5 text-rose-600">{createForm.formState.errors.experienceYears.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">Contact Phone Number *</label>
                <input
                  type="text"
                  {...createForm.register('phoneNumber')}
                  className="input-field !py-2"
                  placeholder="+91 98765 43210"
                />
                {createForm.formState.errors.phoneNumber && (
                  <p className="mt-0.5 text-rose-600">{createForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">Biography (Optional)</label>
                <textarea
                  rows={2}
                  {...createForm.register('bio')}
                  className="input-field !py-2"
                  placeholder="Professional background and clinical focus..."
                />
              </div>

              <div className="flex justify-end space-x-3 border-t border-[#dde5e9] pt-3">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary !text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={createForm.formState.isSubmitting} className="btn-primary !text-xs">
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Doctor Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h2 className="font-display text-xl font-semibold text-ink">Edit Doctor Details</h2>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Update credentials and department assignment.</p>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-3 text-xs">
              <input type="hidden" {...editForm.register('id')} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block font-semibold text-ink">Full Name *</label>
                  <input type="text" {...editForm.register('fullName')} className="input-field !py-2" />
                  {editForm.formState.errors.fullName && (
                    <p className="mt-0.5 text-rose-600">{editForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-ink">Department *</label>
                  <select {...editForm.register('departmentId')} className="input-field !py-2">
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {editForm.formState.errors.departmentId && (
                    <p className="mt-0.5 text-rose-600">{editForm.formState.errors.departmentId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <label className="mb-1 block font-semibold text-ink">Qualification *</label>
                  <input type="text" {...editForm.register('qualification')} className="input-field !py-2" />
                  {editForm.formState.errors.qualification && (
                    <p className="mt-0.5 text-rose-600">{editForm.formState.errors.qualification.message}</p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block font-semibold text-ink">Exp. Years *</label>
                  <input
                    type="number"
                    min="0"
                    {...editForm.register('experienceYears')}
                    className="input-field !py-2"
                  />
                  {editForm.formState.errors.experienceYears && (
                    <p className="mt-0.5 text-rose-600">{editForm.formState.errors.experienceYears.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">Phone Number *</label>
                <input type="text" {...editForm.register('phoneNumber')} className="input-field !py-2" />
                {editForm.formState.errors.phoneNumber && (
                  <p className="mt-0.5 text-rose-600">{editForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1 block font-semibold text-ink">Biography (Optional)</label>
                <textarea rows={2} {...editForm.register('bio')} className="input-field !py-2" />
              </div>

              <div className="flex justify-end space-x-3 border-t border-[#dde5e9] pt-3">
                <button type="button" onClick={() => setEditingDoctor(null)} className="btn-secondary !text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={editForm.formState.isSubmitting} className="btn-primary !text-xs">
                  {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deactivation / Reactivation */}
      {confirmToggleDoctor && (
        <div
          key={`${confirmToggleDoctor.id}-${confirmToggleDoctor.user.isActive ? 'active' : 'inactive'}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-card border border-[#dde5e9] bg-white p-6 text-center shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">
              {confirmToggleDoctor.user.isActive
                ? 'Deactivate Doctor Account?'
                : 'Reactivate Doctor Account?'}
            </h3>
            <p className="mt-2 text-xs text-ink-muted">
              {confirmToggleDoctor.user.isActive
                ? `Deactivating "${confirmToggleDoctor.fullName}" will prevent them from logging in and hide them from new patient bookings. Historical appointments remain intact.`
                : `Reactivating "${confirmToggleDoctor.fullName}" will restore their login access and availability for scheduling.`}
            </p>

            <div className="mt-6 flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setConfirmToggleDoctor(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleToggleStatus}
                className={`rounded-button px-4 py-2.5 text-sm font-semibold text-white shadow-soft ${
                  confirmToggleDoctor.user.isActive
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-accent-600 hover:bg-accent-700'
                }`}
              >
                Confirm {confirmToggleDoctor.user.isActive ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
