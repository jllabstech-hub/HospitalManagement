import Link from 'next/link';
import Card from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: {
    id: string;
    fullName: string;
    qualification: string;
    experienceYears: number;
    bio?: string | null;
    department: { name: string };
  };
  href?: string;
  bookHref?: string;
  publicMode?: boolean;
  className?: string;
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export default function DoctorCard({
  doctor,
  href,
  bookHref,
  publicMode = false,
  className,
}: DoctorCardProps) {
  const profileHref = href || `/patient/doctors/${doctor.id}`;
  const bookLink = bookHref || `/patient/doctors/${doctor.id}`;

  return (
    <Card hover className={cn('flex h-full flex-col', className)}>
      <div className="flex items-start gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-brand-100 font-display text-lg font-semibold text-brand-800"
          aria-hidden
        >
          {initials(doctor.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-pill bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand-700">
              {doctor.department.name}
            </span>
            <span className="text-[11px] font-medium text-ink-soft">
              {doctor.experienceYears} yrs exp.
            </span>
          </div>
          <h3 className="mt-2 truncate text-lg font-semibold text-ink">{doctor.fullName}</h3>
          <p className="text-sm font-medium text-brand-700">{doctor.qualification}</p>
        </div>
      </div>

      {doctor.bio && (
        <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-ink-muted">{doctor.bio}</p>
      )}

      <div className="mt-auto flex flex-col gap-2 border-t border-[#dde5e9] pt-5 sm:flex-row">
        <Link href={profileHref} className="btn-secondary flex-1 text-center">
          {publicMode ? 'View Profile' : 'View Profile & Book →'}
        </Link>
        {publicMode && (
          <Link href={bookLink} className="btn-primary flex-1 text-center">
            Book Appointment
          </Link>
        )}
      </div>
    </Card>
  );
}
