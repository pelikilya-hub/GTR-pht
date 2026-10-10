'use client';
import { useEffect, useState } from 'react';
import { useHub } from '@/lib/HubContext';

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }
const LS = 'gtrpht_install_dismissed';

/**
 * Makes the site an app: registers the service worker and offers installation —
 * Chrome / Android / desktop: the native install prompt behind our button;
 * iOS Safari (no prompt API): a one-time hint "Share → Add to Home Screen".
 * Hidden when already running as an installed app.
 */
export function AppInstall() {
  const { lang } = useHub();
  const ru = lang === 'ru';
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/sw.js').catch(() => {});
    const standalone = window.matchMedia('(display-mode: standalone), (display-mode: fullscreen)').matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    if (standalone) { document.documentElement.classList.add('is-app'); return; }
    let dismissed = false;
    try { dismissed = Date.now() - Number(localStorage.getItem(LS) || 0) < 7 * 864e5; } catch { /* ignore */ }
    const onBip = (e: Event) => { e.preventDefault(); setBip(e as BIPEvent); if (!dismissed) setShow(true); };
    window.addEventListener('beforeinstallprompt', onBip);
    const ua = navigator.userAgent;
    const isIosSafari = /iPhone|iPad|iPod/.test(ua) && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|YaBrowser/.test(ua);
    let t = 0;
    if (isIosSafari && !dismissed) t = window.setTimeout(() => { setIos(true); setShow(true); }, 25000);
    const onInstalled = () => { setShow(false); setBip(null); };
    window.addEventListener('appinstalled', onInstalled);
    return () => { window.removeEventListener('beforeinstallprompt', onBip); window.removeEventListener('appinstalled', onInstalled); clearTimeout(t); };
  }, []);

  const close = () => { setShow(false); try { localStorage.setItem(LS, String(Date.now())); } catch { /* ignore */ } };
  const install = async () => { if (!bip) return; await bip.prompt(); const r = await bip.userChoice.catch(() => null); if (r?.outcome === 'accepted') setShow(false); setBip(null); };

  if (!show || (!bip && !ios)) return null;
  return (
    <div className="app-install" role="dialog" aria-label={ru ? 'Установить приложение' : 'Install the app'}>
      <img src="/app/icon-192.png" alt="" width={44} height={44} />
      <div className="ai-txt">
        <b>{ru ? 'BANGTAOSTYLE — приложением' : 'BANGTAOSTYLE as an app'}</b>
        {ios
          ? <span>{ru ? <>Нажми <i className="ai-share" aria-label="Поделиться" /> и «На экран „Домой“» — откроется во весь экран</> : <>Tap <i className="ai-share" aria-label="Share" /> then “Add to Home Screen” — opens full screen</>}</span>
          : <span>{ru ? 'Во весь экран, с иконкой на рабочем столе' : 'Full screen, with its own icon'}</span>}
      </div>
      {!ios && <button className="btn btn-red btn-sm" onClick={install}>{ru ? 'Установить' : 'Install'}</button>}
      <button className="ai-x" onClick={close} aria-label={ru ? 'Закрыть' : 'Close'}>✕</button>
    </div>
  );
}
