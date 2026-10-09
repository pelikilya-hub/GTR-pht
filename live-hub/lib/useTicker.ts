'use client';
import { useEffect, useState } from 'react';

// 1s ticking clock — mirrors the prototype's setInterval(...,1000) driving all live values.
export function useTicker(intervalMs = 1000): number {
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(iv);
  }, [intervalMs]);
  return now;
}
