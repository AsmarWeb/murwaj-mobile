import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Page } from '../../components/page';
import { AccountScreen } from '../../screens/account';
import { Button, Txt, useText, colors, styles } from '../../components/ui';
import { useApp } from '../../session-context';

export default function Account() {
  const { generation, session } = useApp();
  const t = useText();
  return (
    <Page>
      <View style={{ gap: 19 }}>
        <View style={{ gap: 4 }}>
          <Txt title>{t('حسابي', 'My account')}</Txt>
          <Txt muted>{t('ملفك الشخصي وطلباتك وتفضيلات التسوق', 'Your profile, orders and shopping preferences')}</Txt>
        </View>

        {!session ? (
          <>
            <View style={{ backgroundColor: '#FFF0E9', borderRadius: 27, borderWidth: 1, borderColor: '#FFE0D2', padding: 22, gap: 13 }}>
              <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: 'rgba(255,85,23,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                <Txt title>م</Txt>
              </View>
              <Txt title>{t('مرحباً بك في مُروَّج.كم', 'Welcome to murwaj.com')}</Txt>
              <Txt muted>{t('سجّل الدخول لتتابع طلباتك وتحفظ مشترياتك وتدير بياناتك من مكان واحد.', 'Sign in to follow orders, manage your details and keep your shopping in one place.')}</Txt>
              <Button label={t('تسجيل الدخول', 'Sign in')} onPress={() => router.push('/login')} />
              <Button secondary label={t('إنشاء حساب جديد', 'Create an account')} onPress={() => router.push({ pathname: '/login', params: { mode: 'register' } })} />
            </View>

            <View style={styles.card}>
              <Txt title>{t('ابدأ الاستكشاف', 'Start exploring')}</Txt>
              <Txt muted>{t('تصفح المنتجات والمتاجر قبل إنشاء حسابك.', 'Explore products and independent stores before creating an account.')}</Txt>
              <View style={{ flexDirection: 'row', gap: 9 }}>
                <View style={{ flex: 1 }}>
                  <Button secondary label={t('المنتجات', 'Products')} onPress={() => router.navigate('/search')} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button secondary label={t('المتاجر', 'Stores')} onPress={() => router.navigate('/stores')} />
                </View>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: colors.white }]}>
              <Txt title>{t('تسوّق براحة', 'Shop with confidence')}</Txt>
              <Txt muted>{t('تجربة عربية وإنجليزية، متاجر مستقلة، وسلة واحدة تجمع مشترياتك.', 'Arabic and English, independent stores, and one basket for your shopping.')}</Txt>
            </View>
          </>
        ) : (
          <AccountScreen key={generation} />
        )}
      </View>
    </Page>
  );
}
