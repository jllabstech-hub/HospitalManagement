import Link from 'next/link';
import Image from 'next/image';
import { APP_CONFIG } from '@/config';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-mesh" aria-hidden />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=2000&q=60)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/85 to-brand-800/55" aria-hidden />

      <div className="container-page relative grid min-h-[min(88vh,52rem)] items-center gap-10 py-16 lg:grid-cols-12 lg:py-24">
        <div className="animate-fade-up lg:col-span-7">
          <p className="eyebrow text-brand-200">{APP_CONFIG.shortName} Hospital</p>
          <h1 className="mt-4 max-w-xl font-display text-[1.75rem] font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
            Exceptional Care.
            <span className="mt-1 block text-brand-100">Right When You Need It.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-100/90 sm:text-lg">
            Find the right specialist, choose a convenient 30-minute consultation slot, and
            manage your outpatient appointments with a calm, modern hospital experience.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/book-appointment"
              className="inline-flex items-center justify-center rounded-button bg-white px-6 py-3.5 text-sm font-semibold text-brand-800 shadow-elevated transition duration-brand hover:bg-brand-50"
            >
              Book an Appointment
            </Link>
            <Link
              href="/doctors"
              className="inline-flex items-center justify-center rounded-button border border-white/30 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition duration-brand hover:bg-white/10"
            >
              Find a Doctor
            </Link>
          </div>

          <div className="mt-10 max-w-xl rounded-card border border-white/15 bg-white/10 p-4 backdrop-blur-md sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand-100">
              Start your visit
            </p>
            <p className="mt-2 text-sm text-brand-50/90">
              Sign in to search doctors by speciality, view live availability, and book a
              consultation in minutes.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/register" className="btn-secondary !bg-white !text-brand-800">
                Register as Patient
              </Link>
              <Link href="/login" className="btn-ghost !text-white hover:!bg-white/10">
                Already have an account?
              </Link>
            </div>
          </div>
        </div>

        <div className="relative hidden animate-fade-in lg:col-span-5 lg:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-elevated ring-1 ring-white/20">
            <Image
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=75"
              alt="Physician consulting with a patient in a modern clinic"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0px, 420px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <p className="text-sm font-semibold">Coordinated outpatient care</p>
              <p className="mt-1 text-xs text-brand-100">
                Specialists · Clear scheduling · Secure patient portal
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
