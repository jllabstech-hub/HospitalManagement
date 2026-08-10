import Link from 'next/link';

export default function AppointmentCTA() {
  return (
    <section className="section-pad-sm">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-card hero-mesh px-6 py-12 text-center shadow-elevated sm:px-12 sm:py-16">
          <div className="absolute inset-0 pattern-dots opacity-20" aria-hidden />
          <div className="relative mx-auto max-w-2xl">
            <p className="eyebrow text-brand-200">Ready when you are</p>
            <h2 className="mt-3 font-display text-display-sm text-white sm:text-display-md text-balance">
              Ready to take the next step?
            </h2>
            <p className="mt-4 text-base text-brand-100">
              Create a patient account or sign in to book your next outpatient consultation.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/book-appointment"
                className="inline-flex w-full items-center justify-center rounded-button bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 sm:w-auto"
              >
                Book an Appointment
              </Link>
              <Link
                href="/register"
                className="inline-flex w-full items-center justify-center rounded-button border border-white/30 px-6 py-3.5 text-sm font-semibold text-white sm:w-auto"
              >
                Register as Patient
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
