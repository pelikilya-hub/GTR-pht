'use client';
import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState('');
  const tt = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((m: string) => {
    setToast(m);
    if (tt.current) clearTimeout(tt.current);
    tt.current = setTimeout(() => setToast(''), 2800);
  }, []);

  return { toast, notify };
}
