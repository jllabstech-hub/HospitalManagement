'use client';

import { useState } from 'react';
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

    const res = await toggleDoctorStatusAction(confirmToggleDoctor.id);
    if (!res.success) {
      setServerError(res.error);
    } else {
      setSuccessMessage(
        `Doctor account ${confirmToggleDoctor.user.isActive ? 'deactivated' : 'activated'} successfully!`
      );
    }

    setConfirmToggleDoctor(null);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage hospital doctor profiles, credentials, and account statuses.
          </p>
        </div>
        <button
          onClick={() => {
            setServerError(null);
            setIsCreateOpen(true);
          }}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm rounded-xl shadow-sm transition duration-150 flex items-center justify-center space-x-2"
        >
          <span>+ Add Doctor</span>
        </button>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-xl flex justify-between items-center">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)} className="text-xs text-emerald-600 font-bold">✕</button>
        </div>
      )}

      {serverError && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-xl flex justify-between items-center">
          <span>{serverError}</span>
          <button onClick={() => setServerError(null)} className="text-xs text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-end">
        <div className="md:col-span-5">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Interactive Search Doctors</label>
          <InteractiveSearchInput
            placeholder="Type name, email, qualification, phone..."
            defaultValue={currentSearch}
          />
        </div>

        <div className="md:col-span-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Department</label>
          <select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              applyFilters(currentSearch, e.target.value, statusFilter, 1, limitFilter);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
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
          <label className="block text-xs font-semibold text-slate-600 mb-1">Account Status</label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              applyFilters(currentSearch, deptFilter, e.target.value, 1, limitFilter);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Entries per page</label>
          <select
            value={limitFilter}
            onChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setLimitFilter(newLimit);
              applyFilters(currentSearch, deptFilter, statusFilter, 1, newLimit);
            }}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white font-medium"
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
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {doctors.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👨‍⚕️</div>
            <h3 className="text-base font-semibold text-slate-800">No doctor records found</h3>
            <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Doctor Info</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Qualification & Exp.</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition duration-100">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{doc.fullName}</p>
                      <p className="text-xs text-slate-500">{doc.user.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.phoneNumber}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {doc.department.name}
                      {!doc.department.isActive && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.5 rounded">
                          Dept Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <p className="font-medium text-xs text-slate-800">{doc.qualification}</p>
                      <p className="text-xs text-slate-500">{doc.experienceYears} Years Exp.</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {doc.user.isActive ? (
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
                        onClick={() => openEditModal(doc)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-lg transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmToggleDoctor(doc)}
                        className={`px-3 py-1.5 font-medium text-xs rounded-lg transition ${
                          doc.user.isActive
                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
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
        {doctors.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
            <span>
              Showing Page {currentPage} of {totalPages} ({totalDoctors} total doctors)
            </span>
            <div className="flex space-x-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => applyFilters(currentSearch, deptFilter, statusFilter, currentPage - 1, limitFilter)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 font-medium text-slate-700 transition"
              >
                Previous
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => applyFilters(currentSearch, deptFilter, statusFilter, currentPage + 1, limitFilter)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-md disabled:opacity-40 hover:bg-slate-50 font-medium text-slate-700 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Doctor Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Add Doctor Account</h2>
            <p className="text-xs text-slate-500 mb-4">Onboard a new medical specialist.</p>

            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    {...createForm.register('fullName')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Dr. Jane Smith"
                  />
                  {createForm.formState.errors.fullName && (
                    <p className="text-red-600 mt-0.5">{createForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    {...createForm.register('email')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="dr.smith@hospital.com"
                  />
                  {createForm.formState.errors.email && (
                    <p className="text-red-600 mt-0.5">{createForm.formState.errors.email.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Temporary Password *</label>
                  <input
                    type="password"
                    {...createForm.register('password')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="Minimum 8 characters"
                  />
                  {createForm.formState.errors.password && (
                    <p className="text-red-600 mt-0.5">{createForm.formState.errors.password.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Medical Department *</label>
                  <select
                    {...createForm.register('departmentId')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {createForm.formState.errors.departmentId && (
                    <p className="text-red-600 mt-0.5">{createForm.formState.errors.departmentId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Qualification *</label>
                  <input
                    type="text"
                    {...createForm.register('qualification')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    placeholder="MBBS, MD Cardiology"
                  />
                  {createForm.formState.errors.qualification && (
                    <p className="text-red-600 mt-0.5">{createForm.formState.errors.qualification.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exp. Years *</label>
                  <input
                    type="number"
                    min="0"
                    {...createForm.register('experienceYears')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {createForm.formState.errors.experienceYears && (
                    <p className="text-red-600 mt-0.5">{createForm.formState.errors.experienceYears.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone Number *</label>
                <input
                  type="text"
                  {...createForm.register('phoneNumber')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="+91 98765 43210"
                />
                {createForm.formState.errors.phoneNumber && (
                  <p className="text-red-600 mt-0.5">{createForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biography (Optional)</label>
                <textarea
                  rows={2}
                  {...createForm.register('bio')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  placeholder="Professional background and clinical focus..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createForm.formState.isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Doctor Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Doctor Modal */}
      {editingDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-800 mb-1">Edit Doctor Details</h2>
            <p className="text-xs text-slate-500 mb-4">Update credentials and department assignment.</p>

            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-3 text-xs">
              <input type="hidden" {...editForm.register('id')} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    {...editForm.register('fullName')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {editForm.formState.errors.fullName && (
                    <p className="text-red-600 mt-0.5">{editForm.formState.errors.fullName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    {...editForm.register('departmentId')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                  {editForm.formState.errors.departmentId && (
                    <p className="text-red-600 mt-0.5">{editForm.formState.errors.departmentId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Qualification *</label>
                  <input
                    type="text"
                    {...editForm.register('qualification')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {editForm.formState.errors.qualification && (
                    <p className="text-red-600 mt-0.5">{editForm.formState.errors.qualification.message}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Exp. Years *</label>
                  <input
                    type="number"
                    min="0"
                    {...editForm.register('experienceYears')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  />
                  {editForm.formState.errors.experienceYears && (
                    <p className="text-red-600 mt-0.5">{editForm.formState.errors.experienceYears.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  {...editForm.register('phoneNumber')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                {editForm.formState.errors.phoneNumber && (
                  <p className="text-red-600 mt-0.5">{editForm.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biography (Optional)</label>
                <textarea
                  rows={2}
                  {...editForm.register('bio')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDoctor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editForm.formState.isSubmitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog for Deactivation / Reactivation */}
      {confirmToggleDoctor && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl mb-2">{confirmToggleDoctor.user.isActive ? '⚠️' : '✅'}</div>
            <h3 className="text-lg font-bold text-slate-800">
              {confirmToggleDoctor.user.isActive ? 'Deactivate Doctor Account?' : 'Reactivate Doctor Account?'}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {confirmToggleDoctor.user.isActive
                ? `Deactivating "${confirmToggleDoctor.fullName}" will prevent them from logging in and hide them from new patient bookings. Historical appointments remain intact.`
                : `Reactivating "${confirmToggleDoctor.fullName}" will restore their login access and availability for scheduling.`}
            </p>

            <div className="flex justify-center space-x-3 mt-6">
              <button
                onClick={() => setConfirmToggleDoctor(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                className={`px-4 py-2 text-white text-sm font-medium rounded-lg ${
                  confirmToggleDoctor.user.isActive ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
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
