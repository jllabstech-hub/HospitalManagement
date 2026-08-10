'use client';

import { useState, useTransition } from 'react';
import { submitAppointmentEnquiryAction } from '@/features/cms/actions/public-forms';

interface AppointmentEnquiryFormProps {
  departments?: { id: string; name: string }[];
  doctors?: { id: string; fullName: string }[];
}

export default function AppointmentEnquiryForm({
  departments = [],
  doctors = [],
}: AppointmentEnquiryFormProps) {
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
      const result = await submitAppointmentEnquiryAction({
        name: String(data.get('name') ?? ''),
        email: String(data.get('email') ?? ''),
        phone: String(data.get('phone') ?? ''),
        departmentId: String(data.get('departmentId') ?? ''),
        preferredDoctorId: String(data.get('preferredDoctorId') ?? ''),
        preferredDate: String(data.get('preferredDate') ?? ''),
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
          Enquiry submitted. Our scheduling team will contact you soon.
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
          <span className="font-medium text-ink">Email</span>
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          />
        </label>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-ink">Phone</span>
        <input
          name="phone"
          type="tel"
          required
          minLength={6}
          className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
        />
      </label>

      {departments.length > 0 && (
        <label className="block text-sm">
          <span className="font-medium text-ink">Preferred department (optional)</span>
          <select
            name="departmentId"
            defaultValue=""
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {doctors.length > 0 && (
        <label className="block text-sm">
          <span className="font-medium text-ink">Preferred doctor (optional)</span>
          <select
            name="preferredDoctorId"
            defaultValue=""
            className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
          >
            <option value="">Select doctor</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block text-sm">
        <span className="font-medium text-ink">Preferred date (optional)</span>
        <input
          name="preferredDate"
          type="date"
          className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-ink">Additional details (optional)</span>
        <textarea
          name="message"
          rows={3}
          className="mt-1 w-full rounded-button border border-[#dde5e9] px-3 py-2.5 text-sm"
        />
      </label>

      <button type="submit" disabled={isPending} className="btn-primary w-full sm:w-auto">
        {isPending ? 'Submitting…' : 'Submit enquiry'}
      </button>
    </form>
  );
}
