import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { Page } from '../../components/page';
import { AccountScreen } from '../../screens/account';
import { Button, Txt, useText } from '../../components/ui';
import { useApp } from '../../session-context';

export default function Account() {
  const { generation, session, locale, setLocale } = useApp();
  const t = useText();
  const guest = !session;

  return (
    <Page>
      <View style={{ gap: 9 }}>
        <Txt muted>{t('لغة التطبيق', 'App language')}</Txt>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              secondary={locale !== 'ar'}
              label={t('العربية', 'Arabic')}
              onPress={() => setLocale('ar')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              secondary={locale !== 'en'}
              label={t('الإنجليزية', 'English')}
              onPress={() => setLocale('en')}
            />
          </View>
        </View>
      </View>
      {guest ? (
        <View style={{ gap: 16 }}>
          <Txt title>{t('حسابك في مُروَّج.كم', 'Your murwaj.com account')}</Txt>
          <Txt muted>
            {t('سجّل الدخول لمتابعة طلباتك وإدارة حسابك ومشترياتك.', 'Sign in to manage your account, orders and purchases.')}
          </Txt>
          <Button
            label={t('تسجيل الدخول', 'Sign in')}
            onPress={() => router.push('/login')}
          />
          <Button
            secondary
            label={t('إنشاء حساب جديد', 'Create an account')}
            onPress={() => router.push({ pathname: '/login', params: { mode: 'register' } })}
          />
          <Txt muted>
            {t('احتفظ بطلباتك ونشاط التسوق في مكان واحد.', 'Keep your orders and shopping activity together.')}
          </Txt>
        </View>
      ) : (
        <AccountScreen key={generation} />
      )}
    </Page>
  );
}
