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
type SocialChallenge = { two_factor_required: true; challenge_token: string };

function isSocialChallenge(
  value: AuthReply | SocialChallenge,
): value is SocialChallenge {
  return (
    'two_factor_required' in value &&
    value.two_factor_required === true &&
    typeof value.challenge_token === 'string' &&
    /^[A-Za-z0-9]{64}$/.test(value.challenge_token)
  );
}

function isAuthReply(value: AuthReply | SocialChallenge): value is AuthReply {
  return (
    'access_token' in value &&
    typeof value.access_token === 'string' &&
    typeof value.expires_at === 'string' &&
    typeof value.user === 'object' &&
    value.user !== null
  );
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
  exchangeSocialTicket: (ticket: string) => Promise<SocialChallenge | null>;
  verifySocialChallenge: (challengeToken: string, body: { code?: string; recovery_code?: string }) => Promise<void>;
  logout: () => Promise<void>;
  recheck: () => Promise<void>;
};
const AuthContext = createContext<Context>(null!);
export const useApp = () => useContext(AuthContext);
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [locale, setLocaleState] = useState<Locale>('ar');
  const [ready, setReady] = useState(false);
  const [checked, setChecked] = useState(false);
  const [issue, setIssue] = useState('');
  const [mobileConfig, setMobileConfig] = useState<MobileConfig | null>(null);
  const lock = useRef(false);
  const localeChanged = useRef(false);

  function setLocale(next: Locale) {
    localeChanged.current = true;
    setLocaleState(next);
    if (native) {
      void vault.set('locale', next).catch(() => {});
    }
  }

  useEffect(() => {
    let active = true;

    void vault.get('locale').then((saved) => {
      if (
        active &&
        !localeChanged.current &&
        (saved === 'ar' || saved === 'en')
      ) {
        setLocaleState(saved);
      }
    }).catch(() => {});

    return () => {
      active = false;
    };
  }, []);
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
  async function persistAuthReply(reply: AuthReply) {
    const next = {
      token: reply.access_token,
      expires: reply.expires_at,
      user: reply.user,
      origin: config.origin,
    };

    try {
      await store.save(next);
    } catch (error) {
      void api.request('/auth/logout', next.token, locale, {
        method: 'POST',
      }).catch(() => {});
      throw error;
    }

    setSession(store.current);
    setChecked(true);
    setIssue('');

    if (reply.verification_notification_sent === false) {
      setIssue(
        'تم إنشاء الحساب؛ أعد إرسال رسالة التحقق من الحساب. Account created; resend verification.',
      );
    }
  }

  async function authenticate(kind: 'login' | 'register', body: Record<string, unknown>) {
    if (!native) throw new Error('Native login requires Android/iOS. Web preview is guest-only.');
    if (lock.current) throw new Error('Authentication in progress');

    lock.current = true;
    try {
      const reply = await api.request<{ data: AuthReply }>(
        `/auth/${kind}`,
        null,
        locale,
        {
          method: 'POST',
          body: { ...body, device_name: 'Murwaj mobile' },
        },
      );

      await persistAuthReply(reply.data);
    } finally {
      lock.current = false;
    }
  }

  async function exchangeSocialTicket(ticket: string): Promise<SocialChallenge | null> {
    if (!native) throw new Error('Social sign-in requires Android or iOS.');
    if (lock.current) throw new Error('Authentication in progress');

    lock.current = true;
    try {
      const reply = await api.request<{
        data: AuthReply | SocialChallenge;
      }>('/auth/social/exchange', null, locale, {
        method: 'POST',
        body: {
          ticket,
          device_name: 'Murwaj mobile',
        },
      });

      if (isSocialChallenge(reply.data)) {
        return reply.data;
      }

      if (!isAuthReply(reply.data)) {
        throw new Error('The server returned an invalid social authentication response.');
      }

      await persistAuthReply(reply.data);
      return null;
    } finally {
      lock.current = false;
    }
  }

  async function verifySocialChallenge(
    challengeToken: string,
    body: { code?: string; recovery_code?: string },
  ) {
    if (!native) throw new Error('Social sign-in requires Android or iOS.');
    if (lock.current) throw new Error('Authentication in progress');

    lock.current = true;
    try {
      const reply = await api.request<{ data: AuthReply }>(
        '/auth/social/verify',
        null,
        locale,
        {
          method: 'POST',
          body: {
            challenge_token: challengeToken,
            ...body,
          },
        },
      );

      await persistAuthReply(reply.data);
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
        exchangeSocialTicket,
        verifySocialChallenge,
        logout,
        recheck,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
