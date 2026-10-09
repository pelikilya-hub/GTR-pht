'use client';
import { useCallback, useEffect, useState } from 'react';
import { ls, setLs } from './storage';

export type Role = 'sub' | 'donor' | 'crew';

export interface HubUser {
  id: string;
  key: string;
  nick: string;
  contact: string;
  pw: string;
  role: Role;
  given: number;
  votes: number;
  since: number;
  lastSide?: 'good' | 'joy';
}

function hash(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

function getUsers(): HubUser[] {
  return ls<HubUser[]>('gtrpht_users', []);
}
function saveUsers(u: HubUser[]) {
  setLs('gtrpht_users', u);
}
function getSessionId(): string | null {
  return ls<string | null>('gtrpht_session', null);
}
function readMe(): HubUser | null {
  const id = getSessionId();
  if (!id) return null;
  return getUsers().find((u) => u.id === id) || null;
}

export function useAuth() {
  const [me, setMe] = useState<HubUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydration-safe: session lives in localStorage, unavailable during SSR.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMe(readMe());
    setReady(true);
  }, []);

  const refresh = useCallback(() => setMe(readMe()), []);

  const register = useCallback((nick: string, contact: string, pass: string, role: Role): string | null => {
    nick = nick.trim();
    contact = contact.trim();
    if (!contact) return 'Укажи Telegram или email — по нему придёт доступ.';
    if (pass.length < 4) return 'Код доступа — минимум 4 символа.';
    if (!nick) return 'Позывной обязателен — под ним ты появишься в ленте гирь.';
    const key = contact.toLowerCase();
    const users = getUsers();
    if (users.some((u) => u.key === key)) return 'Такой контакт уже в системе. Переключись на ВХОД.';
    const u: HubUser = {
      id: 'U' + Date.now().toString(36).toUpperCase(),
      key, nick, contact,
      pw: hash(pass + key),
      role, given: 0, votes: 0, since: Date.now(),
    };
    users.push(u);
    saveUsers(users);
    setLs('gtrpht_session', u.id);
    setMe(u);
    return null;
  }, []);

  const login = useCallback((contact: string, pass: string): string | null => {
    contact = contact.trim();
    if (!contact) return 'Укажи Telegram или email — по нему придёт доступ.';
    if (pass.length < 4) return 'Код доступа — минимум 4 символа.';
    const key = contact.toLowerCase();
    const users = getUsers();
    const u = users.find((x) => x.key === key);
    if (!u) return 'Контакт не найден. Зарегистрируйся.';
    if (u.pw !== hash(pass + key)) return 'Код доступа не подходит.';
    setLs('gtrpht_session', u.id);
    setMe(u);
    return null;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem('gtrpht_session');
    } catch {
      /* ignore */
    }
    setMe(null);
  }, []);

  const credit = useCallback((side: 'good' | 'joy', amt: number, isVote: boolean) => {
    const current = readMe();
    if (!current) return;
    const users = getUsers();
    const u = users.find((x) => x.id === current.id);
    if (!u) return;
    u.given = (+u.given || 0) + (isVote ? 0 : amt);
    u.votes = (+u.votes || 0) + 1;
    u.lastSide = side;
    saveUsers(users);
    setMe({ ...u });
  }, []);

  return { me, ready, refresh, register, login, logout, credit };
}
