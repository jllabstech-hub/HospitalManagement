import Image from 'next/image';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';

const STATS_COUNTER = [
  { value: '25+', label: 'Specialty Clinics', icon: '🏥' },
  { value: '50k+', label: 'Happy Patients', icon: '👨‍👩‍👧‍👦' },
  { value: '100+', label: 'Senior Consultants', icon: '🩺' },
  { value: '99.8%', label: 'Clinical Accuracy', icon: '⭐' },
];

interface AboutSectionProps {
  profile?: {
    hospitalName?: string | null;
    shortDescription?: string | null;
    city?: string | null;
  } | null;
}

export default function AboutSection({ profile }: AboutSectionProps) {
  const hospitalName = profile?.hospitalName ?? 'CarePulse Hospital';
  const city = profile?.city ?? 'Bengaluru';

  return (
    <section id="about" className="section-pad relative overflow-hidden bg-gradient-to-b from-white via-surface-warm/40 to-white scroll-mt-28">
      {/* Background Decorative Mesh Pattern */}
      <div className="absolute inset-0 pattern-dots opacity-40 pointer-events-none" aria-hidden />

      <div className="container-page relative grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Left Side: Interactive Hospital Image + Animated Glass Floating Badges */}
        <div className="relative lg:col-span-6 animate-fade-in">
          <div className="group relative aspect-[4/3] sm:aspect-[16/11] overflow-hidden rounded-card border border-[#dde5e9]/90 shadow-card transition-all duration-500 hover:shadow-elevated">
            <Image
              src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1400&q=75"
              alt={`${hospitalName} facility`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1024px) 100vw, 600px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-brand-950/70 via-transparent to-transparent opacity-60 transition duration-brand group-hover:opacity-40" />

            {/* Bottom Overlay Info Tag */}
            <div className="absolute bottom-4 left-4 right-4 rounded-button border border-white/20 bg-brand-950/70 p-3.5 backdrop-blur-md text-white">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-200">
                {hospitalName} · {city}
              </p>
              <p className="mt-0.5 text-xs text-brand-100/90">
                24/7 Emergency Care · Multi-Specialty Hospital
              </p>
            </div>
          </div>

          {/* Apollo-Style Floating Glass Accent Card */}
          <div className="absolute -bottom-6 -right-4 sm:right-6 animate-fade-up hidden sm:flex items-center gap-3.5 rounded-card border border-white/80 bg-white/90 p-4 shadow-elevated backdrop-blur-md transition-all duration-300 hover:scale-105">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-xl shadow-inner">
              ✓
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wide text-ink">NABH Accredited</p>
              <p className="text-[11px] font-semibold text-brand-700">Top-Tier Clinical Standards</p>
            </div>
          </div>
        </div>

        {/* Right Side: Apollo Inspired Content + Live Counter Metrics */}
        <div className="space-y-6 lg:col-span-6 animate-fade-up">
          <SectionHeader
            eyebrow={`About ${hospitalName}`}
            title="Pioneering Outpatient & Specialized Healthcare Excellence"
            description={
              profile?.shortDescription ??
              `${hospitalName} in ${city} combines world-class medical expertise, advanced diagnostic technologies, and a patient-first digital ecosystem—ensuring every consultation is seamless from booking to recovery.`
            }
          />

          {/* Apollo-Style 4-Grid Live Counter Cards */}
          <div className="grid grid-cols-2 gap-3.5 pt-2 sm:grid-cols-4">
            {STATS_COUNTER.map((stat, idx) => (
              <div
                key={stat.label}
                className="group rounded-card border border-[#dde5e9]/80 bg-white p-3.5 text-center shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-brand-50/50 hover:shadow-card"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <span className="text-lg">{stat.icon}</span>
                <span className="block mt-1 font-display text-xl font-extrabold text-brand-800 group-hover:text-brand-900">
                  {stat.value}
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold leading-tight text-ink-muted">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Value Feature Highlights */}
          <ul className="space-y-3.5 pt-1 text-sm text-ink-muted">
            <li className="flex items-start gap-3 transition duration-brand hover:text-ink">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                ✓
              </span>
              <span>
                <strong className="font-semibold text-ink">Live Schedule Booking:</strong> Real-time 30-minute OPD slots in Asia/Kolkata timezone.
              </span>
            </li>
            <li className="flex items-start gap-3 transition duration-brand hover:text-ink">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                ✓
              </span>
              <span>
                <strong className="font-semibold text-ink">Complete Transparency:</strong> Track appointment progression live from booking to completion.
              </span>
            </li>
            <li className="flex items-start gap-3 transition duration-brand hover:text-ink">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                ✓
              </span>
              <span>
                <strong className="font-semibold text-ink">Integrated Care Portals:</strong> Dedicated portals for patients, senior doctors, and administrators.
              </span>
            </li>
          </ul>

          <div className="pt-3 flex flex-wrap items-center gap-4">
            <Link
              href="/about/overview"
              className="btn-primary shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all duration-200"
            >
              Explore Hospital Overview →
            </Link>
            <Link
              href="/doctors"
              className="btn-secondary hover:-translate-y-0.5 transition-all duration-200"
            >
              Meet Our Doctors
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

