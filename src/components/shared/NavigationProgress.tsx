'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { shouldTrackNavigationClick } from './navigation-progress';

const TRICKLE_MS = 240;
const COMPLETE_MS = 400;
const FAILSAFE_MS = 12_000;

export default function NavigationProgress() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const loadingRef = useRef(false);
  const skipPathRef = useRef(true);
  const trickleRef = useRef<number | null>(null);
  const completeRef = useRef<number | null>(null);
  const failsafeRef = useRef<number | null>(null);
  const startRef = useRef<() => void>(() => undefined);
  const finishRef = useRef<() => void>(() => undefined);

  const clearTrickle = () => {
    if (trickleRef.current) window.clearInterval(trickleRef.current);
    trickleRef.current = null;
  };

  startRef.current = () => {
    if (completeRef.current) window.clearTimeout(completeRef.current);
    completeRef.current = null;
    clearTrickle();
    loadingRef.current = true;
    setVisible(true);
    setProgress(18);
    trickleRef.current = window.setInterval(() => {
      setProgress((current) => {
        if (current >= 92) return current;
        if (current < 40) return current + 16;
        if (current < 70) return current + 7;
        return current + 2;
      });
    }, TRICKLE_MS);
    if (failsafeRef.current) window.clearTimeout(failsafeRef.current);
    failsafeRef.current = window.setTimeout(() => finishRef.current(), FAILSAFE_MS);
  };

  finishRef.current = () => {
    if (!loadingRef.current) return;
    loadingRef.current = false;
    clearTrickle();
    if (failsafeRef.current) window.clearTimeout(failsafeRef.current);
    failsafeRef.current = null;
    setVisible(true);
    setProgress(100);
    completeRef.current = window.setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, COMPLETE_MS);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (skipPathRef.current) {
      skipPathRef.current = false;
      return;
    }
    finishRef.current();
  }, [pathname]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest('a');
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (!shouldTrackNavigationClick(event, anchor, new URL(window.location.href))) {
        return;
      }
      startRef.current();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clearTrickle();
      if (completeRef.current) window.clearTimeout(completeRef.current);
      if (failsafeRef.current) window.clearTimeout(failsafeRef.current);
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      id="site-nav-progress"
      role="status"
      aria-live="polite"
      aria-label={visible ? 'Loading page' : undefined}
      aria-hidden={!visible}
    >
      <div
        className="site-nav-progress-bar"
        style={{
          width: `${progress}%`,
          opacity: visible ? 1 : 0,
          transition: visible ? 'width 200ms ease-out, opacity 200ms linear' : 'opacity 200ms linear',
        }}
      />
    </div>,
    document.body
  );
}
