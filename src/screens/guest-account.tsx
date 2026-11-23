import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import * as WebBrowser from 'expo-web-browser';

import { useApp } from '../session-context';
import { Button, colors, styles, Txt, useText } from '../components/ui';

type Panel = 'home' | 'settings' | 'support';

const icons = {
  profile: {
    ios: 'person.crop.circle.fill',
    android: 'account_circle',
    web: 'account_circle',
  },
  details: {
    ios: 'person.text.rectangle.fill',
    android: 'person',
    web: 'person',
  },
  settings: {
    ios: 'gearshape.fill',
    android: 'settings',
    web: 'settings',
  },
  support: {
    ios: 'headset',
    android: 'support_agent',
    web: 'support_agent',
  },
  sparkle: {
    ios: 'sparkles',
    android: 'auto_awesome',
    web: 'auto_awesome',
  },
  categories: {
    ios: 'square.grid.2x2.fill',
    android: 'category',
    web: 'category',
  },
  stores: {
    ios: 'storefront.fill',
    android: 'store',
    web: 'store',
  },
  products: {
    ios: 'bag.fill',
    android: 'shopping_bag',
    web: 'shopping_bag',
  },
  arrow: {
    ios: 'chevron.forward',
    android: 'arrow_forward',
    web: 'arrow_forward',
  },
} as const;

export function GuestAccountScreen() {
  const { api, locale } = useApp();
  const t = useText();
  const [panel, setPanel] = useState<Panel>('home');

  function openWebsite(path: string) {
    void WebBrowser.openBrowserAsync(`${api.origin}${path}`).catch(() => {});
  }

  if (panel === 'settings') {
    return (
      <SettingsPanel
        onBack={() => setPanel('home')}
        openWebsite={openWebsite}
      />
    );
  }

  if (panel === 'support') {
    return (
      <SupportPanel
        onBack={() => setPanel('home')}
        openWebsite={openWebsite}
      />
    );
  }

  return (
    <View style={{ gap: 23 }}>
      <View style={{ alignItems: 'flex-end', gap: 9 }}>
        <View
          style={{
            width: 94,
            height: 94,
            borderRadius: 34,
            backgroundColor: colors.primarySoft,
            borderWidth: 1,
            borderColor: '#FFE0D2',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SymbolView
            name={icons.profile}
            tintColor={colors.primary}
            size={69}
          />
          <View
            style={{
              position: 'absolute',
              right: -4,
              bottom: -3,
              width: 30,
              height: 30,
              borderRadius: 11,
              backgroundColor: colors.primary,
              borderWidth: 3,
              borderColor: colors.paper,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SymbolView name={icons.sparkle} tintColor="#FFFFFF" size={14} />
          </View>
        </View>
        <Text style={{ color: colors.muted, fontSize: 10, fontWeight: '800' }}>
          {t('مساحتك الشخصية', 'YOUR PERSONAL SPACE')}
        </Text>
      </View>

      <View style={{ gap: 7 }}>
        <Text
          style={{
            color: colors.ink,
            fontSize: 27,
            lineHeight: 37,
            fontWeight: '900',
            textAlign: locale === 'ar' ? 'right' : 'left',
            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          {t('إدارة حسابك بسهولة', 'Manage your account')}
        </Text>
        <Txt muted>
          {t(
            'كل ما تحتاجه لتخصيص تجربة التسوق وإدارة حسابك في مكان واحد.',
            'Your account, preferences and shopping support, all in one place.',
          )}
        </Txt>
      </View>

      <View style={{ flexDirection: locale === 'ar' ? 'row-reverse' : 'row', gap: 11 }}>
        <View style={{ flex: 1 }}>
          <ActionCard
            icon={icons.details}
            title={t('بياناتك الشخصية', 'Your details')}
            description={t(
              'الدخول إلى حسابك وإدارة بياناتك',
              'Sign in and manage your profile',
            )}
            onPress={() => router.push('/login')}
          />
        </View>

        <View style={{ flex: 1 }}>
          <ActionCard
            icon={icons.settings}
            title={t('الإعدادات', 'Settings')}
            description={t(
              'اللغة وتفضيلات التطبيق',
              'Language and app preferences',
            )}
            onPress={() => setPanel('settings')}
          />
        </View>
      </View>

      <ActionCard
        icon={icons.support}
        title={t('الدعم والمساعدة', 'Support')}
        description={t(
          'إرشادات الحساب والتسوق واستعادة كلمة المرور',
          'Account help, shopping guidance and password recovery',
        )}
        horizontal
        onPress={() => setPanel('support')}
      />

      <View style={{ gap: 12 }}>
        <View style={{ gap: 4 }}>
          <Txt title>{t('مقترحات لك', 'Recommended for you')}</Txt>
          <Txt muted>
            {t(
              'اكتشف المزيد من عالم مُروَّج.كم',
              'Explore more of the murwaj.com experience',
            )}
          </Txt>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 11, paddingBottom: 4 }}
        >
          <ReadCard
            icon={icons.categories}
            title={t('اكتشف الفئات', 'Explore categories')}
            description={t('اعثر على ما يناسبك', 'Find what you love')}
            onPress={() => router.push('/categories')}
          />
          <ReadCard
            icon={icons.stores}
            title={t('تعرّف على المتاجر', 'Meet the stores')}
            description={t('اكتشف المتاجر المستقلة', 'Discover independent stores')}
            onPress={() => router.push('/stores')}
          />
          <ReadCard
            icon={icons.products}
            title={t('اعثر على منتجاتك', 'Find your favourites')}
            description={t('استكشف المنتجات', 'Browse available products')}
            onPress={() => router.push('/search')}
          />
        </ScrollView>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.ink,
            borderColor: colors.ink,
            padding: 19,
            gap: 10,
          },
        ]}
      >
        <Text
          style={{
            color: '#FF9B76',
            fontSize: 11,
            fontWeight: '900',
            letterSpacing: 1,
          }}
        >
          murwaj.com
        </Text>
        <Text
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            lineHeight: 26,
            fontWeight: '900',
            textAlign: locale === 'ar' ? 'right' : 'left',
          }}
        >
          {t('تجربة تسوق تبدأ بك', 'Your shopping journey starts here')}
        </Text>
        <Text
          style={{
            color: '#E8DED8',
            fontSize: 12,
            lineHeight: 20,
            textAlign: locale === 'ar' ? 'right' : 'left',
          }}
        >
          {t(
            'أنشئ حسابك لتتمكن من متابعة طلباتك وإدارة بياناتك بسهولة.',
            'Create an account to manage your details and follow your orders.',
          )}
        </Text>
        <Button
          label={t('ابدأ الآن', 'Get started')}
          onPress={() =>
            router.push({ pathname: '/login', params: { mode: 'register' } })
          }
        />
      </View>
    </View>
  );
}

