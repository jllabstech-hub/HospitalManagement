'use client';

import { useState } from 'react';
import { upsertHospitalProfileAction } from '@/features/cms/actions/admin-cms';
import ImageUploadPicker from '@/components/shared/ImageUploadPicker';

export interface HospitalProfileFormData {
  id?: string;
  hospitalName: string;
  legalName: string;
  shortDescription: string;
  fullDescription: string;
  tagline: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  timezone: string;
  websiteUrl: string;
  workingHours: string;
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
  facebookUrl?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
}

interface Props {
  profile: HospitalProfileFormData | null;
}

export default function HospitalProfileForm({ profile }: Props) {
  const [form, setForm] = useState<HospitalProfileFormData>({
    id: profile?.id,
    hospitalName: profile?.hospitalName ?? '',
    legalName: profile?.legalName ?? '',
    shortDescription: profile?.shortDescription ?? '',
    fullDescription: profile?.fullDescription ?? '',
    tagline: profile?.tagline ?? '',
    phone: profile?.phone ?? '',
    emergencyPhone: profile?.emergencyPhone ?? '',
    email: profile?.email ?? '',
    addressLine1: profile?.addressLine1 ?? '',
    addressLine2: profile?.addressLine2 ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    postalCode: profile?.postalCode ?? '',
    country: profile?.country ?? 'India',
    timezone: profile?.timezone ?? 'Asia/Kolkata',
    websiteUrl: profile?.websiteUrl ?? '',
    workingHours: profile?.workingHours ?? '',
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
    facebookUrl: profile?.facebookUrl ?? '',
    twitterUrl: profile?.twitterUrl ?? '',
    instagramUrl: profile?.instagramUrl ?? '',
    linkedinUrl: profile?.linkedinUrl ?? '',
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

      {/* Overview Banner for Admin Guidance */}
      <div className="rounded-card border border-brand-200 bg-brand-50/70 p-4 text-xs text-brand-900">
        <div className="flex items-center justify-between">
          <span className="font-bold uppercase tracking-wider text-brand-800 text-[11px]">
            💡 Admin Frontend Placement Guide
          </span>
          <span className="text-ink-muted">All fields below map directly to live public pages.</span>
        </div>
        <p className="mt-1 text-ink-muted leading-relaxed">
          Each section shows exact locations where your edits appear on the public hospital website (Header, Footer, Homepage Hero, About Overview, & Contact Desk).
        </p>
      </div>

      {/* SECTION 1: Hospital Identity */}
      <div className="card-surface space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between border-b border-[#dde5e9] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">1. Hospital Identity & Story</h2>
            <p className="text-xs text-ink-muted">Basic brand details, tagline, and public bio.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
              📍 Used on: Header Logo, Homepage & /about/overview
            </span>
            <a
              href="/about/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              View Page ↗
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            <span className="font-bold text-ink">Hospital Name *</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Header Navbar & Page Titles)</span>
            <input
              className="input-field mt-1"
              value={form.hospitalName}
              onChange={(e) => updateField('hospitalName', e.target.value)}
              required
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Legal Name</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Footer Copyright © Disclaimer)</span>
            <input
              className="input-field mt-1"
              value={form.legalName}
              onChange={(e) => updateField('legalName', e.target.value)}
            />
          </label>

          <label className="block text-xs md:col-span-2">
            <span className="font-bold text-ink">Tagline</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Homepage Sub-banner & Meta Tags)</span>
            <input
              className="input-field mt-1"
              value={form.tagline}
              onChange={(e) => updateField('tagline', e.target.value)}
            />
          </label>

          <label className="block text-xs md:col-span-2">
            <span className="font-bold text-ink">Short Description</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Homepage Intro & /about Summary)</span>
            <textarea
              className="input-field mt-1 min-h-[70px]"
              value={form.shortDescription}
              onChange={(e) => updateField('shortDescription', e.target.value)}
            />
          </label>

          <label className="block text-xs md:col-span-2">
            <span className="font-bold text-ink">Full Description</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Detailed History on /about/overview Page)</span>
            <textarea
              className="input-field mt-1 min-h-[110px]"
              value={form.fullDescription}
              onChange={(e) => updateField('fullDescription', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* SECTION 2: Contact & Emergency Helplines */}
      <div className="card-surface space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between border-b border-[#dde5e9] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">2. Phone & Emergency Helplines</h2>
            <p className="text-xs text-ink-muted">Helpline phone numbers and contact emails.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
              📍 Used on: Site Header Utility Bar, /contact & Footer
            </span>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              View /contact ↗
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-xs">
            <span className="font-bold text-ink">Main Reception Phone</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Header & Contact Page)</span>
            <input
              className="input-field mt-1"
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-rose-700">24x7 Emergency Phone *</span>
            <span className="ml-2 text-[10px] text-rose-600">(Red Alert Badge on Top Bar)</span>
            <input
              className="input-field mt-1 border-rose-300 bg-rose-50/40 text-rose-900"
              value={form.emergencyPhone}
              onChange={(e) => updateField('emergencyPhone', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Public Contact Email</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Contact Form & Footer)</span>
            <input
              type="email"
              className="input-field mt-1"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* SECTION 3: Location Address & Working Hours */}
      <div className="card-surface space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between border-b border-[#dde5e9] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">3. Location Address & OPD Timings</h2>
            <p className="text-xs text-ink-muted">Physical hospital address and operational timings.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              📍 Used on: /contact Map Section & Footer Address
            </span>
            <a
              href="/contact"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              View /contact ↗
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            <span className="font-bold text-ink">Address Line 1</span>
            <input
              className="input-field mt-1"
              value={form.addressLine1}
              onChange={(e) => updateField('addressLine1', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Address Line 2</span>
            <input
              className="input-field mt-1"
              value={form.addressLine2}
              onChange={(e) => updateField('addressLine2', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">City</span>
            <input
              className="input-field mt-1"
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">State</span>
            <input
              className="input-field mt-1"
              value={form.state}
              onChange={(e) => updateField('state', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Postal Code</span>
            <input
              className="input-field mt-1"
              value={form.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">OPD & Hospital Working Hours</span>
            <span className="ml-2 text-[10px] text-ink-muted">(Header Dropdown & Contact Desk)</span>
            <input
              className="input-field mt-1"
              value={form.workingHours}
              onChange={(e) => updateField('workingHours', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* SECTION 4: Mission, Vision & Core Values */}
      <div className="card-surface space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between border-b border-[#dde5e9] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">4. Mission, Vision & Values</h2>
            <p className="text-xs text-ink-muted">Core hospital ethos and strategic goals.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
              📍 Used on: /about/overview (3-Card Feature Grid)
            </span>
            <a
              href="/about/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              View /about/overview ↗
            </a>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-xs">
            <span className="font-bold text-ink">Our Mission</span>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.mission}
              onChange={(e) => updateField('mission', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Our Vision</span>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.vision}
              onChange={(e) => updateField('vision', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Core Values</span>
            <textarea
              className="input-field mt-1 min-h-[80px]"
              value={form.values}
              onChange={(e) => updateField('values', e.target.value)}
            />
          </label>
        </div>
      </div>

      {/* SECTION 5: Branding Images & Social Media Links */}
      <div className="card-surface space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between border-b border-[#dde5e9] pb-3">
          <div>
            <h2 className="font-display text-base font-bold text-ink">5. Media Banners, Logo & Social Links</h2>
            <p className="text-xs text-ink-muted">Visual brand assets and external social profiles.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-100 px-2 py-0.5 text-[10px] font-bold text-indigo-800">
              📍 Used on: Homepage Hero (/) & Footer Social Icons
            </span>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              View Homepage ↗
            </a>
          </div>
        </div>

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

        <div className="grid gap-4 md:grid-cols-2 pt-4 border-t border-[#dde5e9]">
          <label className="block text-xs">
            <span className="font-bold text-ink">Facebook Page URL</span>
            <input
              className="input-field mt-1"
              placeholder="https://facebook.com/carepulsehospital"
              value={form.facebookUrl}
              onChange={(e) => updateField('facebookUrl', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Twitter (X) Profile URL</span>
            <input
              className="input-field mt-1"
              placeholder="https://twitter.com/carepulsehosp"
              value={form.twitterUrl}
              onChange={(e) => updateField('twitterUrl', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">Instagram Profile URL</span>
            <input
              className="input-field mt-1"
              placeholder="https://instagram.com/carepulsehospital"
              value={form.instagramUrl}
              onChange={(e) => updateField('instagramUrl', e.target.value)}
            />
          </label>

          <label className="block text-xs">
            <span className="font-bold text-ink">LinkedIn Company URL</span>
            <input
              className="input-field mt-1"
              placeholder="https://linkedin.com/company/carepulsehospital"
              value={form.linkedinUrl}
              onChange={(e) => updateField('linkedinUrl', e.target.value)}
            />
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
