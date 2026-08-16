'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import JobProgressPanel, { type JobStage } from '@/components/shared/JobProgressPanel';
import { CATEGORY_LABELS } from '../constants';
import { importExtractedContentAction } from '../actions';
import {
  IMPORT_CATEGORIES,
  type CrawlPreview,
  type ImportCategory,
  type ImportCounts,
  type ImportResult,
} from '../types';

const DEFAULT_SELECTED: ImportCategory[] = [
  'departments',
  'specialities',
  'services',
  'centres',
  'packages',
  'faqs',
  'facilities',
  'patientResources',
  'articles',
];

function countPreview(preview: CrawlPreview): Record<string, number> {
  return {
    departments: preview.departments.length,
    specialities: preview.specialities.length,
    services: preview.services.length,
    centres: preview.centres.length,
    packages: preview.packages.length,
    faqs: preview.faqs.length,
    facilities: preview.facilities.length,
    patientResources: preview.patientResources.length,
    articles: preview.articles.length,
    news: preview.news.length,
    insurance: preview.insurance.length,
    testimonials: preview.testimonials.length,
  };
}

function categoriesWithContent(preview: CrawlPreview): ImportCategory[] {
  return IMPORT_CATEGORIES.filter((category) => {
    if (category === 'hospitalProfile') return Boolean(preview.hospitalProfile);
    if (category === 'international') return Boolean(preview.international);
    const value = preview[category];
    return Array.isArray(value) && value.length > 0;
  });
}

function emptyTotals(): ImportCounts {
  return { created: 0, updated: 0, skipped: 0, failed: 0 };
}

function addCounts(target: ImportCounts, extra: ImportCounts) {
  target.created += extra.created;
  target.updated += extra.updated;
  target.skipped += extra.skipped;
  target.failed += extra.failed;
}

