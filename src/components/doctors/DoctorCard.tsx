import Link from 'next/link';
import { cn } from '@/lib/utils';

interface DoctorCardProps {
  doctor: {
    id: string;
    fullName: string;
    qualification: string;
    experienceYears: number;
    designation?: string | null;
    bio?: string | null;
    profileImageUrl?: string | null;
    department: { name: string };
  };
  href?: string;
  bookHref?: string;
  publicMode?: boolean;
  className?: string;
}

export default function DoctorCard({
  doctor,
  href,
  bookHref,
  className,
}: DoctorCardProps) {
  const profileHref = href || `/doctors/${doctor.id}`;
  const bookLink = bookHref || `/book-appointment?doctorId=${doctor.id}`;

  const displayName = doctor.fullName.startsWith('Dr') ? doctor.fullName : `Dr ${doctor.fullName}`;
  const designationText = doctor.designation || `Consultant ${doctor.department.name}`;

  return (
    <div
      className={cn(
        'group flex h-full flex-col justify-between rounded-card border border-[#dde5e9]/80 bg-white p-5 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:shadow-card',
        className
      )}
    >
      <div className="space-y-4">
        {/* Top Header Row: Doctor Avatar + Title */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-brand-100 bg-gradient-to-br from-brand-50 to-brand-100/70 shadow-sm transition duration-brand group-hover:border-brand-300 group-hover:shadow-md">
              {doctor.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doctor.profileImageUrl}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-brand-700/80" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}
            </div>
            <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" title="Available for OPD" />
          </div>

          <div className="min-w-0 flex-1">
            <Link href={profileHref} className="group-hover:text-brand-800">
              <h3 className="truncate font-display text-lg font-bold tracking-tight text-ink group-hover:text-brand-800">
                {displayName}
              </h3>
            </Link>
            <p className="mt-0.5 text-xs font-semibold text-brand-700">
              {doctor.qualification}
            </p>
            <p className="mt-1 line-clamp-2 text-xs font-medium text-ink-muted">
              {designationText}
            </p>
          </div>
        </div>

        {/* Info Badges Row: Location & Experience Pills */}
        <div className="grid gap-2 pt-1 text-xs">
          <div className="flex items-center gap-2 rounded-button bg-surface-muted px-3 py-1.5 font-semibold text-ink-muted">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-brand-600 shrink-0" aria-hidden>
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="truncate">CarePulse Main Campus · Bengaluru</span>
          </div>

          <div className="flex items-center gap-2 rounded-button bg-surface-muted px-3 py-1.5 font-semibold text-ink-muted">
            <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-brand-600 shrink-0" aria-hidden>
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <span>Experience: {doctor.experienceYears}+ Yrs</span>
          </div>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="mt-5 pt-3 border-t border-[#dde5e9]/70 grid gap-2 sm:grid-cols-2">
        <Link
          href={profileHref}
          className="inline-flex items-center justify-center rounded-button border border-[#dde5e9] bg-white px-3 py-2 text-xs font-bold text-ink transition duration-brand hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
        >
          View Profile
        </Link>
        <Link
          href={bookLink}
          className="inline-flex items-center justify-center rounded-button bg-brand-700 px-3 py-2 text-xs font-bold text-white shadow-soft transition duration-brand hover:bg-brand-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          Book Appointment
        </Link>
      </div>
    </div>
  );
}