function ActionCard({
  icon,
  title,
  description,
  onPress,
  horizontal = false,
}: {
  icon: (typeof icons)[keyof typeof icons];
  title: string;
  description: string;
  onPress: () => void;
  horizontal?: boolean;
}) {
  const { locale } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: horizontal ? 112 : 184,
        padding: 14,
        borderRadius: 22,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: colors.white,
        flexDirection: horizontal
          ? locale === 'ar' ? 'row-reverse' : 'row'
          : 'column',
        alignItems: horizontal ? 'center' : 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        shadowColor: colors.ink,
        shadowOpacity: 0.045,
        shadowRadius: 13,
        shadowOffset: { width: 0, height: 5 },
        elevation: 2,
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.99 : 1 }],
      })}
    >
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 21,
          backgroundColor: colors.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SymbolView name={icon} tintColor={colors.primary} size={31} />
      </View>

      <View
        style={{
          flex: 1,
          minWidth: 0,
          gap: 4,
          alignItems: locale === 'ar' ? 'flex-end' : 'flex-start',
        }}
      >
        <Text
          style={{
            color: colors.ink,
            fontSize: 15,
            lineHeight: 21,
            fontWeight: '900',
          }}
        >
          {title}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            color: colors.muted,
            fontSize: 10,
            lineHeight: 16,
            textAlign: locale === 'ar' ? 'right' : 'left',
          }}
        >
          {description}
        </Text>
      </View>

      <SymbolView
        name={icons.arrow}
        tintColor={colors.muted}
        size={16}
      />
    </Pressable>
  );
}

function ReadCard({
  icon,
  title,
  description,
  onPress,
}: {
  icon: (typeof icons)[keyof typeof icons];
  title: string;
  description: string;
  onPress: () => void;
}) {
  const { locale } = useApp();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 190,
        minHeight: 142,
        padding: 14,
        borderRadius: 20,
        backgroundColor: colors.primarySoft,
        justifyContent: 'space-between',
        gap: 9,
        opacity: pressed ? 0.86 : 1,
      })}
    >
      <SymbolView name={icon} tintColor={colors.primary} size={27} />
      <View style={{ gap: 3 }}>
        <Text
          style={{
            color: colors.ink,
            fontSize: 13,
            fontWeight: '900',
            textAlign: locale === 'ar' ? 'right' : 'left',
            writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
          }}
        >
          {title}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 16 }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

