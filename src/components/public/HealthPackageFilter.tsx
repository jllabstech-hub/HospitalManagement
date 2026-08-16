'use client';

import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import CmsRecordImage from '@/components/cms/CmsRecordImage';

export interface PackageItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl?: string | null;
  price: number | { toNumber?: () => number } | null;
  currency: string | null;
  duration: string | null;
  isDemoPricing: boolean;
}

interface Props {
  packages: PackageItem[];
}

const CATEGORIES = ['All', 'Master Health', 'Cardiac Care', 'Women Wellness', 'Senior Citizen'];

function formatPrice(price: number | { toNumber?: () => number } | null, currency: string | null) {
  if (price == null) return null;
  const numPrice = typeof price === 'number' ? price : Number(price);
  const cur = currency ?? 'INR';
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: cur }).format(numPrice);
}

export default function HealthPackageFilter({ packages }: Props) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredPackages = packages.filter((pkg) => {
    if (selectedCategory === 'All') return true;
    return pkg.name.toLowerCase().includes(selectedCategory.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition-all duration-300 ${
                isActive
                  ? 'bg-brand-800 text-white shadow-md scale-105'
                  : 'bg-white text-ink-muted hover:bg-brand-50 hover:text-brand-800 border border-[#dde5e9]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Package Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredPackages.map((pkg) => (
          <Card
            key={pkg.id}
            hover
            padding="none"
            className="flex h-full flex-col overflow-hidden bg-white border border-[#dde5e9] shadow-soft hover:shadow-card animate-fade-in-up"
          >
            <CmsRecordImage src={pkg.imageUrl} fallbackTitle={pkg.name} alt={`${pkg.name} health check package`} />
            <div className="flex h-full flex-col p-6">
            <div className="flex items-center justify-between">
              <span className="rounded bg-brand-100 px-2.5 py-0.5 text-[10px] font-bold text-brand-800 uppercase tracking-wider">
                Preventive Health Check
              </span>
              {pkg.duration && (
                <span className="text-xs text-ink-muted flex items-center gap-1 font-semibold">
                  ⏱ {pkg.duration}
                </span>
              )}
            </div>

            <h2 className="mt-3 font-display text-xl font-bold text-ink">{pkg.name}</h2>
            {pkg.description && (
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-muted line-clamp-3">
                {pkg.description}
              </p>
            )}

            <div className="mt-6 border-t border-[#dde5e9] pt-4 space-y-2">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs text-ink-muted block">Package Price</span>
                  {formatPrice(pkg.price, pkg.currency) && (
                    <p className="font-display text-2xl font-extrabold text-brand-800">
                      {formatPrice(pkg.price, pkg.currency)}
                    </p>
                  )}
                </div>
                <Link
                  href={`/health-packages/${pkg.slug}`}
                  className="btn-primary !px-4 !py-2 !text-xs shadow-soft hover:scale-105"
                >
                  Book Package →
                </Link>
              </div>

              {pkg.isDemoPricing && (
                <p className="text-[11px] font-medium text-amber-700 bg-amber-50 rounded px-2 py-0.5 inline-block">
                  Demo Pricing — For Illustration Only
                </p>
              )}
            </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
