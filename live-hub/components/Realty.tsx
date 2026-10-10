'use client';
import { useState } from 'react';
import { useHub } from '@/lib/HubContext';
import { fireWebhook } from '@/lib/webhooks';
import { SectionHead } from './ui/Motion';
import { Village3D, type VillageKind } from './fx/Village3D';

/** GTR Realty along the ring: scouting, developer visits, 3D packaging of villages and complexes. */
const MODELS: { k: VillageKind; ru: [string, string]; en: [string, string] }[] = [
  { k: 'villas', ru: ['Вилльный посёлок', 'Пхукет · Самуи'], en: ['Villa village', 'Phuket · Samui'] },
  { k: 'condo', ru: ['Кондо-комплекс', 'Паттайя · Бангкок'], en: ['Condo complex', 'Pattaya · Bangkok'] },
  { k: 'eco', ru: ['Эко-резорт на склоне', 'Чиангмай · Панган'], en: ['Hillside eco resort', 'Chiang Mai · Phangan'] },
];

const STEPS: { ru: [string, string]; en: [string, string] }[] = [
  { ru: ['Находим', 'Ищем объекты по ходу кольца: местные, брокеры, дрон над побережьем, наводки зрителей.'],
    en: ['Scout', 'Hunting objects along the ring: locals, brokers, drone over the coast, viewer tips.'] },
  { ru: ['Заезжаем к застройщику', 'Пикап у ворот, встреча на площадке, разговор с тем, кто строит, — в эфире.'],
    en: ['Visit the developer', 'Pickup at the gate, on-site meeting, talk to the people who build it — live.'] },
  { ru: ['Сканируем', 'Дрон, 360°, фотограмметрия: из площадки собираем точный 3D-макет.'],
    en: ['Scan', 'Drone, 360°, photogrammetry: the site becomes an accurate 3D model.'] },
  { ru: ['Упаковываем', '3D-тур, ролик-облёт, серия reels, лендинг объекта в стиле Bangtaostyle.'],
    en: ['Package', '3D tour, fly-through film, reels series, a Bangtaostyle landing page.'] },
  { ru: ['Показываем', 'Эфир, сайт, наша аудитория — заявки уходят застройщику напрямую.'],
    en: ['Show', 'Stream, site, our audience — leads go straight to the developer.'] },
];

const HUNT: { ru: [string, string]; en: [string, string] }[] = [
  { ru: ['Пхукет', 'виллы и кондо у моря'], en: ['Phuket', 'seafront villas & condos'] },
  { ru: ['Самуи', 'виллы с видом на залив'], en: ['Samui', 'bay-view villas'] },
  { ru: ['Панган', 'эко-резорты и земля'], en: ['Phangan', 'eco resorts & land'] },
  { ru: ['Чиангмай', 'дома в горах, ретриты'], en: ['Chiang Mai', 'mountain homes, retreats'] },
  { ru: ['Бангкок', 'кондо в центре, лофты'], en: ['Bangkok', 'downtown condos, lofts'] },
  { ru: ['Паттайя', 'комплексы у моря'], en: ['Pattaya', 'seafront complexes'] },
];

const KINDS_RU = ['Вилльный посёлок', 'Кондо / комплекс', 'Резорт / отель', 'Земля', 'Другое'];
const KINDS_EN = ['Villa village', 'Condo / complex', 'Resort / hotel', 'Land', 'Other'];

