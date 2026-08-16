'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { BusyLabel } from '@/components/ui/Spinner';
import { CMS_IMAGE_STYLES } from '../image-styles';
import type { ImageStyle } from '@/server/ai/image-generation/types';
import {
  attachCmsImageAction,
  discardGeneratedCmsImageAction,
  generateCmsImageAction,
} from '../actions';
import type { CmsImageContentType } from '../types';

interface GenerateImageControlProps {
  contentType: CmsImageContentType;
  recordId: string;
  title: string;
  currentImageUrl?: string | null;
  onAttached?: (url: string) => void;
  compact?: boolean;
}

type Phase = 'idle' | 'dialog' | 'generating' | 'preview' | 'attaching' | 'error';

export default function GenerateImageControl({
  contentType,
  recordId,
  title,
  currentImageUrl,
  onAttached,
  compact = false,
}: GenerateImageControlProps) {
  const router = useRouter();
  const titleId = useId();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [style, setStyle] = useState<ImageStyle>('medical-editorial');
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<{ mediaId: string; url: string } | null>(null);
  const inFlight = useRef(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && phase !== 'generating' && phase !== 'attaching') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, phase]);

  useEffect(() => {
    if (open && phase === 'dialog' && !inFlight.current) {
      void generate();
    }
    // generate is stable enough via inFlight guard
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  const close = async () => {
    if (phase === 'generating' || phase === 'attaching') return;
    if (generated) {
      await discardGeneratedCmsImageAction(generated.mediaId);
    }
    setOpen(false);
    setPhase('idle');
    setError(null);
    setGenerated(null);
    inFlight.current = false;
  };

  const generate = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setPhase('generating');
    setError(null);
    setGenerated(null);
    const result = await generateCmsImageAction({ contentType, recordId, style });
    inFlight.current = false;
    if (!result.success) {
      setPhase('error');
      setError(result.error || 'Unable to generate image. Please try again.');
      return;
    }
    if (!result.data) {
      setPhase('error');
      setError('Unable to generate image. Please try again.');
      return;
    }
    setGenerated({ mediaId: result.data.mediaId, url: result.data.url });
    setPhase('preview');
  };

  const useGenerated = async () => {
    if (!generated || inFlight.current) return;
    inFlight.current = true;
    setPhase('attaching');
    const result = await attachCmsImageAction({
      contentType,
      recordId,
      mediaId: generated.mediaId,
      replaceExisting: true,
    });
    inFlight.current = false;
    if (!result.success) {
      setPhase('preview');
      setError(result.error || 'Image was saved to the media library but could not be attached. Please try again.');
      return;
    }
    if (!result.data) {
      setPhase('preview');
      setError('Image was saved to the media library but could not be attached. Please try again.');
      return;
    }
    onAttached?.(result.data.url);
    router.refresh();
    setOpen(false);
    setPhase('idle');
    setGenerated(null);
  };

  const keepCurrent = async () => {
    if (generated) {
      await discardGeneratedCmsImageAction(generated.mediaId);
    }
    setOpen(false);
    setPhase('idle');
    setGenerated(null);
    setError(null);
  };

  const busy = phase === 'generating' || phase === 'attaching';
  const hasCurrent = Boolean(currentImageUrl);
  const buttonLabel = hasCurrent ? 'Regenerate' : 'Generate Image';

  return (
    <>
      <button
        type="button"
        className={
          compact
            ? 'text-sm font-medium text-brand-700 hover:underline disabled:opacity-50'
            : 'rounded-button border border-brand-800/80 bg-white px-3 py-2 text-xs font-semibold text-brand-900 hover:bg-brand-50 disabled:opacity-50'
        }
        disabled={busy}
        aria-haspopup="dialog"
        onClick={() => {
          setOpen(true);
          setPhase('dialog');
          setError(null);
        }}
      >
        {buttonLabel}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-lg rounded-card border border-[#dde5e9] bg-white p-5 shadow-elevated"
          >
            <h3 id={titleId} className="font-display text-lg font-semibold text-ink">
              Generate image for
            </h3>
            <p className="mt-1 text-sm font-medium text-ink">{title}</p>
            <p className="mt-1 text-xs text-ink-muted">
              Gemini will create a photorealistic hospital photograph from this speciality’s name and CMS description.
            </p>

            {phase !== 'preview' ? (
              <fieldset className="mt-4 space-y-2" disabled={busy}>
                <legend className="text-xs font-semibold text-ink">Image style</legend>
                {CMS_IMAGE_STYLES.map((option) => (
                  <label key={option.id} className="flex items-center gap-2 text-sm text-ink">
                    <input
                      type="radio"
                      name={`image-style-${recordId}`}
                      value={option.id}
                      checked={style === option.id}
                      onChange={() => setStyle(option.id)}
                    />
                    {option.label}
                  </label>
                ))}
              </fieldset>
            ) : null}

            {phase === 'generating' ? (
              <p className="mt-4 text-sm text-ink-muted" role="status" aria-live="polite">
                <BusyLabel>Creating a beautiful image for {title}...</BusyLabel>
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 text-sm font-medium text-rose-700" role="alert">
                {error}
              </p>
            ) : null}

            {phase === 'preview' || phase === 'attaching' ? (
              generated ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs font-semibold text-ink-muted" role="status" aria-live="polite">
                  Image generated. Review before replacing the current image.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <figure>
                    <figcaption className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Current
                    </figcaption>
                    <div className="aspect-video overflow-hidden rounded-lg border border-[#dde5e9] bg-surface-warm">
                      {currentImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={currentImageUrl} alt="Current CMS image" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-ink-muted">No current image</div>
                      )}
                    </div>
                  </figure>
                  <figure>
                    <figcaption className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
                      Generated
                    </figcaption>
                    <div className="aspect-video overflow-hidden rounded-lg border border-[#dde5e9] bg-surface-warm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={generated.url} alt={`Generated image for ${title}`} className="h-full w-full object-cover" />
                    </div>
                  </figure>
                </div>
              </div>
              ) : null
            ) : null}

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              {phase === 'preview' || phase === 'attaching' ? (
                <>
                  <Button variant="outline" onClick={keepCurrent} disabled={busy}>
                    {hasCurrent ? 'Keep Current' : 'Discard'}
                  </Button>
                  <Button onClick={useGenerated} loading={phase === 'attaching'}>
                    {hasCurrent ? 'Use Generated' : 'Use Image'}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={close} disabled={busy}>
                    Cancel
                  </Button>
                  <Button onClick={generate} loading={phase === 'generating'} disabled={busy}>
                    {phase === 'generating' ? 'Generating...' : 'Generate'}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
