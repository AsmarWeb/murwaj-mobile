import React from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { TextInputProps } from 'react-native';
import { useApp } from '../session-context';
import { ApiError } from '../core/api';
export const colors = {
  ink: '#241F1D',
  muted: '#817872',
  green: '#FF5517',
  lime: '#FFF0E9',
  paper: '#FAF7F4',
  line: '#EDE4DE',
  red: '#A43737',
};
export const styles = StyleSheet.create({
  page: { padding: 20, gap: 16, paddingBottom: 36 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  card: {
    padding: 17,
    backgroundColor: '#FFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.line,
    gap: 10,
  },
  hero: { padding: 24, borderRadius: 24, backgroundColor: colors.ink, gap: 12 },
  heading: { fontSize: 28, fontWeight: '800', color: colors.ink },
  title: { fontSize: 20, fontWeight: '700', color: colors.ink },
  text: { fontSize: 15, lineHeight: 23, color: colors.ink },
  muted: { fontSize: 13, lineHeight: 21, color: colors.muted },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: colors.ink,
  },
  image: { width: '100%', height: 175, borderRadius: 14, backgroundColor: colors.paper },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 13,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  secondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  error: { color: colors.red, fontSize: 14, lineHeight: 23 },
  pill: { padding: 9, borderRadius: 10, backgroundColor: colors.paper },
  label: { fontSize: 13, color: colors.muted },
});
export function useText() {
  const { locale } = useApp();
  return (ar: string, en: string) => (locale === 'ar' ? ar : en);
}
export function Txt({
  children,
  muted = false,
  title = false,
}: {
  children: React.ReactNode;
  muted?: boolean;
  title?: boolean;
}) {
  const { locale } = useApp();
  return (
    <Text
      style={[
        title ? styles.title : muted ? styles.muted : styles.text,
        {
          textAlign: locale === 'ar' ? 'right' : 'left',
          writingDirection: locale === 'ar' ? 'rtl' : 'ltr',
        },
      ]}
    >
      {children}
    </Text>
  );
}
export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        { opacity: disabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      <Text
        style={{
          fontWeight: '700',
          color: secondary ? colors.ink : '#FFF',
          fontSize: 15,
          textAlign: 'center',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  const { locale } = useApp();
  return (
    <View style={{ gap: 6 }}>
      <Txt muted>{label}</Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        {...props}
        style={[styles.input, { textAlign: locale === 'ar' ? 'right' : 'left' }, props.style]}
      />
    </View>
  );
}
export function Photo({ uri }: { uri?: string | null }) {
  return uri && /^https?:\/\//.test(uri) ? (
    <Image
      accessibilityIgnoresInvertColors
      source={{ uri }}
      style={styles.image}
      resizeMode="cover"
    />
  ) : (
    <View style={[styles.image, { alignItems: 'center', justifyContent: 'center' }]}>
      <Text style={{ fontSize: 38, color: colors.green }}>م</Text>
    </View>
  );
}
export function Busy() {
  return (
    <ActivityIndicator accessibilityLabel="Loading" color={colors.green} style={{ padding: 24 }} />
  );
}
export function ErrorText({ error }: { error: unknown }) {
  const t = useText();
  if (!error) return null;
  let text = t(
    'تعذّر الاتصال. حدّث البيانات قبل إعادة أي إضافة للسلة.',
    'Connection failed. Refresh before retrying a cart addition.',
  );
  if (error instanceof ApiError) {
    text =
      error.status === 429
        ? t(
            `طلبات كثيرة؛ انتظر ${error.retryAfter || 60} ثانية.`,
            `Too many requests; wait ${error.retryAfter || 60} seconds.`,
          )
        : error.status === 401
          ? t('انتهت الجلسة. سجّل الدخول مجددًا.', 'Session expired. Sign in again.')
          : error.status === 403
            ? t(
                'تحقق من البريد وصلاحية الحساب قبل المتابعة.',
                'Verify your email and account access before continuing.',
              )
            : error.status === 404
              ? t('العنصر غير متاح لهذا الحساب.', 'This resource is unavailable for this account.')
              : error.status === 503
                ? t(
                    'خدمة الدفع غير متاحة. استعد المحاولة الأصلية؛ لا تنشئ دفعًا جديدًا.',
                    'Payment service unavailable. Recover the original attempt; do not create another payment.',
                  )
                : error.message;
    const details = Object.values(error.errors)
      .flat()
      .filter((x) => typeof x === 'string')
      .join('\n');
    if (details) text += '\n' + details;
  } else if (
    error instanceof Error &&
    error.message &&
    !(error instanceof TypeError) &&
    error.name !== 'AbortError'
  )
    text = error.message;
  return (
    <Text accessibilityRole="alert" style={styles.error}>
      {text}
    </Text>
  );
}
export function Money({
  value,
  currency,
}: {
  value: string | null | undefined;
  currency?: string | null;
}) {
  return (
    <Txt>
      {value ?? '—'} {currency ?? ''}
    </Txt>
  );
}
