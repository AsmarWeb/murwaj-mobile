import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { useApp } from '../session-context';
import { ApiError } from '../core/api';
import { Button, ErrorText, Field, styles, Txt, useText } from '../components/ui';
import { native } from '../vault';

const SOCIAL_CALLBACK = 'murwaj://auth/social';

type SocialProvider = 'google' | 'facebook';

type SocialCallback =
  | { ticket: string }
  | { error: 'provider_email_missing' | 'account_link_required' | 'authentication_failed' };

function parseSocialCallback(raw: string): SocialCallback | null {
  try {
    const url = new URL(raw);

    if (
      url.protocol !== 'murwaj:' ||
      url.hostname !== 'auth' ||
      url.pathname !== '/social' ||
      url.username ||
      url.password ||
      url.port ||
      url.hash
    ) {
      return null;
    }

    for (const key of url.searchParams.keys()) {
      if (key !== 'ticket' && key !== 'error') return null;
    }

    const tickets = url.searchParams.getAll('ticket');
    const errors = url.searchParams.getAll('error');

    if (
      tickets.length === 1 &&
      errors.length === 0 &&
      /^[A-Za-z0-9]{64}$/.test(tickets[0])
    ) {
      return { ticket: tickets[0] };
    }

    const allowedErrors = [
      'provider_email_missing',
      'account_link_required',
      'authentication_failed',
    ] as const;

    if (
      errors.length === 1 &&
      tickets.length === 0 &&
      allowedErrors.includes(errors[0] as (typeof allowedErrors)[number])
    ) {
      return { error: errors[0] as SocialCallback & never };
    }

    return null;
  } catch {
    return null;
  }
}

