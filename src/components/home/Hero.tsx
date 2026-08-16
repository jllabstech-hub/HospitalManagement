import Link from 'next/link';
import Image from 'next/image';
import { APP_CONFIG } from '@/config';

const DEFAULT_HERO =
  'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=2400&q=80';

interface HeroProps {
  profile?: {
    hospitalName: string;
    tagline?: string | null;
    shortDescription?: string | null;
    heroImageUrl?: string | null;
    emergencyPhone?: string | null;
    city?: string | null;
  } | null;
}

function HeroMedia({ src, alt }: { src: string; alt: string }) {
  const useNextImage = src.startsWith('/') || src.includes('images.unsplash.com');
  if (useNextImage) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />
    );
  }
  return (
    // CMS-hosted banners may sit on hosts not listed in next/image.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover object-center" />
  );
}

export default function Hero({ profile }: HeroProps) {
  const name = profile?.hospitalName ?? APP_CONFIG.shortName;
  const tagline = profile?.tagline ?? APP_CONFIG.tagline;
  const description =
    profile?.shortDescription ??
    'Find the right specialist, choose a convenient 30-minute consultation slot, and manage your outpatient appointments with a calm, modern hospital experience.';
  const emergencyPhone = profile?.emergencyPhone ?? '+91 80 4567 8999';
  const city = profile?.city ?? 'Bengaluru';
  const heroSrc = profile?.heroImageUrl?.trim() || DEFAULT_HERO;
  const emergencyHref = `tel:${emergencyPhone.replace(/[^0-9+]/g, '')}`;

  return (
    <section className="relative isolate min-h-[min(92vh,54rem)] overflow-hidden bg-brand-950">
      <div className="absolute inset-0">
        <HeroMedia src={heroSrc} alt="" />
      </div>
      <div
        className="absolute inset-0 bg-gradient-to-r from-brand-950 via-brand-950/88 to-brand-950/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-brand-950/80 via-transparent to-brand-950/40"
        aria-hidden
      />

      <div className="relative z-10">
        <div className="border-b border-white/10 bg-brand-950/40 backdrop-blur-sm">
          <div className="container-page flex flex-wrap items-center justify-between gap-3 py-2.5 text-[11px] font-medium tracking-wide text-brand-100 sm:text-xs">
            <p className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-70" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-300" />
              </span>
              24/7 emergency &amp; trauma desk
            </p>
            <a href={emergencyHref} className="font-semibold text-white transition hover:text-brand-100">
              Helpline {emergencyPhone}
            </a>
          </div>
        </div>

        <div className="container-page flex min-h-[min(78vh,46rem)] flex-col justify-center py-16 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-200">
              {city} · Multi-speciality hospital
            </p>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              {name}
              <span className="mt-3 block text-2xl font-medium leading-snug text-brand-100 sm:text-3xl lg:text-[2rem]">
                {tagline}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-100/85 sm:text-lg">
              {description}
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/book-appointment"
                className="inline-flex items-center justify-center rounded-button bg-white px-7 py-3.5 text-sm font-semibold text-brand-950 shadow-elevated transition hover:bg-brand-50"
              >
                Book an Appointment
              </Link>
              <Link
                href="/doctors"
                className="inline-flex items-center justify-center rounded-button border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/10"
              >
                Find a Doctor
              </Link>
            </div>
          </div>

          <dl className="mt-16 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-card border border-white/15 bg-white/10 backdrop-blur-md">
            <div className="px-4 py-5 sm:px-6">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">Clinics</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-white">30+</dd>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">Consultants</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-white">150+</dd>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-brand-200">Emergency</dt>
              <dd className="mt-1 font-display text-2xl font-semibold text-white">24/7</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
