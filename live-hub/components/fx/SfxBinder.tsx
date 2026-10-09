'use client';
import { useEffect } from 'react';
import { sfx, unlockSfx } from '@/lib/sfx';

const HOVER = '.btn, .chip, .seg button, .stop, .place, .car-shot, .nav a, .gtr-hover';

/** Wires UI sounds to every interactive element (event delegation, no per-component code). */
export function SfxBinder() {
  useEffect(() => {
    let lastEl: Element | null = null;
    const over = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const el = (e.target as Element | null)?.closest?.(HOVER) || null;
      if (el && el !== lastEl) sfx('tick');
      lastEl = el;
    };
    const down = () => unlockSfx();
    const click = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('button, a, .stop, .place, .car-shot');
      if (el) sfx('click');
    };
    document.addEventListener('pointerover', over);
    document.addEventListener('pointerdown', down);
    document.addEventListener('click', click);
    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerdown', down);
      document.removeEventListener('click', click);
    };
  }, []);
  return null;
}
