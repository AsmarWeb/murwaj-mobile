import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Page } from '../../components/page';
import { AccountScreen } from '../../screens/account';
import { Button, Txt, useText, colors } from '../../components/ui';
import { useApp } from '../../session-context';

export default function Account() {
  const { generation, session, locale, setLocale } = useApp();
  const t = useText();
  return (
    <Page>
      <View style={{ gap: 19 }}>
        <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ gap: 4 }}>
            <Txt title>{t('حسابي', 'My account')}</Txt>
            <Txt muted>{t('إدارة حسابك وتجربة التسوق', 'Your profile and shopping preferences')}</Txt>
          </View>
          <View style={{ flexDirection: 'row', gap: 5, backgroundColor: '#FFFFFF', padding: 4, borderRadius: 15, borderWidth: 1, borderColor: colors.line }}>
            <Button secondary={locale !== 'ar'} label="عربي" onPress={() => setLocale('ar')} />
            <Button secondary={locale !== 'en'} label="EN" onPress={() => setLocale('en')} />
          </View>
        </View>

        {!session ? (
          <View style={{ backgroundColor: '#FFF0E9', borderRadius: 27, borderWidth: 1, borderColor: '#FFE0D2', padding: 22, gap: 13 }}>
            <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,85,23,0.18)', alignItems: 'center', justifyContent: 'center' }}>
              <Txt title>م</Txt>
            </View>
            <Txt title>{t('مرحباً بك في مُروَّج.كم', 'Welcome to murwaj.com')}</Txt>
            <Txt muted>{t('سجّل الدخول لتتابع طلباتك وتحفظ مشترياتك وتدير بياناتك من مكان واحد.', 'Sign in to follow orders, manage your details and keep your shopping in one place.')}</Txt>
            <Button label={t('تسجيل الدخول', 'Sign in')} onPress={() => router.push('/login')} />
            <Button secondary label={t('إنشاء حساب جديد', 'Create an account')} onPress={() => router.push({ pathname: '/login', params: { mode: 'register' } })} />
          </View>
        ) : (
          <AccountScreen key={generation} />
        )}

      </View>
    </Page>
  );
}
