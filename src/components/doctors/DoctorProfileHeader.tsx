interface DoctorProfileHeaderProps {
  doctor: {
    fullName: string;
    phoneNumber?: string;
    qualification: string;
    experienceYears: number;
    designation?: string | null;
    bio?: string | null;
    profileImageUrl?: string | null;
    department: {
      name: string;
      description?: string | null;
    };
  };
}

/**
 * Doctor Profile Header Component.
 */
export default function DoctorProfileHeader({ doctor }: DoctorProfileHeaderProps) {
  const displayName = doctor.fullName.startsWith('Dr') ? doctor.fullName : `Dr ${doctor.fullName}`;
  const designationText = doctor.designation || `Senior Consultant ${doctor.department.name}`;

  return (
    <div className="card-surface overflow-hidden space-y-6 p-6 sm:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        {/* Left Side: Avatar + Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-brand-50 to-brand-100/80 shadow-md">
              {doctor.profileImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={doctor.profileImageUrl}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 24 24" className="h-14 w-14 text-brand-700/80" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              )}
            </div>
            <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white bg-emerald-500" title="Active Specialist" />
          </div>

          <div className="space-y-1">
            <span className="inline-block rounded-pill bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-800">
              {doctor.department.name}
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">
              {displayName}
            </h1>
            <p className="text-sm font-bold text-brand-700">{doctor.qualification}</p>
            <p className="text-sm font-medium text-ink-muted">{designationText}</p>
          </div>
        </div>

        {/* Right Side: Doctor Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold">
          <div className="rounded-card border border-[#dde5e9] bg-surface-muted p-3 text-center">
            <span className="block text-ink-muted">Experience</span>
            <span className="mt-1 block text-base font-bold text-brand-800">{doctor.experienceYears}+ Yrs</span>
          </div>

          <div className="rounded-card border border-[#dde5e9] bg-surface-muted p-3 text-center">
            <span className="block text-ink-muted">Consultation</span>
            <span className="mt-1 block text-base font-bold text-brand-800">30 Min Slot</span>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-card border border-[#dde5e9] bg-surface-muted p-3 text-center">
            <span className="block text-ink-muted">Location</span>
            <span className="mt-1 block text-sm font-bold text-ink">Bengaluru</span>
          </div>
        </div>
      </div>

      {doctor.bio && (
        <div className="border-t border-[#dde5e9] pt-4">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-wider text-brand-900/80">
            About Doctor
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">{doctor.bio}</p>
        </div>
      )}
    </div>
  );
}

