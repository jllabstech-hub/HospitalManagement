'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { cancelPatientAppointmentAction } from '../actions';

interface Props {
  appointmentId: string;
}

export default function PatientCancelButton({ appointmentId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConfirmCancel = () => {
    setErrorMsg(null);
    startTransition(async () => {
      const res = await cancelPatientAppointmentAction({
        appointmentId,
        cancellationReason: reason.trim() || undefined,
      });

      if (res.success) {
        setIsOpen(false);
        router.refresh();
      } else {
        setErrorMsg(res.error || 'Failed to cancel appointment.');
      }
    });
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="btn-danger !px-5 !py-2.5 !text-xs">
        Cancel Appointment
      </button>

      <ConfirmDialog
        isOpen={isOpen}
        title="Cancel Appointment"
        description="Are you sure you want to cancel this appointment? This action cannot be undone and your slot will be released for other patients."
        confirmLabel="Yes, Cancel Appointment"
        cancelLabel="Keep Appointment"
        variant="danger"
        isPending={isPending}
        onConfirm={handleConfirmCancel}
        onClose={() => setIsOpen(false)}
      >
        <div className="space-y-3">
          {errorMsg && (
            <div className="rounded-card border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
              {errorMsg}
            </div>
          )}
          <div>
            <label htmlFor="cancelReasonInput" className="mb-1 block text-xs font-semibold text-ink">
              Cancellation Reason (Optional):
            </label>
            <input
              id="cancelReasonInput"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better"
              className="input-field !py-2 !text-xs"
            />
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
