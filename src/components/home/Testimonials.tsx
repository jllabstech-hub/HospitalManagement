'use client';

import { useState, useEffect } from 'react';
import SectionHeader from '@/components/ui/SectionHeader';
import Card from '@/components/ui/Card';

const FALLBACK_TESTIMONIALS = [
  {
    quote:
      'Booking was straightforward—I found a cardiologist, picked a morning slot, and received clear confirmation in the portal.',
    name: 'Ananya R.',
    rating: 5,
    context: 'Cardiology OPD · Verified Patient',
  },
  {
    quote:
      'The schedule felt calm and predictable. I could see my upcoming visit details and test reports without calling the front desk.',
    name: 'Vikram S.',
    rating: 5,
    context: 'Neurology Follow-Up · Verified Patient',
  },
  {
    quote:
      'Searching by department helped me choose the right specialist quickly. The patient portal kept everything organized.',
    name: 'Meera K.',
    rating: 5,
    context: 'Orthopedics Clinic · Verified Patient',
  },
  {
    quote:
      'The emergency team acted swiftly when my father had acute chest pain. Exceptional trauma response and nursing care.',
    name: 'Rajesh P.',
    rating: 5,
    context: 'Emergency & Critical Care · Verified Patient',
  },
];

interface CmsTestimonial {
  displayName: string;
  text: string;
  rating: number | null;
  isDemoContent: boolean;
  speciality?: { name: string } | null;
}

export default function Testimonials({ testimonials }: { testimonials?: CmsTestimonial[] }) {
  const items =
    testimonials && testimonials.length > 0
      ? testimonials.slice(0, 6).map((t) => ({
          quote: t.text,
          name: t.displayName,
          rating: t.rating ?? 5,
          context: [
            t.speciality?.name,
            t.isDemoContent ? 'Illustrative Sample' : 'Verified Patient Feedback',
          ]
            .filter(Boolean)
            .join(' · '),
        }))
      : FALLBACK_TESTIMONIALS;

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [items.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  return (
    <section className="section-pad bg-gradient-to-b from-white via-surface-soft/60 to-white">
      <div className="container-page">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeader
            eyebrow="Patient Voices & Recovery Stories"
            title="Experiences from Our Outpatient Community"
            description="Apollo & Vijaya style verified patient reflections. Hear directly from patients treated at CarePulse Hospital."
          />
          {/* Slider Navigation Buttons */}
          <div className="flex items-center gap-2 mb-4 sm:mb-0">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dde5e9] bg-white text-ink font-bold shadow-soft transition hover:bg-brand-50 hover:text-brand-800"
            >
              ←
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next testimonial"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dde5e9] bg-white text-ink font-bold shadow-soft transition hover:bg-brand-50 hover:text-brand-800"
            >
              →
            </button>
          </div>
        </div>

        {/* Carousel Slide Cards Container */}
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {items.slice(currentIndex, currentIndex + 3).concat(
            items.slice(0, Math.max(0, currentIndex + 3 - items.length))
          ).map((item, idx) => (
            <Card
              key={item.name + idx}
              hover
              className="flex h-full flex-col bg-white p-6 border border-[#dde5e9] shadow-soft hover:shadow-card animate-fade-in-up"
            >
              {/* Star Rating */}
              <div className="flex items-center gap-1 text-amber-500 text-sm">
                {'★'.repeat(item.rating)}
                <span className="ml-2 text-xs font-bold text-ink-muted">5.0 / 5.0</span>
              </div>

              <p className="mt-4 flex-1 text-sm leading-relaxed text-ink italic">
                &ldquo;{item.quote}&rdquo;
              </p>

              <div className="mt-6 border-t border-[#dde5e9] pt-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-ink text-sm">{item.name}</p>
                  <p className="text-xs text-ink-muted">{item.context}</p>
                </div>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  ✓
                </span>
              </div>
            </Card>
          ))}
        </div>

        {/* Dot Indicators */}
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentIndex ? 'w-8 bg-brand-700' : 'w-2 bg-brand-200'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
