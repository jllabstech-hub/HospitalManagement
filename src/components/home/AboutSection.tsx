import Image from 'next/image';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';

export default function AboutSection() {
  return (
    <section id="about" className="section-pad scroll-mt-28">
      <div className="container-page grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[5/4] overflow-hidden rounded-card shadow-card">
          <Image
            src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1400&q=75"
            alt="Modern hospital corridor with natural light"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 560px"
          />
        </div>
        <div>
          <SectionHeader
            eyebrow="About the hospital"
            title="A modern home for outpatient excellence"
            description="CarePulse Hospital brings together specialist clinics, thoughtful scheduling, and a secure patient portal—so every visit feels organized from the first click to the consultation room."
          />
          <ul className="mt-6 space-y-3 text-sm text-ink-muted">
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Live doctor availability with Asia/Kolkata hospital time
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Transparent appointment statuses from booked to completed
            </li>
            <li className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              Dedicated portals for patients, doctors, and hospital administrators
            </li>
          </ul>
          <div className="mt-8">
            <Link href="/about/overview" className="btn-primary">
              Learn more about us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
