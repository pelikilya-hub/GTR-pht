'use client';
import { useEffect, useRef, useState } from 'react';
import type * as ML from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useHub } from '@/lib/HubContext';
import { LEGS, STOPS, pathUpTo, pathRange, pToLatLng, type LatLng } from '@/lib/tour';
import { PLACE_SRCS } from '@/lib/i18n';
import { sfx } from '@/lib/sfx';
import { MapReveal } from './fx/MapReveal';
import { scrollP } from './fx/ScrollFX';
import { SectionHead } from './ui/Motion';

const STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const LABEL_SIDE: Record<string, 'l' | 'r'> = { phuket: 'l', samui: 'r', phangan: 'l', chiangmai: 'r', ayutthaya: 'l', bangkok: 'l', pattaya: 'r' };
const ll = (p: LatLng): [number, number] => [p[1], p[0]]; // [lat,lng] → [lng,lat]

/** Repaint OpenFreeMap Positron into the product palette (graphite land, ink-blue sea, quiet labels). */
function darken(style: ML.StyleSpecification, ru: boolean): ML.StyleSpecification {
  const label = ['coalesce', ['get', ru ? 'name:ru' : 'name:en'], ['get', 'name:latin'], ['get', 'name_en'], ['get', 'name']];
  style.layers = style.layers
    .filter((l) => !/poi|housenumber|aeroway|transit|ferry/i.test(l.id))
    .map((l) => {
      const id = l.id.toLowerCase();
      const L = l as ML.LayerSpecification & { paint?: Record<string, unknown>; layout?: Record<string, unknown> };
      L.paint = { ...(L.paint || {}) };
      if (l.type === 'background') L.paint['background-color'] = '#0a0b0e';
      else if (l.type === 'fill') {
        L.paint['fill-color'] = id.includes('water') ? '#0c1219' : id.includes('building') ? '#121318' : /park|wood|forest|grass|landcover/.test(id) ? '#0c0f0e' : '#0b0c0f';
        L.paint['fill-outline-color'] = 'rgba(0,0,0,0)';
        if (id.includes('building')) L.paint['fill-opacity'] = 0.7;
      } else if (l.type === 'line') {
        L.paint['line-color'] = id.includes('water') ? '#0f1823' : id.includes('boundary') ? '#2a2328' : /motorway|trunk|primary/.test(id) ? '#2a2b31' : '#1a1b20';
      } else if (l.type === 'symbol') {
        L.paint['text-color'] = /place|city|country|state/.test(id) ? '#8a8892' : '#55545c';
        L.paint['text-halo-color'] = '#08080a';
        L.paint['text-halo-width'] = 1.2;
        if (L.layout && L.layout['text-field'] !== undefined) L.layout = { ...L.layout, 'text-field': label as unknown as string };
        if (L.paint['icon-opacity'] !== undefined) L.paint['icon-opacity'] = 0;
      }
      return L as ML.LayerSpecification;
    });
  return style;
}

const FALLBACK_STYLE: ML.StyleSpecification = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#0a0b0e' } }] };

function routeFeatures() {
  const plan: GeoJSON.Feature[] = [], ferry: GeoJSON.Feature[] = [];
  LEGS.forEach((leg) => {
    const coords = leg.path.map(ll);
    if (leg.ferry) {
      const [a, b] = leg.ferry;
      ferry.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords.slice(a, b + 1) } });
      if (a > 0) plan.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords.slice(0, a + 1) } });
      if (b < coords.length - 1) plan.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords.slice(b) } });
    } else plan.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } });
  });
  return { plan: { type: 'FeatureCollection', features: plan } as GeoJSON.FeatureCollection, ferry: { type: 'FeatureCollection', features: ferry } as GeoJSON.FeatureCollection };
}
const lineFC = (pts: LatLng[]): GeoJSON.FeatureCollection => ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: pts.map(ll) } }] });

