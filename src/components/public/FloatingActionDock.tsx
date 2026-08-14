'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Props {
  emergencyPhone?: string | null;
}

export default function FloatingActionDock({ emergencyPhone }: Props) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isCallbackOpen, setIsCallbackOpen] = useState(false);
  const [callbackSubmitted, setCallbackSubmitted] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  const phone = emergencyPhone || '+91 80 4567 8999';

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 280) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCallbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !patientPhone.trim()) return;
    setCallbackSubmitted(true);
    setTimeout(() => {
      setCallbackSubmitted(false);
      setIsCallbackOpen(false);
      setPatientName('');
      setPatientPhone('');
    }, 3000);
  };

  return (
    <>
      {/* Floating Dock Container */}
      <aside
        aria-label="Patient Emergency and Quick Actions"
        className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2.5 sm:bottom-6 sm:right-6"
      >
        {/* Quick Callback Pill */}
        <button
          type="button"
          onClick={() => setIsCallbackOpen(true)}
          className="group flex items-center gap-2 rounded-full border border-brand-200 bg-white/95 px-3.5 py-2 text-xs font-bold text-brand-900 shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 hover:bg-brand-50"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-100 text-brand-800">
            📞
          </span>
          <span className="hidden sm:inline">Request Callback</span>
        </button>

        {/* Book Appointment Pill */}
        <Link
          href="/book-appointment"
          className="group flex items-center gap-2 rounded-full border border-brand-600 bg-brand-700 px-4 py-2.5 text-xs font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:bg-brand-800"
        >
          <span className="text-sm">📅</span>
          <span>Book Appointment</span>
        </Link>

        {/* 24/7 Emergency Hotline Button */}
        <a
          href={`tel:${phone.replace(/[^0-9+]/g, '')}`}
          className="animate-pulse-glow group flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-600 to-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-rose-700 hover:to-red-800"
        >
          <span className="flex h-5 w-5 items-center justify-center text-sm">🚨</span>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-200">
              24/7 Trauma Helpline
            </span>
            <span className="font-mono text-xs font-bold">{phone}</span>
          </div>
        </a>

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dde5e9] bg-white/90 text-sm font-bold text-ink shadow-md backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-brand-50 hover:text-brand-800"
          >
            ↑
          </button>
        )}
      </aside>

      {/* Quick Callback Modal */}
      {isCallbackOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-950/60 p-4 backdrop-blur-sm animate-fade-in-up">
          <div className="w-full max-w-md rounded-card border border-[#dde5e9] bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dde5e9] pb-3">
              <div>
                <span className="rounded bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-800">
                  Apollo / Manipal Style Desk
                </span>
                <h3 className="mt-1 font-display text-lg font-bold text-ink">
                  Request an Instant Callback
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCallbackOpen(false)}
                className="rounded-full p-1 text-ink-muted hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {callbackSubmitted ? (
              <div className="my-6 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-center text-sm font-semibold text-emerald-800">
                ✓ Thank you {patientName}! Our outpatient executive will call you at {patientPhone} within 15 minutes.
              </div>
            ) : (
              <form onSubmit={handleCallbackSubmit} className="mt-4 space-y-4">
                <p className="text-xs text-ink-muted leading-relaxed">
                  Enter your contact details below and our hospital outpatient care team will reach out immediately.
                </p>

                <label className="block text-xs font-bold text-ink">
                  Full Name *
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    className="input-field mt-1"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                  />
                </label>

                <label className="block text-xs font-bold text-ink">
                  Mobile Number *
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    className="input-field mt-1"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                  />
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCallbackOpen(false)}
                    className="btn-secondary !px-4 !py-2 !text-xs"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary !px-5 !py-2 !text-xs">
                    Submit Request →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
