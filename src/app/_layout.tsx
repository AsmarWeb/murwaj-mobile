import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AppProvider, useApp } from '../session-context';
import { CheckoutProvider } from '../checkout-context';
import { Busy, colors, styles, Txt, useText } from '../components/ui';
import { config } from '../config';
import { checkoutReturn } from '../core/api';
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <CheckoutProvider>
          <Shell />
        </CheckoutProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
function Shell() {
  const { api, session, locale, setLocale, ready, checked } = useApp();
  const token = session?.token;
  const t = useText();
  const [pendingLink, setPendingLink] = useState<number | null>(null);
  const busy = useRef(false);
  useEffect(() => {
    const receive = (url: string) => {
      const id = checkoutReturn(url);
      if (id) setPendingLink(id);
    };
    void Linking.getInitialURL()
      .then((url) => {
        if (url) receive(url);
      })
      .catch(() => {});
    const listener = Linking.addEventListener('url', (e) => receive(e.url));
    return () => listener.remove();
  }, []);
  useEffect(() => {
    if (!ready || !pendingLink || !token || !checked || busy.current) return;
    busy.current = true;
    const id = pendingLink;
    let active = true;
    void api
      .request(`/checkout/${id}/refresh`, token, locale, { method: 'POST' })
      .catch(() => {})
      .finally(() => {
        busy.current = false;
        if (active) {
          setPendingLink(null);
          router.replace({ pathname: '/order/[id]', params: { id: String(id) } });
        }
      });
    return () => {
      active = false;
      busy.current = false;
    };
  }, [api, pendingLink, token, checked, locale, ready]);
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View
          style={{
            paddingHorizontal: 20,
            paddingVertical: 13,
            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderColor: colors.line,
          }}
        >
          <Text
            accessibilityRole="header"
            style={{ fontSize: 25, fontWeight: '900', color: colors.green }}
          >
            مروج<Text style={{ color: colors.muted, fontSize: 14 }}> .com</Text>
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={locale === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
            onPress={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            style={{ padding: 10 }}
          >
            <Text style={{ color: colors.green, fontWeight: '700' }}>
              {locale === 'ar' ? 'EN' : 'عربي'}
            </Text>
          </Pressable>
        </View>
        {config.problem ? (
          <View style={styles.page}>
            <Txt title>{t('إعداد الاتصال', 'Connection setup')}</Txt>
            <Txt>{config.problem}</Txt>
          </View>
        ) : !ready ? (
          <Busy />
        ) : (
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.paper },
              headerTintColor: colors.green,
              headerBackTitle: t('رجوع', 'Back'),
              headerTitle: '',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[slug]" />
            <Stack.Screen name="store/[slug]" />
            <Stack.Screen name="store-products/[slug]" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="checkout/index" />
            <Stack.Screen name="checkout/result" />
            <Stack.Screen name="+not-found" />
          </Stack>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
