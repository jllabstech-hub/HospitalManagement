import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import Card from '@/components/ui/Card';
import { formatTimeTo12Hour } from '@/lib/date-utils';
import { AppointmentStatus } from '@prisma/client';

interface AppointmentCardProps {
  dateStr: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus | string;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
  linkLabel?: string;
}

export default function AppointmentCard({
  dateStr,
  startTime,
  endTime,
  status,
  title,
  subtitle,
  meta,
  href,
  linkLabel = 'View Details →',
}: AppointmentCardProps) {
  return (
    <Card hover className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-3">
        {subtitle ? (
          <span className="rounded-pill bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
            {subtitle}
          </span>
        ) : (
          <span />
        )}
        <StatusBadge status={status} />
      </div>
      <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
      {meta && <p className="mt-1 text-sm text-brand-700">{meta}</p>}
      <div className="mt-4 space-y-1 text-sm text-ink-muted">
        <p>
          <span className="font-medium text-ink">Date:</span> {dateStr}
        </p>
        <p>
          <span className="font-medium text-ink">Time:</span>{' '}
          {formatTimeTo12Hour(startTime)} – {formatTimeTo12Hour(endTime)}
        </p>
      </div>
      <div className="mt-auto border-t border-[#dde5e9] pt-4 text-right">
        <Link
          href={href}
          className="inline-flex rounded-button border border-[#dde5e9] bg-white px-4 py-2 text-xs font-semibold text-brand-800 transition hover:border-brand-300 hover:bg-brand-50"
        >
          {linkLabel}
        </Link>
      </div>
    </Card>
  );
}
