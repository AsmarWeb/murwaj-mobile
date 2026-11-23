import React, { useState } from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { resolveMediaUrl } from '../core/api';
import { Button, ErrorText, Txt, colors, styles, useText } from '../components/ui';
import type { Device } from '../core/types';
import { useApp } from '../session-context';

function ProfileAvatar({
  uri,
  name,
  apiOrigin,
}: {
  uri?: string | null;
  name: string;
  apiOrigin: string;
}) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const imageUri = resolveMediaUrl(uri, apiOrigin);

  if (imageUri && failedUri !== imageUri) {
    return (
      <Image
        accessibilityLabel={name}
        accessibilityIgnoresInvertColors
        source={{ uri: imageUri }}
        onError={() => setFailedUri(imageUri)}
        resizeMode="cover"
        style={{
          width: 78,
          height: 78,
          borderRadius: 27,
          borderWidth: 3,
          borderColor: colors.white,
          backgroundColor: colors.white,
        }}
      />
    );
  }

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={name}
      style={{
        width: 78,
        height: 78,
        borderRadius: 27,
        borderWidth: 3,
        borderColor: colors.white,
        backgroundColor: colors.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: colors.primary, fontSize: 30, fontWeight: '900' }}>
        {name.trim().slice(0, 1) || 'م'}
      </Text>
    </View>
  );
}

