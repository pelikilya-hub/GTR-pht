'use client';
import { MapPanel } from './MapPanel';
import { Telemetry } from './Telemetry';
import { StreamPanel } from './StreamPanel';
import { BoostPanel } from './BoostPanel';

export function Dashboard() {
  return (
    <section data-screen-label="dashboard" style={{ maxWidth: 1280, margin: '0 auto', padding: '0 clamp(14px,4vw,28px)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(400px,100%),1fr))', gap: 16, alignItems: 'start' }}>
      <MapPanel />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <Telemetry />
        <StreamPanel />
        <BoostPanel />
      </div>
    </section>
  );
}
