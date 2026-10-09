'use client';
import { CrewShell } from '@/components/CrewShell';

export default function CameraPage() {
  return (
    <CrewShell title="Камера экипажа" sub="ПЕРЕДАТЧИК · CLOUDFLARE REALTIME">
      <div style={{ maxWidth: 560 }}>
        <gtr-camera room="gtrpht" />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', lineHeight: 1.8, color: '#4A4950', marginTop: 12 }}>
          Выбери слот, нажми «В ЭФИР» и держи Safari открытым на этой странице — iOS гасит камеру в фоне. Картинка уходит в Cloudflare SFU, пульт и хаб подхватывают её сами. Второй слот — второй iPhone.
        </div>
      </div>
    </CrewShell>
  );
}
