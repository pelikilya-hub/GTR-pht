import type { Metadata } from 'next';
import Link from 'next/link';
import credits from '@/lib/photoCredits.json';

export const metadata: Metadata = { title: 'Photo credits · GTR|PHT' };

type Credit = { title: string; page: string; author: string; license: string; licenseUrl?: string | null };

export default function CreditsPage() {
  const rows = Object.entries(credits as Record<string, Credit>);
  const mono = "'JetBrains Mono',monospace";
  return (
    <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,28px) 80px', color: '#ECE9E4', background: '#0B0B0C', minHeight: '100vh' }}>
      <Link href="/" style={{ fontFamily: mono, fontSize: 10, letterSpacing: '.16em', color: '#FF6A5B' }}>← GTR|PHT</Link>
      <h1 style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 900, fontSize: 22, margin: '18px 0 6px' }}>Photo credits</h1>
      <p style={{ fontFamily: mono, fontSize: 11, color: '#8E8C94', lineHeight: 1.7 }}>
        City photos in the route section come from Wikimedia Commons under the licenses below.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {rows.map(([file, c]) => (
          <li key={file} style={{ borderTop: '1px solid #1E1E23', paddingTop: 10, fontSize: 13, lineHeight: 1.6 }}>
            <div style={{ fontFamily: mono, fontSize: 10, color: '#55545C' }}>{file}</div>
            <a href={c.page} target="_blank" rel="noreferrer" style={{ color: '#ECE9E4' }}>{c.title.replace(/^File:/, '')}</a>
            <div style={{ color: '#8E8C94' }}>
              {c.author || 'Unknown author'} ·{' '}
              {c.licenseUrl ? <a href={c.licenseUrl} target="_blank" rel="noreferrer" style={{ color: '#FF6A5B' }}>{c.license}</a> : c.license}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
