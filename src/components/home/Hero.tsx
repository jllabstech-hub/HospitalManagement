import Link from 'next/link';
import Image from 'next/image';
import { APP_CONFIG } from '@/config';

interface HeroProps {
  profile?: {
    hospitalName: string;
    tagline?: string | null;
    shortDescription?: string | null;
    heroImageUrl?: string | null;
    emergencyPhone?: string | null;
  } | null;
}

export default function Hero({ profile }: HeroProps) {
  const name = profile?.hospitalName ?? APP_CONFIG.shortName;
  const tagline = profile?.tagline ?? 'Right When You Need It.';
  const description =
    profile?.shortDescription ??
    'Find the right specialist, choose a convenient 30-minute consultation slot, and manage your outpatient appointments with a calm, modern hospital experience.';
  const emergencyPhone = profile?.emergencyPhone ?? '+91 80 4567 8999';

  return (
    <section className="relative overflow-hidden">
      {/* Apollo / Manipal Style 24/7 Emergency Ticker Bar */}
      <div className="relative z-20 bg-gradient-to-r from-rose-900 via-red-800 to-rose-900 px-4 py-2 text-white shadow-md">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-rose-400">
              <span className="h-2 w-2 animate-ping rounded-full bg-white" />
            </span>
            <span className="font-extrabold uppercase tracking-wider text-rose-200">
              24/7 Level-1 Emergency & Trauma Care Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <span className="hidden md:inline text-rose-100">
              🚑 Ambulance & Critical Care Helpline:
            </span>
            <a
              href={`tel:${emergencyPhone.replace(/[^0-9+]/g, '')}`}
              className="rounded bg-white/20 px-2.5 py-0.5 font-mono font-bold text-white transition hover:bg-white/30"
            >
              {emergencyPhone}
            </a>
            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center text-rose-200 hover:text-white hover:underline"
            >
              Emergency Desk →
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 hero-mesh" aria-hidden />
      <div
        className="absolute inset-0 opacity-30 mix-blend-overlay"
        style={{
          backgroundImage: `url(${profile?.heroImageUrl || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=2000&q=60'})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-950/95 via-brand-900/85 to-brand-800/55" aria-hidden />

      <div className="container-page relative grid min-h-[min(85vh,50rem)] items-center gap-10 py-12 lg:grid-cols-12 lg:py-20">
        <div className="animate-fade-in-up lg:col-span-7">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-500/20 px-3 py-1 text-xs font-bold text-brand-200 border border-brand-300/30">
              ★ NABH Accredited Multi-Speciality Institute
            </span>
          </div>

          <h1 className="mt-4 max-w-xl font-display text-3xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl text-balance">
            {name}
            <span className="mt-1 block text-brand-100">{tagline}</span>
          </h1>

          <p className="mt-5 max-w-lg text-base leading-relaxed text-brand-100/90 sm:text-lg">
            {description}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/book-appointment"
              className="inline-flex items-center justify-center rounded-button bg-white px-6 py-3.5 text-sm font-bold text-brand-900 shadow-elevated transition duration-brand hover:scale-105 hover:bg-brand-50"
            >
              📅 Book Appointment Online
            </Link>
            <Link
              href="/doctors"
              className="inline-flex items-center justify-center rounded-button border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition duration-brand hover:bg-white/20"
            >
              👨‍⚕️ Find a Specialist
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 border-t border-white/15 pt-6 text-white max-w-xl">
            <div>
              <p className="font-display text-xl font-extrabold text-white">30+</p>
              <p className="text-xs text-brand-200">Specialist Clinics</p>
            </div>
            <div>
              <p className="font-display text-xl font-extrabold text-white">150+</p>
              <p className="text-xs text-brand-200">Senior Consultants</p>
            </div>
            <div>
              <p className="font-display text-xl font-extrabold text-white">24/7</p>
              <p className="text-xs text-brand-200">Emergency & OTs</p>
            </div>
          </div>
        </div>

        <div className="relative hidden animate-float-subtle lg:col-span-5 lg:block">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card shadow-elevated ring-1 ring-white/20">
            <Image
              src={profile?.heroImageUrl || "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=75"}
              alt={`${name} medical consultation`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 0px, 420px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <span className="rounded bg-brand-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                Excellence in Healthcare
              </span>
              <p className="mt-2 text-sm font-semibold">Coordinated Outpatient Care</p>
              <p className="mt-1 text-xs text-brand-100">
                Robotic Surgery · Precision Diagnostics · 30-Min Appointments
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