export default function ContentImportClient() {
  const [url, setUrl] = useState('');
  const [selected, setSelected] = useState<ImportCategory[]>(DEFAULT_SELECTED);
  const [preview, setPreview] = useState<CrawlPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<'crawl' | 'import' | null>(null);
  const [stages, setStages] = useState<JobStage[]>([]);
  const [activeMessage, setActiveMessage] = useState<string | null>(null);

  const counts = useMemo(() => (preview ? countPreview(preview) : null), [preview]);

  function toggleCategory(category: ImportCategory) {
    setSelected((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category]
    );
  }

  async function runCrawl() {
    setError(null);
    setResult(null);
    setPreview(null);
    setBusy('crawl');
    setStages([
      { id: 'discover', label: 'Discovering hospital pages...', status: 'active' },
      { id: 'extract', label: 'Extracting departments, services, packages and FAQs...', status: 'pending' },
      { id: 'prepare', label: 'Preparing CMS content...', status: 'pending' },
    ]);
    setActiveMessage('Discovering hospital pages...');

    try {
      const response = await fetch('/api/admin/content-import/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error || 'Crawl failed.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as { type: string; message?: string; stage?: string; preview?: CrawlPreview; error?: string };
          if (event.type === 'progress') {
            setActiveMessage(event.message || null);
            setStages((current) =>
              current.map((stage) => {
                if (event.stage === 'prepare' && stage.id === 'prepare') return { ...stage, status: 'active' };
                if (event.stage === 'discover' && stage.id === 'discover') return { ...stage, status: 'active' };
                if (event.stage !== 'discover' && event.stage !== 'prepare' && stage.id === 'extract') {
                  return { ...stage, status: 'active' };
                }
                if (stage.status === 'active' && event.stage === 'prepare' && stage.id !== 'prepare') {
                  return { ...stage, status: 'done' };
                }
                return stage;
              })
            );
          }
          if (event.type === 'complete' && event.preview) {
            setPreview(event.preview);
            setStages((current) => current.map((stage) => ({ ...stage, status: 'done' })));
            setActiveMessage(null);
          }
          if (event.type === 'error') {
            throw new Error(event.error || 'Crawl failed.');
          }
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Crawl failed.');
      setStages((current) =>
        current.map((stage) => (stage.status === 'active' ? { ...stage, status: 'error' } : stage))
      );
    } finally {
      setBusy(null);
    }
  }

  async function runImport(categories: ImportCategory[]) {
    if (!preview) return;
    const queue = categories.filter((category) => categoriesWithContent(preview).includes(category));
    if (!queue.length) {
      setError('No extracted content is available for the selected types.');
      return;
    }
    setError(null);
    setBusy('import');
    setResult(null);
    setStages(
      queue.map((category, index) => ({
        id: category,
        label: `Importing ${CATEGORY_LABELS[category].toLowerCase()}...`,
        status: index === 0 ? 'active' : 'pending',
      }))
    );
    setActiveMessage(`Importing ${CATEGORY_LABELS[queue[0]].toLowerCase()}...`);

    const totals = emptyTotals();
    const byCategory: Record<string, ImportCounts> = {};
    try {
      for (let index = 0; index < queue.length; index += 1) {
        const category = queue[index];
        setActiveMessage(`Importing ${CATEGORY_LABELS[category].toLowerCase()}...`);
        setStages((current) =>
          current.map((stage) => {
            if (stage.id === category) return { ...stage, status: 'active' };
            if (queue.indexOf(stage.id as ImportCategory) < index) {
              return {
                ...stage,
                status: 'done',
                label: `${CATEGORY_LABELS[stage.id as ImportCategory]} complete`,
              };
            }
            return stage;
          })
        );
        const response = await importExtractedContentAction({ preview, categories: [category] });
        if (!response.success) {
          setError(response.error);
          setStages((current) =>
            current.map((stage) => (stage.id === category ? { ...stage, status: 'error' } : stage))
          );
          return;
        }
        byCategory[category] = response.result.byCategory[category] ?? emptyTotals();
        addCounts(totals, response.result.totals);
      }
      setResult({ byCategory, totals });
      setStages((current) =>
        current.map((stage) => ({
          ...stage,
          status: 'done',
          label: `${CATEGORY_LABELS[stage.id as ImportCategory]} complete`,
        }))
      );
      setActiveMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <section className="card-surface space-y-4 p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Populate Hospital Content</h2>
        <p className="text-sm text-ink-muted">
          Optionally crawl this hospital&apos;s existing public website, preview extracted CMS content, then import it
          here. Doctors are never imported.
        </p>
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" disabled checked={false} />
          Doctors (not available)
        </label>
        <label className="block text-sm font-semibold text-ink" htmlFor="hospital-url">
          Enter hospital website
        </label>
        <input
          id="hospital-url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://www.your-hospital-website.com"
          className="input-field"
        />
        <button type="button" className="btn-primary" disabled={!url.trim() || busy !== null} onClick={runCrawl}>
          {busy === 'crawl' ? 'Crawling…' : 'Crawl Website'}
        </button>
      </section>

      {(busy || stages.length > 0) && <JobProgressPanel stages={stages} activeMessage={activeMessage} />}
      {error && <p className="rounded-card border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}

      {preview && counts && (
        <section className="card-surface space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Content found</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {Object.entries(counts).map(([key, value]) => (
              <div key={key} className="flex justify-between rounded-button bg-surface-muted px-3 py-2">
                <span className="capitalize text-ink-muted">{key}</span>
                <span className="font-semibold text-ink">{value}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {IMPORT_CATEGORIES.map((category) => (
              <label key={category} className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={() => toggleCategory(category)}
                />
                {CATEGORY_LABELS[category]}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" disabled checked={false} />
              Doctors (not available)
            </label>
          </div>

          <PreviewLists preview={preview} />

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={busy !== null}
              onClick={() => runImport(categoriesWithContent(preview))}
            >
              Import All
            </button>
            <button type="button" className="btn-secondary" disabled={busy !== null || selected.length === 0} onClick={() => runImport(selected)}>
              Import Selected
            </button>
          </div>
        </section>
      )}

      {result && (
        <section className="card-surface space-y-4 p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Content imported</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
            {Object.entries(result.byCategory).map(([key, counts]) => (
              <div key={key} className="flex justify-between rounded-button bg-surface-muted px-3 py-2">
                <span className="text-ink-muted">{CATEGORY_LABELS[key as ImportCategory] || key}</span>
                <span className="font-semibold text-ink">{counts.created + counts.updated}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-ink-muted">
            Created {result.totals.created} · Updated {result.totals.updated} · Skipped {result.totals.skipped} · Failed{' '}
            {result.totals.failed}
          </p>
          <Link href="/admin/content" className="btn-primary inline-flex">
            View CMS
          </Link>
        </section>
      )}
    </div>
  );
}

function PreviewLists({ preview }: { preview: CrawlPreview }) {
  const groups: Array<[string, { name: string; description?: string }[]]> = [
    ['Departments', preview.departments],
    ['Specialities', preview.specialities],
    ['Services', preview.services],
    ['Centres', preview.centres],
    ['Packages', preview.packages],
    ['FAQs', preview.faqs.map((item) => ({ name: item.question || item.name, description: item.answer || item.description }))],
    ['Facilities', preview.facilities],
    ['Patient resources', preview.patientResources],
    ['Articles', preview.articles],
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map(([title, items]) =>
        items.length ? (
          <div key={title}>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <ul className="mt-2 max-h-40 space-y-1 overflow-auto text-sm text-ink-muted">
              {items.slice(0, 12).map((item) => (
                <li key={item.name}>✓ {item.name}</li>
              ))}
              {items.length > 12 && <li>… {items.length - 12} more</li>}
            </ul>
          </div>
        ) : null
      )}
    </div>
  );
}
