'use client';

import { useState } from 'react';
import { updateFooterSettingsAction } from '@/features/cms/actions/admin-cms';
import type { FooterConfig, FooterNavColumn, FooterNavLink } from '@/features/cms/footer-config';
import { BusyLabel } from '@/components/ui/Spinner';

export interface FooterSettingsFormData {
  legalName: string;
  phone: string;
  emergencyPhone: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  workingHours: string;
  facebookUrl: string;
  twitterUrl: string;
  instagramUrl: string;
  linkedinUrl: string;
  footerConfig: FooterConfig;
}

interface Props {
  initial: FooterSettingsFormData;
}

function emptyLink(): FooterNavLink {
  return { href: '/', label: '' };
}

export default function FooterSettingsForm({ initial }: Props) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateField = (field: keyof Omit<FooterSettingsFormData, 'footerConfig'>, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateConfig = (footerConfig: FooterConfig) => {
    setForm((prev) => ({ ...prev, footerConfig }));
  };

  const updateColumn = (index: number, patch: Partial<FooterNavColumn>) => {
    const columns = form.footerConfig.columns.map((column, i) => (i === index ? { ...column, ...patch } : column));
    updateConfig({ ...form.footerConfig, columns });
  };

  const updateColumnLink = (columnIndex: number, linkIndex: number, patch: Partial<FooterNavLink>) => {
    const columns = form.footerConfig.columns.map((column, i) => {
      if (i !== columnIndex) return column;
      return {
        ...column,
        links: column.links.map((link, j) => (j === linkIndex ? { ...link, ...patch } : link)),
      };
    });
    updateConfig({ ...form.footerConfig, columns });
  };

  const updateLegalLink = (index: number, patch: Partial<FooterNavLink>) => {
    const legalLinks = form.footerConfig.legalLinks.map((link, i) => (i === index ? { ...link, ...patch } : link));
    updateConfig({ ...form.footerConfig, legalLinks });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    const result = await updateFooterSettingsAction(form);
    setSaving(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess('Footer saved. Public pages will show the updated footer.');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-card border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-card border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-semibold text-accent-800">
          ✓ {success}{' '}
          <a href="/" target="_blank" rel="noopener noreferrer" className="underline font-bold">
            View live site ↗
          </a>
        </p>
      )}

      <div className="rounded-card border border-brand-200 bg-brand-50/70 p-4 text-xs text-brand-900">
        This page controls only the public website footer. Hospital name, logo, and mission stay on{' '}
        <a href="/admin/content/hospital" className="font-semibold underline">
          Hospital Profile & Branding
        </a>
        .
      </div>

      <section className="card-surface space-y-4 p-6">
        <h2 className="font-display text-base font-bold text-ink">1. Contact details shown in the footer</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            <span className="font-bold text-ink">Main phone</span>
            <input className="input-field mt-1" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Emergency phone</span>
            <input
              className="input-field mt-1"
              value={form.emergencyPhone}
              onChange={(e) => updateField('emergencyPhone', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Email</span>
            <input
              type="email"
              className="input-field mt-1"
              value={form.email}
              onChange={(e) => updateField('email', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Working hours</span>
            <input
              className="input-field mt-1"
              value={form.workingHours}
              onChange={(e) => updateField('workingHours', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Address line 1</span>
            <input
              className="input-field mt-1"
              value={form.addressLine1}
              onChange={(e) => updateField('addressLine1', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Address line 2</span>
            <input
              className="input-field mt-1"
              value={form.addressLine2}
              onChange={(e) => updateField('addressLine2', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">City</span>
            <input className="input-field mt-1" value={form.city} onChange={(e) => updateField('city', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">State</span>
            <input className="input-field mt-1" value={form.state} onChange={(e) => updateField('state', e.target.value)} />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Postal code</span>
            <input
              className="input-field mt-1"
              value={form.postalCode}
              onChange={(e) => updateField('postalCode', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Legal / copyright name</span>
            <input
              className="input-field mt-1"
              value={form.legalName}
              onChange={(e) => updateField('legalName', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card-surface space-y-4 p-6">
        <h2 className="font-display text-base font-bold text-ink">2. Social links</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-xs">
            <span className="font-bold text-ink">Facebook</span>
            <input
              className="input-field mt-1"
              value={form.facebookUrl}
              onChange={(e) => updateField('facebookUrl', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Twitter / X</span>
            <input
              className="input-field mt-1"
              value={form.twitterUrl}
              onChange={(e) => updateField('twitterUrl', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">Instagram</span>
            <input
              className="input-field mt-1"
              value={form.instagramUrl}
              onChange={(e) => updateField('instagramUrl', e.target.value)}
            />
          </label>
          <label className="block text-xs">
            <span className="font-bold text-ink">LinkedIn</span>
            <input
              className="input-field mt-1"
              value={form.linkedinUrl}
              onChange={(e) => updateField('linkedinUrl', e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="card-surface space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-ink">3. Footer navigation columns</h2>
          <button
            type="button"
            className="btn-secondary !py-1.5 !text-xs"
            disabled={form.footerConfig.columns.length >= 4}
            onClick={() =>
              updateConfig({
                ...form.footerConfig,
                columns: [...form.footerConfig.columns, { title: 'New column', links: [emptyLink()] }],
              })
            }
          >
            + Add column
          </button>
        </div>
        <p className="text-xs text-ink-muted">Links must be internal paths such as /departments. External URLs are rejected.</p>
        <div className="grid gap-4 lg:grid-cols-3">
          {form.footerConfig.columns.map((column, columnIndex) => (
            <div key={`column-${columnIndex}`} className="space-y-3 rounded-card border border-[#dde5e9] p-4">
              <div className="flex items-center gap-2">
                <input
                  className="input-field !py-1.5 text-xs font-semibold"
                  value={column.title}
                  onChange={(e) => updateColumn(columnIndex, { title: e.target.value })}
                  aria-label={`Column ${columnIndex + 1} title`}
                />
                <button
                  type="button"
                  className="text-[11px] font-semibold text-rose-700 hover:underline"
                  onClick={() =>
                    updateConfig({
                      ...form.footerConfig,
                      columns: form.footerConfig.columns.filter((_, i) => i !== columnIndex),
                    })
                  }
                >
                  Remove
                </button>
              </div>
              {column.links.map((link, linkIndex) => (
                <div key={`link-${columnIndex}-${linkIndex}`} className="grid gap-2">
                  <input
                    className="input-field !py-1.5 text-xs"
                    placeholder="Label"
                    value={link.label}
                    onChange={(e) => updateColumnLink(columnIndex, linkIndex, { label: e.target.value })}
                    aria-label={`Column ${columnIndex + 1} link ${linkIndex + 1} label`}
                  />
                  <div className="flex gap-2">
                    <input
                      className="input-field !py-1.5 text-xs"
                      placeholder="/departments"
                      value={link.href}
                      onChange={(e) => updateColumnLink(columnIndex, linkIndex, { href: e.target.value })}
                      aria-label={`Column ${columnIndex + 1} link ${linkIndex + 1} path`}
                    />
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-rose-700"
                      onClick={() =>
                        updateColumn(columnIndex, {
                          links: column.links.filter((_, i) => i !== linkIndex),
                        })
                      }
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                className="text-xs font-semibold text-brand-700 hover:underline"
                disabled={column.links.length >= 8}
                onClick={() => updateColumn(columnIndex, { links: [...column.links, emptyLink()] })}
              >
                + Add link
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card-surface space-y-4 p-6">
        <h2 className="font-display text-base font-bold text-ink">4. Bottom bar</h2>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={form.footerConfig.showLogin}
            onChange={(e) => updateConfig({ ...form.footerConfig, showLogin: e.target.checked })}
          />
          Show login link
        </label>
        {form.footerConfig.showLogin && (
          <label className="block max-w-xs text-xs">
            <span className="font-bold text-ink">Login label</span>
            <input
              className="input-field mt-1"
              value={form.footerConfig.loginLabel}
              onChange={(e) => updateConfig({ ...form.footerConfig, loginLabel: e.target.value })}
            />
          </label>
        )}
        <div className="space-y-3">
          <p className="text-xs font-bold text-ink">Legal links</p>
          {form.footerConfig.legalLinks.map((link, index) => (
            <div key={`legal-${index}`} className="grid gap-2 md:grid-cols-2">
              <input
                className="input-field !py-1.5 text-xs"
                value={link.label}
                onChange={(e) => updateLegalLink(index, { label: e.target.value })}
                aria-label={`Legal link ${index + 1} label`}
              />
              <div className="flex gap-2">
                <input
                  className="input-field !py-1.5 text-xs"
                  value={link.href}
                  onChange={(e) => updateLegalLink(index, { href: e.target.value })}
                  aria-label={`Legal link ${index + 1} path`}
                />
                <button
                  type="button"
                  className="text-[11px] font-semibold text-rose-700"
                  onClick={() =>
                    updateConfig({
                      ...form.footerConfig,
                      legalLinks: form.footerConfig.legalLinks.filter((_, i) => i !== index),
                    })
                  }
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="text-xs font-semibold text-brand-700 hover:underline"
            disabled={form.footerConfig.legalLinks.length >= 6}
            onClick={() =>
              updateConfig({
                ...form.footerConfig,
                legalLinks: [...form.footerConfig.legalLinks, emptyLink()],
              })
            }
          >
            + Add legal link
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn-primary !px-8 !py-3 !text-sm" disabled={saving}>
          {saving ? <BusyLabel>Saving...</BusyLabel> : 'Save Footer'}
        </button>
      </div>
    </form>
  );
}
