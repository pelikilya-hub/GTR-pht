'use client';
import { useEffect, useRef, useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { SectionHead } from './ui/Motion';

/** «Борт тура»: the Bangtaostyle pickup that drives the ring — footage, livery anatomy, live odometer. */
const ANGLES = [
  { src: '/assets/video/car-2.mp4', ru: 'Ночь · дрифт', en: 'Night · drift' },
  { src: '/assets/video/car-3.mp4', ru: 'Побережье', en: 'Coast run' },
  { src: '/assets/video/car-1.mp4', ru: 'Диски · капот', en: 'Wheels · hood' },
];

const LIVERY: { ru: [string, string]; en: [string, string] }[] = [
  { ru: ['Кузов', 'Родной серый — тот же, что у Mazda 2 Bangtaostyle. Никакой перекраски: база сохранена.'],
    en: ['Body', 'Factory grey — same as the Bangtaostyle Mazda 2. No respray: the base stays.'] },
  { ru: ['Аэрография', 'Рваные мазки графит + оранжевый. Перед перетекает в бок, бок — в корму: машина читается цельной с любого угла.'],
    en: ['Airbrush', 'Torn graphite + orange strokes. Nose flows into the flank, flank into the tail — reads as one piece from any angle.'] },
  { ru: ['Лого', 'Рукописный BangTao + акцент STYLE крупно по двери, bangtaostyle.com — на корме.'],
    en: ['Logo', 'Hand-lettered BangTao + STYLE accent big on the door, bangtaostyle.com on the tail.'] },
  { ru: ['Диски', 'Чёрные, оранжевые канты, логотип в центре — 1 в 1 как концепция Mazda, под пикап.'],
    en: ['Wheels', 'Black, orange lips, logo centre caps — the Mazda concept, adapted to the pickup.'] },
];

const ROLES: { ru: [string, string]; en: [string, string] }[] = [
  { ru: ['База экипажа', 'Везёт команду, камеры и свет все 3 540 км кольца.'], en: ['Crew base', 'Carries the team, cameras and lights for all 3,540 km.'] },
  { ru: ['Камера-кар', 'CAM-слоты эфира и GPS-трекер — карта на сайте едет вместе с ним.'], en: ['Camera car', 'Stream CAM slots and the GPS tracker — the site map moves with it.'] },
  { ru: ['Носитель бренда', 'Reels, shorts, сторис — и магнит у входа GTR Rawai Hub.'], en: ['Brand carrier', 'Reels, shorts, stories — and a magnet at the GTR Rawai Hub door.'] },
];

export function Rig() {
  const { lang, journey } = useHub();
  const ru = lang === 'ru';
  const loc = ru ? 'ru-RU' : 'en-US';
  const [ang, setAng] = useState(0);
  const vid = useRef<HTMLVideoElement | null>(null);

  // play only while on screen
  useEffect(() => {
    const v = vid.current;
    if (!v) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // nothing is fetched or decoded until the block is close; paused (and its buffer released) when far
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { if (v.preload !== 'auto') v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
    }, { threshold: 0.15, rootMargin: '25% 0px' });
    io.observe(v);
    return () => io.disconnect();
  }, [ang]);

  const odo = String(journey.km).padStart(6, '0');

  return (
    <section className="sec" id="rig" data-screen-label="rig">
      <div className="wrap">
        <SectionHead
          kicker={ru ? 'Борт тура · Nissan Navara' : 'Tour rig · Nissan Navara'}
          title={ru ? 'Борт Bangtaostyle' : 'The Bangtaostyle rig'}
          lead={ru
            ? 'Пикап, который проходит всё кольцо. Упакован в ту же систему, что Mazda 2: родной серый, аэрография, оранжевые акценты.'
            : 'The pickup that drives the whole ring. Wrapped in the same system as the Mazda 2: factory grey, airbrush, orange accents.'}
        />

        <div className="rig-stage rv">
          <video key={ang} ref={vid} className="rig-video" src={ANGLES[ang].src} poster={ANGLES[ang].src.replace('.mp4', '.jpg')}
            muted playsInline loop preload="none" aria-label={ru ? 'Пикап Bangtaostyle' : 'Bangtaostyle pickup'} />
          <div className="rig-grade" aria-hidden />
          <div className="rig-odo" aria-label={(ru ? 'Пробег тура ' : 'Tour odometer ') + journey.km + ' km'}>
            <span className="meta">{ru ? 'ОДОМЕТР ТУРА' : 'TOUR ODOMETER'}</span>
            <b>{odo.split('').map((d, i) => <i key={i} className={i < odo.length - String(journey.km).length ? 'z' : ''}>{d}</i>)}</b>
            <span className="meta">/ {journey.totalKm.toLocaleString(loc)} KM · {journey.posLabel}</span>
          </div>
          <div className="rig-angles" role="tablist" aria-label={ru ? 'Ракурс' : 'Angle'}>
            {ANGLES.map((a, i) => (
              <button key={a.src} type="button" role="tab" aria-selected={i === ang} className={i === ang ? 'on' : ''} onClick={() => setAng(i)}>
                { }
                <img src={a.src.replace('.mp4', '.jpg')} alt="" />
                <span>{String(i + 1).padStart(2, '0')} · {ru ? a.ru : a.en}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rig-cols">
          <div>
            <div className="meta rig-sub rv">{ru ? 'Ливрея' : 'Livery'}</div>
            <ol className="rig-list">
              {LIVERY.map((l, i) => {
                const [h, d] = ru ? l.ru : l.en;
                return (
                  <li key={h} className="rv" style={{ ['--d' as string]: `${i * 0.06}s` }}>
                    <span className="num g">0{i + 1}</span>
                    <div><h4>{h}</h4><p>{d}</p></div>
                  </li>
                );
              })}
            </ol>
            <div className="rig-swatch rv" aria-label={ru ? 'Палитра' : 'Palette'}>
              <span><i style={{ background: '#8d9096' }} />{ru ? 'родной серый' : 'factory grey'}</span>
              <span><i style={{ background: '#2b2d31' }} />{ru ? 'графит' : 'graphite'}</span>
              <span><i style={{ background: '#ff7a1a' }} />BTS orange</span>
              <span><i style={{ background: '#0a0b0d' }} />{ru ? 'чёрные диски' : 'black wheels'}</span>
            </div>
          </div>
          <div>
            <div className="meta rig-sub rv">{ru ? 'Роль в туре' : 'Role on tour'}</div>
            <ol className="rig-list">
              {ROLES.map((r, i) => {
                const [h, d] = ru ? r.ru : r.en;
                return (
                  <li key={h} className="rv" style={{ ['--d' as string]: `${0.1 + i * 0.06}s` }}>
                    <span className="num g">{['A', 'B', 'C'][i]}</span>
                    <div><h4>{h}</h4><p>{d}</p></div>
                  </li>
                );
              })}
            </ol>
            <div className="meta rig-family rv">{ru ? 'Одна система: Mazda 2 → Navara · bangtaostyle.com' : 'One system: Mazda 2 → Navara · bangtaostyle.com'}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
