import React, { useState } from 'react';

import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useApp } from '../session-context';
import { Button, ErrorText, Field, styles, Txt, useText } from '../components/ui';
import { native } from '../vault';
import { AccountDashboard } from './account-dashboard';
export function AccountScreen() {
  const { api, session, authenticate, issue } = useApp();
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
        <AccountDashboard />
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
