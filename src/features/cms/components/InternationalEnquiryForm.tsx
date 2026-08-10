'use client';

import { useState, useTransition } from 'react';
import { submitInternationalEnquiryAction } from '@/features/cms/actions/public-forms';

export default function InternationalEnquiryForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const form = e.currentTarget;
    const data = new FormData(form);

    startTransition(async () => {
      const result = await submitInternationalEnquiryAction({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        country: String(data.get('country') ?? ''),
        treatmentInterest: String(data.get('treatmentInterest') ?? ''),
        preferredDepartment: String(data.get('preferredDepartment') ?? ''),
        message: String(data.get('message') ?? ''),
      });

      if (result.success) {
        setSuccess(true);
        form.reset();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="card-surface space-y-4 p-6">
      {success && (
        <p className="rounded-button bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Thank you — our international patient coordinator will reach out shortly.
        </p>
      )}
      {error && (
        <p className="rounded-button bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
          {error}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Full name</span>
          <input
            name="name"
            required
            minLength={2}
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Country</span>
          <input
            name="country"
            required
            minLength={2}
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="font-medium text-ink">Phone (optional)</span>
          <input
            name="phone"
            type="tel"
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-ink">Treatment interest (optional)</span>
        <input
          name="treatmentInterest"
          className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Preferred department (optional)</span>
        <input
          name="preferredDepartment"
          className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Message (optional)</span>
        <textarea
          name="message"
          rows={4}
          className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
        />
      </label>

      <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
        {isPending ? 'Submitting…' : 'Submit enquiry'}
      </button>
    </form>
  );
}
