'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  CreateAvailabilitySchema,
  CreateAvailabilityInput,
  UpdateAvailabilitySchema,
  UpdateAvailabilityInput,
  CreateBlockedDateSchema,
  CreateBlockedDateInput,
  UpdateBlockedDateSchema,
  UpdateBlockedDateInput,
} from '../schemas';
import {
  createAvailabilityAction,
  updateAvailabilityAction,
  deleteAvailabilityAction,
  createBlockedDateAction,
  updateBlockedDateAction,
  deleteBlockedDateAction,
} from '../actions';
import { formatTimeTo12Hour, formatDateToYYYYMMDD, getHospitalTodayDateString } from '@/lib/date-utils';

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday' },
  { day: 2, name: 'Tuesday' },
  { day: 3, name: 'Wednesday' },
  { day: 4, name: 'Thursday' },
  { day: 5, name: 'Friday' },
  { day: 6, name: 'Saturday' },
  { day: 0, name: 'Sunday' },
];

interface AvailabilityWindow {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface BlockedDateItem {
  id: string;
  startDate: Date | string;
  endDate: Date | string;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface Props {
  availabilities: AvailabilityWindow[];
  blockedDates: BlockedDateItem[];
  doctorName: string;
}

export default function ScheduleManager({ availabilities, blockedDates, doctorName }: Props) {
  // Modal states
  const [activeAddDay, setActiveAddDay] = useState<number | null>(null);
  const [editingWindow, setEditingWindow] = useState<AvailabilityWindow | null>(null);
  const [confirmDeleteWindow, setConfirmDeleteWindow] = useState<AvailabilityWindow | null>(null);

  const [isAddBlockOpen, setIsAddBlockOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedDateItem | null>(null);
  const [confirmDeleteBlock, setConfirmDeleteBlock] = useState<BlockedDateItem | null>(null);

  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Availability Form Hooks
  const addAvailForm = useForm<CreateAvailabilityInput>({
    resolver: zodResolver(CreateAvailabilitySchema),
    defaultValues: { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
  });

  const editAvailForm = useForm<UpdateAvailabilityInput>({
    resolver: zodResolver(UpdateAvailabilitySchema),
  });

  // Blocked Date Form Hooks
  const addBlockForm = useForm<CreateBlockedDateInput>({
    resolver: zodResolver(CreateBlockedDateSchema),
    defaultValues: {
      startDate: getHospitalTodayDateString(),
      endDate: getHospitalTodayDateString(),
      isFullDay: true,
      startTime: '',
      endTime: '',
      reason: '',
    },
  });

  const editBlockForm = useForm<UpdateBlockedDateInput>({
    resolver: zodResolver(UpdateBlockedDateSchema),
  });

  // Availability Submissions
  const handleAddAvailability = async (data: CreateAvailabilityInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await createAvailabilityAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Availability window added successfully!');
    setActiveAddDay(null);
    addAvailForm.reset();
  };

  const handleEditAvailability = async (data: UpdateAvailabilityInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await updateAvailabilityAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Availability window updated successfully!');
    setEditingWindow(null);
  };

  const handleDeleteAvailability = async () => {
    if (!confirmDeleteWindow) return;
    setServerError(null);
    setSuccessMessage(null);

    const res = await deleteAvailabilityAction(confirmDeleteWindow.id);
    if (!res.success) {
      setServerError(res.error);
    } else {
      setSuccessMessage('Availability window deleted.');
    }

    setConfirmDeleteWindow(null);
  };

  // Blocked Date Submissions
  const handleAddBlockedDate = async (data: CreateBlockedDateInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await createBlockedDateAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Blocked date created successfully!');
    setIsAddBlockOpen(false);
    addBlockForm.reset();
  };

  const handleEditBlockedDate = async (data: UpdateBlockedDateInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const res = await updateBlockedDateAction(data);
    if (!res.success) {
      setServerError(res.error);
      return;
    }

    setSuccessMessage('Blocked date updated successfully!');
    setEditingBlock(null);
  };

  const handleDeleteBlockedDate = async () => {
    if (!confirmDeleteBlock) return;
    setServerError(null);
    setSuccessMessage(null);

    const res = await deleteBlockedDateAction(confirmDeleteBlock.id);
    if (!res.success) {
      setServerError(res.error);
    } else {
      setSuccessMessage('Blocked date entry removed.');
    }

    setConfirmDeleteBlock(null);
  };

  const openAddWindowModal = (day: number) => {
    setActiveAddDay(day);
    addAvailForm.reset({
      dayOfWeek: day,
      startTime: '09:00',
      endTime: '17:00',
    });
  };

  const openEditWindowModal = (win: AvailabilityWindow) => {
    setEditingWindow(win);
    editAvailForm.reset({
      id: win.id,
      startTime: win.startTime.slice(0, 5),
      endTime: win.endTime.slice(0, 5),
    });
  };

  const openEditBlockModal = (block: BlockedDateItem) => {
    setEditingBlock(block);
    const startDateStr = formatDateToYYYYMMDD(block.startDate);
    const endDateStr = formatDateToYYYYMMDD(block.endDate);
    const isFull = !block.startTime || !block.endTime;

    editBlockForm.reset({
      id: block.id,
      startDate: startDateStr,
      endDate: endDateStr,
      isFullDay: isFull,
      startTime: block.startTime ? block.startTime.slice(0, 5) : '',
      endTime: block.endTime ? block.endTime.slice(0, 5) : '',
      reason: block.reason || '',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Doctor Schedule Manager</h1>
        <p className="text-sm text-slate-500 mt-1">
          Welcome <span className="font-semibold text-slate-700">{doctorName}</span>. Configure your recurring weekly working hours and schedule blocked dates.
        </p>
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

      {/* SECTION 1: WEEKLY RECURRING AVAILABILITY */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📅 Weekly Recurring Working Hours</h2>
            <p className="text-xs text-slate-500">Define the working windows for each day of the week.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS_OF_WEEK.map(({ day, name }) => {
            const dayWindows = availabilities.filter((a) => a.dayOfWeek === day);

            return (
              <div
                key={day}
                data-testid={`day-card-${day}`}
                className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-sm text-slate-800">{name}</h3>
                    {dayWindows.length > 0 ? (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        {dayWindows.length} {dayWindows.length === 1 ? 'Window' : 'Windows'}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-slate-200 text-slate-600 font-medium px-2 py-0.5 rounded-full">
                        Unavailable
                      </span>
                    )}
                  </div>

                  {/* Windows List */}
                  {dayWindows.length === 0 ? (
                    <p className="text-xs text-slate-400 italic mb-4">No working hours set</p>
                  ) : (
                    <div className="space-y-2 mb-4">
                      {dayWindows.map((win) => (
                        <div
                          key={win.id}
                          className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs flex justify-between items-center text-xs"
                        >
                          <span className="font-medium text-slate-700">
                            {formatTimeTo12Hour(win.startTime)} – {formatTimeTo12Hour(win.endTime)}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditWindowModal(win)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteWindow(win)}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded text-[11px]"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => openAddWindowModal(day)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg border border-blue-200 transition"
                >
                  + Add Working Window
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: BLOCKED DATES & SCHEDULE EXCEPTIONS */}
      <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">🚫 Blocked Dates & Schedule Exceptions</h2>
            <p className="text-xs text-slate-500">Block full days or specific time ranges for leave or hospital meetings.</p>
          </div>
          <button
            onClick={() => {
              setServerError(null);
              addBlockForm.reset({
                startDate: getHospitalTodayDateString(),
                endDate: getHospitalTodayDateString(),
                isFullDay: true,
                startTime: '',
                endTime: '',
                reason: '',
              });
              setIsAddBlockOpen(true);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center space-x-2"
          >
            <span>+ Block Date / Range</span>
          </button>
        </div>

        {blockedDates.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <div className="text-3xl mb-2">🌴</div>
            <h4 className="text-sm font-semibold text-slate-700">No Blocked Dates Scheduled</h4>
            <p className="text-xs text-slate-500 mt-1">You currently have no leave or partial-day exceptions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Blocked Date</th>
                  <th className="px-4 py-3">Block Type</th>
                  <th className="px-4 py-3">Time Range</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {blockedDates.map((b) => {
                  const startDateStr = formatDateToYYYYMMDD(b.startDate);
                  const isFull = !b.startTime || !b.endTime;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-semibold text-slate-800">{startDateStr}</td>
                      <td className="px-4 py-3">
                        {isFull ? (
                          <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Full Day Block
                          </span>
                        ) : (
                          <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            Partial Day Block
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">
                        {isFull
                          ? 'Entire Day (00:00 – 23:59)'
                          : `${formatTimeTo12Hour(b.startTime!)} – ${formatTimeTo12Hour(b.endTime!)}`}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{b.reason || <span className="italic text-slate-400">None specified</span>}</td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => openEditBlockModal(b)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteBlock(b)}
                          className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ADD AVAILABILITY MODAL */}
      {activeAddDay !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Add Working Window</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add recurring working hours for {DAYS_OF_WEEK.find((d) => d.day === activeAddDay)?.name}.
            </p>

            <form onSubmit={addAvailForm.handleSubmit(handleAddAvailability)} className="space-y-4 text-xs">
              <input type="hidden" {...addAvailForm.register('dayOfWeek')} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="availStartTime" className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    id="availStartTime"
                    type="time"
                    {...addAvailForm.register('startTime')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {addAvailForm.formState.errors.startTime && (
                    <p className="text-red-600 mt-1">{addAvailForm.formState.errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="availEndTime" className="block font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    id="availEndTime"
                    type="time"
                    {...addAvailForm.register('endTime')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {addAvailForm.formState.errors.endTime && (
                    <p className="text-red-600 mt-1">{addAvailForm.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveAddDay(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAvailForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {addAvailForm.formState.isSubmitting ? 'Saving...' : 'Add Window'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT AVAILABILITY MODAL */}
      {editingWindow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Edit Working Window</h3>
            <p className="text-xs text-slate-500 mb-4">Modify existing working hours.</p>

            <form onSubmit={editAvailForm.handleSubmit(handleEditAvailability)} className="space-y-4 text-xs">
              <input type="hidden" {...editAvailForm.register('id')} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editAvailStartTime" className="block font-semibold text-slate-700 mb-1">Start Time *</label>
                  <input
                    id="editAvailStartTime"
                    type="time"
                    {...editAvailForm.register('startTime')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {editAvailForm.formState.errors.startTime && (
                    <p className="text-red-600 mt-1">{editAvailForm.formState.errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="editAvailEndTime" className="block font-semibold text-slate-700 mb-1">End Time *</label>
                  <input
                    id="editAvailEndTime"
                    type="time"
                    {...editAvailForm.register('endTime')}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {editAvailForm.formState.errors.endTime && (
                    <p className="text-red-600 mt-1">{editAvailForm.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWindow(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editAvailForm.formState.isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {editAvailForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE WINDOW DIALOG */}
      {confirmDeleteWindow && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl mb-2">🗑️</div>
            <h3 className="text-lg font-bold text-slate-800">Delete Availability Window?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove {formatTimeTo12Hour(confirmDeleteWindow.startTime)} – {formatTimeTo12Hour(confirmDeleteWindow.endTime)}?
            </p>

            <div className="flex justify-center space-x-3 mt-6">
              <button
                onClick={() => setConfirmDeleteWindow(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAvailability}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
              >
                Delete Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BLOCKED DATE MODAL */}
      {isAddBlockOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Add Blocked Date / Range</h3>
            <p className="text-xs text-slate-500 mb-4">Set leave or partial unavailability.</p>

            <form onSubmit={addBlockForm.handleSubmit(handleAddBlockedDate)} className="space-y-3 text-xs">
              <div>
                <label htmlFor="blockStartDate" className="block font-semibold text-slate-700 mb-1">Date (YYYY-MM-DD) *</label>
                <input
                  id="blockStartDate"
                  type="date"
                  min={getHospitalTodayDateString()}
                  {...addBlockForm.register('startDate')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {addBlockForm.formState.errors.startDate && (
                  <p className="text-red-600 mt-1">{addBlockForm.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    {...addBlockForm.register('isFullDay')}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span>Block Full Day (Entire 24 Hours)</span>
                </label>
              </div>

              {!addBlockForm.watch('isFullDay') && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                  <div>
                    <label htmlFor="blockStartTime" className="block font-semibold text-slate-700 mb-1">Blocked Start Time *</label>
                    <input
                      id="blockStartTime"
                      type="time"
                      {...addBlockForm.register('startTime')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                    {addBlockForm.formState.errors.startTime && (
                      <p className="text-red-600 mt-1">{addBlockForm.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="blockEndTime" className="block font-semibold text-slate-700 mb-1">Blocked End Time *</label>
                    <input
                      id="blockEndTime"
                      type="time"
                      {...addBlockForm.register('endTime')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                    {addBlockForm.formState.errors.endTime && (
                      <p className="text-red-600 mt-1">{addBlockForm.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="blockReason" className="block font-semibold text-slate-700 mb-1">Reason (Optional)</label>
                <input
                  id="blockReason"
                  type="text"
                  {...addBlockForm.register('reason')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  placeholder="e.g. Personal Leave, Hospital Meeting"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBlockOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBlockForm.formState.isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {addBlockForm.formState.isSubmitting ? 'Saving...' : 'Add Blocked Date'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT BLOCKED DATE MODAL */}
      {editingBlock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Edit Blocked Date</h3>
            <p className="text-xs text-slate-500 mb-4">Modify blocked date range or reason.</p>

            <form onSubmit={editBlockForm.handleSubmit(handleEditBlockedDate)} className="space-y-3 text-xs">
              <input type="hidden" {...editBlockForm.register('id')} />

              <div>
                <label htmlFor="editBlockStartDate" className="block font-semibold text-slate-700 mb-1">Date (YYYY-MM-DD) *</label>
                <input
                  id="editBlockStartDate"
                  type="date"
                  min={getHospitalTodayDateString()}
                  {...editBlockForm.register('startDate')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                {editBlockForm.formState.errors.startDate && (
                  <p className="text-red-600 mt-1">{editBlockForm.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center space-x-2 font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    {...editBlockForm.register('isFullDay')}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <span>Block Full Day</span>
                </label>
              </div>

              {!editBlockForm.watch('isFullDay') && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-xl border border-amber-200">
                  <div>
                    <label htmlFor="editBlockStartTime" className="block font-semibold text-slate-700 mb-1">Blocked Start Time *</label>
                    <input
                      id="editBlockStartTime"
                      type="time"
                      {...editBlockForm.register('startTime')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                    {editBlockForm.formState.errors.startTime && (
                      <p className="text-red-600 mt-1">{editBlockForm.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="editBlockEndTime" className="block font-semibold text-slate-700 mb-1">Blocked End Time *</label>
                    <input
                      id="editBlockEndTime"
                      type="time"
                      {...editBlockForm.register('endTime')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none bg-white"
                    />
                    {editBlockForm.formState.errors.endTime && (
                      <p className="text-red-600 mt-1">{editBlockForm.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="editBlockReason" className="block font-semibold text-slate-700 mb-1">Reason (Optional)</label>
                <input
                  id="editBlockReason"
                  type="text"
                  {...editBlockForm.register('reason')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBlock(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBlockForm.formState.isSubmitting}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg disabled:opacity-50"
                >
                  {editBlockForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE BLOCK DIALOG */}
      {confirmDeleteBlock && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 border border-slate-200 text-center">
            <div className="text-3xl mb-2">🗑️</div>
            <h3 className="text-lg font-bold text-slate-800">Remove Blocked Date?</h3>
            <p className="text-xs text-slate-500 mt-2">
              Are you sure you want to remove the block for {formatDateToYYYYMMDD(confirmDeleteBlock.startDate)}?
            </p>

            <div className="flex justify-center space-x-3 mt-6">
              <button
                onClick={() => setConfirmDeleteBlock(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteBlockedDate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg"
              >
                Remove Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
