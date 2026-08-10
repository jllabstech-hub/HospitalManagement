'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import {
  confirmDoctorAppointmentAction,
  completeDoctorAppointmentAction,
  noShowDoctorAppointmentAction,
  cancelDoctorAppointmentAction,
} from '../actions';
import { AppointmentStatus } from '@prisma/client';

interface Props {
  appointmentId: string;
  currentStatus: AppointmentStatus | string;
}

export default function DoctorAppointmentActionButtons({ appointmentId, currentStatus }: Props) {
  const [actionType, setActionType] = useState<'confirm' | 'complete' | 'noshow' | 'cancel' | null>(null);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleExecuteAction = () => {
    setErrorMsg(null);
    startTransition(async () => {
      let res: { success: boolean; error?: string } = { success: false };

      if (actionType === 'confirm') {
        res = await confirmDoctorAppointmentAction({ appointmentId });
      } else if (actionType === 'complete') {
        res = await completeDoctorAppointmentAction({ appointmentId });
      } else if (actionType === 'noshow') {
        res = await noShowDoctorAppointmentAction({ appointmentId });
      } else if (actionType === 'cancel') {
        res = await cancelDoctorAppointmentAction({ appointmentId, cancellationReason: reason.trim() || undefined });
      }

      if (res.success) {
        setActionType(null);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to update appointment status.');
      }
    });
  };

  // Terminal states have no actions
  if (
    currentStatus === AppointmentStatus.COMPLETED ||
    currentStatus === AppointmentStatus.CANCELLED ||
    currentStatus === AppointmentStatus.NO_SHOW
  ) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap gap-2 justify-end">
        {currentStatus === AppointmentStatus.BOOKED && (
          <button
            onClick={() => setActionType('confirm')}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Confirm
          </button>
        )}

        {currentStatus === AppointmentStatus.CONFIRMED && (
          <>
            <button
              onClick={() => setActionType('complete')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              Complete
            </button>
            <button
              onClick={() => setActionType('noshow')}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
            >
              No-Show
            </button>
          </>
        )}

        {(currentStatus === AppointmentStatus.BOOKED || currentStatus === AppointmentStatus.CONFIRMED) && (
          <button
            onClick={() => setActionType('cancel')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={actionType !== null}
        title={
          actionType === 'confirm'
            ? 'Confirm Appointment'
            : actionType === 'complete'
            ? 'Complete Consultation'
            : actionType === 'noshow'
            ? 'Mark Patient No-Show'
            : 'Cancel Appointment'
        }
        description={
          actionType === 'confirm'
            ? 'Confirm this booked consultation slot?'
            : actionType === 'complete'
            ? 'Mark this consultation as successfully completed?'
            : actionType === 'noshow'
            ? 'Mark this patient as absent/no-show for their consultation?'
            : 'Cancel this appointment? The slot will be released.'
        }
        confirmLabel={
          actionType === 'confirm'
            ? 'Confirm Appointment'
            : actionType === 'complete'
            ? 'Mark Completed'
            : actionType === 'noshow'
            ? 'Mark No-Show'
            : 'Yes, Cancel'
        }
        variant={actionType === 'cancel' ? 'danger' : actionType === 'complete' ? 'success' : 'primary'}
        isPending={isPending}
        onConfirm={handleExecuteAction}
        onClose={() => setActionType(null)}
      >
        <div className="space-y-3">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          {actionType === 'cancel' && (
            <div>
              <label htmlFor="docCancelReasonInput" className="block text-xs font-semibold text-slate-700 mb-1">
                Cancellation Reason (Optional):
              </label>
              <input
                id="docCancelReasonInput"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Doctor emergency leave"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
