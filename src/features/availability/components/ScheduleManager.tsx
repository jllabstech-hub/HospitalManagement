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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink">Doctor Schedule Manager</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Welcome <span className="font-semibold text-ink">{doctorName}</span>. Configure your recurring weekly working hours and schedule blocked dates.
        </p>
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

      {/* SECTION 1: WEEKLY RECURRING AVAILABILITY */}
      <section className="card-surface space-y-6 p-6">
        <div className="flex flex-col justify-between gap-2 border-b border-[#dde5e9] pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Weekly Recurring Working Hours</h2>
            <p className="text-xs text-ink-muted">Define the working windows for each day of the week.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {DAYS_OF_WEEK.map(({ day, name }) => {
            const dayWindows = availabilities.filter((a) => a.dayOfWeek === day);

            return (
              <div
                key={day}
                data-testid={`day-card-${day}`}
                className="flex flex-col justify-between rounded-card border border-[#dde5e9] bg-surface-muted p-4"
              >
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-ink">{name}</h3>
                    {dayWindows.length > 0 ? (
                      <span className="rounded-pill bg-accent-100 px-2 py-0.5 text-[10px] font-bold text-accent-800">
                        {dayWindows.length} {dayWindows.length === 1 ? 'Window' : 'Windows'}
                      </span>
                    ) : (
                      <span className="rounded-pill bg-surface-soft px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                        Unavailable
                      </span>
                    )}
                  </div>

                  {/* Windows List */}
                  {dayWindows.length === 0 ? (
                    <p className="mb-4 text-xs italic text-ink-soft">No working hours set</p>
                  ) : (
                    <div className="mb-4 space-y-2">
                      {dayWindows.map((win) => (
                        <div
                          key={win.id}
                          className="flex items-center justify-between rounded-button border border-[#dde5e9] bg-white p-2.5 text-xs shadow-soft"
                        >
                          <span className="font-medium text-ink">
                            {formatTimeTo12Hour(win.startTime)} – {formatTimeTo12Hour(win.endTime)}
                          </span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditWindowModal(win)}
                              className="rounded-button bg-surface-muted px-2 py-1 text-[11px] text-ink-muted transition hover:bg-brand-50 hover:text-brand-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setConfirmDeleteWindow(win)}
                              className="rounded-button bg-rose-50 px-2 py-1 text-[11px] text-rose-600 transition hover:bg-rose-100"
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
                  className="w-full rounded-button border border-brand-200 bg-brand-50 py-2 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
                >
                  + Add Working Window
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 2: BLOCKED DATES & SCHEDULE EXCEPTIONS */}
      <section className="card-surface space-y-6 p-6">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dde5e9] pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Blocked Dates & Schedule Exceptions</h2>
            <p className="text-xs text-ink-muted">Block full days or specific time ranges for leave or hospital meetings.</p>
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
            className="inline-flex items-center justify-center rounded-button bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-amber-700"
          >
            <span>+ Block Date / Range</span>
          </button>
        </div>

        {blockedDates.length === 0 ? (
          <div className="rounded-card border border-dashed border-[#c9d5db] bg-surface-muted p-8 text-center">
            <h4 className="text-sm font-semibold text-ink">No Blocked Dates Scheduled</h4>
            <p className="mt-1 text-xs text-ink-muted">You currently have no leave or partial-day exceptions.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-ink-muted">
              <thead className="border-b border-[#dde5e9] bg-surface-muted text-[11px] font-semibold uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-3">Blocked Date</th>
                  <th className="px-4 py-3">Block Type</th>
                  <th className="px-4 py-3">Time Range</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dde5e9]/60">
                {blockedDates.map((b) => {
                  const startDateStr = formatDateToYYYYMMDD(b.startDate);
                  const isFull = !b.startTime || !b.endTime;

                  return (
                    <tr key={b.id} className="hover:bg-brand-50/40">
                      <td className="px-4 py-3 font-semibold text-ink">{startDateStr}</td>
                      <td className="px-4 py-3">
                        {isFull ? (
                          <span className="rounded-pill bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Full Day Block
                          </span>
                        ) : (
                          <span className="rounded-pill bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
                            Partial Day Block
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">
                        {isFull
                          ? 'Entire Day (00:00 – 23:59)'
                          : `${formatTimeTo12Hour(b.startTime!)} – ${formatTimeTo12Hour(b.endTime!)}`}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {b.reason || <span className="italic text-ink-soft">None specified</span>}
                      </td>
                      <td className="space-x-2 px-4 py-3 text-right">
                        <button
                          onClick={() => openEditBlockModal(b)}
                          className="rounded-button bg-surface-muted px-2.5 py-1 text-ink transition hover:bg-brand-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setConfirmDeleteBlock(b)}
                          className="rounded-button bg-rose-50 px-2.5 py-1 text-rose-600 transition hover:bg-rose-100"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">Add Working Window</h3>
            <p className="mb-4 mt-1 text-xs text-ink-muted">
              Add recurring working hours for {DAYS_OF_WEEK.find((d) => d.day === activeAddDay)?.name}.
            </p>

            <form onSubmit={addAvailForm.handleSubmit(handleAddAvailability)} className="space-y-4 text-xs">
              <input type="hidden" {...addAvailForm.register('dayOfWeek')} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="availStartTime" className="mb-1 block font-semibold text-ink">
                    Start Time *
                  </label>
                  <input
                    id="availStartTime"
                    type="time"
                    {...addAvailForm.register('startTime')}
                    className="input-field !py-2"
                  />
                  {addAvailForm.formState.errors.startTime && (
                    <p className="mt-1 text-rose-600">{addAvailForm.formState.errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="availEndTime" className="mb-1 block font-semibold text-ink">
                    End Time *
                  </label>
                  <input
                    id="availEndTime"
                    type="time"
                    {...addAvailForm.register('endTime')}
                    className="input-field !py-2"
                  />
                  {addAvailForm.formState.errors.endTime && (
                    <p className="mt-1 text-rose-600">{addAvailForm.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setActiveAddDay(null)} className="btn-secondary !px-4 !py-2 !text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addAvailForm.formState.isSubmitting}
                  className="btn-primary !px-4 !py-2 !text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">Edit Working Window</h3>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Modify existing working hours.</p>

            <form onSubmit={editAvailForm.handleSubmit(handleEditAvailability)} className="space-y-4 text-xs">
              <input type="hidden" {...editAvailForm.register('id')} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="editAvailStartTime" className="mb-1 block font-semibold text-ink">
                    Start Time *
                  </label>
                  <input
                    id="editAvailStartTime"
                    type="time"
                    {...editAvailForm.register('startTime')}
                    className="input-field !py-2"
                  />
                  {editAvailForm.formState.errors.startTime && (
                    <p className="mt-1 text-rose-600">{editAvailForm.formState.errors.startTime.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="editAvailEndTime" className="mb-1 block font-semibold text-ink">
                    End Time *
                  </label>
                  <input
                    id="editAvailEndTime"
                    type="time"
                    {...editAvailForm.register('endTime')}
                    className="input-field !py-2"
                  />
                  {editAvailForm.formState.errors.endTime && (
                    <p className="mt-1 text-rose-600">{editAvailForm.formState.errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingWindow(null)} className="btn-secondary !px-4 !py-2 !text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editAvailForm.formState.isSubmitting}
                  className="btn-primary !px-4 !py-2 !text-xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-card border border-[#dde5e9] bg-white p-6 text-center shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">Delete Availability Window?</h3>
            <p className="mt-2 text-xs text-ink-muted">
              Are you sure you want to remove {formatTimeTo12Hour(confirmDeleteWindow.startTime)} –{' '}
              {formatTimeTo12Hour(confirmDeleteWindow.endTime)}?
            </p>

            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setConfirmDeleteWindow(null)}
                className="btn-secondary !px-4 !py-2 !text-xs"
              >
                Cancel
              </button>
              <button onClick={handleDeleteAvailability} className="btn-danger !px-4 !py-2 !text-xs">
                Delete Window
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD BLOCKED DATE MODAL */}
      {isAddBlockOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">Add Blocked Date / Range</h3>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Set leave or partial unavailability.</p>

            <form onSubmit={addBlockForm.handleSubmit(handleAddBlockedDate)} className="space-y-3 text-xs">
              <div>
                <label htmlFor="blockStartDate" className="mb-1 block font-semibold text-ink">
                  Date (YYYY-MM-DD) *
                </label>
                <input
                  id="blockStartDate"
                  type="date"
                  min={getHospitalTodayDateString()}
                  {...addBlockForm.register('startDate')}
                  className="input-field !py-2"
                />
                {addBlockForm.formState.errors.startDate && (
                  <p className="mt-1 text-rose-600">{addBlockForm.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="rounded-card border border-[#dde5e9] bg-surface-muted p-3">
                <label className="flex cursor-pointer items-center space-x-2 font-semibold text-ink">
                  <input
                    type="checkbox"
                    {...addBlockForm.register('isFullDay')}
                    className="h-4 w-4 rounded border-[#dde5e9] text-brand-600 focus:ring-brand-500"
                  />
                  <span>Block Full Day (Entire 24 Hours)</span>
                </label>
              </div>

              {!addBlockForm.watch('isFullDay') && (
                <div className="grid grid-cols-2 gap-3 rounded-card border border-amber-200 bg-amber-50/50 p-3">
                  <div>
                    <label htmlFor="blockStartTime" className="mb-1 block font-semibold text-ink">
                      Blocked Start Time *
                    </label>
                    <input
                      id="blockStartTime"
                      type="time"
                      {...addBlockForm.register('startTime')}
                      className="input-field !py-2"
                    />
                    {addBlockForm.formState.errors.startTime && (
                      <p className="mt-1 text-rose-600">{addBlockForm.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="blockEndTime" className="mb-1 block font-semibold text-ink">
                      Blocked End Time *
                    </label>
                    <input
                      id="blockEndTime"
                      type="time"
                      {...addBlockForm.register('endTime')}
                      className="input-field !py-2"
                    />
                    {addBlockForm.formState.errors.endTime && (
                      <p className="mt-1 text-rose-600">{addBlockForm.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="blockReason" className="mb-1 block font-semibold text-ink">
                  Reason (Optional)
                </label>
                <input
                  id="blockReason"
                  type="text"
                  {...addBlockForm.register('reason')}
                  className="input-field !py-2"
                  placeholder="e.g. Personal Leave, Hospital Meeting"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setIsAddBlockOpen(false)} className="btn-secondary !px-4 !py-2 !text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addBlockForm.formState.isSubmitting}
                  className="inline-flex items-center justify-center rounded-button bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-amber-700 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">Edit Blocked Date</h3>
            <p className="mb-4 mt-1 text-xs text-ink-muted">Modify blocked date range or reason.</p>

            <form onSubmit={editBlockForm.handleSubmit(handleEditBlockedDate)} className="space-y-3 text-xs">
              <input type="hidden" {...editBlockForm.register('id')} />

              <div>
                <label htmlFor="editBlockStartDate" className="mb-1 block font-semibold text-ink">
                  Date (YYYY-MM-DD) *
                </label>
                <input
                  id="editBlockStartDate"
                  type="date"
                  min={getHospitalTodayDateString()}
                  {...editBlockForm.register('startDate')}
                  className="input-field !py-2"
                />
                {editBlockForm.formState.errors.startDate && (
                  <p className="mt-1 text-rose-600">{editBlockForm.formState.errors.startDate.message}</p>
                )}
              </div>

              <div className="rounded-card border border-[#dde5e9] bg-surface-muted p-3">
                <label className="flex cursor-pointer items-center space-x-2 font-semibold text-ink">
                  <input
                    type="checkbox"
                    {...editBlockForm.register('isFullDay')}
                    className="h-4 w-4 rounded border-[#dde5e9] text-brand-600 focus:ring-brand-500"
                  />
                  <span>Block Full Day</span>
                </label>
              </div>

              {!editBlockForm.watch('isFullDay') && (
                <div className="grid grid-cols-2 gap-3 rounded-card border border-amber-200 bg-amber-50/50 p-3">
                  <div>
                    <label htmlFor="editBlockStartTime" className="mb-1 block font-semibold text-ink">
                      Blocked Start Time *
                    </label>
                    <input
                      id="editBlockStartTime"
                      type="time"
                      {...editBlockForm.register('startTime')}
                      className="input-field !py-2"
                    />
                    {editBlockForm.formState.errors.startTime && (
                      <p className="mt-1 text-rose-600">{editBlockForm.formState.errors.startTime.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="editBlockEndTime" className="mb-1 block font-semibold text-ink">
                      Blocked End Time *
                    </label>
                    <input
                      id="editBlockEndTime"
                      type="time"
                      {...editBlockForm.register('endTime')}
                      className="input-field !py-2"
                    />
                    {editBlockForm.formState.errors.endTime && (
                      <p className="mt-1 text-rose-600">{editBlockForm.formState.errors.endTime.message}</p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="editBlockReason" className="mb-1 block font-semibold text-ink">
                  Reason (Optional)
                </label>
                <input
                  id="editBlockReason"
                  type="text"
                  {...editBlockForm.register('reason')}
                  className="input-field !py-2"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button type="button" onClick={() => setEditingBlock(null)} className="btn-secondary !px-4 !py-2 !text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editBlockForm.formState.isSubmitting}
                  className="inline-flex items-center justify-center rounded-button bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-amber-700 disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-sm rounded-card border border-[#dde5e9] bg-white p-6 text-center shadow-elevated">
            <h3 className="font-display text-lg font-semibold text-ink">Remove Blocked Date?</h3>
            <p className="mt-2 text-xs text-ink-muted">
              Are you sure you want to remove the block for {formatDateToYYYYMMDD(confirmDeleteBlock.startDate)}?
            </p>

            <div className="mt-6 flex justify-center space-x-3">
              <button
                onClick={() => setConfirmDeleteBlock(null)}
                className="btn-secondary !px-4 !py-2 !text-xs"
              >
                Cancel
              </button>
              <button onClick={handleDeleteBlockedDate} className="btn-danger !px-4 !py-2 !text-xs">
                Remove Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
