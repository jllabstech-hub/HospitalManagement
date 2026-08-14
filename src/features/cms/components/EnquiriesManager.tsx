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
  const [searchQuery, setSearchQuery] = useState('');

  const q = searchQuery.toLowerCase().trim();

  const filteredContactMessages = contactMessages.filter(
    (row) =>
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      row.subject.toLowerCase().includes(q) ||
      row.message.toLowerCase().includes(q)
  );

  const filteredAppointmentEnquiries = appointmentEnquiries.filter(
    (row) =>
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      (row.phone && row.phone.toLowerCase().includes(q)) ||
      (row.detail && row.detail.toLowerCase().includes(q))
  );

  const filteredInternationalEnquiries = internationalEnquiries.filter(
    (row) =>
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      (row.phone && row.phone.toLowerCase().includes(q)) ||
      (row.detail && row.detail.toLowerCase().includes(q))
  );

  const filteredPackageRequests = packageRequests.filter(
    (row) =>
      !q ||
      row.name.toLowerCase().includes(q) ||
      row.email.toLowerCase().includes(q) ||
      (row.packageName && row.packageName.toLowerCase().includes(q))
  );

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
    { key: 'contact', label: 'Contact Messages', count: filteredContactMessages.length },
    { key: 'appointment', label: 'Appointment Enquiries', count: filteredAppointmentEnquiries.length },
    { key: 'international', label: 'International', count: filteredInternationalEnquiries.length },
    { key: 'package', label: 'Package Requests', count: filteredPackageRequests.length },
  ];

  return (
    <div className="space-y-4">
      {feedback && (
        <p className="rounded-card border border-brand-200 bg-brand-50 px-4 py-2 text-sm text-brand-800">
          {feedback}
        </p>
      )}

      {/* Live Search Bar */}
      <div className="relative flex items-center">
        <svg
          className="pointer-events-none absolute left-3 h-4 w-4 text-ink-muted"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          type="text"
          placeholder="Search enquiries by name, email, subject, or keywords as you type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field pl-9 pr-8 text-xs font-medium sm:text-sm"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 rounded-full p-1 text-xs font-bold text-ink-soft transition hover:bg-brand-50 hover:text-ink"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

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
              {filteredContactMessages.map((row) => (
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
            rows={filteredAppointmentEnquiries}
            onStatusChange={(id, status) => handleEnquiryStatus('appointment', id, status)}
          />
        )}

        {tab === 'international' && (
          <EnquiryTable
            rows={filteredInternationalEnquiries}
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
              {filteredPackageRequests.map((row) => (
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

        {((tab === 'contact' && filteredContactMessages.length === 0) ||
          (tab === 'appointment' && filteredAppointmentEnquiries.length === 0) ||
          (tab === 'international' && filteredInternationalEnquiries.length === 0) ||
          (tab === 'package' && filteredPackageRequests.length === 0)) && (
          <p className="py-8 text-center text-sm text-ink-muted">No records matching your search query.</p>
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