export function Realty() {
  const { lang, notify, auth } = useHub();
  const ru = lang === 'ru';
  const [m, setM] = useState(0);
  const [f, setF] = useState({ name: '', city: '', kind: '', contact: '' });
  const [sent, setSent] = useState(false);
  const model = MODELS[m];

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (f.name.trim().length < 2 || f.contact.trim().length < 3) {
      notify(ru ? 'Нужны объект и контакт' : 'Object and contact are required');
      return;
    }
    fireWebhook('realty_lead', { ...f, member: auth.me?.nick || 'anon' });
    setF({ name: '', city: '', kind: '', contact: '' });
    setSent(true);
    notify(ru ? 'Заявка у экипажа — заедем по маршруту' : 'Crew got it — we will stop by on the route');
  };

  return (
    <section className="sec" id="realty" data-screen-label="realty">
      <div className="wrap">
        <SectionHead
          kicker={ru ? 'LINE 03 · GTR REALTY · ПО МАРШРУТУ' : 'LINE 03 · GTR REALTY · ON THE ROUTE'}
          title={ru ? 'Недвижимость по пути' : 'Real estate on the way'}
          lead={ru
            ? 'Находим крутые объекты на кольце, заезжаем к застройщикам, сканируем и упаковываем посёлки и комплексы в 3D. Работаем, веселимся, трансформируемся вместе.'
            : 'We find the coolest properties on the ring, drop in on developers, scan and package villages and complexes in 3D. Work, party, transform — together.'}
        />

        <div className="v3d-stage rv">
          <Village3D key={model.k + lang} kind={model.k} ru={ru} />
          <div className="v3d-hud tl">
            <span className="meta">{ru ? '3D · МАКЕТ УПАКОВКИ' : '3D · PACKAGING MOCK-UP'}</span>
            <b>{(ru ? model.ru : model.en)[0]}</b>
            <span className="meta">{(ru ? model.ru : model.en)[1]}</span>
          </div>
          <div className="v3d-hud br meta">{ru ? '⟲ потяни, чтобы повернуть · лазер = 3D-скан' : '⟲ drag to orbit · laser = 3D scan'}</div>
          <div className="v3d-tabs" role="tablist" aria-label={ru ? 'Тип объекта' : 'Object type'}>
            {MODELS.map((x, i) => (
              <button key={x.k} type="button" role="tab" aria-selected={i === m} className={'btn btn-sm' + (i === m ? ' btn-red' : '')} onClick={() => setM(i)}>
                0{i + 1} · {(ru ? x.ru : x.en)[0]}
              </button>
            ))}
          </div>
        </div>

        <ol className="re-steps">
          {STEPS.map((s, i) => {
            const [h, d] = ru ? s.ru : s.en;
            return (
              <li key={h} className="rv" style={{ ['--d' as string]: `${i * 0.06}s` }}>
                <span className="num g">0{i + 1}</span>
                <h4>{h}</h4>
                <p>{d}</p>
              </li>
            );
          })}
        </ol>

        <div className="re-cols">
          <div>
            <div className="meta re-sub rv">{ru ? 'Что ищем на кольце' : 'What we hunt on the ring'}</div>
            <ul className="re-hunt">
              {HUNT.map((h, i) => {
                const [c, d] = ru ? h.ru : h.en;
                return (
                  <li key={c} className="rv" style={{ ['--d' as string]: `${i * 0.05}s` }}>
                    <b>{c}</b><span>{d}</span>
                  </li>
                );
              })}
            </ul>
            <div className="meta re-sub rv" style={{ marginTop: 28 }}>{ru ? 'Застройщик получает' : 'The developer gets'}</div>
            <div className="re-chips rv">
              {(ru
                ? ['3D-тур', 'Ролик-облёт', 'Серия reels', 'Лендинг объекта', 'Показ в эфире', 'Заявки напрямую']
                : ['3D tour', 'Fly-through film', 'Reels series', 'Object landing', 'Live showing', 'Direct leads']
              ).map((x) => <span key={x} className="chip">{x}</span>)}
            </div>
          </div>

          <form className="re-form rv" onSubmit={submit}>
            <div className="meta re-sub">{ru ? 'Застройщикам и владельцам' : 'Developers & owners'}</div>
            <h3>{ru ? 'Заявка на заезд' : 'Book a stop'}</h3>
            <p>{ru ? 'Есть объект по маршруту? Заедем, снимем и упакуем — покажем всей аудитории тура.' : 'Got a property on the route? We stop by, film and package it — and show it to the whole tour audience.'}</p>
            <label><span>{ru ? 'Объект / компания' : 'Object / company'}</span>
              <input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} maxLength={120} placeholder={ru ? 'Например: Bangtao Hills Villas' : 'e.g. Bangtao Hills Villas'} /></label>
            <div className="re-row">
              <label><span>{ru ? 'Город' : 'City'}</span>
                <select className="field" value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })}>
                  <option value="">—</option>
                  {HUNT.map((h) => <option key={h.en[0]} value={h.en[0]}>{(ru ? h.ru : h.en)[0]}</option>)}
                </select></label>
              <label><span>{ru ? 'Тип' : 'Type'}</span>
                <select className="field" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
                  <option value="">—</option>
                  {(ru ? KINDS_RU : KINDS_EN).map((k, i) => <option key={k} value={KINDS_EN[i]}>{k}</option>)}
                </select></label>
            </div>
            <label><span>{ru ? 'Контакт (Telegram / WhatsApp / почта)' : 'Contact (Telegram / WhatsApp / email)'}</span>
              <input className="field" value={f.contact} onChange={(e) => setF({ ...f, contact: e.target.value })} maxLength={120} placeholder="@username" /></label>
            <button className="btn btn-red" type="submit">{sent ? (ru ? 'Отправлено · ещё одну' : 'Sent · another one') : (ru ? 'Позвать экипаж' : 'Call the crew')}</button>
          </form>
        </div>
      </div>
    </section>
  );
}
