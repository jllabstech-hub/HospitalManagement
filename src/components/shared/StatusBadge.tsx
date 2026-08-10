import { AppointmentStatus } from '@prisma/client';

interface Props {
  status: AppointmentStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-200';
  let icon = '📌';
  let label = status;

  switch (status) {
    case AppointmentStatus.BOOKED:
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-200';
      icon = '📅';
      label = 'BOOKED';
      break;
    case AppointmentStatus.CONFIRMED:
      badgeStyle = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      icon = '✅';
      label = 'CONFIRMED';
      break;
    case AppointmentStatus.COMPLETED:
      badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      icon = '🏁';
      label = 'COMPLETED';
      break;
    case AppointmentStatus.CANCELLED:
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      icon = '🚫';
      label = 'CANCELLED';
      break;
    case AppointmentStatus.NO_SHOW:
      badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
      icon = '⚠️';
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
      className={`inline-flex items-center space-x-1.5 rounded-full border uppercase tracking-wider ${badgeStyle} ${sizeStyle}`}
      title={`Appointment Status: ${label}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
