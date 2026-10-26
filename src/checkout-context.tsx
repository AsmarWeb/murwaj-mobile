import React, { createContext, useContext, useEffect, useMemo } from 'react';
import * as Crypto from 'expo-crypto';
import { CheckoutJournal } from './core/checkout';
import { useApp } from './session-context';
import { vault } from './vault';
const CheckoutContext = createContext<CheckoutJournal | null>(null);
export const useCheckout = () => useContext(CheckoutContext);
export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const { api, session, locale } = useApp();
  const userId = session?.user.id;
  const token = session?.token;
  const journal = useMemo(
    () =>
      userId && token
        ? new CheckoutJournal(api, vault, userId, token, 'en', () => Crypto.randomUUID())
        : null,
    [api, userId, token],
  );
  useEffect(() => {
    journal?.setLocale(locale);
  }, [journal, locale]);
  return <CheckoutContext.Provider value={journal}>{children}</CheckoutContext.Provider>;
}