export function LoginScreen() {
  const {
    api,
    authenticate,
    exchangeSocialTicket,
    verifySocialChallenge,
  } = useApp();

  const t = useText();
  const params = useLocalSearchParams<{ mode?: string }>();

  const [register, setRegister] = useState(params.mode === 'register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [terms, setTerms] = useState(false);

  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [socialChallenge, setSocialChallenge] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(false);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [notice, setNotice] = useState('');

  function resetTwoFactor() {
    setTwoFactorRequired(false);
    setSocialChallenge(null);
    setCode('');
    setRecovery(false);
  }

  async function run(task: () => Promise<void>) {
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

  async function website(path: string) {
    await WebBrowser.openBrowserAsync(api.origin + path);
  }

  function twoFactorBody() {
    return recovery ? { recovery_code: code } : { code };
  }

  async function submit() {
    await run(async () => {
      if (socialChallenge) {
        await verifySocialChallenge(socialChallenge, twoFactorBody());
        router.replace('/account');
        return;
      }

      try {
        await authenticate(
          register ? 'register' : 'login',
          register
            ? {
                name,
                email,
                password,
                password_confirmation: confirm,
                terms,
              }
            : {
                email,
                password,
                ...(twoFactorRequired ? twoFactorBody() : {}),
              },
        );

        router.replace('/account');
      } catch (e) {
        if (
          !register &&
          !twoFactorRequired &&
          e instanceof ApiError &&
          Array.isArray(e.errors.code) &&
          e.errors.code.length > 0
        ) {
          setTwoFactorRequired(true);
          setNotice(
            t(
              'تم التحقق من كلمة المرور. أدخل رمز المصادقة الثنائية لإكمال الدخول.',
              'Password accepted. Enter your two-factor code to complete sign-in.',
            ),
          );
          return;
        }

        throw e;
      }
    });
  }

  function socialMessage(reason: string) {
    switch (reason) {
      case 'provider_email_missing':
        return t(
          'لم يرسل مزود الخدمة عنوان بريد إلكتروني. جرّب طريقة أخرى.',
          'The provider did not return an email address. Try another sign-in method.',
        );
      case 'account_link_required':
        return t(
          'هذا البريد مرتبط بحساب موجود. سجّل الدخول بالطريقة الأصلية أولًا.',
          'This email already belongs to an account. Sign in using your original method first.',
        );
      default:
        return t(
          'تعذر إكمال تسجيل الدخول الاجتماعي. حاول مرة أخرى.',
          'Social sign-in could not be completed. Please try again.',
        );
    }
  }

  async function signInWithSocial(provider: SocialProvider) {
    await run(async () => {
      const result = await WebBrowser.openAuthSessionAsync(
        `${api.origin}/auth/mobile/${provider}`,
        SOCIAL_CALLBACK,
      );

      if (result.type === 'cancel' || result.type === 'dismiss') {
        setNotice(t('تم إلغاء تسجيل الدخول.', 'Sign-in was cancelled.'));
        return;
      }

      if (result.type !== 'success' || !result.url) {
        throw new Error(
          t('تعذر فتح جلسة تسجيل الدخول.', 'Could not open the sign-in session.'),
        );
      }

      const callback = parseSocialCallback(result.url);

      if (!callback) {
        throw new Error(
          t('رابط العودة غير صالح. أعد المحاولة.', 'The sign-in return link is invalid. Please retry.'),
        );
      }

      if ('error' in callback) {
        throw new Error(socialMessage(callback.error));
      }

      const challenge = await exchangeSocialTicket(callback.ticket);

      if (challenge) {
        setSocialChallenge(challenge.challenge_token);
        setTwoFactorRequired(true);
        setRecovery(false);
        setCode('');
        setNotice(
          t(
            'هذا الحساب محمي بالمصادقة الثنائية. أدخل رمز التحقق للمتابعة.',
            'This account is protected by two-factor authentication. Enter your code to continue.',
          ),
        );
        return;
      }

      router.replace('/account');
    });
  }

  return (
    <View style={{ gap: 16 }}>
      <View style={{ gap: 6 }}>
        <Txt title>
          {twoFactorRequired
            ? t('التحقق من الحساب', 'Verify your account')
            : register
              ? t('إنشاء حساب جديد', 'Create your account')
              : t('مرحبًا بعودتك', 'Welcome back')}
        </Txt>
        <Txt muted>
          {twoFactorRequired
            ? t('خطوة إضافية لحماية حسابك.', 'One more step to protect your account.')
            : t('سجّل الدخول إلى مُروَّج.كم وتابع التسوق.', 'Sign in to murwaj.com and continue shopping.')}
        </Txt>
      </View>

      <ErrorText error={error} />
      {notice ? <Txt>{notice}</Txt> : null}

      {!native ? (
        <Txt muted>
          {t(
            'المعاينة في المتصفح للتصفح فقط. استخدم نسخة Android أو iOS لتسجيل الدخول.',
            'Browser preview supports guest browsing. Use Android or iOS for authentication.',
          )}
        </Txt>
      ) : null}

      {!twoFactorRequired ? (
        <>
          {!register ? (
            <View style={{ gap: 10 }}>
              <Button
                secondary
                disabled={busy || !native}
                label={t('المتابعة باستخدام Google', 'Continue with Google')}
                onPress={() => void signInWithSocial('google')}
              />
              <Button
                secondary
                disabled={busy || !native}
                label={t('المتابعة باستخدام Facebook', 'Continue with Facebook')}
                onPress={() => void signInWithSocial('facebook')}
              />
              <Txt muted>
                {t('أو استخدم بريدك الإلكتروني', 'Or use your email address')}
              </Txt>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Button
                secondary
                disabled={busy || !native}
                label={t('المتابعة باستخدام Google', 'Continue with Google')}
                onPress={() => void signInWithSocial('google')}
              />
              <Button
                secondary
                disabled={busy || !native}
                label={t('المتابعة باستخدام Facebook', 'Continue with Facebook')}
                onPress={() => void signInWithSocial('facebook')}
              />
            </View>
          )}

          {register ? (
            <Field
              label={t('الاسم', 'Name')}
              value={name}
              onChangeText={setName}
              maxLength={80}
              autoComplete="name"
            />
          ) : null}

          <Field
            label={t('البريد الإلكتروني', 'Email')}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              resetTwoFactor();
            }}
            maxLength={254}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            style={{ textAlign: 'left' }}
          />

          <Field
            label={t('كلمة المرور', 'Password')}
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              resetTwoFactor();
            }}
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
                secondary
                label={
                  (terms ? '✓ ' : '') +
                  t('أوافق على الشروط وسياسة الخصوصية', 'I agree to the terms and privacy policy')
                }
                onPress={() => setTerms((value) => !value)}
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
          ) : null}
        </>
      ) : (
        <>
          <Field
            label={
              recovery
                ? t('رمز الاسترداد', 'Recovery code')
                : t('رمز المصادقة الثنائية', 'Two-factor authentication code')
            }
            value={code}
            onChangeText={setCode}
            keyboardType={recovery ? 'default' : 'number-pad'}
            maxLength={recovery ? 100 : 6}
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
              setRecovery((value) => !value);
              setCode('');
              setError(null);
            }}
          />
        </>
      )}

      <Button
        disabled={
          busy ||
          !native ||
          (twoFactorRequired
            ? !code.trim()
            : !email.trim() ||
              !password ||
              (register && (!name.trim() || !confirm || !terms)))
        }
        label={
          twoFactorRequired
            ? t('التحقق والمتابعة', 'Verify and continue')
            : register
              ? t('إنشاء الحساب', 'Create account')
              : t('تسجيل الدخول', 'Sign in')
        }
        onPress={() => void submit()}
      />

      {!twoFactorRequired ? (
        <>
          <Button
            disabled={busy}
            secondary
            label={
              register
                ? t('لدي حساب بالفعل', 'I already have an account')
                : t('إنشاء حساب جديد', 'Create a new account')
            }
            onPress={() => {
              setRegister((value) => !value);
              setError(null);
              setPassword('');
              setConfirm('');
              setTerms(false);
              resetTwoFactor();
            }}
          />

          {!register ? (
            <Button
              secondary
              disabled={busy}
              label={t('نسيت كلمة المرور', 'Forgot password')}
              onPress={() => void run(() => website('/forgot-password'))}
            />
          ) : null}
        </>
      ) : (
        <Button
          secondary
          disabled={busy}
          label={t('العودة إلى تسجيل الدخول', 'Back to sign-in')}
          onPress={() => {
            resetTwoFactor();
            setError(null);
            setNotice('');
          }}
        />
      )}
    </View>
  );
}
