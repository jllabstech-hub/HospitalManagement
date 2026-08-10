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
      <div className="flex flex-wrap justify-end gap-2">
        {currentStatus === AppointmentStatus.BOOKED && (
          <button
            type="button"
            onClick={() => setActionType('confirm')}
            className="btn-primary !rounded-button !px-3 !py-1.5 !text-xs"
          >
            Confirm
          </button>
        )}

        {currentStatus === AppointmentStatus.CONFIRMED && (
          <>
            <button
              type="button"
              onClick={() => setActionType('complete')}
              className="inline-flex items-center justify-center rounded-button bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-accent-700"
            >
              Complete
            </button>
            <button
              type="button"
              onClick={() => setActionType('noshow')}
              className="inline-flex items-center justify-center rounded-button bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-soft transition hover:bg-amber-700"
            >
              No-Show
            </button>
          </>
        )}

        {(currentStatus === AppointmentStatus.BOOKED || currentStatus === AppointmentStatus.CONFIRMED) && (
          <button
            type="button"
            onClick={() => setActionType('cancel')}
            className="btn-danger !px-3 !py-1.5 !text-xs"
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
            <div className="rounded-card border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              {errorMsg}
            </div>
          )}

          {actionType === 'cancel' && (
            <div>
              <label htmlFor="docCancelReasonInput" className="mb-1 block text-xs font-semibold text-ink">
                Cancellation Reason (Optional):
              </label>
              <input
                id="docCancelReasonInput"
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Doctor emergency leave"
                className="input-field !py-2 !text-xs"
              />
            </div>
          )}
        </div>
      </ConfirmDialog>
    </>
  );
}
