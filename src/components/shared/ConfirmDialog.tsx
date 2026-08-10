'use client';

import { ReactNode, useEffect } from 'react';

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  variant?: 'danger' | 'primary' | 'success';
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancel',
  variant = 'primary',
  isPending = false,
  onConfirm,
  onClose,
  children,
}: Props) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isPending) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPending, onClose]);

  if (!isOpen) return null;

  let btnStyle = 'bg-blue-600 hover:bg-blue-700 text-white';
  if (variant === 'danger') {
    btnStyle = 'bg-rose-600 hover:bg-rose-700 text-white';
  } else if (variant === 'success') {
    btnStyle = 'bg-emerald-600 hover:bg-emerald-700 text-white';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
    >
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-200 space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 id="dialog-title" className="text-xl font-extrabold text-slate-800">
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        {children && <div className="text-xs text-slate-600">{children}</div>}

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-slate-400"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-2 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${btnStyle}`}
          >
            {isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmLabel}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
