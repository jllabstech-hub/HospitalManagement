'use client';

import { useState } from 'react';
import { upsertHospitalProfileAction } from '@/features/cms/actions/admin-cms';
import ImageUploadPicker from '@/components/shared/ImageUploadPicker';

export interface HospitalProfileFormData {
  id?: string;
  hospitalName: string;
  shortDescription: string;
  fullDescription: string;
  tagline: string;
  country: string;
  timezone: string;
  websiteUrl: string;
  mission: string;
  vision: string;
  values: string;
  heroImageUrl?: string;
  logoUrl?: string;
  customDomain?: string;
  subdomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
}

interface Props {
  profile: HospitalProfileFormData | null;
}

export default function HospitalProfileForm({ profile }: Props) {
  const [form, setForm] = useState<HospitalProfileFormData>({
    id: profile?.id,
    hospitalName: profile?.hospitalName ?? '',
    shortDescription: profile?.shortDescription ?? '',
    fullDescription: profile?.fullDescription ?? '',
    tagline: profile?.tagline ?? '',
    country: profile?.country ?? 'India',
    timezone: profile?.timezone ?? 'Asia/Kolkata',
    websiteUrl: profile?.websiteUrl ?? '',
    mission: profile?.mission ?? '',
    vision: profile?.vision ?? '',
    values: profile?.values ?? '',
    heroImageUrl: profile?.heroImageUrl ?? '',
    logoUrl: profile?.logoUrl ?? '',
    customDomain: profile?.customDomain ?? '',
    subdomain: profile?.subdomain ?? '',
    primaryColor: profile?.primaryColor ?? '#0ea5e9',
    secondaryColor: profile?.secondaryColor ?? '#f43f5e',
    fontFamily: profile?.fontFamily ?? 'var(--font-inter)',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof HospitalProfileFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    const result = await upsertHospitalProfileAction(form);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setSuccess('Hospital profile saved successfully. Frontend public pages will reflect changes immediately.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-card border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-800 flex items-center justify-between">
          <span>✓ {success}</span>
          <a href="/about/overview" target="_blank" rel="noopener noreferrer" className="underline font-bold text-accent-900">
            View Live Public Page ↗
          </a>
        </p>
      )}

      <div className="rounded-card border border-brand-200 bg-brand-50/70 p-4 text-xs text-brand-900">
        <p className="font-bold uppercase tracking-wider text-brand-800 text-[11px]">This page is hospital identity only</p>
        <p className="mt-1 text-ink-muted leading-relaxed">
          Phone, email, address, hours, social links, and footer navigation are edited on{' '}
          <a href="/admin/content/footer" className="font-semibold underline">
            Website Footer
          </a>
          . Saving this page does not change those footer fields.
        </p>
      </div>

      <div className="card-surface space-y-4 p-6">
        <h2 className="font-display text-base font-bold text-ink">1. Hospital identity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            <span className="font-bold text-ink">Hospital Name *</span>
            <input
              className="input-field mt-1"
              value={form.hospitalName}
              onChange={(e) => updateField('hospitalName', e.target.value)}
              required
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Tagline</span>
            <input className="input-field mt-1" value={form.tagline} onChange={(e) => updateField('tagline', e.target.value)} />
          </label>
          <label className="block text-xs md:col-span-2">
            <span className="font-bold text-ink">Short description</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Homepage intro and footer bio)</span>
            <textarea
              className="input-field mt-1 min-h-[70px]"
              value={form.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
            />
          </label>
          <label className="block text-xs md:col-span-2">
            <span className="font-bold text-ink">Full description</span>
            <textarea
              className="input-field mt-1 min-h-[110px]"
              value={form.fullDescription}
              onChange={(e) => updateField('fullDescription', e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="card-surface space-y-4 p-6">
        <h2 className="font-display text-base font-bold text-ink">2. Mission, vision & values</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-xs">
            <span className="font-bold text-ink">Our Mission</span>
            <textarea className="input-field mt-1 min-h-[80px]" value={form.mission} onChange={(e) => updateField('mission', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Our Vision</span>
            <textarea className="input-field mt-1 min-h-[80px]" value={form.vision} onChange={(e) => updateField('vision', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Core Values</span>
            <textarea className="input-field mt-1 min-h-[80px]" value={form.values} onChange={(e) => updateField('values', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="card-surface space-y-6 p-6">
        <h2 className="font-display text-base font-bold text-ink">3. Logo, hero & branding</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ImageUploadPicker
            label="Homepage Hero Banner Image"
            description="Main banner image displayed at the top of the homepage (/)."
            value={form.heroImageUrl}
            onChange={(url) => updateField('heroImageUrl', url)}
          />
          <ImageUploadPicker
            label="Hospital Primary Logo"
            description="Brand logo displayed in the top header navbar and footer."
            value={form.logoUrl}
            onChange={(url) => updateField('logoUrl', url)}
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            <span className="font-bold text-ink">Primary color</span>
            <input className="input-field mt-1" value={form.primaryColor} onChange={(e) => updateField('primaryColor', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Secondary color</span>
            <input className="input-field mt-1" value={form.secondaryColor} onChange={(e) => updateField('secondaryColor', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Custom domain</span>
            <input className="input-field mt-1" value={form.customDomain} onChange={(e) => updateField('customDomain', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Subdomain</span>
            <input className="input-field mt-1" value={form.subdomain} onChange={(e) => updateField('subdomain', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary !px-8 !py-3 !text-sm shadow-soft" disabled={saving}>
          {saving ? 'Saving Profile...' : 'Save Hospital Profile Changes'}
        </button>
      </div>
    </form>
  );
}
