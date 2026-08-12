'use client';

import { useState, useEffect, useCallback, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { AvailableSlot } from '../domain/slot-types';
import { getAvailableSlotsAction, bookAppointmentAction } from '../actions';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import { BookAppointmentSuccessResult } from '../schemas/booking-schema';

interface Props {
  doctorId: string;
  doctorName: string;
  departmentName: string;
  todayDate: string;
  isGuestMode?: boolean;
}

function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

function formatChipLabel(isoDate: string, todayDate: string) {
  if (isoDate === todayDate) return 'Today';
  if (isoDate === addDays(todayDate, 1)) return 'Tomorrow';
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
}

/**
 * Interactive slot selection + booking confirmation.
 * Availability and booking authority remain on the server via Server Actions.
 */
export default function DoctorProfileSlotPicker({
  doctorId,
  doctorName,
  departmentName,
  todayDate,
  isGuestMode = false,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullyBlocked, setIsFullyBlocked] = useState<boolean>(false);

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingConflictMsg, setBookingConflictMsg] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<
    BookAppointmentSuccessResult['appointment'] | null
  >(null);

  const dateChips = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(todayDate, i)),
    [todayDate]
  );

  const fetchSlots = useCallback(
    (dateToFetch: string) => {
      setErrorMsg(null);
      setIsFullyBlocked(false);
      setSelectedSlot(null);

      startTransition(async () => {
        const res = await getAvailableSlotsAction(doctorId, dateToFetch);

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to fetch slots.');
          setSlots([]);
        } else {
          setSlots(res.slots);
          setIsFullyBlocked(Boolean(res.isFullyBlocked));
        }
      });
    },
    [doctorId]
  );

  useEffect(() => {
    fetchSlots(selectedDate);
  }, [fetchSlots, selectedDate]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot || isSubmitting) return;

    setIsSubmitting(true);
    setBookingConflictMsg(null);

    try {
      const res = await bookAppointmentAction({
        doctorId,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
      });

      if (res.success) {
        setBookedAppointment(res.appointment);
        setShowConfirmModal(false);
      } else {
        setBookingConflictMsg(res.message);
        setShowConfirmModal(false);
        fetchSlots(selectedDate);
      }
    } catch (error: unknown) {
      console.error('Booking submission error:', error);
      setBookingConflictMsg('An unexpected error occurred. Please try again.');
      setShowConfirmModal(false);
      fetchSlots(selectedDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const morningSlots = slots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    return hour < 12;
  });

  const afternoonSlots = slots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    return hour >= 12 && hour < 17;
  });

  const eveningSlots = slots.filter((s) => {
    const hour = parseInt(s.startTime.split(':')[0], 10);
    return hour >= 17;
  });

  const renderSlotGroup = (label: string, group: AvailableSlot[]) => {
    if (group.length === 0) return null;
    return (
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
          {label}
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {group.map((slot) => {
            const isSelected = selectedSlot?.startTime === slot.startTime;
            return (
              <button
                key={slot.startTime}
                type="button"
                onClick={() => setSelectedSlot(slot)}
                className={`flex flex-col items-center justify-center rounded-button border p-3 text-xs font-semibold transition duration-brand ${
                  isSelected
                    ? 'border-brand-700 bg-brand-700 text-white shadow-soft ring-2 ring-brand-300'
                    : 'border-[#dde5e9] bg-white text-ink hover:border-brand-400 hover:bg-brand-50'
                }`}
              >
                <span>{formatTimeTo12Hour(slot.startTime)}</span>
                <span
                  className={`mt-0.5 text-[10px] font-medium ${
                    isSelected ? 'text-brand-100' : 'text-ink-soft'
                  }`}
                >
                  30 min
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  if (bookedAppointment) {
    return (
      <div className="mx-auto my-8 max-w-xl space-y-6 rounded-card border border-accent-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-50 text-2xl text-accent-700">
          ✓
        </div>
        <div>
          <span className="rounded-pill bg-accent-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-800">
            Status: {bookedAppointment.status}
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold text-ink">Appointment Booked!</h2>
          <p className="mt-1 text-sm text-ink-muted">Your outpatient consultation has been scheduled.</p>
        </div>

        <div className="space-y-3 rounded-card border border-[#dde5e9] bg-surface-muted p-6 text-left text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Doctor:</span>
            <span className="font-semibold text-ink">{bookedAppointment.doctorName}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Department:</span>
            <span className="font-medium text-ink">{bookedAppointment.departmentName}</span>
          </div>
          <div className="flex justify-between gap-4 border-t border-[#dde5e9] pt-3">
            <span className="text-ink-muted">Date:</span>
            <span className="font-semibold text-brand-700">{bookedAppointment.appointmentDate}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-ink-muted">Time Slot:</span>
            <span className="font-semibold text-brand-700">
              {formatTimeTo12Hour(bookedAppointment.startTime)} –{' '}
              {formatTimeTo12Hour(bookedAppointment.endTime)}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Link href="/patient/dashboard" className="btn-primary">
            Go to Patient Dashboard
          </Link>
          <Link href="/patient/doctors" className="btn-secondary">
            Back to Doctor Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {bookingConflictMsg && (
        <div className="flex items-center justify-between gap-4 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm font-semibold text-amber-900 shadow-soft">
          <span>{bookingConflictMsg}</span>
          <button
            type="button"
            onClick={() => setBookingConflictMsg(null)}
            className="px-2 py-1 text-xs font-bold text-amber-800 hover:text-amber-950"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      <div className="card-surface space-y-6 p-6 sm:p-8">
        <div className="flex flex-col justify-between gap-4 border-b border-[#dde5e9] pb-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-ink">Available Appointments</h2>
            <p className="text-sm text-ink-muted">Pick an available 30-minute consultation slot.</p>
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="slotDatePicker" className="text-xs font-semibold text-ink">
              Date:
            </label>
            <input
              id="slotDatePicker"
              type="date"
              min={todayDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field !w-auto font-medium"
            />
          </div>
        </div>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {dateChips.map((date) => {
            const active = date === selectedDate;
            return (
              <button
                key={date}
                type="button"
                onClick={() => setSelectedDate(date)}
                className={`min-w-[4.75rem] shrink-0 rounded-button border px-3 py-2.5 text-center transition duration-brand ${
                  active
                    ? 'border-brand-700 bg-brand-700 text-white shadow-soft'
                    : 'border-[#dde5e9] bg-white text-ink hover:border-brand-300'
                }`}
              >
                <span className="block text-xs font-semibold">{formatChipLabel(date, todayDate)}</span>
                <span className={`mt-0.5 block text-[10px] ${active ? 'text-brand-100' : 'text-ink-soft'}`}>
                  {date.slice(5)}
                </span>
              </button>
            );
          })}
        </div>

        {isPending && (
          <div className="space-y-2 py-12 text-center text-sm text-ink-muted">
            <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            <p>Checking live doctor schedule...</p>
          </div>
        )}

        {!isPending && errorMsg && (
          <div className="rounded-card border border-rose-200 bg-rose-50 p-4 text-center text-sm font-medium text-rose-800">
            {errorMsg}
          </div>
        )}

        {!isPending && !errorMsg && isFullyBlocked && (
          <div className="space-y-2 rounded-card border border-amber-200 bg-amber-50 p-8 text-center">
            <h4 className="text-sm font-bold text-amber-900">Doctor Unavailable on Date</h4>
            <p className="text-xs text-amber-700">
              The doctor has blocked full-day leave or is unavailable on{' '}
              <strong className="font-semibold">{selectedDate}</strong>. Please select another date.
            </p>
          </div>
        )}

        {!isPending && !errorMsg && !isFullyBlocked && slots.length === 0 && (
          <div className="space-y-2 rounded-card border border-[#dde5e9] bg-surface-muted p-8 text-center">
            <h4 className="text-sm font-bold text-ink">No Appointments Available</h4>
            <p className="text-xs text-ink-muted">
              No 30-minute slots are available for{' '}
              <strong className="font-semibold text-ink">{selectedDate}</strong>. The doctor may be
              off-duty or fully booked.
            </p>
          </div>
        )}

        {!isPending && !errorMsg && slots.length > 0 && (
          <div className="space-y-6">
            {renderSlotGroup('Morning', morningSlots)}
            {renderSlotGroup('Afternoon', afternoonSlots)}
            {renderSlotGroup('Evening', eveningSlots)}

            {selectedSlot && (
              <div className="flex flex-col items-center justify-between gap-4 rounded-card border border-brand-100 bg-brand-50/80 p-4 sm:flex-row">
                <div>
                  <span className="block text-xs font-semibold text-brand-900">
                    Selected Consultation Slot:
                  </span>
                  <span className="text-sm font-bold text-brand-950">
                    {selectedDate} ({formatTimeTo12Hour(selectedSlot.startTime)} –{' '}
                    {formatTimeTo12Hour(selectedSlot.endTime)})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="btn-primary w-full sm:w-auto"
                >
                  Proceed to Confirmation →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfirmModal && selectedSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-booking-title"
            className="w-full max-w-md space-y-6 rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated sm:p-8"
          >
            <div className="border-b border-[#dde5e9] pb-4">
              <span className="rounded-pill border border-brand-100 bg-brand-50 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-brand-700">
                Confirm Booking
              </span>
              <h3 id="confirm-booking-title" className="mt-2 font-display text-xl font-semibold text-ink">
                Confirm Appointment Selection
              </h3>
              <p className="mt-1 text-xs text-ink-muted">
                Review your selected consultation slot before booking.
              </p>
            </div>

            <div className="space-y-3 rounded-card border border-[#dde5e9] bg-surface-muted p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-ink-muted">Doctor:</span>
                <span className="font-semibold text-ink">{doctorName}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-muted">Department:</span>
                <span className="font-medium text-ink">{departmentName}</span>
              </div>
              <div className="flex justify-between gap-4 border-t border-[#dde5e9] pt-2">
                <span className="text-ink-muted">Date:</span>
                <span className="font-semibold text-brand-700">{selectedDate}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-ink-muted">Time Slot:</span>
                <span className="font-semibold text-brand-700">
                  {formatTimeTo12Hour(selectedSlot.startTime)} –{' '}
                  {formatTimeTo12Hour(selectedSlot.endTime)}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="btn-secondary disabled:opacity-50"
              >
                Change Time
              </button>

              {isGuestMode ? (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/patient/doctors/${doctorId}`)}`}
                  className="btn-primary shadow-soft"
                >
                  Enter Mobile Number & Verify OTP →
                </Link>
              ) : (
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmBooking}
                  className="btn-primary disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Booking...</span>
                    </>
                  ) : (
                    <span>Confirm Appointment</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
