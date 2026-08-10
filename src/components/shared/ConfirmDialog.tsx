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

  let btnStyle = 'btn-primary';
  if (variant === 'danger') {
    btnStyle = 'btn-danger';
  } else if (variant === 'success') {
    btnStyle = 'inline-flex items-center justify-center gap-2 rounded-button bg-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-700 disabled:opacity-50';
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]"
    >
      <div className="w-full max-w-md space-y-6 rounded-card border border-[#dde5e9] bg-white p-6 shadow-elevated sm:p-8">
        <div className="border-b border-[#dde5e9] pb-4">
          <h3 id="dialog-title" className="font-display text-xl font-semibold text-ink">
            {title}
          </h3>
          <p className="mt-1 text-xs text-ink-muted">{description}</p>
        </div>

        {children && <div className="text-xs text-ink-muted">{children}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isPending}
            onClick={onClose}
            className="btn-secondary disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={onConfirm}
            className={`${btnStyle} disabled:opacity-50`}
          >
            {isPending ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
