import { AppointmentStatus } from '@prisma/client';
import { cn } from '@/lib/utils';

interface Props {
  status: AppointmentStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  let badgeStyle = 'bg-surface-muted text-ink-muted border-[#dde5e9]';
  let label = status;

  switch (status) {
    case AppointmentStatus.BOOKED:
      badgeStyle = 'bg-brand-50 text-brand-800 border-brand-200';
      label = 'BOOKED';
      break;
    case AppointmentStatus.CONFIRMED:
      badgeStyle = 'bg-brand-100 text-brand-900 border-brand-300';
      label = 'CONFIRMED';
      break;
    case AppointmentStatus.COMPLETED:
      badgeStyle = 'bg-accent-50 text-accent-800 border-accent-200';
      label = 'COMPLETED';
      break;
    case AppointmentStatus.CANCELLED:
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'CANCELLED';
      break;
    case AppointmentStatus.NO_SHOW:
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'NO-SHOW';
      break;
  }

  const sizeStyle =
    size === 'lg'
      ? 'px-3 py-1.5 text-xs font-bold'
      : size === 'md'
        ? 'px-2.5 py-1 text-[11px] font-bold'
        : 'px-2 py-0.5 text-[10px] font-extrabold';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill border uppercase tracking-wider shadow-soft',
        badgeStyle,
        sizeStyle
      )}
      title={`Appointment Status: ${label}`}
    >
      <span>{label}</span>
    </span>
  );
}
