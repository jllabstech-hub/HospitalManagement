'use client';

export type JobStage = {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
};

interface Props {
  stages: JobStage[];
  activeMessage?: string | null;
}

export default function JobProgressPanel({ stages, activeMessage }: Props) {
  if (!stages.length) return null;

  return (
    <div
      className="rounded-card border border-brand-200 bg-brand-50/70 p-4"
      data-testid="job-progress"
      aria-live="polite"
    >
      <p className="text-xs font-bold uppercase tracking-wider text-brand-800">Progress</p>
      <ul className="mt-3 space-y-2 text-sm">
        {stages.map((stage) => (
          <li key={stage.id} className="flex items-center gap-2 text-ink">
            <span aria-hidden className="w-4 text-center">
              {stage.status === 'done' ? '✓' : stage.status === 'error' ? '✕' : stage.status === 'active' ? '◌' : '·'}
            </span>
            <span className={stage.status === 'active' ? 'font-semibold text-brand-900' : 'text-ink-muted'}>
              {stage.label}
            </span>
          </li>
        ))}
      </ul>
      {activeMessage && <p className="mt-3 text-xs text-brand-800">{activeMessage}</p>}
    </div>
  );
}
