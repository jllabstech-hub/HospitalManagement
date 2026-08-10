'use client';

import { useState } from 'react';
import {
  ContactMessageStatus,
  EnquiryStatus,
} from '@prisma/client';
import {
  updateContactMessageStatusAction,
  updateEnquiryStatusAction,
} from '@/features/cms/actions/admin-cms';

type Tab = 'contact' | 'appointment' | 'international' | 'package';

interface ContactRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  createdAt: Date;
}

interface EnquiryRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: EnquiryStatus;
  createdAt: Date;
  detail?: string;
}

interface PackageRow extends EnquiryRow {
  packageName: string | null;
}

interface Props {
  contactMessages: ContactRow[];
  appointmentEnquiries: EnquiryRow[];
  internationalEnquiries: EnquiryRow[];
  packageRequests: PackageRow[];
}

const CONTACT_STATUSES = Object.values(ContactMessageStatus);
const ENQUIRY_STATUSES = Object.values(EnquiryStatus);

export default function EnquiriesManager({
  contactMessages,
  appointmentEnquiries,
  internationalEnquiries,
  packageRequests,
}: Props) {
  const [tab, setTab] = useState<Tab>('contact');
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleContactStatus = async (id: string, status: ContactMessageStatus) => {
    setFeedback(null);
    const result = await updateContactMessageStatusAction({ id, status });
    setFeedback(result.success ? 'Contact message updated.' : result.error);
  };

  const handleEnquiryStatus = async (
    type: 'appointment' | 'international' | 'package',
    id: string,
    status: EnquiryStatus
  ) => {
    setFeedback(null);
    const result = await updateEnquiryStatusAction({ type, id, status });
    setFeedback(result.success ? 'Enquiry updated.' : result.error);
  };

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'contact', label: 'Contact Messages', count: contactMessages.length },
    { key: 'appointment', label: 'Appointment Enquiries', count: appointmentEnquiries.length },
    { key: 'international', label: 'International', count: internationalEnquiries.length },
    { key: 'package', label: 'Package Requests', count: packageRequests.length },
  ];

  return (
    <div className="space-y-4">
      {feedback && (
        <p className="rounded-card border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-800">
          {feedback}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-button px-3 py-2 text-xs font-semibold ${
              tab === t.key
                ? 'bg-brand-700 text-white'
                : 'border border-[#dde5e9] bg-white text-ink-muted hover:bg-brand-50'
            }`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="card-surface overflow-x-auto p-4">
        {tab === 'contact' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#dde5e9] font-bold uppercase tracking-wider text-ink-soft">
                <th className="px-2 py-2">From</th>
                <th className="px-2 py-2">Subject</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f4]">
              {contactMessages.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-3">
                    <div className="font-semibold text-ink">{row.name}</div>
                    <div className="text-ink-muted">{row.email}</div>
                  </td>
                  <td className="px-2 py-3">
                    <div className="font-medium">{row.subject}</div>
                    <div className="text-ink-muted line-clamp-2">{row.message}</div>
                  </td>
                  <td className="px-2 py-3">{row.status}</td>
                  <td className="px-2 py-3">
                    <select
                      className="input-field !py-1 !text-xs"
                      value={row.status}
                      onChange={(e) =>
                        handleContactStatus(row.id, e.target.value as ContactMessageStatus)
                      }
                    >
                      {CONTACT_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {tab === 'appointment' && (
          <EnquiryTable
            rows={appointmentEnquiries}
            onStatusChange={(id, status) => handleEnquiryStatus('appointment', id, status)}
          />
        )}

        {tab === 'international' && (
          <EnquiryTable
            rows={internationalEnquiries}
            onStatusChange={(id, status) => handleEnquiryStatus('international', id, status)}
          />
        )}

        {tab === 'package' && (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#dde5e9] font-bold uppercase tracking-wider text-ink-soft">
                <th className="px-2 py-2">Requester</th>
                <th className="px-2 py-2">Package</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2f4]">
              {packageRequests.map((row) => (
                <tr key={row.id}>
                  <td className="px-2 py-3">
                    <div className="font-semibold text-ink">{row.name}</div>
                    <div className="text-ink-muted">{row.email}</div>
                  </td>
                  <td className="px-2 py-3">{row.packageName ?? '—'}</td>
                  <td className="px-2 py-3">{row.status}</td>
                  <td className="px-2 py-3">
                    <select
                      className="input-field !py-1 !text-xs"
                      value={row.status}
                      onChange={(e) =>
                        handleEnquiryStatus('package', row.id, e.target.value as EnquiryStatus)
                      }
                    >
                      {ENQUIRY_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {((tab === 'contact' && contactMessages.length === 0) ||
          (tab === 'appointment' && appointmentEnquiries.length === 0) ||
          (tab === 'international' && internationalEnquiries.length === 0) ||
          (tab === 'package' && packageRequests.length === 0)) && (
          <p className="py-8 text-center text-sm text-ink-muted">No records in this section.</p>
        )}
      </div>
    </div>
  );
}

function EnquiryTable({
  rows,
  onStatusChange,
}: {
  rows: EnquiryRow[];
  onStatusChange: (id: string, status: EnquiryStatus) => void;
}) {
  return (
    <table className="w-full text-left text-xs">
      <thead>
        <tr className="border-b border-[#dde5e9] font-bold uppercase tracking-wider text-ink-soft">
          <th className="px-2 py-2">Enquirer</th>
          <th className="px-2 py-2">Details</th>
          <th className="px-2 py-2">Status</th>
          <th className="px-2 py-2">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-[#eef2f4]">
        {rows.map((row) => (
          <tr key={row.id}>
            <td className="px-2 py-3">
              <div className="font-semibold text-ink">{row.name}</div>
              <div className="text-ink-muted">{row.email}</div>
            </td>
            <td className="px-2 py-3 text-ink-muted">{row.detail ?? '—'}</td>
            <td className="px-2 py-3">{row.status}</td>
            <td className="px-2 py-3">
              <select
                className="input-field !py-1 !text-xs"
                value={row.status}
                onChange={(e) => onStatusChange(row.id, e.target.value as EnquiryStatus)}
              >
                {ENQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
