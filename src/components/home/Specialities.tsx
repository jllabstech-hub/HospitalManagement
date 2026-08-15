'use client';

import { useState } from 'react';
import Link from 'next/link';
import SectionHeader from '@/components/ui/SectionHeader';

interface Speciality {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  icon?: string | null;
}

interface Dept {
  id: string;
  name: string;
  slug?: string;
  description: string | null;
}

interface Props {
  specialities?: Speciality[];
  departments: Dept[];
}

export default function Specialities({ specialities, departments }: Props) {
  const items =
    specialities && specialities.length > 0
      ? specialities.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          href: `/specialities/${s.slug}`,
          description: s.shortDescription || 'Comprehensive tertiary care and specialized consultations.',
        }))
      : departments.map((d) => ({
          id: d.id,
          name: d.name,
          slug: d.slug ?? 'department',
          href: d.slug ? `/departments/${d.slug}` : '/departments',
          description: d.description || 'Specialized clinical services and senior consultant outpatient OPD.',
        }));

  const [activeTabId, setActiveTabId] = useState<string>(items[0]?.id ?? '');

  const activeItem = items.find((i) => i.id === activeTabId) ?? items[0];

  return (
    <section id="specialities" className="section-pad-sm scroll-mt-28 border-y border-[#dde5e9]/80 bg-surface-warm/30">
      <div className="container-page">
        <SectionHeader
          eyebrow="Clinical Excellence"
          title="Explore Our Centres of Speciality"
          description="Interactive specialty finder—browse treatments, key procedures, and book consultations."
          action={
            <Link href="/specialities" className="btn-secondary">
              View All Specialities →
            </Link>
          }
        />

        {/* Interactive Micro-Tab Navigation Bar */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
          {items.map((item) => {
            const isActive = item.id === (activeItem?.id ?? '');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTabId(item.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-300 ${
                  isActive
                    ? 'bg-brand-800 text-white shadow-md scale-105 ring-2 ring-brand-400/30'
                    : 'bg-white text-ink-muted hover:bg-brand-50 hover:text-brand-800 border border-[#dde5e9]'
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Selected Speciality Spotlight Card with Animations */}
        {activeItem && (
          <div className="mt-6 rounded-card border border-brand-200 bg-white p-6 sm:p-8 shadow-card animate-fade-in-up">
            <div className="grid gap-6 lg:grid-cols-12 items-center">
              <div className="lg:col-span-8 space-y-3">
                <span className="rounded-full bg-brand-100 px-3 py-1 text-[11px] font-bold text-brand-800 uppercase tracking-wider">
                  Featured Department
                </span>
                <h3 className="font-display text-2xl font-bold text-ink">{activeItem.name}</h3>
                <p className="text-sm leading-relaxed text-ink-muted">{activeItem.description}</p>

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className="text-emerald-600">✓</span> 24/7 OPD & Emergency Care
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className="text-emerald-600">✓</span> Internationally Trained Consultants
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className="text-emerald-600">✓</span> Advanced Modular Surgical Suites
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                    <span className="text-emerald-600">✓</span> Instant Appointment Confirmation
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-center">
                <Link
                  href={`/book-appointment?speciality=${activeItem.slug}`}
                  className="btn-primary !w-full justify-center !py-3 shadow-soft hover:scale-105"
                >
                  📅 Book Doctor in {activeItem.name}
                </Link>
                <Link
                  href={activeItem.href}
                  className="btn-secondary !w-full justify-center !py-3 hover:border-brand-300"
                >
                  Learn More About {activeItem.name} →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
