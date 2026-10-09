'use client';
import { CrewShell } from '@/components/CrewShell';

export default function PultPage() {
  return (
    <CrewShell title="Режиссёрский пульт" sub="ПУЛЬТ · ТАЛЛИ · КОМАНДЫ КАМЕРАМ">
      <gtr-director room="gtrpht" />
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', lineHeight: 1.8, color: '#4A4950', marginTop: 12 }}>
        Клик по плитке — камера в программу (на телефоне загорается «В ПРОГРАММЕ»). Команды flip / качество / мик уходят выбранной камере по сигнальному каналу комнаты. Зрители на хабе (вкладка GTR CAM · LIVE) видят то же, что и этот пульт.
      </div>
    </CrewShell>
  );
}
