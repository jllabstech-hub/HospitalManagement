'use client';

import { useState } from 'react';

interface Props {
  title: string;
  description?: string;
  frontendPath?: string;
  children?: React.ReactNode;
}

const FRONTEND_PATH_MAP: Record<string, string> = {
  '/admin/dashboard': '/',
  '/admin/analytics': '/',
  '/admin/departments': '/departments',
  '/admin/doctors': '/doctors',
  '/admin/appointments': '/book-appointment',
  '/admin/centres': '/centres-of-excellence',
  '/admin/services': '/services',
  '/admin/specialities': '/specialities',
  '/admin/health-packages': '/health-packages',
  '/admin/health-library': '/health-library',
  '/admin/news': '/news',
  '/admin/faqs': '/patient-resources/faq',
  '/admin/patient-resources': '/patient-resources',
  '/admin/success-stories': '/success-stories',
  '/admin/leadership': '/about/leadership',
  '/admin/facilities': '/about/facilities',
  '/admin/insurance': '/insurance',
  '/admin/international': '/international-patients',
  '/admin/media': '/',
  '/admin/enquiries': '/contact',
  '/admin/content': '/about',
  '/admin/content/hospital': '/about/overview',
  '/admin/content-import': '/departments',
};

export default function AdminPageHeader({
  title,
  description,
  frontendPath,
  children,
}: Props) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'before' | 'after'>('split');
  const [reloadKey, setReloadKey] = useState(Date.now());

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const targetPath = frontendPath || FRONTEND_PATH_MAP[currentPath] || '/';
  const fullFrontendUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${targetPath}`
      : `http://localhost:5000${targetPath}`;

  const openPopupWindow = () => {
    if (typeof window !== 'undefined') {
      const width = Math.min(1280, window.screen.width * 0.9);
      const height = Math.min(850, window.screen.height * 0.9);
      const left = (window.screen.width - width) / 2;
      const top = (window.screen.height - height) / 2;
      window.open(
        `${fullFrontendUrl}?preview=live`,
        'LivePreviewWindow',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }
  };

  const handleRefresh = () => {
    setReloadKey(Date.now());
  };

  return (
    <div className="space-y-3 pb-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
        </div>

        {children && <div className="flex items-center gap-2">{children}</div>}
      </div>

      {/* Frontend URL Hint Banner */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-brand-200/80 bg-brand-50/60 px-3.5 py-2 text-xs text-brand-900">
        <div className="flex items-center gap-2 font-medium">
          <span className="font-bold text-brand-800 uppercase tracking-wider text-[10px] bg-brand-200/60 px-1.5 py-0.5 rounded">
            Frontend Match
          </span>
          <span className="text-ink-muted">Public Page:</span>
          <a
            href={fullFrontendUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-700 underline hover:text-brand-900 truncate max-w-md"
          >
            {fullFrontendUrl}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openPopupWindow}
            className="font-semibold text-brand-700 hover:underline text-[11px]"
          >
            Open Browser Window ↗
          </button>
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="font-bold text-brand-800 hover:underline text-[11px]"
          >
            Open Interactive Modal →
          </button>
        </div>
      </div>

      {/* Live Preview Modal Popup */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-3 sm:p-5 backdrop-blur-md">
          <div className="flex h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-card border border-[#dde5e9] bg-white shadow-elevated">
            {/* Modal Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#dde5e9] bg-brand-950 px-6 py-3.5 text-white">
              <div>
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <span>👁 Live Page Preview</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-white/10 px-2 py-0.5 rounded border border-white/20 text-brand-200">
                    Interactive HTML View
                  </span>
                </h3>
                <p className="text-xs text-brand-200">
                  Compare published baseline layout against live updated HTML changes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex rounded-button border border-white/20 bg-white/10 p-0.5 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setViewMode('split')}
                    className={`rounded px-2.5 py-1 transition ${
                      viewMode === 'split' ? 'bg-white text-brand-950' : 'text-brand-100 hover:text-white'
                    }`}
                  >
                    Side-by-Side
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('before')}
                    className={`rounded px-2.5 py-1 transition ${
                      viewMode === 'before' ? 'bg-white text-brand-950' : 'text-brand-100 hover:text-white'
                    }`}
                  >
                    Before View
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('after')}
                    className={`rounded px-2.5 py-1 transition ${
                      viewMode === 'after' ? 'bg-white text-brand-950' : 'text-brand-100 hover:text-white'
                    }`}
                  >
                    After View (Live)
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleRefresh}
                  className="rounded-button border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  title="Reload Preview Frames"
                >
                  ↻ Refresh
                </button>

                <button
                  type="button"
                  onClick={openPopupWindow}
                  className="rounded-button border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
                  title="Open Detached Browser Window"
                >
                  External Window ↗
                </button>

                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="rounded-full bg-white/10 p-1.5 text-xs font-bold text-white transition hover:bg-white/20"
                  title="Close Live Preview"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Preview Frames Area */}
            <div className="relative flex-1 overflow-hidden bg-surface-muted">
              {viewMode === 'split' ? (
                <div className="grid h-full grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#dde5e9]">
                  {/* Left Column: Before View */}
                  <div className="flex h-full flex-col">
                    <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-xs font-semibold text-amber-900 flex justify-between items-center shrink-0">
                      <span>BEFORE: Baseline Published Site</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-200/70 px-2 py-0.5 rounded text-amber-900">
                        Published View
                      </span>
                    </div>
                    <iframe
                      key={`before-${reloadKey}`}
                      src={fullFrontendUrl}
                      title="Before Changes Baseline Preview"
                      className="h-full w-full border-0 bg-white"
                    />
                  </div>

                  {/* Right Column: After View */}
                  <div className="flex h-full flex-col">
                    <div className="bg-accent-50 px-4 py-2 border-b border-accent-200 text-xs font-semibold text-accent-900 flex justify-between items-center shrink-0">
                      <span>AFTER: Live Rendered Output</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-accent-200/70 px-2 py-0.5 rounded text-accent-900">
                        Live Preview
                      </span>
                    </div>
                    <iframe
                      key={`after-${reloadKey}`}
                      src={`${fullFrontendUrl}?preview=live&t=${reloadKey}`}
                      title="After Changes Live Preview"
                      className="h-full w-full border-0 bg-white"
                    />
                  </div>
                </div>
              ) : viewMode === 'before' ? (
                <div className="flex h-full flex-col">
                  <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 text-xs font-semibold text-amber-900 flex justify-between items-center shrink-0">
                    <span>BEFORE: Published Baseline View ({fullFrontendUrl})</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-200/70 px-2 py-0.5 rounded text-amber-900">
                      Published View
                    </span>
                  </div>
                  <iframe
                    key={`before-full-${reloadKey}`}
                    src={fullFrontendUrl}
                    title="Before Changes Full Preview"
                    className="h-full w-full border-0 bg-white"
                  />
                </div>
              ) : (
                <div className="flex h-full flex-col">
                  <div className="bg-accent-50 px-4 py-2 border-b border-accent-200 text-xs font-semibold text-accent-900 flex justify-between items-center shrink-0">
                    <span>AFTER: Live Rendered HTML Output ({fullFrontendUrl})</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-accent-200/70 px-2 py-0.5 rounded text-accent-900">
                      Live Preview
                    </span>
                  </div>
                  <iframe
                    key={`after-full-${reloadKey}`}
                    src={`${fullFrontendUrl}?preview=live&t=${reloadKey}`}
                    title="After Changes Full Preview"
                    className="h-full w-full border-0 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-[#dde5e9] bg-surface-soft px-6 py-3 text-xs">
              <span className="text-ink-muted">
                Public Frontend URL: <strong className="text-ink">{fullFrontendUrl}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={openPopupWindow}
                  className="btn-secondary !py-1.5 !text-xs"
                >
                  Open Browser Window ↗
                </button>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="btn-primary !py-1.5 !text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
