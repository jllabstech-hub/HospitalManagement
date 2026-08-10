'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { AvailableSlot } from '../domain/slot-types';
import { getAvailableSlotsAction, bookAppointmentAction } from '../actions';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import { BookAppointmentSuccessResult } from '../schemas/booking-schema';

interface DoctorProfileInfo {
  id: string;
  fullName: string;
  phoneNumber: string;
  qualification: string;
  experienceYears: number;
  bio: string | null;
  department: {
    id: string;
    name: string;
    description: string | null;
  };
}

interface Props {
  doctor: DoctorProfileInfo;
  todayDate: string;
}

export default function DoctorProfileSlotPicker({ doctor, todayDate }: Props) {
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullyBlocked, setIsFullyBlocked] = useState<boolean>(false);

  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Booking state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingConflictMsg, setBookingConflictMsg] = useState<string | null>(null);
  const [bookedAppointment, setBookedAppointment] = useState<BookAppointmentSuccessResult['appointment'] | null>(null);

  // Fetch slots function
  const fetchSlots = useCallback((dateToFetch: string) => {
    setErrorMsg(null);
    setIsFullyBlocked(false);
    setSelectedSlot(null);

    startTransition(async () => {
      const res = await getAvailableSlotsAction(doctor.id, dateToFetch);

      if (!res.success) {
        setErrorMsg(res.error || 'Failed to fetch slots.');
        setSlots([]);
      } else {
        setSlots(res.slots);
        setIsFullyBlocked(Boolean(res.isFullyBlocked));
      }
    });
  }, [doctor.id]);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    fetchSlots(selectedDate);
  }, [fetchSlots, selectedDate]);

  // Handle booking submission
  const handleConfirmBooking = async () => {
    if (!selectedSlot || isSubmitting) return;

    setIsSubmitting(true);
    setBookingConflictMsg(null);

    try {
      const res = await bookAppointmentAction({
        doctorId: doctor.id,
        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
      });

      if (res.success) {
        setBookedAppointment(res.appointment);
        setShowConfirmModal(false);
      } else {
        // Conflict or Validation error: set message, close modal, and refresh available slots
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

  // Group slots into Morning, Afternoon, Evening
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

  // Render Success Screen after booking
  if (bookedAppointment) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-emerald-200 shadow-lg text-center space-y-6 max-w-xl mx-auto my-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 text-3xl mx-auto">
          ✅
        </div>
        <div>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            Status: {bookedAppointment.status}
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 mt-3">Appointment Booked!</h2>
          <p className="text-xs text-slate-500 mt-1">Your outpatient consultation has been scheduled.</p>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-left text-xs space-y-3">
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Doctor:</span>
            <span className="font-bold text-slate-800">{bookedAppointment.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="font-semibold text-slate-700">{bookedAppointment.departmentName}</span>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-3">
            <span className="text-slate-500 font-medium">Date:</span>
            <span className="font-bold text-blue-700">{bookedAppointment.appointmentDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 font-medium">Time Slot:</span>
            <span className="font-bold text-blue-700">
              {formatTimeTo12Hour(bookedAppointment.startTime)} – {formatTimeTo12Hour(bookedAppointment.endTime)}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Link
            href="/patient/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            Go to Patient Dashboard
          </Link>
          <Link
            href="/patient/doctors"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
          >
            Back to Doctor Directory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Booking Conflict Alert Notice */}
      {bookingConflictMsg && (
        <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl text-amber-900 text-xs font-semibold flex items-center justify-between gap-4 shadow-sm animate-pulse">
          <div className="flex items-center space-x-2">
            <span className="text-lg">⚠️</span>
            <span>{bookingConflictMsg}</span>
          </div>
          <button
            onClick={() => setBookingConflictMsg(null)}
            className="text-amber-700 hover:text-amber-950 font-bold text-xs px-2 py-1"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      {/* Doctor Profile Header Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-2">
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {doctor.department.name}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {doctor.experienceYears} Years Experience
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800">{doctor.fullName}</h1>
            <p className="text-sm font-semibold text-blue-600 mt-1">{doctor.qualification}</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
            <p><strong className="text-slate-700">Contact:</strong> {doctor.phoneNumber}</p>
            <p><strong className="text-slate-700">Department:</strong> {doctor.department.name}</p>
            <p><strong className="text-slate-700">Consultation:</strong> 30 Minutes</p>
          </div>
        </div>

        {doctor.bio && (
          <div className="border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">About Doctor</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{doctor.bio}</p>
          </div>
        )}
      </div>

      {/* Date & Slot Selection Container */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">📅 Select Appointment Date & Slot</h2>
            <p className="text-xs text-slate-500">Pick an available 30-minute consultation slot.</p>
          </div>

          {/* Date Picker Input */}
          <div className="flex items-center space-x-2">
            <label htmlFor="slotDatePicker" className="text-xs font-semibold text-slate-700">
              Date:
            </label>
            <input
              id="slotDatePicker"
              type="date"
              min={todayDate}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white font-medium text-slate-800"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {isPending && (
          <div className="py-12 text-center text-slate-500 text-xs space-y-2">
            <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p>Checking live doctor schedule...</p>
          </div>
        )}

        {/* Error State */}
        {!isPending && errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Fully Blocked State */}
        {!isPending && !errorMsg && isFullyBlocked && (
          <div className="p-8 text-center bg-amber-50 rounded-2xl border border-amber-200 space-y-2">
            <div className="text-3xl">🚫</div>
            <h4 className="text-sm font-bold text-amber-900">Doctor Unavailable on Date</h4>
            <p className="text-xs text-amber-700">
              The doctor has blocked full-day leave or is unavailable on <strong className="font-semibold">{selectedDate}</strong>. Please select another date.
            </p>
          </div>
        )}

        {/* Empty Slots State */}
        {!isPending && !errorMsg && !isFullyBlocked && slots.length === 0 && (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="text-3xl">📅</div>
            <h4 className="text-sm font-bold text-slate-700">No Appointments Available</h4>
            <p className="text-xs text-slate-500">
              No 30-minute slots are available for <strong className="font-semibold text-slate-700">{selectedDate}</strong>. The doctor may be off-duty or fully booked.
            </p>
          </div>
        )}

        {/* Slots Available Display */}
        {!isPending && !errorMsg && slots.length > 0 && (
          <div className="space-y-6">
            {/* Morning Section */}
            {morningSlots.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                  <span>🌅 Morning Slots (Before 12:00 PM)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {morningSlots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span>{formatTimeTo12Hour(slot.startTime)}</span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          to {formatTimeTo12Hour(slot.endTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Afternoon Section */}
            {afternoonSlots.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                  <span>☀️ Afternoon Slots (12:00 PM - 05:00 PM)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {afternoonSlots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span>{formatTimeTo12Hour(slot.startTime)}</span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          to {formatTimeTo12Hour(slot.endTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Evening Section */}
            {eveningSlots.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center space-x-2">
                  <span>🌙 Evening Slots (After 05:00 PM)</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {eveningSlots.map((slot) => {
                    const isSelected = selectedSlot?.startTime === slot.startTime;
                    return (
                      <button
                        key={slot.startTime}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-400'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 hover:bg-blue-50/50'
                        }`}
                      >
                        <span>{formatTimeTo12Hour(slot.startTime)}</span>
                        <span className={`text-[10px] font-medium mt-0.5 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                          to {formatTimeTo12Hour(slot.endTime)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Selected Slot Action Bar */}
            {selectedSlot && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-blue-50/80 p-4 rounded-xl border border-blue-100">
                <div>
                  <span className="text-xs font-semibold text-blue-900 block">Selected Consultation Slot:</span>
                  <span className="text-sm font-extrabold text-blue-950">
                    {selectedDate} ({formatTimeTo12Hour(selectedSlot.startTime)} – {formatTimeTo12Hour(selectedSlot.endTime)})
                  </span>
                </div>
                <button
                  onClick={() => setShowConfirmModal(true)}
                  className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition transform hover:-translate-y-0.5"
                >
                  Proceed to Confirmation →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOOKING CONFIRMATION MODAL */}
      {showConfirmModal && selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Confirm Booking
              </span>
              <h3 className="text-xl font-extrabold text-slate-800 mt-2">Confirm Appointment Selection</h3>
              <p className="text-xs text-slate-500 mt-1">Review your selected consultation slot before booking.</p>
            </div>

            {/* Details Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Doctor:</span>
                <span className="font-bold text-slate-800">{doctor.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-700">{doctor.department.name}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <span className="text-slate-500 font-medium">Date:</span>
                <span className="font-bold text-blue-700">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Time Slot:</span>
                <span className="font-bold text-blue-700">
                  {formatTimeTo12Hour(selectedSlot.startTime)} – {formatTimeTo12Hour(selectedSlot.endTime)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl disabled:opacity-50"
              >
                Change Time
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmBooking}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Booking...</span>
                  </>
                ) : (
                  <span>Confirm Appointment</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