function PanelHeading({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) {
  const t = useText();

  return (
    <View style={{ gap: 12 }}>
      <Button
        label={t('رجوع', 'Back')}
        secondary
        onPress={onBack}
      />
      <Txt title>{title}</Txt>
    </View>
  );
}

function SettingsPanel({
  onBack,
  openWebsite,
}: {
  onBack: () => void;
  openWebsite: (path: string) => void;
}) {
  const { locale, setLocale } = useApp();
  const t = useText();

  return (
    <View style={{ gap: 18 }}>
      <PanelHeading
        title={t('الإعدادات', 'Settings')}
        onBack={onBack}
      />

      <View style={[styles.card, { gap: 13 }]}>
        <Txt title>{t('لغة التطبيق', 'App language')}</Txt>
        <Txt muted>
          {t(
            'اختر اللغة التي تفضّل استخدامها في مُروَّج.كم.',
            'Choose the language you prefer for murwaj.com.',
          )}
        </Txt>

        {([
          { value: 'ar' as const, title: 'العربية', subtitle: 'Arabic' },
          { value: 'en' as const, title: 'English', subtitle: 'الإنجليزية' },
        ]).map((option) => {
          const selected = locale === option.value;

          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => setLocale(option.value)}
              style={{
                minHeight: 58,
                paddingHorizontal: 14,
                borderRadius: 15,
                borderWidth: 1,
                borderColor: selected ? colors.primary : colors.line,
                backgroundColor: selected ? colors.primarySoft : colors.white,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: colors.ink, fontWeight: '800' }}>
                {option.title}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {option.subtitle} {selected ? '✓' : ''}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.card, { gap: 12 }]}>
        <Txt title>{t('الخصوصية والشروط', 'Privacy and legal')}</Txt>
        <Button
          secondary
          label={t('سياسة الخصوصية', 'Privacy policy')}
          onPress={() => openWebsite('/privacy-policy')}
        />
        <Button
          secondary
          label={t('شروط الاستخدام', 'Terms of service')}
          onPress={() => openWebsite('/terms-of-service')}
        />
      </View>
    </View>
  );
}

function SupportPanel({
  onBack,
  openWebsite,
}: {
  onBack: () => void;
  openWebsite: (path: string) => void;
}) {
  const t = useText();

  return (
    <View style={{ gap: 18 }}>
      <PanelHeading
        title={t('الدعم والمساعدة', 'Support')}
        onBack={onBack}
      />

      <View style={[styles.card, { gap: 10 }]}>
        <Txt title>{t('كيف يمكننا مساعدتك؟', 'How can we help?')}</Txt>
        <Txt muted>
          {t(
            'اختر الموضوع الذي تحتاج إلى المساعدة بشأنه.',
            'Choose a topic to get help with your account and shopping.',
          )}
        </Txt>
      </View>

      <View style={[styles.card, { gap: 12 }]}>
        <View style={{ gap: 4 }}>
          <Txt title>{t('الدخول إلى الحساب', 'Account access')}</Txt>
          <Txt muted>
            {t(
              'سجّل الدخول أو أنشئ حسابًا للوصول إلى بياناتك وطلباتك.',
              'Sign in or create an account to access your details and orders.',
            )}
          </Txt>
        </View>
        <Button
          label={t('الانتقال إلى تسجيل الدخول', 'Go to sign in')}
          onPress={() => router.push('/login')}
        />
      </View>

      <View style={[styles.card, { gap: 12 }]}>
        <View style={{ gap: 4 }}>
          <Txt title>{t('استعادة كلمة المرور', 'Password recovery')}</Txt>
          <Txt muted>
            {t(
              'إذا نسيت كلمة المرور، ابدأ عملية الاستعادة من الموقع.',
              'Forgot your password? Start recovery on the website.',
            )}
          </Txt>
        </View>
        <Button
          secondary
          label={t('استعادة كلمة المرور', 'Reset password')}
          onPress={() => openWebsite('/forgot-password')}
        />
      </View>

      <View style={[styles.card, { gap: 12 }]}>
        <Txt title>{t('المساعدة والسياسات', 'Help and policies')}</Txt>
        <Button
          secondary
          label={t('سياسة الخصوصية', 'Privacy policy')}
          onPress={() => openWebsite('/privacy-policy')}
        />
        <Button
          secondary
          label={t('شروط الاستخدام', 'Terms of service')}
          onPress={() => openWebsite('/terms-of-service')}
        />
      </View>

      <Txt muted>
        {t(
          'لمتابعة طلب أو الوصول إلى بيانات حسابك، سجّل الدخول أولًا. روابط المساعدة والسياسات تفتح صفحات المنصة الرسمية.',
          'For account-specific or order-related help, sign in first. Help and policy links open the platform website.',
        )}
      </Txt>
    </View>
  );
}
