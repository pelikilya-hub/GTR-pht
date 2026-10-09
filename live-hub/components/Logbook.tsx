'use client';
import { useHub } from '@/lib/HubContext';
import { ls } from '@/lib/storage';
import { SectionHead } from './ui/Motion';

interface Post { id?: string; ts: number; member: string; type: 'post' | 'mat' | 'hyp' | 'obs'; text: string; link?: string }

export function Logbook() {
  const { t, lang, now } = useHub();
  const ru = lang === 'ru';
  const posts = ls<Post[]>('gtrpht_posts', []);
  const journal = (Array.isArray(posts) ? posts : []).slice(0, 6);
  return (
    <section className="sec" id="logbook" data-screen-label="logbook">
      <div className="wrap">
        <SectionHead kicker={t.jrSub} title={t.jrTitle} />
        {journal.length === 0 ? (
          <div className="panel rv" style={{ padding: 28, color: 'var(--ink-2)', fontSize: 15, lineHeight: 1.65, maxWidth: 760 }}>{t.jrEmptyTxt}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(360px,100%),1fr))', gap: 14 }}>
            {journal.map((j, i) => (
              <article key={j.id || i} className="panel rv" style={{ padding: 22, ['--d' as string]: `${i * 0.05}s` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontFamily: 'var(--display)', fontWeight: 800, color: 'var(--red-2)' }}>{String(j.member || '').toUpperCase()}</span>
                  <span className="chip" style={{ height: 24, fontSize: 9 }}>{t.jrTypes[j.type] || t.jrTypes.post}</span>
                  <span style={{ flex: 1 }} />
                  <span className="meta">{new Date(+j.ts || now).toLocaleString(ru ? 'ru-RU' : 'en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })}</span>
                </div>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', margin: '14px 0 0', whiteSpace: 'pre-wrap' }}>{j.text}</p>
                {j.link && <a href={j.link} target="_blank" rel="noreferrer" className="chip" style={{ marginTop: 14 }}>{t.jrLink}</a>}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