export function AccountDashboard() {
  const {
    api,
    session,
    locale,
    checked,
    recheck,
    logout,
    setLocale,
  } = useApp();

  const t = useText();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [devices, setDevices] = useState<Device[]>([]);
  const [devicesOpen, setDevicesOpen] = useState(false);

  async function run(task: () => Promise<unknown>) {
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      await task();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  async function openWebsite(path: string) {
    await WebBrowser.openBrowserAsync(api.origin + path);
  }

  async function toggleDevices() {
    if (devicesOpen) {
      setDevicesOpen(false);
      return;
    }

    if (!session || !checked) return;

    await run(async () => {
      const reply = await api.request<{ data: Device[] }>(
        '/auth/devices',
        session.token,
        locale,
      );

      setDevices(reply.data);
      setDevicesOpen(true);
    });
  }

  function confirmLogout() {
    Alert.alert(
      t('تسجيل الخروج', 'Sign out'),
      t('هل تريد تسجيل الخروج من هذا الجهاز؟', 'Do you want to sign out from this device?'),
      [
        { text: t('إلغاء', 'Cancel'), style: 'cancel' },
        {
          text: t('تسجيل الخروج', 'Sign out'),
          style: 'destructive',
          onPress: () => void run(logout),
        },
      ],
    );
  }

  if (!session) return null;

  const user = session.user;

  return (
    <View style={{ gap: 16 }}>
      <ErrorText error={error} />

      {/* Personal profile */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: '#FFF0E9',
            borderColor: '#FFE0D2',
            padding: 20,
          },
        ]}
      >
        <View
          style={{
            flexDirection: locale === 'ar' ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <ProfileAvatar
            uri={user.profile_photo_url}
            name={user.name}
            apiOrigin={api.origin}
          />

          <View style={{ flex: 1, gap: 5 }}>
            <Txt title>{user.name}</Txt>
            <Txt muted>{user.email}</Txt>

            <View
              style={{
                alignSelf: locale === 'ar' ? 'flex-end' : 'flex-start',
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 20,
                backgroundColor: user.email_verified ? '#E7F6EB' : '#FFF4D9',
              }}
            >
              <Text
                style={{
                  color: user.email_verified ? '#247342' : '#8A641C',
                  fontSize: 11,
                  fontWeight: '800',
                }}
              >
                {user.email_verified
                  ? t('✓ البريد الإلكتروني موثّق', '✓ Email verified')
                  : t('البريد الإلكتروني غير موثّق', 'Email not verified')}
              </Text>
            </View>
          </View>
        </View>

        <Txt muted>
          {t(
            'مرحباً بك في حسابك. يمكنك متابعة مشترياتك وإدارة بياناتك وأمان حسابك من هنا.',
            'Welcome to your account. Manage your details, shopping and account security here.',
          )}
        </Txt>

        <Button
          secondary
          disabled={busy}
          label={t('تحديث بيانات الحساب', 'Refresh account details')}
          onPress={() => void run(recheck)}
        />

        {!checked && (
          <Txt muted>
            {t(
              'تحقق من اتصال الحساب لتحديث بياناتك وإدارة الأجهزة.',
              'Verify your account connection to refresh details and manage devices.',
            )}
          </Txt>
        )}
      </View>

      {/* Shopping shortcuts */}
      <View style={styles.card}>
        <Txt title>{t('اختصارات التسوق', 'Shopping shortcuts')}</Txt>

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <View style={{ flex: 1 }}>
            <Button
              label={t('طلباتي', 'My orders')}
              onPress={() => router.navigate('/orders')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={t('سلة التسوق', 'Shopping cart')}
              onPress={() => router.navigate('/cart')}
            />
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={t('اكتشف المتاجر', 'Explore stores')}
              onPress={() => router.navigate('/stores')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={t('إدارة ملفي الشخصي', 'Manage my profile')}
              onPress={() => void run(() => openWebsite('/profile'))}
              disabled={busy}
            />
          </View>
        </View>
      </View>

      {/* Contact details */}
      <View style={styles.card}>
        <Txt title>{t('بيانات الاتصال', 'Contact details')}</Txt>

        <View style={{ gap: 5 }}>
          <Txt muted>{t('البريد الإلكتروني', 'Email address')}</Txt>
          <Txt>{user.email}</Txt>
          <Txt muted>
            {user.email_verified
              ? t('البريد موثّق', 'Verified email')
              : t('بانتظار توثيق البريد', 'Email verification pending')}
          </Txt>
        </View>

        <View style={{ height: 1, backgroundColor: colors.line }} />

        <View style={{ gap: 5 }}>
          <Txt muted>{t('رقم الهاتف', 'Phone number')}</Txt>
          <Txt>{user.phone || t('لم تتم إضافة رقم هاتف', 'No phone number added')}</Txt>
          <Txt muted>
            {user.phone
              ? user.phone_verified
                ? t('رقم الهاتف موثّق', 'Phone verified')
                : t('رقم الهاتف غير موثّق', 'Phone not verified')
              : t('يمكنك إضافة رقمك من الملف الشخصي على الموقع.', 'You can add your number from your website profile.')}
          </Txt>
        </View>

        <Button
          secondary
          disabled={busy}
          label={t('تعديل بياناتي', 'Edit my details')}
          onPress={() => void run(() => openWebsite('/profile'))}
        />
      </View>

      {/* Account security */}
      <View style={styles.card}>
        <Txt title>{t('أمان الحساب والأجهزة', 'Account security and devices')}</Txt>
        <Txt muted>
          {t(
            'راجع الأجهزة التي استخدمت حسابك، وألغِ وصول أي جهاز لا تعرفه.',
            'Review devices using your account and revoke access to any device you do not recognize.',
          )}
        </Txt>

        <Button
          secondary
          disabled={busy || !checked}
          label={
            devicesOpen
              ? t('إخفاء الأجهزة المتصلة', 'Hide connected devices')
              : t('عرض الأجهزة المتصلة', 'View connected devices')
          }
          onPress={() => void toggleDevices()}
        />

        {devicesOpen && (
          devices.length ? (
            devices.map((device) => {
              const current = Boolean(device.current ?? device.is_current);

              return (
                <View key={device.id} style={[styles.card, { backgroundColor: colors.paper }]}>
                  <Txt title>{device.device_name}</Txt>
                  <Txt muted>
                    {device.last_used_at ?? device.created_at ?? t('غير متاح', 'Not available')}
                  </Txt>

                  {current ? (
                    <Txt muted>{t('هذا الجهاز الحالي', 'This is the current device')}</Txt>
                  ) : (
                    <Button
                      secondary
                      disabled={busy}
                      label={t('إلغاء وصول هذا الجهاز', 'Revoke this device')}
                      onPress={() =>
                        void run(async () => {
                          if (!session) return;

                          await api.request(
                            `/auth/devices/${device.id}`,
                            session.token,
                            locale,
                            { method: 'DELETE' },
                          );

                          setDevices((items) =>
                            items.filter((item) => item.id !== device.id),
                          );
                        })
                      }
                    />
                  )}
                </View>
              );
            })
          ) : (
            <Txt muted>{t('لا توجد أجهزة مسجلة.', 'No connected devices found.')}</Txt>
          )
        )}
      </View>

      {/* Official support form */}
      <View style={[styles.card, { backgroundColor: '#FFF8F3', borderColor: '#FFE6D8' }]}>
        <Txt title>{t('الدعم والمساعدة', 'Help and support')}</Txt>

        <Txt muted>
          {t(
            'تواصل مع فريق مُروَّج.كم عبر نموذج الموقع الرسمي. يتضمن النموذج الاسم والبريد الإلكتروني ورقم الهاتف والرسالة، مع تأكيد إرسال الطلب.',
            'Contact the murwaj team through the official website form. It includes your name, email, phone number and message, with a submission confirmation.',
          )}
        </Txt>

        <Button
          disabled={busy}
          label={t('فتح نموذج التواصل', 'Open contact form')}
          onPress={() => void run(() => openWebsite('/contact-us'))}
        />
      </View>

      {/* Preferences and legal */}
      <View style={styles.card}>
        <Txt title>{t('التفضيلات والسياسات', 'Preferences and policies')}</Txt>

        <View style={{ flexDirection: 'row', gap: 9 }}>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={locale === 'ar' ? 'English' : 'العربية'}
              onPress={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              secondary
              label={t('الشروط والأحكام', 'Terms of service')}
              onPress={() => void run(() => openWebsite('/terms-of-service'))}
              disabled={busy}
            />
          </View>
        </View>

        <Button
          secondary
          disabled={busy}
          label={t('سياسة الخصوصية', 'Privacy policy')}
          onPress={() => void run(() => openWebsite('/privacy-policy'))}
        />
      </View>

      <Button
        secondary
        disabled={busy}
        label={t('تسجيل الخروج', 'Sign out')}
        onPress={confirmLogout}
      />
    </View>
  );
}
