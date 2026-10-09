'use client';
import { useHub } from '@/lib/HubContext';

function Bar({ label, pct }: { label: string; pct: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 64px', alignItems: 'center', gap: 12 }}>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: '#8E8C94' }}>{label}</div>
      <div style={{ height: 4, background: '#1D1D21' }}><div style={{ height: 4, background: '#E5372C', width: pct + '%', transition: 'width .8s ease' }} /></div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#ECE9E4', textAlign: 'right' }}>{pct}%</div>
    </div>
  );
}

export function Telemetry() {
  const { t, lang, journey } = useHub();
  const { day, km, routePct, stageNo, stagePct, crewStatus, crewStatusAge, nextPoint, ictTime } = journey;
  return (
    <div data-screen-label="telemetry" style={{ border: '1px solid #26262B', background: '#101013', padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.22em', color: '#8E8C94', flex: 1 }}>{t.telTitle}</div>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, color: '#E5372C' }}>{ictTime} ICT</div>
      </div>
      <div style={{ display: 'flex', gap: 34, marginTop: 18, flexWrap: 'wrap' }}>
        <div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', color: '#55545C' }}>{t.dayWord} </span><span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 26, color: '#ECE9E4' }}>{day}</span><span style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 13, color: '#55545C' }}>/39</span></div>
        <div><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.16em', color: '#55545C' }}>{t.kmDoneW}</span><span style={{ fontFamily: "'Inter Tight',sans-serif", fontWeight: 700, fontSize: 26, color: '#ECE9E4' }}>{km.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')}</span><span style={{ fontFamily: "'Inter Tight',sans-serif", fontSize: 13, color: '#55545C' }}>/2 830</span></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
        <Bar label={t.telRoute} pct={routePct} />
        <Bar label={`${t.telStage} ${stageNo}`} pct={stagePct} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: '#8E8C94', minWidth: 110 }}>{t.telStatus}</div>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', color: '#FF6A5B', border: '1px solid #E5372C', padding: '4px 10px' }}>{crewStatus}</span>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#55545C' }}>{crewStatusAge}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', color: '#8E8C94', minWidth: 110 }}>{t.telNext}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5, letterSpacing: '.06em', color: '#ECE9E4' }}>{nextPoint}</div>
        </div>
      </div>
    </div>
  );
}
