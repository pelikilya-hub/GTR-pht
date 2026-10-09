'use client';
import { useCallback, useEffect, useState } from 'react';

export type Lang = 'ru' | 'en';

export function useLang(): [Lang, (l: Lang) => void] {
  const [lang, setLangState] = useState<Lang>('ru');

  useEffect(() => {
    // One-time hydration-safe read of the persisted choice: first paint
    // always renders 'ru', then this syncs from localStorage after mount.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (localStorage.getItem('gtrpht_lang') === 'en') setLangState('en');
    } catch {
      /* ignore */
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem('gtrpht_lang', l);
    } catch {
      /* ignore */
    }
  }, []);

  return [lang, setLang];
}
