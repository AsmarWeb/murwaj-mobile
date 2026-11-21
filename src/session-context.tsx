import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Api, ApiError } from './core/api';
import { SessionStore } from './core/session';
import type { AuthReply, Locale, MobileConfig, Session, User } from './core/types';
import { config } from './config';
import { native, vault } from './vault';

const store = new SessionStore(vault, config.origin);
const api = new Api(config.origin, fetch, (token) => {
  if (store.current?.token !== token) return;
  void store
    .clear(token)
    .then(() => notify())
    .catch(() => notify());
});
let notify = () => {};
async function verifySession(locale: Locale): Promise<boolean> {
  const current = store.current;
  if (!current) return false;
  const reply = await api.request<{ data: User }>('/auth/me', current.token, locale);
  if (store.current?.token !== current.token) return false;
  await store.save({ ...current, user: reply.data });
  return store.current?.token === current.token;
}
type Context = {
  generation: number;
  api: Api;
  session: Session | null;
  locale: Locale;
  setLocale: (l: Locale) => void;
  ready: boolean;
  checked: boolean;
  issue: string;
  mobileConfig: MobileConfig | null;
  authenticate: (kind: 'login' | 'register', body: Record<string, unknown>) => Promise<void>;
  logout: () => Promise<void>;
  recheck: () => Promise<void>;
};
const AuthContext = createContext<Context>(null!);
export const useApp = () => useContext(AuthContext);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [locale, setLocale] = useState<Locale>('ar');
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [issue, setIssue] = useState('');
  const [mobileConfig, setMobileConfig] = useState<MobileConfig | null>(null);
  const lock = useRef(false);
  useEffect(() => {
    notify = () => {
      setSession(store.current);
      setChecked(false);
    };
    return () => {
      notify = () => {};
    };
  }, []);
  useEffect(() => {
    let active = true;

    void api
      .request<{ data: MobileConfig }>('/mobile/config', null, locale)
      .then((reply) => {
        if (active) setMobileConfig(reply.data);
      })
      .catch(() => {
        // Keep the local brand fallback if the public config is unavailable.
      });

    return () => {
      active = false;
    };
  }, [locale]);

  async function recheck() {
    setIssue('');
    try {
      const verified = await verifySession(locale);
      setSession(store.current);
      setChecked(verified);
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 401))
        setIssue('تعذّر التحقق من الجلسة. أعد المحاولة. Session could not be verified.');
      throw error;
    }
  }
  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        await store.restore();
        if (active) setSession(store.current);
        if (store.current) {
          const verified = await verifySession('en');
          if (active) {
            setSession(store.current);
            setChecked(verified);
          }
        }
      } catch {
        if (active)
          setIssue('تعذّر استعادة الجلسة أو الاتصال. أعد التحقق. Retry session verification.');
      } finally {
        if (active) setReady(true);
      }
    })();
    return () => {
      active = false;
      notify = () => {};
    };
  }, []);
  async function authenticate(kind: 'login' | 'register', body: Record<string, unknown>) {
    if (!native) throw new Error('Native login requires Android/iOS. Web preview is guest-only.');
    if (lock.current) throw new Error('Authentication in progress');
    lock.current = true;
    try {
      const r = await api.request<{ data: AuthReply }>(`/auth/${kind}`, null, locale, {
        method: 'POST',
        body: { ...body, device_name: 'Murwaj mobile' },
      });
      const s = {
        token: r.data.access_token,
        expires: r.data.expires_at,
        user: r.data.user,
        origin: config.origin,
      };
      try {
        await store.save(s);
      } catch (error) {
        void api.request('/auth/logout', s.token, locale, { method: 'POST' }).catch(() => {});
        throw error;
      }
      setSession(store.current);
      setChecked(true);
      setIssue('');
      if (r.data.verification_notification_sent === false)
        setIssue(
          'تم إنشاء الحساب؛ أعد إرسال رسالة التحقق من الحساب. Account created; resend verification.',
        );
    } finally {
      lock.current = false;
    }
  }
  async function logout() {
    const token = store.current?.token;
    if (token)
      await api.request('/auth/logout', token, locale, { method: 'POST' }).catch((error) => {
        if (!(error instanceof ApiError && error.status === 401)) throw error;
      });
    await store.clear(token);
    setSession(null);
    setChecked(false);
    setIssue('');
  }
  return (
    <AuthContext.Provider
      value={{
        generation: store.generation,
        api,
        session,
        locale,
        setLocale,
        ready,
        checked,
        issue,
        mobileConfig,
        authenticate,
        logout,
        recheck,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
