import React, { useState } from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '../session-context';
import { Button, ErrorText, Field, styles, Txt, useText } from '../components/ui';
import type { Device } from '../core/types';
import { native } from '../vault';
export function AccountScreen() {
  const { api, session, locale, authenticate, logout, recheck, issue, checked } = useApp();
  const t = useText();
  const [register, setRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);
  const [terms, setTerms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState('');
  const [devices, setDevices] = useState<Device[]>([]);
  async function run(task: () => Promise<unknown>) {
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice('');
    try {
      await task();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    await run(async () => {
      await authenticate(
        register ? 'register' : 'login',
        register
          ? { name, email, password, password_confirmation: confirm, terms }
          : { email, password, ...(code ? { [recovery ? 'recovery_code' : 'code']: code } : {}) },
      );
      setPassword('');
      setConfirm('');
      setCode('');
    });
  }
  async function website(path: string) {
    await WebBrowser.openBrowserAsync(api.origin + path);
  }
  return (
    <View style={{ gap: 16 }}>
      <Txt title>{t('حسابك في مروج', 'Your Murwaj account')}</Txt>
      <ErrorText error={error} />
      {notice && <Txt>{notice}</Txt>}
      {issue && <Txt muted>{issue}</Txt>}
      {!native && (
        <Txt>
          {t(
            'المعاينة في المتصفح للتصفح فقط. استخدم نسخة Android أو iOS لتسجيل الدخول.',
            'Browser preview supports guest browsing. Use Android/iOS for authentication.',
          )}
        </Txt>
      )}
      {session ? (
        <>
          <View style={styles.card}>
            <Txt title>{session.user.name}</Txt>
            <Txt>{session.user.email}</Txt>
            <Txt muted>
              {session.user.email_verified
                ? t('البريد موثّق', 'Email verified')
                : t('يلزم توثيق البريد قبل الدفع', 'Verify your email before checkout')}
            </Txt>
            <Button
              disabled={busy}
              label={t('تحديث حالة الحساب', 'Refresh account')}
              onPress={() => void run(recheck)}
              secondary
            />
            {!checked && (
              <Txt muted>
                {t(
                  'تحقق من الاتصال قبل عمليات الحساب.',
                  'Verify the session before account actions.',
                )}
              </Txt>
            )}
          </View>
          {!session.user.email_verified && (
            <>
              <Button
                disabled={busy || !checked}
                label={t('إعادة إرسال رسالة التحقق', 'Resend verification email')}
                onPress={() =>
                  void run(async () => {
                    await api.request(
                      '/auth/email/verification-notification',
                      session.token,
                      locale,
                      { method: 'POST' },
                    );
                    setNotice(
                      t(
                        'افتح رسالة التحقق وأكملها في الموقع، ثم حدّث الحساب.',
                        'Open the verification email, complete the website flow, then refresh your account.',
                      ),
                    );
                  })
                }
              />
              <Button
                label={t('فتح الموقع لإكمال التحقق', 'Open website to verify')}
                secondary
                onPress={() => void run(() => website('/login'))}
              />
            </>
          )}
          <Button
            disabled={busy || !checked}
            secondary
            label={t('الأجهزة المتصلة', 'Connected devices')}
            onPress={() =>
              void run(async () => {
                const r = await api.request<{ data: Device[] }>(
                  '/auth/devices',
                  session.token,
                  locale,
                );
                setDevices(r.data);
              })
            }
          />
          {devices.map((d) => (
            <View style={styles.card} key={d.id}>
              <Txt>
                {d.device_name} {d.current ? t('(هذا الجهاز)', '(this device)') : ''}
              </Txt>
              <Txt muted>{d.last_used_at ?? d.created_at}</Txt>
              {!d.current && (
                <Button
                  label={t('إلغاء وصول الجهاز', 'Revoke device')}
                  secondary
                  disabled={busy}
                  onPress={() =>
                    void run(async () => {
                      await api.request(`/auth/devices/${d.id}`, session.token, locale, {
                        method: 'DELETE',
                      });
                      setDevices((x) => x.filter((v) => v.id !== d.id));
                    })
                  }
                />
              )}
            </View>
          ))}
          <Button
            disabled={busy}
            label={t('تسجيل الخروج', 'Sign out')}
            onPress={() => void run(logout)}
          />
          <Txt muted>
            {t(
              'الخروج يلغي رمز هذا الجهاز فقط. محاولات الدفع المحفوظة تبقى لاستعادتها عند الدخول للحساب نفسه.',
              'Sign out revokes this device token. Saved checkout recovery remains available when the same account signs in again.',
            )}
          </Txt>
        </>
      ) : (
        <>
          {register && (
            <Field
              label={t('الاسم', 'Name')}
              value={name}
              onChangeText={setName}
              maxLength={80}
              autoComplete="name"
            />
          )}
          <Field
            label={t('البريد الإلكتروني', 'Email')}
            value={email}
            onChangeText={setEmail}
            maxLength={254}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={{ textAlign: 'left' }}
          />
          <Field
            label={t('كلمة المرور', 'Password')}
            value={password}
            onChangeText={setPassword}
            maxLength={128}
            secureTextEntry
            autoCapitalize="none"
            autoComplete={register ? 'new-password' : 'current-password'}
          />
          {register ? (
            <>
              <Field
                label={t('تأكيد كلمة المرور', 'Confirm password')}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                maxLength={128}
              />
              <Button
                label={
                  (terms ? '✓ ' : '') +
                  t('أوافق على الشروط وسياسة الخصوصية', 'I agree to the terms and privacy policy')
                }
                secondary
                onPress={() => setTerms((x) => !x)}
              />
              <View style={styles.row}>
                <Button
                  secondary
                  label={t('الشروط', 'Terms')}
                  onPress={() => void run(() => website('/terms-of-service'))}
                />
                <Button
                  secondary
                  label={t('الخصوصية', 'Privacy')}
                  onPress={() => void run(() => website('/privacy-policy'))}
                />
              </View>
            </>
          ) : (
            <>
              <Field
                label={
                  recovery
                    ? t(
                        'رمز استرداد المصادقة الثنائية (عند الحاجة)',
                        '2FA recovery code (if required)',
                      )
                    : t('رمز المصادقة الثنائية (عند الحاجة)', '2FA code (if required)')
                }
                value={code}
                onChangeText={setCode}
                keyboardType={recovery ? 'default' : 'number-pad'}
                maxLength={recovery ? 50 : 6}
                autoCapitalize="none"
              />
              <Button
                secondary
                label={
                  recovery
                    ? t('استخدام رمز التطبيق', 'Use authenticator code')
                    : t('استخدام رمز الاسترداد', 'Use recovery code')
                }
                onPress={() => {
                  setRecovery((x) => !x);
                  setCode('');
                }}
              />
            </>
          )}
          <Button
            disabled={
              busy || !native || !email || !password || (register && (!name || !confirm || !terms))
            }
            label={register ? t('إنشاء الحساب', 'Create account') : t('تسجيل الدخول', 'Sign in')}
            onPress={() => void submit()}
          />
          <Button
            disabled={busy}
            secondary
            label={
              register
                ? t('لدي حساب بالفعل', 'I already have an account')
                : t('إنشاء حساب جديد', 'Create a new account')
            }
            onPress={() => {
              setRegister((x) => !x);
              setError(null);
              setCode('');
              setPassword('');
              setConfirm('');
            }}
          />
          <Button
            secondary
            label={t('نسيت كلمة المرور', 'Forgot password')}
            onPress={() => void run(() => website('/forgot-password'))}
          />
        </>
      )}
    </View>
  );
}
