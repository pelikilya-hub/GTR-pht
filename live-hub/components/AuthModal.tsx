'use client';
import { useHub } from '@/lib/HubContext';

const ROLE_META: Record<string, { label: string; col: string }> = {
  sub: { label: 'ПОДПИСЧИК', col: '#8E8C94' },
  donor: { label: 'ДОНАТЕР', col: '#4A9EFF' },
  crew: { label: 'ЭКИПАЖ', col: '#FF6A5B' },
};

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box', background: '#141416', border: '1px solid #2A2A30',
  color: '#ECE9E4', fontFamily: "'JetBrains Mono',monospace", fontSize: 13, padding: 13, outline: 'none', minHeight: 44,
};

export function AuthModal() {
  const { authUi, closeAuth, setAuthTab, setAuthRole, setAuthField, submitAuth, auth, scrollToId, notify } = useHub();
  if (!authUi.open) return null;
  const { me } = auth;

  if (me) {
    const role = ROLE_META[me.role] || ROLE_META.sub;
    let accessTag = 'ДОСТУП: БАЗОВЫЙ', accessText = 'Открыты общие эфиры и лента маршрута. Донат в СЧАСТЬЕ откроет закрытые трансляции.';
    let accessCol = '#8E8C94', accessBorder = '#1E1E23', accessBg = '#101013';
    const rub = (n: number) => (+n || 0).toLocaleString('ru-RU') + ' ₽';
    if (me.given >= 5000) {
      accessTag = 'ДОСТУП: ЗАКРЫТЫЙ КОНТУР';
      accessText = 'Приваты, вечеринки и зарытые исполнения. Ссылка приходит на этот контакт за час до начала, живёт 3 часа.';
      accessCol = '#FF8A7C'; accessBorder = '#6E2A24'; accessBg = 'rgba(229,55,44,.06)';
    } else if (me.given >= 500) {
      accessTag = 'ДОСТУП: РАСШИРЕННЫЙ';
      accessText = 'Отчёты по ДОБРУ с чеками, ранний доступ к эфирам, голос весит двойной. До закрытого контура: ' + rub(5000 - me.given) + '.';
      accessCol = '#4A9EFF'; accessBorder = '#2A4E80'; accessBg = 'rgba(74,158,255,.05)';
    }
    return (
      <div onClick={closeAuth} style={backdropStyle}>
        <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
          <Corners />
          <ModalHeader tag="ЛИЧНЫЙ КОНТУР" onClose={closeAuth} />
          <div style={{ padding: '22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 52, height: 52, border: `1px solid ${role.col}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 20, color: role.col, background: '#101013' }}>
                {me.nick.slice(0, 1).toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 700, fontSize: 16, color: '#ECE9E4', overflow: 'hidden', textOverflow: 'ellipsis' }}>{me.nick}</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.14em', color: role.col, marginTop: 4 }}>{role.label}</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 18 }}>
              <div style={{ border: '1px solid #1E1E23', background: '#101013', padding: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: '.16em', color: '#55545C' }}>ВНЕСЕНО</div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 17, color: '#ECE9E4', marginTop: 5 }}>{rub(me.given)}</div>
              </div>
              <div style={{ border: '1px solid #1E1E23', background: '#101013', padding: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: '.16em', color: '#55545C' }}>ГОЛОСОВ</div>
                <div style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 17, color: '#ECE9E4', marginTop: 5 }}>{me.votes}</div>
              </div>
            </div>
            <div style={{ border: `1px solid ${accessBorder}`, background: accessBg, padding: 14, marginTop: 8 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.18em', color: accessCol }}>{accessTag}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.7, color: '#A8A6AD', marginTop: 7 }}>{accessText}</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.06em', lineHeight: 1.8, color: '#4A4950', marginTop: 14 }}>
              ID: {me.id}<br />КОНТАКТ: {me.contact}<br />С НАМИ С: {new Date(me.since).toLocaleDateString('ru-RU')}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              <button onClick={() => { closeAuth(); setTimeout(() => scrollToId('scales'), 120); }} style={{ flex: 1, minWidth: 140, background: '#E5372C', border: '1px solid #E5372C', color: '#0B0B0C', fontFamily: 'var(--display)', fontWeight: 700, fontSize: 11, letterSpacing: '.08em', padding: 14, cursor: 'pointer', minHeight: 44 }}>К ВЕСАМ ⇄</button>
              <button onClick={() => { auth.logout(); closeAuth(); notify('Ты вышел. Донаты и голоса сохранены.'); }} style={{ background: 'none', border: '1px solid #2A2A30', color: '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.1em', padding: '12px 16px', cursor: 'pointer', minHeight: 44 }}>ВЫЙТИ</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabOn = { background: 'rgba(229,55,44,.14)', color: '#FF6A5B' };
  const tabOff = { background: 'none', color: '#8E8C94' };
  const reg = authUi.tab === 'reg';

  return (
    <div onClick={closeAuth} style={backdropStyle}>
      <div onClick={(e) => e.stopPropagation()} style={cardStyle}>
        <Corners />
        <ModalHeader tag="ДОСТУП К ПРОТОКОЛУ" onClose={closeAuth} />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', border: '1px solid #26262B' }}>
            <button onClick={() => setAuthTab('login')} style={{ flex: 1, border: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', padding: 12, cursor: 'pointer', minHeight: 44, ...(reg ? tabOff : tabOn) }}>ВХОД</button>
            <button onClick={() => setAuthTab('reg')} style={{ flex: 1, border: 'none', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.14em', padding: 12, cursor: 'pointer', minHeight: 44, ...(reg ? tabOn : tabOff) }}>РЕГИСТРАЦИЯ</button>
          </div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: '#8E8C94', marginTop: 16 }}>
            {reg
              ? 'Регистрация привязывает донаты и голоса к твоему позывному, открывает закрытый контур и отчёты по ДОБРУ. Ничего лишнего не спрашиваем.'
              : 'Войди, чтобы твои гири на весах считались за тобой и пришёл доступ к закрытым эфирам.'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {reg && (
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', color: '#55545C', marginBottom: 6 }}>ПОЗЫВНОЙ</div>
                <input value={authUi.nick} onChange={(e) => setAuthField('nick', e.target.value)} placeholder="как тебя звать в эфире" style={inputStyle} />
              </div>
            )}
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', color: '#55545C', marginBottom: 6 }}>TELEGRAM ИЛИ EMAIL</div>
              <input value={authUi.contact} onChange={(e) => setAuthField('contact', e.target.value)} placeholder="@nickname или mail@mail.ru" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', color: '#55545C', marginBottom: 6 }}>КОД ДОСТУПА</div>
              <input type="password" value={authUi.pass} onChange={(e) => setAuthField('pass', e.target.value)} placeholder="минимум 4 символа" style={inputStyle} />
            </div>
            {reg && (
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8.5, letterSpacing: '.18em', color: '#55545C', marginBottom: 6 }}>ЗАЧЕМ ТЫ ЗДЕСЬ</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {(['sub', 'donor', 'crew'] as const).map((k) => {
                    const on = authUi.role === k;
                    return (
                      <button key={k} onClick={() => setAuthRole(k)} style={{ flex: 1, minWidth: 96, background: on ? 'rgba(229,55,44,.14)' : 'none', border: `1px solid ${on ? '#E5372C' : '#2A2A30'}`, color: on ? '#FF6A5B' : '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 9.5, letterSpacing: '.1em', padding: '11px 6px', cursor: 'pointer', minHeight: 44 }}>
                        {ROLE_META[k].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          {authUi.err && (
            <div style={{ border: '1px solid #6E2A24', background: 'rgba(229,55,44,.07)', color: '#FF8A7C', fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5, letterSpacing: '.04em', lineHeight: 1.6, padding: 11, marginTop: 12 }}>{authUi.err}</div>
          )}
          <button onClick={submitAuth} style={{ width: '100%', background: '#E5372C', border: '1px solid #E5372C', color: '#0B0B0C', fontFamily: 'var(--display)', fontWeight: 900, fontSize: 13, letterSpacing: '.08em', padding: 16, cursor: 'pointer', marginTop: 16, minHeight: 52 }}>
            {reg ? 'СОЗДАТЬ АККАУНТ' : 'ВОЙТИ В ПРОТОКОЛ'}
          </button>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.04em', lineHeight: 1.8, color: '#4A4950', marginTop: 14 }}>
            Аккаунт живёт на этом устройстве и привязывает к тебе донаты, голоса и закрытый доступ. Пароль не уходит с устройства.
          </div>
        </div>
      </div>
    </div>
  );
}

const backdropStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1600, background: 'rgba(6,6,7,.88)', backdropFilter: 'blur(6px)',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 'clamp(16px,6vh,80px) 16px', overflowY: 'auto',
};
const cardStyle: React.CSSProperties = {
  width: '100%', maxWidth: 440, background: '#0D0D0F', border: '1px solid #2A2A30', position: 'relative', boxShadow: '0 30px 90px rgba(0,0,0,.7)',
};

function Corners() {
  return (
    <>
      <div style={{ position: 'absolute', top: -1, left: -1, width: 16, height: 16, borderTop: '2px solid #E5372C', borderLeft: '2px solid #E5372C' }} />
      <div style={{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderBottom: '2px solid #E5372C', borderRight: '2px solid #E5372C' }} />
    </>
  );
}

function ModalHeader({ tag, onClose }: { tag: string; onClose: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid #1C1C20' }}>
      <span style={{ fontFamily: 'var(--display)', fontWeight: 900, fontSize: 14, letterSpacing: '.05em', color: '#ECE9E4' }}>BANGTAOSTYLE<span style={{ color: '#E5372C' }}>.COM</span></span>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '.2em', color: '#55545C' }}>{tag}</span>
      <span style={{ flex: 1 }} />
      <button onClick={onClose} style={{ background: 'none', border: '1px solid #2A2A30', color: '#8E8C94', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, padding: '6px 10px', cursor: 'pointer', minHeight: 32 }}>✕</button>
    </div>
  );
}
