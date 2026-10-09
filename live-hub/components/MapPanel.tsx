'use client';
import { useEffect, useRef } from 'react';
import type * as LeafletNS from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useHub } from '@/lib/HubContext';
import { WAY, names, paramToLatLng } from '@/lib/route';

export function MapPanel() {
  const { t, lang, journey } = useHub();
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const doneLineRef = useRef<LeafletNS.Polyline | null>(null);
  const liveMarkerRef = useRef<LeafletNS.Marker | null>(null);
  const stopMarkersRef = useRef<Record<number, LeafletNS.CircleMarker>>({});

  useEffect(() => {
    let cancelled = false;
    import('leaflet').then((mod) => {
      if (cancelled || !elRef.current || mapRef.current) return;
      const L = mod.default;
      const all: [number, number][] = WAY.map((w) => [w[0], w[1]]);
      const m = L.map(elRef.current, { scrollWheelZoom: false, zoomControl: true });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 19,
      }).addTo(m);
      L.polyline(all, { color: '#4A4A52', weight: 2, opacity: 0.75 }).addTo(m);
      ([[1, 2], [2, 3], [3, 4]] as [number, number][]).forEach((r) => {
        const pts = WAY.filter((w) => w[2] >= r[0] - 1e-9 && w[2] <= r[1] + 1e-9).map((w) => [w[0], w[1]] as [number, number]);
        L.polyline(pts, { color: '#8E8C94', weight: 2, opacity: 0.85, dashArray: '3 7' }).addTo(m);
      });
      doneLineRef.current = L.polyline([], { color: '#E5372C', weight: 3.5, opacity: 0.95 }).addTo(m);

      const NAMES = names(lang === 'ru');
      const AN = [0, 1, 2, 3, 5, 6, 7, 8, 9, 10];
      const MAJOR: Record<number, boolean> = { 0: true, 2: true, 6: true, 8: true, 10: true };
      const stopM: Record<number, LeafletNS.CircleMarker> = {};
      AN.forEach((idx) => {
        const ll = paramToLatLng(idx);
        const c = L.circleMarker(ll, { radius: 5, color: '#0B0B0C', weight: 1.5, fillColor: '#3F3F45', fillOpacity: 1 }).addTo(m);
        c.bindTooltip(NAMES[idx] || '', { permanent: !!MAJOR[idx], direction: idx === 0 ? 'left' : 'right', className: 'om-tt', offset: [idx === 0 ? -8 : 8, 0] });
        stopM[idx] = c;
      });
      stopMarkersRef.current = stopM;

      liveMarkerRef.current = L.marker(all[0], {
        icon: L.divIcon({
          className: '', iconSize: [18, 18], iconAnchor: [9, 9],
          html: '<div style="position:relative;width:18px;height:18px"><div style="position:absolute;inset:0;border-radius:50%;border:2px solid #FF4B3E;animation:omPulse 2.4s ease-out infinite"></div><div style="position:absolute;inset:5px;border-radius:50%;background:#FF4B3E;border:1.5px solid #0B0B0C;box-shadow:0 0 10px rgba(255,75,62,.9)"></div></div>',
        }),
        zIndexOffset: 1000,
      }).addTo(m);

      m.fitBounds(L.latLngBounds(all).pad(0.06));
      mapRef.current = m;
      setTimeout(() => { try { m.invalidateSize(); } catch { /* ignore */ } }, 400);
    });
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const m = mapRef.current;
    if (!m || !doneLineRef.current || !liveMarkerRef.current) return;
    const pos = journey.pos;
    const done = WAY.filter((w) => w[2] <= pos.p).map((w) => [w[0], w[1]] as [number, number]);
    const head = paramToLatLng(pos.p);
    done.push(pos.src === 'gps' ? [pos.lat, pos.lng] : head);
    doneLineRef.current.setLatLngs(done);
    liveMarkerRef.current.setLatLng(pos.src === 'gps' ? [pos.lat, pos.lng] : head);
    Object.keys(stopMarkersRef.current).forEach((k) => {
      const vis = pos.p >= +k - 0.001;
      stopMarkersRef.current[+k].setStyle({ fillColor: vis ? '#E5372C' : '#3F3F45' });
    });
  });

  return (
    <div id="map" style={{ position: 'relative', border: '1px solid #26262B', background: '#101013', padding: 22 }}>
      <div style={{ position: 'absolute', top: -1, left: -1, width: 14, height: 14, borderTop: '2px solid #E5372C', borderLeft: '2px solid #E5372C' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.22em', color: '#8E8C94', flex: 1 }}>{t.mapTitle}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, border: `1px solid ${journey.srcGps ? '#E5372C' : '#2A2A30'}`, padding: '4px 10px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: journey.srcGps ? '#FF4B3E' : '#8E8C94' }} />
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', color: journey.srcGps ? '#FF6A5B' : '#8E8C94' }}>
            {journey.srcGps ? t.srcGps + (journey.pos.by ? ' · ' + journey.pos.by : '') : t.srcPlan}
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 'clamp(300px,52vh,620px)', marginTop: 16, border: '1px solid #1E1E23', overflow: 'hidden' }}>
        <div ref={elRef} style={{ position: 'absolute', inset: 0, background: '#0D0D0F' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 900, pointerEvents: 'none', background: 'rgba(11,11,12,.85)', border: '1px solid #2A2A30', padding: '8px 12px' }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.1em', color: '#FF6A5B' }}>{journey.posLabel}</div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.08em', color: '#8E8C94', marginTop: 4 }}>{journey.posCoords}</div>
        </div>
      </div>
      <div style={{ borderTop: '1px solid #1E1E23', marginTop: 16, paddingTop: 14, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E5372C' }} /><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#6E6C74' }}>{t.lgBase}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, borderTop: '2px dashed #6E6C74' }} /><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#6E6C74' }}>{t.lgFerry}</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 16, borderTop: '2px solid #E5372C' }} /><span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, color: '#6E6C74' }}>{t.lgDone}</span></div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.12em', color: '#55545C' }}>{journey.km.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} / 2 830 {t.kmUnit}</div>
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.06em', lineHeight: 1.7, color: '#4A4950', marginTop: 10 }}>{t.mapHint}</div>
    </div>
  );
}