function Telemetry() {
  const { t, lang, journey } = useHub();
  const loc = lang === 'ru' ? 'ru-RU' : 'en-US';
  const rows: [string, React.ReactNode][] = [
    [lang === 'ru' ? 'ПОЗИЦИЯ' : 'POSITION', journey.posLabel],
    [t.telStage + ' ' + journey.stageNo, journey.curStage],
    [t.telStatus, <span key="s" style={{ color: 'var(--red-2)' }}>{journey.crewStatus}{journey.crewStatusAge ? <span style={{ color: 'var(--ink-4)' }}> · {journey.crewStatusAge}</span> : null}</span>],
    [t.telNext, journey.nextPoint],
    ['ICT', journey.ictTime],
  ];
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={'dot' + (journey.srcGps ? ' live' : '')} />
        <span className="meta" style={{ color: journey.srcGps ? 'var(--red-2)' : undefined }}>{journey.srcGps ? t.srcGps + (journey.pos.by ? ' · ' + journey.pos.by : '') : t.srcPlan}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
        <span className="g" style={{ fontSize: 44, lineHeight: 1 }}>{journey.km.toLocaleString(loc)}</span>
        <span className="meta">/ {journey.totalKm.toLocaleString(loc)} {t.kmUnit}</span>
      </div>
      <div className="bar" style={{ margin: '12px 0 8px' }}><i style={{ width: journey.routePct + '%' }} /></div>
      {rows.map(([k, v]) => (
        <div className="row" key={k}>
          <span className="meta">{k}</span>
          <span style={{ fontSize: 13.5, textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </>
  );
}

export function RouteSection() {
  const { t, lang, journey } = useHub();
  const ru = lang === 'ru';
  const box = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<ML.Map | null>(null);
  const carRef = useRef<ML.Marker | null>(null);
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const drawn = useRef(0); // animated share of the covered path (0..p)
  const popupRef = useRef<ML.Popup | null>(null);
  const popupCtor = useRef<((o: ML.PopupOptions) => ML.Popup) | null>(null);
  const journeyRef = useRef(journey);
  useEffect(() => { journeyRef.current = journey; });
  const [ready, setReady] = useState(false);
  const p = journey.pos.p;
  const carLL: LatLng = journey.srcGps ? [journey.pos.lat, journey.pos.lng] : pToLatLng(p);

  useEffect(() => {
    let dead = false, raf = 0;
    (async () => {
      const mod = await import('maplibre-gl');
      const maplibregl = mod.default || mod;
      let style: ML.StyleSpecification = FALLBACK_STYLE;
      try {
        const r = await fetch(STYLE_URL);
        if (r.ok) style = darken(await r.json(), ru);
      } catch { /* offline tiles → route still renders on a plain background */ }
      if (dead || !box.current) return;
      const narrow = box.current.clientWidth < 700;
      const map = new maplibregl.Map({
        container: box.current, style, attributionControl: { compact: true },
        bounds: [[97.6, 7.4], [101.4, 19.4]], fitBoundsOptions: { padding: narrow ? 30 : { top: 40, bottom: 40, left: 420, right: 60 } },
        cooperativeGestures: true, dragRotate: false, pitchWithRotate: false, maxZoom: 14, maxPitch: 60,
      });
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
      mapRef.current = map;
      popupCtor.current = (opts) => new maplibregl.Popup(opts);

      map.on('load', () => {
        const { plan, ferry } = routeFeatures();
        map.addSource('plan', { type: 'geojson', data: plan });
        map.addSource('ferry', { type: 'geojson', data: ferry });
        map.addSource('done', { type: 'geojson', data: lineFC([STOPS[0].ll]) });
        map.addLayer({ id: 'plan', type: 'line', source: 'plan', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#4a4950', 'line-width': 2, 'line-dasharray': [0, 2, 2] } });
        map.addLayer({ id: 'ferry', type: 'line', source: 'ferry', layout: { 'line-cap': 'round' }, paint: { 'line-color': '#5aa9ff', 'line-width': 2, 'line-opacity': 0.75, 'line-dasharray': [0.5, 2] } });
        map.addLayer({ id: 'done-glow', type: 'line', source: 'done', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#e5372c', 'line-width': 12, 'line-blur': 10, 'line-opacity': 0.55 } });
        map.addLayer({ id: 'done', type: 'line', source: 'done', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ff5a4b', 'line-width': 3.2 } });
        // laser pulse running the whole ring
        map.addSource('laser', { type: 'geojson', data: lineFC([STOPS[0].ll]) });
        map.addLayer({ id: 'laser-glow', type: 'line', source: 'laser', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ff3427', 'line-width': 14, 'line-blur': 12, 'line-opacity': 0.8 } });
        map.addLayer({ id: 'laser-core', type: 'line', source: 'laser', layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 2.2 } });

        STOPS.slice(0, -1).forEach((s, i) => {
          const el = document.createElement('div');
          el.style.cssText = 'display:flex;flex-direction:column;align-items:center';
          const side = LABEL_SIDE[s.id] || 'r';
          el.innerHTML = `<div class="city-lbl">${ru ? s.ru : s.en}</div><div class="city-dot"></div>`;
          el.firstElementChild!.setAttribute('style', side === 'l'
            ? 'position:absolute;top:50%;right:100%;transform:translate(-8px,-50%)'
            : 'position:absolute;top:50%;left:100%;transform:translate(8px,-50%)');
          dotsRef.current[i] = el.lastElementChild as HTMLDivElement;
          el.style.cursor = 'pointer';
          el.addEventListener('click', (ev) => { ev.stopPropagation(); openStop(i); });
          el.addEventListener('mouseenter', () => sfx('tick'));
          new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat(ll(s.ll)).addTo(map);
        });
        const car = document.createElement('div');
        car.className = 'car-dot';
        carRef.current = new maplibregl.Marker({ element: car, anchor: 'center' }).setLngLat(ll(STOPS[0].ll)).addTo(map);

        // marching ants on the planned route
        const steps = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]];
        let k = 0, last = 0;
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // only animate while the map is on screen (MapLibre repaints on every paint/data change)
        let onScreen = false;
        const vio = new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; }, { threshold: 0.01 });
        vio.observe(map.getContainer());
        map.once('remove', () => vio.disconnect());
        const tick = (ts: number) => {
          raf = requestAnimationFrame(tick);
          if (reduce || !onScreen || document.hidden || ts - last < 70) return;
          last = ts; k = (k + 1) % steps.length;
          if (map.getLayer('plan')) map.setPaintProperty('plan', 'line-dasharray', steps[k]);
          const pp = scrollP.route ?? 0;
          if (!map.isMoving() && !popupRef.current?.isOpen()) {
            const pitch = Math.sin(Math.min(1, Math.max(0, pp)) * Math.PI) * 52;
            // re-render the map only when the camera actually moved
            if (Math.abs(map.getPitch() - pitch) > 0.25) map.jumpTo({ pitch, bearing: (pp - 0.5) * -18 });
          }
          const head = ((ts / 16000) % 1) * (LEGS.length + 0.6);
          (map.getSource('laser') as ML.GeoJSONSource | undefined)?.setData(lineFC(pathRange(head - 0.6, head)));
        };
        raf = requestAnimationFrame(tick);
        setReady(true);
      });
    })();
    return () => { dead = true; cancelAnimationFrame(raf); mapRef.current?.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Covered path: animate from what is drawn to the current position (draw-in on first view).
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const from = drawn.current, to = p, t0 = performance.now(), dur = from === 0 ? 2600 : 900;
    let raf = 0;
    const step = (tm: number) => {
      const k = Math.min(1, (tm - t0) / dur), e = 1 - Math.pow(1 - k, 3), cur = from + (to - from) * e;
      const src = map.getSource('done') as ML.GeoJSONSource | undefined;
      src?.setData(lineFC(pathUpTo(cur)));
      carRef.current?.setLngLat(ll(k < 1 ? pToLatLng(cur) : carLL));
      dotsRef.current.forEach((d, i) => d?.classList.toggle('done', cur >= i - 0.001 && to > 0));
      drawn.current = cur;
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ready, p, carLL[0], carLL[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  function openStop(i: number) {
    const map = mapRef.current;
    if (!map) return;
    const s = STOPS[i], st = journeyRef.current.stages[i];
    const img = PLACE_SRCS[Math.min(i, PLACE_SRCS.length - 1)]?.[0];
    const finale = i === STOPS.length - 1;
    sfx('ping');
    map.flyTo({ center: ll(s.ll), zoom: finale || i === 0 ? 9 : 9.5, speed: 1.1, curve: 1.6, essential: true });
    popupRef.current?.remove();
    const esc = (x: string) => x.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string));
    popupRef.current = popupCtor.current?.({ closeButton: true, offset: 18, maxWidth: '300px', className: 'stop-pop' })
      .setLngLat(ll(s.ll))
      .setHTML(`<div class="sp-img" style="background-image:url('/${finale ? PLACE_SRCS[0][4] : img}')"></div>`
        + `<div class="sp-body"><div class="sp-n">${st?.n || ''} · ${esc(st?.status || '')}</div>`
        + `<div class="sp-t">${esc(st?.title || s.ru)}</div><div class="sp-d">${esc(st?.dates || '')}</div>`
        + `<div class="sp-x">${esc(st?.base || '')}</div><div class="sp-l">→ ${esc(st?.leg || '')}</div></div>`)
      .addTo(map) || null;
  }
  const fly = (i: number) => {
    box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => openStop(i), 350);
  };
  const overview = () => mapRef.current?.fitBounds([[97.6, 7.4], [101.4, 19.4]], { padding: (box.current?.clientWidth || 0) < 700 ? 30 : { top: 40, bottom: 40, left: 420, right: 60 } });

  return (
    <section className="sec" id="route" data-screen-label="route">
      <div className="wrap">
        <SectionHead
          kicker={t.routeKicker}
          title={`${t.routeTitle} ${journey.totalKm.toLocaleString(ru ? 'ru-RU' : 'en-US')} ${ru ? 'км' : 'km'}`}
          lead={t.mapHint}
          right={<button className="btn btn-sm" onClick={overview}>{ru ? 'Весь маршрут' : 'Whole route'}</button>}
        />
        <div className="map-shell rv">
          <div ref={box} style={{ position: 'absolute', inset: 0 }} />
          <MapReveal />
          <div className="glass map-hud map-hud-desktop"><Telemetry /></div>
          <div className="glass map-pos">
            <div className="mono" style={{ fontSize: 12, color: 'var(--red-2)', letterSpacing: '.08em' }}>{journey.posLabel}</div>
            <div className="meta" style={{ marginTop: 4, fontSize: 9.5 }}>{journey.posCoords}</div>
          </div>
          <div className="glass map-legend">
            <span><i style={{ width: 18, height: 3, background: 'var(--red-2)', borderRadius: 2 }} />{t.lgDone}</span>
            <span><i style={{ width: 18, borderTop: '2px dashed #6a6870' }} />{ru ? 'план' : 'plan'}</span>
            <span><i style={{ width: 18, borderTop: '2px dotted var(--blue)' }} />{t.lgFerry}</span>
          </div>
        </div>
        <div className="glass map-hud map-hud-mobile"><Telemetry /></div>

        <div className="stops">
          {journey.stages.map((st, i) => (
            <button key={st.n} className={'panel stop rv ' + st.state} style={{ ['--d' as string]: `${i * 0.04}s` }} onClick={() => fly(i)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="n">{st.n}</span>
                <span className={'chip' + (st.state === 'active' ? ' on' : '')} style={{ height: 24, fontSize: 9 }}>{st.status}</span>
              </div>
              <h4>{st.title}</h4>
              <div className="meta" style={{ marginTop: 6 }}>{st.dates}</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', marginTop: 10, lineHeight: 1.45 }}>{st.base}</div>
              <div className="meta" style={{ marginTop: 12, fontSize: 9.5, color: 'var(--ink-4)' }}>→ {st.leg}</div>
              {st.state === 'active' && <div className="bar" style={{ marginTop: 12 }}><i style={{ width: st.pct + '%' }} /></div>}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
