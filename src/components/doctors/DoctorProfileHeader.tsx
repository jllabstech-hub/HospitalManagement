interface DoctorProfileHeaderProps {
  doctor: {
    fullName: string;
    phoneNumber: string;
    qualification: string;
    experienceYears: number;
    bio: string | null;
    department: {
      name: string;
      description: string | null;
    };
  };
}

function initials(name: string) {
  return name
    .replace(/^Dr\.?\s*/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

/**
 * Server-rendered doctor profile summary for SSR/SEO.
 * Interactive booking UI lives in DoctorProfileSlotPicker.
 */
export default function DoctorProfileHeader({ doctor }: DoctorProfileHeaderProps) {
  return (
    <div className="card-surface space-y-6 p-6 sm:p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div className="flex gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-brand-100 font-display text-2xl font-semibold text-brand-800"
            aria-hidden
          >
            {initials(doctor.fullName)}
          </div>
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-pill bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-800">
                {doctor.department.name}
              </span>
              <span className="text-xs font-medium text-ink-muted">
                {doctor.experienceYears} Years Experience
              </span>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
              {doctor.fullName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-brand-700">{doctor.qualification}</p>
          </div>
        </div>

        <div className="space-y-1 rounded-card border border-[#dde5e9] bg-surface-muted p-4 text-sm text-ink-muted">
          <p>
            <strong className="text-ink">Contact:</strong> {doctor.phoneNumber}
          </p>
          <p>
            <strong className="text-ink">Department:</strong> {doctor.department.name}
          </p>
          <p>
            <strong className="text-ink">Consultation:</strong> 30 Minutes
          </p>
        </div>
      </div>

      {doctor.bio && (
        <div className="border-t border-[#dde5e9] pt-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            About Doctor
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">{doctor.bio}</p>
        </div>
      )}

      {doctor.department.description && (
        <div className="border-t border-[#dde5e9] pt-4">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Department
          </h2>
          <p className="text-sm leading-relaxed text-ink-muted">{doctor.department.description}</p>
        </div>
      )}
    </div>
  );
}
