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
      <button
        onClick={() => setIsOpen(true)}
        className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
      >
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
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs font-semibold">
              {errorMsg}
            </div>
          )}
          <div>
            <label htmlFor="cancelReasonInput" className="block text-xs font-semibold text-slate-700 mb-1">
              Cancellation Reason (Optional):
            </label>
            <input
              id="cancelReasonInput"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
        </div>
      </ConfirmDialog>
    </>
  );
}
