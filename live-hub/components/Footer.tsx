'use client';
import Link from 'next/link';
import { useHub } from '@/lib/HubContext';

export function Footer() {
  const { t, lang } = useHub();
  const ru = lang === 'ru';
  return (
    <footer className="foot">
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(260px,100%),1fr))', gap: 32, alignItems: 'end' }}>
        <div>
          <div className="logo" style={{ fontSize: 'clamp(48px,8vw,110px)', letterSpacing: '-.04em', lineHeight: .9 }}>GTR<i>|</i>PHT</div>
          <div className="meta" style={{ marginTop: 16 }}>{t.f2}</div>
        </div>
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {t.nav.map(([id, l]) => <a key={id} href={'#' + id} style={{ color: 'var(--ink-3)', fontSize: 14 }}>{l}</a>)}
          <Link href="/console/" style={{ color: 'var(--red-2)', fontSize: 14 }}>{ru ? 'Консоль экипажа' : 'Crew console'}</Link>
          <Link href="/credits/" style={{ color: 'var(--ink-4)', fontSize: 14 }}>Photo credits</Link>
        </div>
      </div>
    </footer>
  );
}
