'use client';
import { useHub } from '@/lib/HubContext';
import { ls } from '@/lib/storage';

interface Post { id?: string; ts: number; member: string; type: 'post' | 'mat' | 'hyp' | 'obs'; text: string; link?: string }

export function Logbook() {
  const { t, lang, notify, now } = useHub();
  const ru = lang === 'ru';
  const posts = ls<Post[]>('gtrpht_posts', []);
  const journal = (Array.isArray(posts) ? posts : []).slice(0, 6).map((pp) => ({
    member: String(pp.member || '').toUpperCase(),
    type: t.jrTypes[pp.type] || t.jrTypes.post,
    time: new Date(+pp.ts || now).toLocaleString(ru ? 'ru-RU' : 'en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    text: String(pp.text || ''),
    link: String(pp.link || ''),
  }));

  return (
    <section data-screen-label="logbook" style={{ maxWidth: 1280, margin: '56px auto 0', padding: '0 clamp(14px,4vw,28px)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
        <h2 style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 21, letterSpacing: '.03em', margin: 0, color: '#ECE9E4', flex: 1 }}>{t.jrTitle}</h2>
        <a href="#" onClick={(e) => { e.preventDefault(); notify(ru ? 'Консоль экипажа — отдельный дизайн-файл, не входит в эту сборку' : 'Crew console is a separate design file, not part of this build'); }} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.14em', color: '#FF6A5B' }}>{t.jrOpen}</a>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.2em', color: '#55545C', marginTop: 8 }}>{t.jrSub}</div>
      {journal.length === 0 && (
        <div style={{ border: '1px dashed #2E2E34', padding: 26, marginTop: 22, fontFamily: "'JetBrains Mono',monospace", fontSize: 11, letterSpacing: '.06em', lineHeight: 1.8, color: '#6E6C74' }}>{t.jrEmptyTxt}</div>
      )}
      <div className="logbook-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(340px,100%),1fr))', gap: 12, marginTop: 22 }}>
        {journal.map((j, i) => (
          <div key={i} style={{ border: '1px solid #26262B', background: '#101013', padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Unbounded',sans-serif", fontWeight: 700, fontSize: 12, color: '#FF6A5B' }}>{j.member}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.16em', color: '#8E8C94', border: '1px solid #2A2A30', padding: '3px 8px' }}>{j.type}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#55545C' }}>{j.time}</span>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.6, color: '#B9B6BE', marginTop: 12, whiteSpace: 'pre-wrap' }}>{j.text}</div>
            {j.link && <a href={j.link} target="_blank" rel="noreferrer" style={{ display: 'inline-block', fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.08em', marginTop: 10 }}>{t.jrLink}</a>}
          </div>
        ))}
      </div>
    </section>
  );
}
