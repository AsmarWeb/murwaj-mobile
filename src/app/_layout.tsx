import React, { useEffect, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { AppProvider, useApp } from '../session-context';
import { CheckoutProvider } from '../checkout-context';
import { Busy, colors, styles, Txt, useText } from '../components/ui';
import { config } from '../config';
import { checkoutReturn, resolveMediaUrl } from '../core/api';
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
  const { api, session, locale, setLocale, ready, checked, mobileConfig } = useApp();
  const token = session?.token;
  const segments = useSegments();
  const showGlobalChrome = segments[0] !== 'product';
  const t = useText();
  const [pendingLink, setPendingLink] = useState<number | null>(null);
  const brandLogoUrl = resolveMediaUrl(mobileConfig?.brand.logo_url, api.origin);
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
        {showGlobalChrome && (
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
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            {brandLogoUrl ? (
              <Image
                accessibilityLabel={locale === 'ar' ? 'شعار مروج' : 'Murwaj logo'}
                source={{ uri: brandLogoUrl }}
                resizeMode="contain"
                style={{ width: 38, height: 38 }}
              />
            ) : null}
            <Text
              accessibilityRole="header"
              style={{ fontSize: 23, fontWeight: '900', color: colors.ink }}
            >
              {locale === 'ar'
                ? mobileConfig?.brand.name_ar ?? 'مُروَّج.كم'
                : 'murwaj.com'}
            </Text>
          </View>
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
        )}
                {showGlobalChrome && (
          <>
        {mobileConfig?.promo?.enabled &&
        (mobileConfig.promo.text[locale] || mobileConfig.promo.text.en || mobileConfig.promo.text.ar) ? (
          <Pressable
            accessibilityRole={mobileConfig.promo.url ? 'link' : 'text'}
            accessibilityLabel={
              mobileConfig.promo.text[locale] ||
              mobileConfig.promo.text.en ||
              mobileConfig.promo.text.ar ||
              ''
            }
            disabled={!mobileConfig.promo.url}
            onPress={() => {
              const url = mobileConfig.promo?.url;
              if (url && /^https:\/\//i.test(url)) {
                void Linking.openURL(url).catch(() => {});
              }
            }}
            style={{
              marginHorizontal: 12,
              marginTop: 9,
              marginBottom: 5,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 12,
              backgroundColor: mobileConfig.promo.background_color,
            }}
          >
            <Text
              style={{
                color: mobileConfig.promo.text_color,
                textAlign: 'center',
                writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
                fontSize: 13,
                fontWeight: '700',
              }}
            >
              {mobileConfig.promo.text[locale] ||
                mobileConfig.promo.text.en ||
                mobileConfig.promo.text.ar}
            </Text>
          </Pressable>
        ) : null}
          </>
        )}
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
            <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
            <Stack.Screen name="categories" />
            <Stack.Screen name="store/[slug]" />
            <Stack.Screen name="store-products/[slug]" />
            <Stack.Screen name="order/[id]" />
            <Stack.Screen name="checkout/index" />
            <Stack.Screen name="checkout/result" />
            <Stack.Protected guard={!session} redirectTo="/account">
              <Stack.Screen name="login" options={{ headerShown: false }} />
            </Stack.Protected>
            <Stack.Screen name="+not-found" />
          </Stack>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
