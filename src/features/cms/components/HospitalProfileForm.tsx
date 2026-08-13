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

    setSuccess('Hospital profile saved successfully.');
  };

  return (
    <form onSubmit={handleSubmit} className="card-surface space-y-6 p-6">
      {error && (
        <p className="rounded-card border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-card border border-accent-200 bg-accent-50 px-4 py-2 text-sm text-accent-800">
          {success}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Hospital Name *</span>
          <input
            className="input-field mt-1"
            value={form.hospitalName}
            onChange={(e) => updateField('hospitalName', e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Legal Name</span>
          <input
            className="input-field mt-1"
            value={form.legalName}
            onChange={(e) => updateField('legalName', e.target.value)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Tagline</span>
          <input
            className="input-field mt-1"
            value={form.tagline}
            onChange={(e) => updateField('tagline', e.target.value)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Short Description</span>
          <textarea
            className="input-field mt-1 min-h-[80px]"
            value={form.shortDescription}
            onChange={(e) => updateField('shortDescription', e.target.value)}
          />
        </label>
        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-ink">Full Description</span>
          <textarea
            className="input-field mt-1 min-h-[120px]"
            value={form.fullDescription}
            onChange={(e) => updateField('fullDescription', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-ink">Phone</span>
          <input
            className="input-field mt-1"
            value={form.phone}
            onChange={(e) => updateField('phone', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Emergency Phone</span>
          <input
            className="input-field mt-1"
            value={form.emergencyPhone}
            onChange={(e) => updateField('emergencyPhone', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Email</span>
          <input
            type="email"
            className="input-field mt-1"
            value={form.email}
            onChange={(e) => updateField('email', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Address Line 1</span>
          <input
            className="input-field mt-1"
            value={form.addressLine1}
            onChange={(e) => updateField('addressLine1', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Address Line 2</span>
          <input
            className="input-field mt-1"
            value={form.addressLine2}
            onChange={(e) => updateField('addressLine2', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">City</span>
          <input
            className="input-field mt-1"
            value={form.city}
            onChange={(e) => updateField('city', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">State</span>
          <input
            className="input-field mt-1"
            value={form.state}
            onChange={(e) => updateField('state', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Postal Code</span>
          <input
            className="input-field mt-1"
            value={form.postalCode}
            onChange={(e) => updateField('postalCode', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Working Hours</span>
          <input
            className="input-field mt-1"
            value={form.workingHours}
            onChange={(e) => updateField('workingHours', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block text-sm">
          <span className="font-medium text-ink">Mission</span>
          <textarea
            className="input-field mt-1 min-h-[80px]"
            value={form.mission}
            onChange={(e) => updateField('mission', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Vision</span>
          <textarea
            className="input-field mt-1 min-h-[80px]"
            value={form.vision}
            onChange={(e) => updateField('vision', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Values</span>
          <textarea
            className="input-field mt-1 min-h-[80px]"
            value={form.values}
            onChange={(e) => updateField('values', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 pt-6 border-t border-[#dde5e9]">
        <div className="md:col-span-2">
          <h3 className="font-semibold text-ink">Domain & White-Label Hosting</h3>
          <p className="text-xs text-ink-muted">Configure the custom domain and tenant subdomain.</p>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-ink">Custom Domain</span>
          <input
            className="input-field mt-1"
            placeholder="e.g. hospital-a.com"
            value={form.customDomain}
            onChange={(e) => updateField('customDomain', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Tenant Subdomain</span>
          <input
            className="input-field mt-1"
            placeholder="e.g. tenant-a.platform.com"
            value={form.subdomain}
            onChange={(e) => updateField('subdomain', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3 pt-6 border-t border-[#dde5e9]">
        <div className="md:col-span-3">
          <h3 className="font-semibold text-ink">Branding & Colors</h3>
          <p className="text-xs text-ink-muted">Set the primary and secondary colors for your hospital.</p>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-ink">Primary Color</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-12 rounded border border-gray-300 p-1"
              value={form.primaryColor}
              onChange={(e) => updateField('primaryColor', e.target.value)}
            />
            <input
              className="input-field flex-1 uppercase"
              value={form.primaryColor}
              onChange={(e) => updateField('primaryColor', e.target.value)}
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Secondary Color</span>
          <div className="mt-1 flex items-center gap-2">
            <input
              type="color"
              className="h-10 w-12 rounded border border-gray-300 p-1"
              value={form.secondaryColor}
              onChange={(e) => updateField('secondaryColor', e.target.value)}
            />
            <input
              className="input-field flex-1 uppercase"
              value={form.secondaryColor}
              onChange={(e) => updateField('secondaryColor', e.target.value)}
            />
          </div>
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Font Family</span>
          <input
            className="input-field mt-1"
            placeholder="e.g. var(--font-inter)"
            value={form.fontFamily}
            onChange={(e) => updateField('fontFamily', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 pt-6 border-t border-[#dde5e9]">
        <div className="md:col-span-2">
          <h3 className="font-semibold text-ink">Social Links</h3>
        </div>
        <label className="block text-sm">
          <span className="font-medium text-ink">Facebook URL</span>
          <input
            className="input-field mt-1"
            value={form.facebookUrl}
            onChange={(e) => updateField('facebookUrl', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Twitter URL</span>
          <input
            className="input-field mt-1"
            value={form.twitterUrl}
            onChange={(e) => updateField('twitterUrl', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Instagram URL</span>
          <input
            className="input-field mt-1"
            value={form.instagramUrl}
            onChange={(e) => updateField('instagramUrl', e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">LinkedIn URL</span>
          <input
            className="input-field mt-1"
            value={form.linkedinUrl}
            onChange={(e) => updateField('linkedinUrl', e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-[#dde5e9]">
        <ImageUploadPicker
          label="Homepage Hero Image"
          description="Upload or select the main image for the public homepage hero banner."
          value={form.heroImageUrl}
          onChange={(url) => updateField('heroImageUrl', url)}
        />
        <ImageUploadPicker
          label="Hospital Logo"
          description="Upload or select the primary hospital logo asset."
          value={form.logoUrl}
          onChange={(url) => updateField('logoUrl', url)}
        />
      </div>

      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving…' : 'Save Hospital Profile'}
      </button>
    </form>
  );
}
