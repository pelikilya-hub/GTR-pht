'use client';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTicker } from './useTicker';
import { useLang, Lang } from './useLang';
import { useToast } from './useToast';
import { useAuth } from './useAuth';
import { getDict, Dict } from './i18n';
import { deriveJourney, Journey } from './journey';
import { ls } from './storage';
import { pullShared } from './sharedState';

interface Integrations { payUrl?: string; posUrl?: string; tgToken?: string; tgChat?: string; discord?: string; custom?: string }

export interface AuthUiState {
  open: boolean;
  tab: 'login' | 'reg';
  role: 'sub' | 'donor' | 'crew';
  nick: string;
  contact: string;
  pass: string;
  err: string;
}

interface HubValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  now: number;
  journey: Journey;
  notify: (m: string) => void;
  toast: string;
  auth: ReturnType<typeof useAuth>;
  integrations: Integrations;
  bump: () => void;
  scrollToId: (id: string) => void;
  authUi: AuthUiState;
  openAuth: (opts?: { tab?: 'login' | 'reg'; err?: string }) => void;
  closeAuth: () => void;
  setAuthTab: (tab: 'login' | 'reg') => void;
  setAuthRole: (role: 'sub' | 'donor' | 'crew') => void;
  setAuthField: (field: 'nick' | 'contact' | 'pass', value: string) => void;
  submitAuth: () => void;
}

const HubCtx = createContext<HubValue | null>(null);

export function useHub(): HubValue {
  const v = useContext(HubCtx);
  if (!v) throw new Error('useHub must be used inside <HubProvider>');
  return v;
}

export function HubProvider({ children }: { children: React.ReactNode }) {
  const now = useTicker(1000);
  const [lang, setLang] = useLang();
  const { toast, notify } = useToast();
  const auth = useAuth();
  const [gen, setGen] = useState(0); // bumped after localStorage-mutating actions to force recompute
  const bump = () => setGen((g) => g + 1);

  // Cross-tab sync: another tab (crew console, second device) wrote localStorage.
  useEffect(() => {
    const onStorage = () => bump();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // Shared state from the Worker (channels, pay/GPS URLs, position, status, logbook):
  // on load, every 20s, and whenever the tab comes back to the foreground.
  useEffect(() => {
    let alive = true;
    const pull = () => { pullShared().then((changed) => { if (alive && changed) bump(); }); };
    pull();
    const iv = setInterval(pull, 20000);
    const onVis = () => { if (document.visibilityState === 'visible') pull(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { alive = false; clearInterval(iv); document.removeEventListener('visibilitychange', onVis); };
  }, []);

  // GPS endpoint polling (OwnTracks/Traccar-style JSON {lat,lng,ts}), every 30s.
  useEffect(() => {
    const poll = () => {
      const cfg = ls<Integrations>('gtrpht_integrations', {});
      if (!cfg.posUrl) return;
      fetch(cfg.posUrl, { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => {
          if (j && isFinite(+j.lat) && isFinite(+j.lng)) {
            localStorage.setItem('gtrpht_pos', JSON.stringify({ lat: +j.lat, lng: +j.lng, ts: +j.ts || Date.now(), by: 'endpoint', src: 'gps' }));
            bump();
          }
        })
        .catch(() => {});
    };
    poll();
    const iv = setInterval(poll, 30000);
    return () => clearInterval(iv);
  }, []);

  // Live document title, e.g. "● ДЕНЬ 12/39 · GTR|PHT LIVE"
  useEffect(() => {
    try {
      const ru = lang === 'ru';
      let s: string;
      if (now < Date.parse('2026-08-01T09:00:00+07:00')) s = 'T-' + Math.ceil((Date.parse('2026-08-01T09:00:00+07:00') - now) / 86400000) + ' · GTR|PHT';
      else if (now > Date.parse('2026-09-08T21:00:00+07:00')) s = 'GTR|PHT · FINISH';
      else {
        const d = Math.min(39, Math.floor((now - Date.parse('2026-08-01T00:00:00+07:00')) / 86400000) + 1);
        s = '● ' + (ru ? 'ДЕНЬ ' : 'DAY ') + d + '/39 · GTR|PHT LIVE';
      }
      if (document.title !== s) document.title = s;
    } catch {
      /* ignore */
    }
  }, [now, lang]);

  const t = useMemo(() => getDict(lang), [lang]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const journey = useMemo(() => deriveJourney(now, lang, t), [now, lang, t, gen]);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- gen is a version counter, not read in the body
  const integrations = useMemo(() => ls<Integrations>('gtrpht_integrations', {}), [gen]);

  const scrollToId = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 74, behavior: 'smooth' });
  };

  const [authUi, setAuthUi] = useState<AuthUiState>({ open: false, tab: 'login', role: 'sub', nick: '', contact: '', pass: '', err: '' });
  const openAuth: HubValue['openAuth'] = (opts) => setAuthUi((s) => ({ ...s, open: true, tab: opts?.tab ?? s.tab, err: opts?.err ?? '' }));
  const closeAuth = () => setAuthUi((s) => ({ ...s, open: false, err: '' }));
  const setAuthTab = (tab: 'login' | 'reg') => setAuthUi((s) => ({ ...s, tab, err: '' }));
  const setAuthRole = (role: 'sub' | 'donor' | 'crew') => setAuthUi((s) => ({ ...s, role }));
  const setAuthField = (field: 'nick' | 'contact' | 'pass', value: string) => setAuthUi((s) => ({ ...s, [field]: value }));
  const submitAuth = () => {
    if (authUi.tab === 'reg') {
      const err = auth.register(authUi.nick, authUi.contact, authUi.pass, authUi.role);
      if (err) { setAuthUi((s) => ({ ...s, err })); return; }
      setAuthUi((s) => ({ ...s, open: false, err: '', pass: '' }));
      notify('Добро пожаловать, ' + authUi.nick.trim() + '. Аккаунт создан.');
    } else {
      const err = auth.login(authUi.contact, authUi.pass);
      if (err) { setAuthUi((s) => ({ ...s, err })); return; }
      setAuthUi((s) => ({ ...s, open: false, err: '', pass: '' }));
      notify('С возвращением.');
    }
  };

  const value: HubValue = {
    lang, setLang, t, now, journey, notify, toast, auth, integrations, bump,
    scrollToId, authUi, openAuth, closeAuth, setAuthTab, setAuthRole, setAuthField, submitAuth,
  };
  return <HubCtx.Provider value={value}>{children}</HubCtx.Provider>;
}
